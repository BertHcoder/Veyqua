export type Lang = 'en' | 'nl';

/** A string in every supported language. */
export type L10n = Record<Lang, string>;

export type ParamId =
  | 'temperature'
  | 'ph'
  | 'ammonia'
  | 'nitrite'
  | 'nitrate'
  | 'gh'
  | 'kh'
  | 'phosphate'
  | 'salinity'
  | 'calcium'
  | 'magnesium'
  | 'potassium'
  | 'tds'
  | 'co2'
  | 'iron';

export type ProfileId =
  | 'tropical'
  | 'planted'
  | 'coldwater'
  | 'softwater'
  | 'riftlake'
  | 'neocaridina'
  | 'caridina'
  | 'marine'
  | 'reef';

export type Water = 'fresh' | 'marine';

/** Inclusive range in canonical units; `null` means open-ended. */
export type Range = [min: number | null, max: number | null];

export interface Measurement {
  id: string;
  /** ISO timestamp. */
  takenAt: string;
  /** Values in canonical units: °C, dGH/dKH, ppt salinity, mg/L for the rest. */
  values: Partial<Record<ParamId, number>>;
  note?: string;
}

export type CareEventType =
  | 'water-change'
  | 'filter'
  | 'cleaning'
  | 'dosing'
  | 'medication'
  | 'livestock'
  | 'other';

export interface CareEvent {
  id: string;
  /** ISO timestamp. */
  at: string;
  type: CareEventType;
  /** Water change size in percent of the tank volume. */
  percent?: number;
  note?: string;
}

export type InhabitantKind = 'fish' | 'invertebrate' | 'coral' | 'plant' | 'other';

export interface Inhabitant {
  id: string;
  /** Set when picked from the species library. */
  speciesId?: string;
  name: string;
  kind: InhabitantKind;
  count: number;
  /** YYYY-MM-DD */
  addedOn?: string;
  note?: string;
}

export interface Tank {
  id: string;
  name: string;
  profile: ProfileId;
  volumeL?: number;
  /** YYYY-MM-DD */
  startedOn?: string;
  /** True while the nitrogen cycle is still establishing. */
  cycling: boolean;
  /** Parameters shown in the test form, in display order. */
  params: ParamId[];
  /** Manual target overrides in canonical units. */
  targets: Partial<Record<ParamId, Range>>;
  testEveryDays?: number;
  waterChangeEveryDays?: number;
  notes?: string;
  inhabitants: Inhabitant[];
  measurements: Measurement[];
  events: CareEvent[];
  createdAt: string;
  updatedAt: string;
}

export type TemperatureUnit = 'C' | 'F';
export type VolumeUnit = 'L' | 'gal';
export type HardnessUnit = 'dH' | 'ppm';
export type SalinityUnit = 'sg' | 'ppt';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  /** Undefined follows the browser language. */
  lang?: Lang;
  theme: Theme;
  temperatureUnit: TemperatureUnit;
  volumeUnit: VolumeUnit;
  hardnessUnit: HardnessUnit;
  salinityUnit: SalinityUnit;
  /** ISO timestamp of the last exported backup. */
  lastBackupAt?: string;
  /** ISO timestamp until which the backup reminder stays hidden. */
  backupReminderSnoozedUntil?: string;
}

export interface AppData {
  version: 1;
  settings: Settings;
  tanks: Tank[];
}
