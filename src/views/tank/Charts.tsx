import { useState } from 'react';
import { ParamChart, type ChartPoint } from '../../components/Chart';
import { paramLabel, PARAM_IDS } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { levelOf } from '../../engine/evaluate';
import { hasLivestock, type TankReport } from '../../engine/insights';
import { useI18n } from '../../i18n';
import { DAY_MS } from '../../lib/dates';
import { formatValue } from '../../lib/units';
import type { ParamId, Settings, Tank } from '../../lib/types';

const RANGES = [30, 90, 365, 0] as const;
type RangeDays = (typeof RANGES)[number];

const NITROGEN: ParamId[] = ['ammonia', 'nitrite', 'nitrate'];

export function Charts({ tank, report, settings }: { tank: Tank; report: TankReport; settings: Settings }) {
  const { t, tn, l, lang } = useI18n();
  const [days, setDays] = useState<RangeDays>(90);
  const water = PROFILES[tank.profile].water;

  if (tank.measurements.length < 2) {
    return (
      <div className="empty card">
        <p>{t('charts.empty')}</p>
      </div>
    );
  }

  const to = Date.now();
  const first = Date.parse(tank.measurements[0].takenAt);
  const from = Math.min(days === 0 ? first : to - days * DAY_MS, to - DAY_MS);
  const fishlessCycle = tank.cycling && !hasLivestock(tank);
  const markers = tank.events
    .filter((e) => e.type === 'water-change')
    .map((e) => Date.parse(e.at))
    .filter((time) => time >= from && time <= to);
  const order = [...tank.params, ...PARAM_IDS.filter((p) => !tank.params.includes(p))];

  const charts = order.flatMap((param) => {
    const target = report.targets[param];
    const points: ChartPoint[] = [];
    for (const m of tank.measurements) {
      const value = m.values[param];
      const time = Date.parse(m.takenAt);
      if (value === undefined || time < from) continue;
      let level: ChartPoint['level'] = target ? levelOf(value, target) : null;
      if (fishlessCycle && NITROGEN.includes(param) && level !== 'ok' && level !== null) level = 'cycling';
      points.push({ t: time, v: value, level });
    }
    return points.length > 0 ? [{ param, target, points }] : [];
  });

  return (
    <div className="stack">
      <fieldset className="segmented">
        <legend className="sr-only">{t('charts.range')}</legend>
        {RANGES.map((value) => (
          <label key={value}>
            <input
              type="radio"
              name="chart-range"
              checked={days === value}
              onChange={() => setDays(value)}
            />
            <span>{value === 0 ? t('charts.all') : tn('charts.days', value)}</span>
          </label>
        ))}
      </fieldset>
      {charts.length === 0 && (
        <div className="empty card">
          <p>{t('charts.noneInRange')}</p>
        </div>
      )}
      {charts.map(({ param, target, points }) => (
        <section key={param} className="card chart-card" aria-labelledby={`chart-${param}`}>
          <div className="chart-head">
            <h2 id={`chart-${param}`}>{l(paramLabel(param, water))}</h2>
            <span className="muted">
              {t('charts.latest', { value: formatValue(param, points[points.length - 1].v, settings, lang) })}
            </span>
          </div>
          <ParamChart param={param} points={points} target={target} markers={markers} from={from} to={to} settings={settings} />
        </section>
      ))}
      {markers.length > 0 && <p className="muted small">{t('charts.markersNote')}</p>}
    </div>
  );
}
