import type { ParamId, Tank } from '../lib/types';

/**
 * Stages of the nitrogen cycle in a new tank:
 * - start: no ammonia or nitrite seen yet (no ammonia source, or nothing tested)
 * - ammonia: ammonia present, nitrite not yet
 * - nitrite: nitrite has appeared; the second group of bacteria is still catching up
 * - done: ammonia and nitrite are back to zero after the cycle got going
 */
export type CycleStage = 'start' | 'ammonia' | 'nitrite' | 'done';

function latest(tank: Tank, param: ParamId): number | undefined {
  for (let i = tank.measurements.length - 1; i >= 0; i--) {
    const value = tank.measurements[i].values[param];
    if (value !== undefined) return value;
  }
  return undefined;
}

const everAbove0 = (tank: Tank, param: ParamId) => tank.measurements.some((m) => (m.values[param] ?? 0) > 0);

export function cycleStage(tank: Tank): CycleStage {
  const ammonia = latest(tank, 'ammonia');
  const nitrite = latest(tank, 'nitrite');
  if (ammonia === undefined && nitrite === undefined) return 'start';
  const nitriteSeen = everAbove0(tank, 'nitrite');
  if ((nitrite ?? 0) > 0) return 'nitrite';
  if ((ammonia ?? 0) > 0) return nitriteSeen ? 'nitrite' : 'ammonia';
  if (!nitriteSeen && !everAbove0(tank, 'ammonia')) return 'start';
  if (ammonia === undefined || nitrite === undefined) return nitriteSeen ? 'nitrite' : 'ammonia';
  return 'done';
}
