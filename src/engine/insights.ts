import { PARAM_IDS, PARAMS } from '../data/parameters';
import { PROFILES } from '../data/profiles';
import type { Species } from '../data/species';
import { calendarDaysSince, DAY_MS } from '../lib/dates';
import type { Measurement, ParamId, Tank } from '../lib/types';
import { FREE_NH3_BAD, FREE_NH3_WARN, freeAmmonia } from './ammonia';
import { compatibility, type CompatInsight } from './compatibility';
import { cycleStage, type CycleStage } from './cycle';
import { directionOf, levelOf, within, worst, type Level } from './evaluate';
import { effectiveTargets, SPECIES_PARAMS, tankSpecies, type Target, type Targets } from './targets';
import { linearTrend, type Point } from './trends';

export type Severity = 'bad' | 'warn' | 'info';

export type Insight =
  | {
      kind: 'param';
      severity: 'bad' | 'warn';
      param: ParamId;
      value: number;
      at: string;
      direction: 'low' | 'high';
      target: Target;
      /** Library species whose own range does not include the value. */
      species: Species[];
      freeNh3?: number;
    }
  | { kind: 'cycle'; severity: 'info' | 'warn'; stage: CycleStage; withLivestock: boolean; days?: number }
  | { kind: 'trend'; severity: 'info' | 'warn'; param: ParamId; perWeek: number; bound: number; days: number }
  | { kind: 'swing'; severity: 'warn'; param: ParamId; from: number; to: number; hours: number }
  | CompatInsight
  | { kind: 'first-test'; severity: 'info' }
  | { kind: 'test-due'; severity: 'info' | 'warn'; days: number; every: number }
  | { kind: 'water-change-due'; severity: 'info' | 'warn'; days: number | null; every: number };

const REMINDERS: Insight['kind'][] = ['first-test', 'test-due', 'water-change-due'];
export const isReminder = (insight: Insight) => REMINDERS.includes(insight.kind);

export interface Reading {
  param: ParamId;
  value: number;
  at: string;
  /** `cycling`: out of range, but expected during a fishless cycle. `null`: no target. */
  level: Level | 'cycling' | null;
  target?: Target;
  /** Older than a month: shown, but no longer judged. */
  stale: boolean;
  freeNh3?: number;
}

export interface TankReport {
  targets: Targets;
  /** Latest value per parameter: tracked parameters first, then any others that were tested. */
  readings: Reading[];
  /** Most severe first. */
  insights: Insight[];
  /** Water quality and livestock; reminders do not count. */
  status: Level | 'none';
  attention: number;
  reminders: number;
  stage?: CycleStage;
}

const STALE_DAYS = 30;
const NITROGEN: ParamId[] = ['ammonia', 'nitrite', 'nitrate'];

export const hasLivestock = (tank: Tank) =>
  tank.inhabitants.some((i) => i.kind === 'fish' || i.kind === 'invertebrate' || i.kind === 'coral');

function latestWith(tank: Tank, param: ParamId): Measurement | undefined {
  for (let i = tank.measurements.length - 1; i >= 0; i--) {
    if (tank.measurements[i].values[param] !== undefined) return tank.measurements[i];
  }
  return undefined;
}

function series(tank: Tank, param: ParamId, fromMs: number): Point[] {
  const points: Point[] = [];
  for (const m of tank.measurements) {
    const value = m.values[param];
    const t = Date.parse(m.takenAt);
    if (value !== undefined && t >= fromMs) points.push({ t, v: value });
  }
  return points;
}

/** Warns when consecutive readings change faster than animals tolerate. */
function swingInsight(tank: Tank, param: ParamId, now: number): Insight | null {
  const max = PARAMS[param].maxDailyChange;
  if (!max) return null;
  const points = series(tank, param, now - 7 * DAY_MS);
  if (points.length < 2) return null;
  const [a, b] = points.slice(-2);
  const hours = (b.t - a.t) / 3_600_000;
  if (hours <= 0 || hours > 72) return null;
  const perDay = Math.abs(b.v - a.v) / Math.max(hours / 24, 1);
  return perDay > max + 1e-9 ? { kind: 'swing', severity: 'warn', param, from: a.v, to: b.v, hours } : null;
}

/** Projects a steady rise or fall since the last water change and warns before it leaves the range. */
function trendInsight(tank: Tank, param: ParamId, target: Target, sinceMs: number, now: number): Insight | null {
  const points = series(tank, param, Math.max(sinceMs, now - 30 * DAY_MS));
  const last = points.at(-1);
  if (!last || now - last.t > 7 * DAY_MS) return null;
  const trend = linearTrend(points);
  if (!trend || trend.spanDays < 4 || trend.r2 < 0.6 || trend.slopePerDay === 0) return null;
  const slope = trend.slopePerDay;
  let bound: number | null;
  let severity: 'info' | 'warn';
  if (within(last.v, target.ideal)) {
    bound = slope > 0 ? target.ideal[1] : target.ideal[0];
    severity = 'info';
  } else if (within(last.v, target.acceptable)) {
    const aboveIdeal = target.ideal[1] !== null && last.v > target.ideal[1];
    if (aboveIdeal !== slope > 0) return null;
    bound = slope > 0 ? target.acceptable[1] : target.acceptable[0];
    severity = 'warn';
  } else {
    return null;
  }
  if (bound === null || (bound === 0 && slope < 0)) return null;
  const days = (bound - last.v) / slope - (now - last.t) / DAY_MS;
  if (days < 0.5 || days > 14) return null;
  return { kind: 'trend', severity, param, perWeek: slope * 7, bound, days: Math.max(1, Math.round(days)) };
}

