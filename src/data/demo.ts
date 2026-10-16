import { DAY_MS, isoDate, newId } from '../lib/dates';
import type { CareEvent, CareEventType, Inhabitant, Lang, Measurement, ParamId, Tank } from '../lib/types';
import { PROFILES } from './profiles';
import { getSpecies } from './species';

type Values = Partial<Record<ParamId, number>>;

/**
 * Three example tanks with a few weeks of history up to today, so newcomers can see what Veyqua
 * does before logging their own tests:
 * - a community tank where skipped water changes let nitrate creep up,
 * - a shrimp tank halfway through a fishless cycle,
 * - a reef whose alkalinity is slowly dropping.
 */
export function demoTanks(lang: Lang, now = Date.now()): Tank[] {
  const text = (en: string, nl: string) => (lang === 'nl' ? nl : en);
  const stamp = new Date(now).toISOString();
  const at = (daysAgo: number, hour = 19) => {
    const date = new Date(now - daysAgo * DAY_MS);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };
  const day = (daysAgo: number) => isoDate(new Date(now - daysAgo * DAY_MS));
  const test = (daysAgo: number, values: Values, note?: string): Measurement => ({
    id: newId(),
    takenAt: at(daysAgo),
    values,
    ...(note ? { note } : {}),
  });
  const care = (daysAgo: number, type: CareEventType, extra: Partial<CareEvent> = {}): CareEvent => ({
    id: newId(),
    at: at(daysAgo, 20),
    type,
    ...extra,
  });
  const animal = (speciesId: string, count: number, addedDaysAgo: number): Inhabitant => {
    const species = getSpecies(speciesId);
    return {
      id: newId(),
      speciesId: species?.id,
      name: species?.name[lang] ?? speciesId,
      kind: species?.kind ?? 'other',
      count,
      addedOn: day(addedDaysAgo),
    };
  };
  const plant = (en: string, nl: string, count: number, addedDaysAgo: number): Inhabitant => ({
    id: newId(),
    name: text(en, nl),
    kind: 'plant',
    count,
    addedOn: day(addedDaysAgo),
  });
  const notes = text(
    'Example tank. Delete it under Edit once you have had a look around.',
    'Voorbeeldaquarium. Verwijder het via Bewerken wanneer je genoeg hebt rondgekeken.',
  );

  const community: Tank = {
    id: newId(),
    name: text('Living room', 'Woonkamer'),
    profile: 'tropical',
    volumeL: 120,
    startedOn: day(240),
    cycling: false,
    params: [...PROFILES.tropical.params],
    targets: {},
    testEveryDays: 7,
    waterChangeEveryDays: 7,
    notes,
    inhabitants: [
      animal('neon-tetra', 12, 200),
      animal('harlequin-rasbora', 8, 180),
      animal('bronze-corydoras', 6, 150),
      animal('nerite-snail', 2, 120),
      plant('Java fern', 'Javavaren', 3, 240),
      plant('Amazon sword', 'Amazonezwaardplant', 1, 240),
    ],
    measurements: [
      test(51, { temperature: 24.6, ph: 7, ammonia: 0, nitrite: 0, nitrate: 18, gh: 9, kh: 5 }),
      test(44, { temperature: 24.8, ph: 7, ammonia: 0, nitrite: 0, nitrate: 20 }),
      test(37, { temperature: 24.5, ph: 6.9, ammonia: 0, nitrite: 0, nitrate: 17 }),
      test(30, { temperature: 24.7, ph: 7, ammonia: 0, nitrite: 0, nitrate: 19, gh: 9, kh: 5 }),
      test(23, { temperature: 24.6, ph: 7, ammonia: 0, nitrite: 0, nitrate: 18 }),
      test(15, { temperature: 24.8, ph: 6.9, ammonia: 0, nitrite: 0, nitrate: 18 }),
      test(
        8,
        { temperature: 24.9, ph: 6.9, ammonia: 0, nitrite: 0, nitrate: 24 },
        text('Busy weeks, water changes slipped.', 'Drukke weken, de waterwissels schoten erbij in.'),
      ),
      test(1, { temperature: 24.7, ph: 6.8, ammonia: 0, nitrite: 0, nitrate: 30, gh: 9, kh: 5 }),
    ],
    events: [
      care(50, 'water-change', { percent: 30 }),
      care(43, 'water-change', { percent: 30 }),
      care(36, 'water-change', { percent: 30 }),
      care(36, 'filter', { note: text('Rinsed the sponge in old tank water.', 'Spons uitgespoeld in oud aquariumwater.') }),
      care(29, 'water-change', { percent: 30 }),
      care(22, 'water-change', { percent: 30 }),
    ],
    createdAt: stamp,
    updatedAt: stamp,
  };

  const shrimp: Tank = {
    id: newId(),
    name: text('Shrimp nano', 'Garnalennano'),
    profile: 'neocaridina',
    volumeL: 30,
    startedOn: day(16),
    cycling: true,
    params: [...PROFILES.neocaridina.params],
    targets: {},
    testEveryDays: 3,
    waterChangeEveryDays: 7,
    notes,
    inhabitants: [plant('Java moss', 'Javamos', 1, 16), plant('Anubias nana', 'Anubias nana', 2, 16)],
    measurements: [
      test(16, { temperature: 24, ph: 7.6, ammonia: 2, nitrite: 0, nitrate: 0, gh: 8, kh: 4, tds: 230 }),
      test(13, { temperature: 24, ph: 7.6, ammonia: 2, nitrite: 0 }),
      test(10, { temperature: 24.2, ph: 7.4, ammonia: 0.5, nitrite: 0.5 }),
      test(7, { temperature: 24, ph: 7.4, ammonia: 1, nitrite: 2, nitrate: 5 }),
      test(4, { temperature: 24.1, ph: 7.4, ammonia: 0, nitrite: 2, nitrate: 10 }),
      test(1, { temperature: 24, ph: 7.4, ammonia: 0.5, nitrite: 2, nitrate: 20, gh: 8, kh: 4, tds: 240 }),
    ],
    events: [
      care(16, 'dosing', { note: text('Ammonia to 2 ppm.', 'Ammoniak tot 2 ppm.') }),
      care(10, 'dosing', { note: text('Ammonia back to 2 ppm.', 'Ammoniak opnieuw tot 2 ppm.') }),
      care(4, 'dosing', { note: text('Ammonia back to 2 ppm.', 'Ammoniak opnieuw tot 2 ppm.') }),
    ],
    createdAt: stamp,
    updatedAt: stamp,
  };

  // Alkalinity is tested every few days; the rest about once a week.
  const reefTests: [number, number, Values?][] = [
    [40, 8.5, { ph: 8.2, calcium: 425, magnesium: 1310, nitrate: 5, phosphate: 0.05 }],
    [37, 8.4],
    [34, 8.6, { ph: 8.2, calcium: 420, magnesium: 1300, nitrate: 6, phosphate: 0.06 }],
    [31, 8.5],
    [28, 8.5, { ph: 8.1, calcium: 425, magnesium: 1300, nitrate: 5, phosphate: 0.05 }],
    [25, 8.4],
    [22, 8.5, { ph: 8.2, calcium: 420, magnesium: 1310, nitrate: 4, phosphate: 0.05 }],
    [19, 8.4, { ammonia: 0, nitrite: 0 }],
    [16, 8.5, { ph: 8.2, calcium: 415, magnesium: 1300, nitrate: 5, phosphate: 0.04 }],
    [13, 8.4],
    [10, 8.2, { ph: 8.1, calcium: 415, magnesium: 1290, nitrate: 6, phosphate: 0.05 }],
    [7, 8],
    [4, 7.8, { ph: 8.1, calcium: 410, magnesium: 1290, nitrate: 5, phosphate: 0.05 }],
    [1, 7.6],
  ];

  const reef: Tank = {
    id: newId(),
    name: text('Reef', 'Rifaquarium'),
    profile: 'reef',
    volumeL: 200,
    startedOn: day(420),
    cycling: false,
    params: [...PROFILES.reef.params],
    targets: {},
    testEveryDays: 3,
    waterChangeEveryDays: 14,
    notes,
    inhabitants: [
      animal('ocellaris-clownfish', 2, 330),
      animal('royal-gramma', 1, 250),
      animal('skunk-cleaner-shrimp', 2, 280),
      animal('soft-corals-zoanthids', 4, 360),
      animal('lps-corals', 3, 200),
    ],
    measurements: reefTests.map(([daysAgo, kh, extra], index) =>
      test(daysAgo, { temperature: index % 2 ? 25.4 : 25.6, salinity: index % 3 ? 35 : 34.8, kh, ...extra }),
    ),
    events: [
      care(40, 'water-change', { percent: 10 }),
      care(26, 'water-change', { percent: 10 }),
      care(12, 'water-change', { percent: 10 }),
    ],
    createdAt: stamp,
    updatedAt: stamp,
  };

  return [community, shrimp, reef];
}
