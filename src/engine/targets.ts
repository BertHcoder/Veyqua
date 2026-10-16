import { PROFILES, type ParamTarget } from '../data/profiles';
import { getSpecies, type Species, type SpeciesParam } from '../data/species';
import type { ParamId, Range, Tank } from '../lib/types';

export type TargetSource = 'profile' | 'livestock' | 'custom';

export interface Target extends ParamTarget {
  source: TargetSource;
}

export type Targets = Partial<Record<ParamId, Target>>;

export const SPECIES_PARAMS: SpeciesParam[] = ['temperature', 'ph', 'gh'];

const isSpeciesParam = (id: ParamId): id is SpeciesParam => (SPECIES_PARAMS as ParamId[]).includes(id);

export function intersect(a: Range, b: Range): Range | null {
  const min = Math.max(a[0] ?? -Infinity, b[0] ?? -Infinity);
  const max = Math.min(a[1] ?? Infinity, b[1] ?? Infinity);
  if (min > max) return null;
  return [Number.isFinite(min) ? min : null, Number.isFinite(max) ? max : null];
}

/** Distinct library species kept in the tank. */
export function tankSpecies(tank: Tank): Species[] {
  const found = new Map<string, Species>();
  for (const inhabitant of tank.inhabitants) {
    const species = getSpecies(inhabitant.speciesId);
    if (species) found.set(species.id, species);
  }
  return [...found.values()];
}

export interface Overlap {
  range: Range;
  /** Species with the highest minimum: it sets the lower bound. */
  lowFrom?: Species;
  /** Species with the lowest maximum: it sets the upper bound. */
  highFrom?: Species;
  /** True when no value suits every species. */
  conflict: boolean;
}

/** The range of a parameter that suits all given species. */
export function speciesOverlap(species: Species[], param: SpeciesParam): Overlap | null {
  let min: number | null = null;
  let max: number | null = null;
  let lowFrom: Species | undefined;
  let highFrom: Species | undefined;
  for (const s of species) {
    const range = s.ranges[param];
    if (!range) continue;
    if (range[0] !== null && (min === null || range[0] > min)) {
      min = range[0];
      lowFrom = s;
    }
    if (range[1] !== null && (max === null || range[1] < max)) {
      max = range[1];
      highFrom = s;
    }
  }
  if (min === null && max === null) return null;
  return { range: [min, max], lowFrom, highFrom, conflict: min !== null && max !== null && min > max };
}

/** Builds the tolerable (amber) band around an ideal range, using the profile's margins when known. */
function acceptableAround(ideal: Range, base: ParamTarget | undefined): Range {
  const [min, max] = ideal;
  const width = min !== null && max !== null ? max - min : 0;
  const fallback = Math.max(width * 0.25, Math.abs(max ?? min ?? 0) * 0.1, 0.01);
  const below =
    base && base.ideal[0] !== null && base.acceptable[0] !== null ? base.ideal[0] - base.acceptable[0] : fallback;
  const above =
    base && base.ideal[1] !== null && base.acceptable[1] !== null ? base.acceptable[1] - base.ideal[1] : fallback;
  const openTop = base !== undefined && base.acceptable[1] === null;
  return [min === null ? null : Math.max(0, min - below), max === null || openTop ? null : max + above];
}

/**
 * Targets for a tank: the profile's ranges, narrowed to what all its library species
 * tolerate, with the owner's own overrides on top.
 */
export function effectiveTargets(tank: Tank): Targets {
  const profile = PROFILES[tank.profile];
  const species = tankSpecies(tank).filter((s) => s.water === profile.water);
  const ids = new Set([...Object.keys(profile.targets), ...Object.keys(tank.targets)] as ParamId[]);
  const result: Targets = {};
  for (const id of ids) {
    const base = profile.targets[id];
    const custom = tank.targets[id];
    if (custom) {
      result[id] = { ideal: custom, acceptable: acceptableAround(custom, base), source: 'custom' };
      continue;
    }
    if (!base) continue;
    const overlap = isSpeciesParam(id) ? speciesOverlap(species, id) : null;
    if (overlap && !overlap.conflict) {
      const ideal = intersect(base.ideal, overlap.range) ?? overlap.range;
      if (ideal[0] !== base.ideal[0] || ideal[1] !== base.ideal[1]) {
        result[id] = { ideal, acceptable: acceptableAround(ideal, base), source: 'livestock' };
        continue;
      }
    }
    result[id] = { ...base, source: 'profile' };
  }
  return result;
}
