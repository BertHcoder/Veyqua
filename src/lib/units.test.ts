import { describe, expect, it } from 'vitest';
import {
  cToF,
  formatDelta,
  formatRange,
  formatValue,
  formatVolume,
  fToC,
  parseDisplayValue,
  parseNumber,
  pptToSg,
  sgToPpt,
  toInputValue,
} from './units';
import type { Settings } from './types';

const metric: Pick<Settings, 'temperatureUnit' | 'hardnessUnit' | 'salinityUnit'> = {
  temperatureUnit: 'C',
  hardnessUnit: 'dH',
  salinityUnit: 'ppt',
};
const imperial = { ...metric, temperatureUnit: 'F', hardnessUnit: 'ppm', salinityUnit: 'sg' } as const;

describe('unit conversions', () => {
  it('converts temperature both ways', () => {
    expect(cToF(25)).toBe(77);
    expect(fToC(77)).toBeCloseTo(25, 10);
  });

  it('maps 35 ppt to the usual hobby specific gravity', () => {
    expect(pptToSg(35)).toBeCloseTo(1.0264, 4);
    expect(sgToPpt(pptToSg(33.5))).toBeCloseTo(33.5, 10);
  });
});

describe('parsing input', () => {
  it('accepts a comma or a dot as decimal separator', () => {
    expect(parseNumber('7,4')).toBe(7.4);
    expect(parseNumber(' 7.4 ')).toBe(7.4);
    expect(parseNumber('.5')).toBe(0.5);
    expect(parseNumber('12')).toBe(12);
  });

  it('rejects anything that is not a plain number', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1e3')).toBeNull();
    expect(parseNumber('7,4,1')).toBeNull();
  });

  it('converts display units back to canonical units', () => {
    expect(parseDisplayValue('temperature', '77', imperial)).toBeCloseTo(25, 10);
    expect(parseDisplayValue('kh', '89', imperial)).toBeCloseTo(4.99, 2);
    expect(parseDisplayValue('salinity', '1,0264', imperial)).toBeCloseTo(35, 1);
    expect(parseDisplayValue('ph', 'x', metric)).toBeNull();
  });

  it('round-trips values through the input field in both languages', () => {
    for (const lang of ['en', 'nl'] as const) {
      const shown = toInputValue('ph', 7.45, metric, lang);
      expect(parseDisplayValue('ph', shown, metric)).toBe(7.45);
    }
  });
});

describe('formatting', () => {
  it('uses the locale decimal separator and unit labels', () => {
    expect(formatValue('ph', 7.4, metric, 'en')).toBe('7.4');
    expect(formatValue('ph', 7.4, metric, 'nl')).toBe('7,4');
    expect(formatValue('temperature', 25, imperial, 'en')).toBe('77\u00a0°F');
    expect(formatValue('gh', 8, imperial, 'en')).toBe('143\u00a0ppm');
  });

  it('describes ranges compactly', () => {
    expect(formatRange('temperature', [24, 27], metric, 'en')).toBe('24–27\u00a0°C');
    expect(formatRange('nitrate', [0, 20], metric, 'en')).toBe('≤\u00a020\u00a0ppm');
    expect(formatRange('ammonia', [0, 0], metric, 'en')).toBe('0\u00a0ppm');
    expect(formatRange('kh', [7, null], metric, 'en')).toBe('≥\u00a07\u00a0dKH');
    expect(formatRange('ph', [null, null], metric, 'en')).toBe('—');
  });

  it('formats differences without the °C to °F offset', () => {
    expect(formatDelta('temperature', 1, imperial, 'en')).toBe('+1.8\u00a0°F');
    expect(formatDelta('nitrate', -2.5, metric, 'en')).toBe('−2.5\u00a0ppm');
  });

  it('formats volumes in litres or US gallons', () => {
    expect(formatVolume(120, 'L', 'en')).toBe('120\u00a0L');
    expect(formatVolume(120, 'gal', 'en')).toBe('32\u00a0gal');
  });
});
