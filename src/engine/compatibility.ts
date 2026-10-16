import { PROFILES } from '../data/profiles';
import { getSpecies, type Species, type SpeciesParam } from '../data/species';
import type { Tank } from '../lib/types';
import { SPECIES_PARAMS, speciesOverlap, tankSpecies } from './targets';

export type CompatInsight =
  | { kind: 'water'; severity: 'bad'; species: Species[] }
  | { kind: 'conflict'; severity: 'bad'; param: SpeciesParam; low: Species; high: Species }
  | { kind: 'group'; severity: 'warn'; species: Species; count: number }
  | { kind: 'volume'; severity: 'warn'; species: Species; volumeL: number }
  | { kind: 'reef'; severity: 'warn' | 'info'; species: Species }
  | { kind: 'coral-profile'; severity: 'info' };

/** Checks the livestock against the tank and against each other. */
export function compatibility(tank: Tank): CompatInsight[] {
  const profile = PROFILES[tank.profile];
  const all = tankSpecies(tank);
  const issues: CompatInsight[] = [];

  const wrongWater = all.filter((s) => s.water !== profile.water);
  if (wrongWater.length > 0) issues.push({ kind: 'water', severity: 'bad', species: wrongWater });

  const species = all.filter((s) => s.water === profile.water);
  for (const param of SPECIES_PARAMS) {
    const overlap = speciesOverlap(species, param);
    if (overlap?.conflict && overlap.lowFrom && overlap.highFrom) {
      issues.push({ kind: 'conflict', severity: 'bad', param, low: overlap.highFrom, high: overlap.lowFrom });
    }
  }

  const counts = new Map<string, number>();
  for (const inhabitant of tank.inhabitants) {
    if (inhabitant.speciesId) counts.set(inhabitant.speciesId, (counts.get(inhabitant.speciesId) ?? 0) + inhabitant.count);
  }
  for (const s of species) {
    const count = counts.get(s.id) ?? 0;
    if (s.minGroup && count < s.minGroup) issues.push({ kind: 'group', severity: 'warn', species: s, count });
    if (s.minVolumeL && tank.volumeL && tank.volumeL < s.minVolumeL * 0.95) {
      issues.push({ kind: 'volume', severity: 'warn', species: s, volumeL: tank.volumeL });
    }
    if (tank.profile === 'reef' && s.reefSafe !== undefined && s.reefSafe !== true) {
      issues.push({ kind: 'reef', severity: s.reefSafe === false ? 'warn' : 'info', species: s });
    }
  }

  const hasCorals = tank.inhabitants.some((i) => i.kind === 'coral' || getSpecies(i.speciesId)?.kind === 'coral');
  if (tank.profile === 'marine' && hasCorals) issues.push({ kind: 'coral-profile', severity: 'info' });

  return issues;
}
