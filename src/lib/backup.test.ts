import { describe, expect, it } from 'vitest';
import { createBackupJson, mergeData, parseBackup, tankToCsv } from './backup';
import { defaultSettings, normalizeData } from './normalize';
import type { AppData, Tank } from './types';

const tank = (id: string, extra: Partial<Tank> = {}): Tank => ({
  id,
  name: `Tank ${id}`,
  profile: 'tropical',
  cycling: false,
  params: ['temperature', 'ph', 'nitrate'],
  targets: {},
  inhabitants: [],
  measurements: [],
  events: [],
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  ...extra,
});

const data = (...tanks: Tank[]): AppData => ({ version: 1, settings: defaultSettings(), tanks });

describe('backups', () => {
  it('restores exactly what was exported', () => {
    const original = data(
      tank('a', {
        volumeL: 60,
        measurements: [{ id: 'm1', takenAt: '2026-02-01T18:00:00.000Z', values: { ph: 7.2, nitrate: 10 } }],
        events: [{ id: 'e1', at: '2026-02-02T18:00:00.000Z', type: 'water-change', percent: 25 }],
        inhabitants: [{ id: 'i1', speciesId: 'neon-tetra', name: 'Neon tetra', kind: 'fish', count: 10 }],
      }),
    );
    const parsed = parseBackup(createBackupJson(original, new Date('2026-03-01T12:00:00Z')));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.exportedAt).toBe('2026-03-01T12:00:00.000Z');
    expect(parsed.data.tanks[0]).toMatchObject({
      id: 'a',
      volumeL: 60,
      measurements: [{ id: 'm1', values: { ph: 7.2, nitrate: 10 } }],
      events: [{ id: 'e1', type: 'water-change', percent: 25 }],
      inhabitants: [{ id: 'i1', speciesId: 'neon-tetra', count: 10 }],
    });
  });

  it('explains why a file cannot be restored', () => {
    expect(parseBackup('{not json')).toEqual({ ok: false, reason: 'json' });
    expect(parseBackup('{"hello":"world"}')).toEqual({ ok: false, reason: 'format' });
    expect(parseBackup(JSON.stringify({ app: 'veyqua', version: 2, data: { tanks: [] } }))).toEqual({
      ok: false,
      reason: 'version',
    });
  });

  it('drops invalid values instead of trusting the file', () => {
    const result = normalizeData({
      tanks: [
        {
          id: 'x',
          name: 'X',
          profile: 'no-such-profile',
          measurements: [
            { id: 'ok', takenAt: '2026-01-02T10:00:00Z', values: { ph: 7, nitrate: 'lots', unknown: 3 } },
            { id: 'bad-date', takenAt: 'yesterday', values: { ph: 7 } },
          ],
          inhabitants: [{ name: '' }, { name: 'Snail', count: -4 }],
        },
        'not a tank',
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [x] = result.data.tanks;
    expect(result.data.tanks).toHaveLength(1);
    expect(x.profile).toBe('tropical');
    expect(x.measurements).toHaveLength(1);
    expect(x.measurements[0].values).toEqual({ ph: 7 });
    expect(x.inhabitants).toHaveLength(1);
    expect(x.inhabitants[0].count).toBe(1);
  });
});

describe('merging a backup', () => {
  it('adds missing tanks and entries without touching existing data', () => {
    const current = data(
      tank('a', { measurements: [{ id: 'm1', takenAt: '2026-02-01T18:00:00.000Z', values: { ph: 7 } }] }),
    );
    current.settings.lang = 'nl';
    const incoming = data(
      tank('a', {
        name: 'Renamed elsewhere',
        measurements: [
          { id: 'm1', takenAt: '2026-02-01T18:00:00.000Z', values: { ph: 6 } },
          { id: 'm0', takenAt: '2026-01-15T18:00:00.000Z', values: { ph: 7.1 } },
        ],
      }),
      tank('b'),
    );
    incoming.settings.lang = 'en';

    const result = mergeData(current, incoming);
    expect(result.addedTanks).toBe(1);
    expect(result.addedEntries).toBe(1);
    expect(result.data.settings.lang).toBe('nl');
    const a = result.data.tanks.find((t) => t.id === 'a')!;
    expect(a.name).toBe('Tank a');
    expect(a.measurements.map((m) => m.id)).toEqual(['m0', 'm1']);
    expect(a.measurements[1].values.ph).toBe(7);
    expect(result.data.tanks.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('reports when there is nothing new', () => {
    const current = data(tank('a'));
    const result = mergeData(current, data(tank('a')));
    expect(result).toMatchObject({ addedTanks: 0, addedEntries: 0 });
    expect(result.data.tanks[0]).toBe(current.tanks[0]);
  });
});

describe('CSV export', () => {
  it('writes one column per tested parameter in display units', () => {
    const settings = { ...defaultSettings(), temperatureUnit: 'F' as const };
    const csv = tankToCsv(
      tank('a', {
        measurements: [
          { id: '1', takenAt: '2026-02-01T12:00:00.000Z', values: { temperature: 25, ph: 7.2 }, note: 'Cloudy, "milky" water' },
          { id: '2', takenAt: '2026-02-08T12:00:00.000Z', values: { ph: 7 }, note: '=HYPERLINK("http://example.com")' },
        ],
      }),
      settings,
      'en',
    );
    const [header, first, second] = csv.split('\r\n');
    expect(header).toBe('Date,Temperature (°F),pH,Note');
    expect(first).toMatch(/^2026-02-01 \d\d:00,77,7\.2,"Cloudy, ""milky"" water"$/);
    // Formula-like notes are neutralised so spreadsheets show them as text.
    expect(second).toMatch(/^2026-02-08 \d\d:00,,7,"'=HYPERLINK\(""http:\/\/example\.com""\)"$/);
  });
});
