import { isParamId } from '../data/parameters';
import { isProfileId, PROFILES } from '../data/profiles';
import { newId } from './dates';
import type {
  AppData,
  CareEvent,
  CareEventType,
  Inhabitant,
  InhabitantKind,
  Measurement,
  ParamId,
  Range,
  Settings,
  Tank,
} from './types';

type Obj = Record<string, unknown>;

export const CARE_EVENT_TYPES: CareEventType[] = [
  'water-change',
  'filter',
  'cleaning',
  'dosing',
  'medication',
  'livestock',
  'other',
];
export const INHABITANT_KINDS: InhabitantKind[] = ['fish', 'invertebrate', 'coral', 'plant', 'other'];

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max: number): string | undefined =>
  typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : undefined;
const finite = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const timestamp = (v: unknown): string | undefined =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined;
const day = (v: unknown): string | undefined =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : undefined;
const intIn = (v: unknown, min: number, max: number): number | undefined => {
  const n = finite(v);
  return n !== undefined && n >= min && n <= max ? Math.round(n) : undefined;
};
const oneOf = <T extends string>(v: unknown, options: readonly T[]): T | undefined =>
  options.includes(v as T) ? (v as T) : undefined;

export function defaultSettings(): Settings {
  const language = typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';
  const imperial = /^en-(US|LR)$/i.test(language);
  return {
    theme: 'system',
    temperatureUnit: imperial ? 'F' : 'C',
    volumeUnit: imperial ? 'gal' : 'L',
    hardnessUnit: 'dH',
    salinityUnit: 'sg',
  };
}

function normalizeSettings(v: unknown): Settings {
  const defaults = defaultSettings();
  if (!isObj(v)) return defaults;
  return {
    lang: oneOf(v.lang, ['en', 'nl'] as const),
    theme: oneOf(v.theme, ['system', 'light', 'dark'] as const) ?? defaults.theme,
    temperatureUnit: oneOf(v.temperatureUnit, ['C', 'F'] as const) ?? defaults.temperatureUnit,
    volumeUnit: oneOf(v.volumeUnit, ['L', 'gal'] as const) ?? defaults.volumeUnit,
    hardnessUnit: oneOf(v.hardnessUnit, ['dH', 'ppm'] as const) ?? defaults.hardnessUnit,
    salinityUnit: oneOf(v.salinityUnit, ['sg', 'ppt'] as const) ?? defaults.salinityUnit,
    lastBackupAt: timestamp(v.lastBackupAt),
    backupReminderSnoozedUntil: timestamp(v.backupReminderSnoozedUntil),
  };
}

function normalizeRange(v: unknown): Range | undefined {
  if (!Array.isArray(v) || v.length !== 2) return undefined;
  const [a, b] = v.map((x) => (x === null ? null : finite(x)));
  if (a === undefined || b === undefined || (a === null && b === null)) return undefined;
  if (a !== null && b !== null && a > b) return [b, a];
  return [a, b];
}

function normalizeMeasurement(v: unknown): Measurement | undefined {
  if (!isObj(v) || !isObj(v.values)) return undefined;
  const takenAt = timestamp(v.takenAt);
  if (!takenAt) return undefined;
  const values: Partial<Record<ParamId, number>> = {};
  for (const [key, raw] of Object.entries(v.values)) {
    const value = finite(raw);
    if (isParamId(key) && value !== undefined) values[key] = value;
  }
  if (Object.keys(values).length === 0) return undefined;
  return { id: text(v.id, 64) ?? newId(), takenAt, values, note: text(v.note, 1000) };
}

function normalizeEvent(v: unknown): CareEvent | undefined {
  if (!isObj(v)) return undefined;
  const at = timestamp(v.at);
  if (!at) return undefined;
  const percent = finite(v.percent);
  return {
    id: text(v.id, 64) ?? newId(),
    at,
    type: oneOf(v.type, CARE_EVENT_TYPES) ?? 'other',
    percent: percent !== undefined && percent > 0 && percent <= 100 ? percent : undefined,
    note: text(v.note, 1000),
  };
}

function normalizeInhabitant(v: unknown): Inhabitant | undefined {
  if (!isObj(v)) return undefined;
  const name = text(v.name, 120);
  if (!name) return undefined;
  return {
    id: text(v.id, 64) ?? newId(),
    speciesId: text(v.speciesId, 64),
    name,
    kind: oneOf(v.kind, INHABITANT_KINDS) ?? 'other',
    count: intIn(v.count, 1, 100_000) ?? 1,
    addedOn: day(v.addedOn),
    note: text(v.note, 1000),
  };
}

const uniqueById = <T extends { id: string }>(items: T[]): T[] => [...new Map(items.map((i) => [i.id, i])).values()];

export function normalizeTank(v: unknown): Tank | undefined {
  if (!isObj(v)) return undefined;
  const now = new Date().toISOString();
  const profile = isProfileId(v.profile) ? v.profile : 'tropical';
  const params = Array.isArray(v.params) ? [...new Set(v.params.filter(isParamId))] : [];
  const targets: Tank['targets'] = {};
  if (isObj(v.targets)) {
    for (const [key, raw] of Object.entries(v.targets)) {
      const range = normalizeRange(raw);
      if (isParamId(key) && range) targets[key] = range;
    }
  }
  const volume = finite(v.volumeL);
  const list = (x: unknown) => (Array.isArray(x) ? x : []);
  return {
    id: text(v.id, 64) ?? newId(),
    name: text(v.name, 80) ?? 'Aquarium',
    profile,
    volumeL: volume !== undefined && volume > 0 && volume < 1_000_000 ? volume : undefined,
    startedOn: day(v.startedOn),
    cycling: v.cycling === true,
    params: params.length > 0 ? params : [...PROFILES[profile].params],
    targets,
    testEveryDays: intIn(v.testEveryDays, 1, 365),
    waterChangeEveryDays: intIn(v.waterChangeEveryDays, 1, 365),
    notes: text(v.notes, 4000),
    inhabitants: uniqueById(list(v.inhabitants).map(normalizeInhabitant).filter((x) => x !== undefined)),
    measurements: uniqueById(list(v.measurements).map(normalizeMeasurement).filter((x) => x !== undefined)).sort(
      (a, b) => a.takenAt.localeCompare(b.takenAt),
    ),
    events: uniqueById(list(v.events).map(normalizeEvent).filter((x) => x !== undefined)).sort((a, b) =>
      a.at.localeCompare(b.at),
    ),
    createdAt: timestamp(v.createdAt) ?? now,
    updatedAt: timestamp(v.updatedAt) ?? now,
  };
}

export type NormalizeResult = { ok: true; data: AppData } | { ok: false; reason: 'format' | 'version' };

/** Validates untrusted JSON (stored data or a backup file) and returns clean app data. */
export function normalizeData(input: unknown): NormalizeResult {
  let source = input;
  if (isObj(source) && source.app === 'veyqua') {
    if (source.version !== undefined && source.version !== 1) return { ok: false, reason: 'version' };
    source = source.data;
  }
  if (!isObj(source) || !Array.isArray(source.tanks)) return { ok: false, reason: 'format' };
  if (source.version !== undefined && source.version !== 1) return { ok: false, reason: 'version' };
  const tanks = uniqueById(source.tanks.map(normalizeTank).filter((t) => t !== undefined));
  return { ok: true, data: { version: 1, settings: normalizeSettings(source.settings), tanks } };
}