const RANK: Record<Severity, number> = { bad: 0, warn: 1, info: 2 };

export function analyzeTank(tank: Tank, now = Date.now()): TankReport {
  const targets = effectiveTargets(tank);
  const livestock = hasLivestock(tank);
  const fishlessCycle = tank.cycling && !livestock;
  const species = tankSpecies(tank).filter((s) => s.water === PROFILES[tank.profile].water);
  const insights: Insight[] = [];

  let stage: CycleStage | undefined;
  if (tank.cycling) {
    stage = cycleStage(tank);
    insights.push({
      kind: 'cycle',
      severity: livestock ? 'warn' : 'info',
      stage,
      withLivestock: livestock,
      days: tank.startedOn ? calendarDaysSince(tank.startedOn, now) : undefined,
    });
  }

  const order = [...tank.params, ...PARAM_IDS.filter((p) => !tank.params.includes(p))];
  const readings: Reading[] = [];
  for (const param of order) {
    const measurement = latestWith(tank, param);
    if (!measurement) continue;
    const value = measurement.values[param] as number;
    const target = targets[param];
    const stale = calendarDaysSince(measurement.takenAt, now) > STALE_DAYS;
    let level: Reading['level'] = target ? levelOf(value, target) : null;
    let freeNh3: number | undefined;
    if (param === 'ammonia' && value > 0) {
      const ph = latestWith(tank, 'ph')?.values.ph;
      const temperature = latestWith(tank, 'temperature')?.values.temperature;
      if (ph !== undefined && temperature !== undefined) {
        freeNh3 = freeAmmonia(value, ph, temperature);
        const nh3Level: Level = freeNh3 >= FREE_NH3_BAD ? 'bad' : freeNh3 >= FREE_NH3_WARN ? 'warn' : 'ok';
        if (level) level = worst(level, nh3Level);
      }
    }
    if (fishlessCycle && NITROGEN.includes(param) && (level === 'warn' || level === 'bad')) level = 'cycling';
    readings.push({ param, value, at: measurement.takenAt, level, target, stale, freeNh3 });
    if (target && !stale && (level === 'warn' || level === 'bad')) {
      const unhappy = (SPECIES_PARAMS as ParamId[]).includes(param)
        ? species.filter((s) => {
            const range = s.ranges[param as (typeof SPECIES_PARAMS)[number]];
            return range !== undefined && !within(value, range);
          })
        : [];
      insights.push({
        kind: 'param',
        severity: level,
        param,
        value,
        at: measurement.takenAt,
        direction: directionOf(value, target),
        target,
        species: unhappy,
        freeNh3,
      });
    }
  }

  const lastWaterChange = tank.events.findLast((e) => e.type === 'water-change');
  const sinceWaterChange = lastWaterChange ? Date.parse(lastWaterChange.at) : 0;
  for (const param of order) {
    if (fishlessCycle && NITROGEN.includes(param)) continue;
    const swing = swingInsight(tank, param, now);
    if (swing) insights.push(swing);
    const target = targets[param];
    const trend = target ? trendInsight(tank, param, target, sinceWaterChange, now) : null;
    if (trend) insights.push(trend);
  }

  insights.push(...compatibility(tank));

  const lastTest = tank.measurements.at(-1);
  if (!lastTest) {
    insights.push({ kind: 'first-test', severity: 'info' });
  } else if (tank.testEveryDays) {
    const days = calendarDaysSince(lastTest.takenAt, now);
    if (days >= tank.testEveryDays) {
      const severity = days >= tank.testEveryDays * 2 ? 'warn' : 'info';
      insights.push({ kind: 'test-due', severity, days, every: tank.testEveryDays });
    }
  }
  if (tank.waterChangeEveryDays && !fishlessCycle) {
    const days = calendarDaysSince(lastWaterChange?.at ?? tank.startedOn ?? tank.createdAt, now);
    if (days >= tank.waterChangeEveryDays) {
      const severity = days >= tank.waterChangeEveryDays * 2 ? 'warn' : 'info';
      insights.push({
        kind: 'water-change-due',
        severity,
        days: lastWaterChange ? days : null,
        every: tank.waterChangeEveryDays,
      });
    }
  }

  insights.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  const quality = insights.filter((i) => !isReminder(i));
  const status: TankReport['status'] = quality.some((i) => i.severity === 'bad')
    ? 'bad'
    : quality.some((i) => i.severity === 'warn')
      ? 'warn'
      : readings.some((r) => !r.stale)
        ? 'ok'
        : 'none';
  return {
    targets,
    readings,
    insights,
    status,
    attention: quality.filter((i) => i.severity !== 'info').length,
    reminders: insights.length - quality.length,
    stage,
  };
}
