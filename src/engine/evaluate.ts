import type { ParamTarget } from '../data/profiles';
import type { Range } from '../lib/types';

export type Level = 'ok' | 'warn' | 'bad';

/** Inclusive range check that ignores floating point noise from unit conversions. */
export function within(value: number, range: Range): boolean {
  const tolerance = 1e-9 * Math.max(1, Math.abs(value));
  return (range[0] === null || value >= range[0] - tolerance) && (range[1] === null || value <= range[1] + tolerance);
}

export function levelOf(value: number, target: ParamTarget): Level {
  if (within(value, target.ideal)) return 'ok';
  return within(value, target.acceptable) ? 'warn' : 'bad';
}

/** Whether a value lies below or above the ideal range. */
export function directionOf(value: number, target: ParamTarget): 'low' | 'high' {
  return target.ideal[0] !== null && value < target.ideal[0] ? 'low' : 'high';
}

const RANK: Record<Level, number> = { ok: 0, warn: 1, bad: 2 };

export const worst = (a: Level, b: Level): Level => (RANK[a] >= RANK[b] ? a : b);
