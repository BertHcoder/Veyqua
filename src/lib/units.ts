import type { Lang, ParamId, Range, Settings } from './types';

/** mg/L CaCO₃ per German degree of hardness (°dH = 10 mg/L CaO). */
export const PPM_PER_DEGREE = 17.848;
export const LITERS_PER_GALLON = 3.785411784;
/** Seawater at 25 °C: 35 ppt ≈ SG 1.0264, and the relation is close to linear in the hobby range. */
const PPT_PER_SG = 1327;

export const sgToPpt = (sg: number) => (sg - 1) * PPT_PER_SG;
export const pptToSg = (ppt: number) => 1 + ppt / PPT_PER_SG;
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;

export interface DisplayUnit {
  label: string;
  minDecimals: number;
  maxDecimals: number;
  toDisplay: (canonical: number) => number;
  fromDisplay: (display: number) => number;
}

const identity = (v: number) => v;

const BASE: Record<ParamId, { label: string; decimals: number }> = {
  temperature: { label: '°C', decimals: 1 },
  ph: { label: '', decimals: 2 },
  ammonia: { label: 'ppm', decimals: 2 },
  nitrite: { label: 'ppm', decimals: 2 },
  nitrate: { label: 'ppm', decimals: 1 },
  gh: { label: 'dGH', decimals: 1 },
  kh: { label: 'dKH', decimals: 1 },
  phosphate: { label: 'ppm', decimals: 3 },
  salinity: { label: 'ppt', decimals: 1 },
  calcium: { label: 'ppm', decimals: 0 },
  magnesium: { label: 'ppm', decimals: 0 },
  potassium: { label: 'ppm', decimals: 1 },
  tds: { label: 'ppm', decimals: 0 },
  co2: { label: 'ppm', decimals: 0 },
  iron: { label: 'ppm', decimals: 2 },
};

type UnitSettings = Pick<Settings, 'temperatureUnit' | 'hardnessUnit' | 'salinityUnit'>;

export function displayUnit(param: ParamId, settings: UnitSettings): DisplayUnit {
  if (param === 'temperature' && settings.temperatureUnit === 'F') {
    return { label: '°F', minDecimals: 0, maxDecimals: 1, toDisplay: cToF, fromDisplay: fToC };
  }
  if ((param === 'gh' || param === 'kh') && settings.hardnessUnit === 'ppm') {
    return {
      label: 'ppm',
      minDecimals: 0,
      maxDecimals: 0,
      toDisplay: (v) => v * PPM_PER_DEGREE,
      fromDisplay: (v) => v / PPM_PER_DEGREE,
    };
  }
  if (param === 'salinity' && settings.salinityUnit === 'sg') {
    return { label: 'SG', minDecimals: 3, maxDecimals: 4, toDisplay: pptToSg, fromDisplay: sgToPpt };
  }
  const base = BASE[param];
  return {
    label: base.label,
    minDecimals: 0,
    maxDecimals: base.decimals,
    toDisplay: identity,
    fromDisplay: identity,
  };
}

const formatters = new Map<string, Intl.NumberFormat>();

export function formatNumber(value: number, lang: Lang, minDecimals: number, maxDecimals: number): string {
  const key = `${lang}|${minDecimals}|${maxDecimals}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(lang === 'nl' ? 'nl-BE' : 'en-GB', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: maxDecimals,
      useGrouping: false,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}

/** Formats a canonical value in the user's display unit, e.g. "77 °F" or "7.4". */
export function formatValue(param: ParamId, canonical: number, settings: UnitSettings, lang: Lang, withUnit = true): string {
  const unit = displayUnit(param, settings);
  const text = formatNumber(unit.toDisplay(canonical), lang, unit.minDecimals, unit.maxDecimals);
  return withUnit && unit.label ? `${text}\u00a0${unit.label}` : text;
}

/** Formats a canonical range, e.g. "24–27 °C", "≤ 20 ppm" or "0 ppm". */
export function formatRange(param: ParamId, range: Range, settings: UnitSettings, lang: Lang): string {
  const unit = displayUnit(param, settings);
  const [min, max] = range;
  const num = (v: number) => formatNumber(unit.toDisplay(v), lang, unit.minDecimals, unit.maxDecimals);
  const suffix = unit.label ? `\u00a0${unit.label}` : '';
  if (min === null && max === null) return '—';
  if (min !== null && max !== null && min === max) return `${num(min)}${suffix}`;
  if (max !== null && (min === null || (min === 0 && param !== 'temperature'))) return `≤\u00a0${num(max)}${suffix}`;
  if (max === null && min !== null) return `≥\u00a0${num(min)}${suffix}`;
  return `${num(min as number)}–${num(max as number)}${suffix}`;
}

/** Formats a change (e.g. "+0.5 °C" or "−9 °F"): unit offsets such as °C → °F do not apply to differences. */
export function formatDelta(param: ParamId, delta: number, settings: UnitSettings, lang: Lang): string {
  const unit = displayUnit(param, settings);
  const display = unit.toDisplay(delta) - unit.toDisplay(0);
  const sign = display > 0 ? '+' : display < 0 ? '−' : '';
  const text = formatNumber(Math.abs(display), lang, 0, Math.max(unit.maxDecimals, 1));
  return unit.label ? `${sign}${text}\u00a0${unit.label}` : `${sign}${text}`;
}

/** Parses user input that may use a comma or a dot as decimal separator. */
export function parseNumber(input: string): number | null {
  const text = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Converts a display value to canonical units, or null when the input is not a number. */
export function parseDisplayValue(param: ParamId, input: string, settings: UnitSettings): number | null {
  const value = parseNumber(input);
  return value === null ? null : displayUnit(param, settings).fromDisplay(value);
}

/** Canonical value rendered for an input field in display units, without unit label. */
export function toInputValue(param: ParamId, canonical: number | null | undefined, settings: UnitSettings, lang: Lang): string {
  if (canonical === null || canonical === undefined) return '';
  return formatValue(param, canonical, settings, lang, false);
}

export function formatVolume(liters: number, unit: Settings['volumeUnit'], lang: Lang): string {
  if (unit === 'gal') {
    const gallons = liters / LITERS_PER_GALLON;
    return `${formatNumber(gallons, lang, 0, gallons < 10 ? 1 : 0)}\u00a0gal`;
  }
  return `${formatNumber(liters, lang, 0, liters < 10 ? 1 : 0)}\u00a0L`;
}

export function volumeToDisplay(liters: number, unit: Settings['volumeUnit']): number {
  return unit === 'gal' ? liters / LITERS_PER_GALLON : liters;
}

export function volumeFromDisplay(value: number, unit: Settings['volumeUnit']): number {
  return unit === 'gal' ? value * LITERS_PER_GALLON : value;
}
