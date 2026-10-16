import { sgToPpt } from '../lib/units';
import type { L10n, ParamId, ProfileId, Range, Water } from '../lib/types';

export interface ParamTarget {
  /** Aim for this (green). */
  ideal: Range;
  /** Tolerable for a while (amber); outside it is red. */
  acceptable: Range;
}

export interface Profile {
  id: ProfileId;
  water: Water;
  name: L10n;
  description: L10n;
  /** Parameters tracked by default, in display order. */
  params: ParamId[];
  targets: Partial<Record<ParamId, ParamTarget>>;
  /** Suggested test interval once the tank is established. */
  testEveryDays: number;
}

/** Any reading above zero is a problem; up to 0.25 ppm (the first step on most test kits) is amber. */
const zero: ParamTarget = { ideal: [0, 0], acceptable: [0, 0.25] };
/** Shrimp tolerate no measurable ammonia or nitrite at all: every positive reading is urgent. */
const none: ParamTarget = { ideal: [0, 0], acceptable: [0, 0] };

export const PROFILES: Record<ProfileId, Profile> = {
  tropical: {
    id: 'tropical',
    water: 'fresh',
    name: { en: 'Tropical community', nl: 'Tropisch gezelschapsaquarium' },
    description: {
      en: 'Mixed freshwater fish such as tetras, rasboras, livebearers, corydoras and gouramis.',
      nl: 'Gemengde zoetwatervissen zoals tetra’s, rasbora’s, levendbarenden, pantsermeervallen en goerami’s.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh'],
    targets: {
      temperature: { ideal: [24, 27], acceptable: [22, 29] },
      ph: { ideal: [6.5, 7.5], acceptable: [6, 8] },
      ammonia: zero,
      nitrite: zero,
      nitrate: { ideal: [0, 20], acceptable: [0, 40] },
      gh: { ideal: [4, 12], acceptable: [2, 20] },
      kh: { ideal: [3, 8], acceptable: [2, 12] },
      phosphate: { ideal: [0, 1], acceptable: [0, 2] },
    },
    testEveryDays: 7,
  },
  planted: {
    id: 'planted',
    water: 'fresh',
    name: { en: 'Planted (CO₂ & fertiliser)', nl: 'Plantenaquarium (CO₂ & meststof)' },
    description: {
      en: 'Densely planted, with fertiliser and usually CO₂ injection.',
      nl: 'Dicht beplant, met meststof en meestal CO₂-toevoeging.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'phosphate', 'kh', 'gh', 'co2'],
    targets: {
      temperature: { ideal: [22, 26], acceptable: [20, 29] },
      ph: { ideal: [6.5, 7.5], acceptable: [6, 7.6] },
      ammonia: zero,
      nitrite: zero,
      // Nutrients here: zero nitrate or phosphate means the plants are starving.
      nitrate: { ideal: [5, 20], acceptable: [0, 30] },
      phosphate: { ideal: [0.3, 1], acceptable: [0, 2] },
      gh: { ideal: [3, 8], acceptable: [1, null] },
      kh: { ideal: [4, 8], acceptable: [3, 12] },
      co2: { ideal: [20, 30], acceptable: [10, 35] },
      potassium: { ideal: [10, 20], acceptable: [5, 30] },
      iron: { ideal: [0.1, 0.3], acceptable: [0, null] },
    },
    testEveryDays: 7,
  },
  coldwater: {
    id: 'coldwater',
    water: 'fresh',
    name: { en: 'Coldwater & goldfish', nl: 'Koudwater & goudvissen' },
    description: {
      en: 'Unheated tanks for goldfish and other coldwater species.',
      nl: 'Onverwarmde aquaria voor goudvissen en andere koudwatersoorten.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh'],
    targets: {
      // Goldfish overwinter in cold ponds, so a cool room is no emergency.
      temperature: { ideal: [18, 22], acceptable: [10, 24] },
      ph: { ideal: [7.2, 8], acceptable: [6.5, 8.5] },
      ammonia: zero,
      nitrite: zero,
      nitrate: { ideal: [0, 20], acceptable: [0, 50] },
      gh: { ideal: [8, 15], acceptable: [5, 20] },
      kh: { ideal: [4, 8], acceptable: [3, 12] },
      phosphate: { ideal: [0, 1], acceptable: [0, 2] },
    },
    testEveryDays: 7,
  },
  softwater: {
    id: 'softwater',
    water: 'fresh',
    name: { en: 'Soft & acidic water', nl: 'Zacht & zuur water' },
    description: {
      en: 'Blackwater-style tanks for discus, Apistogramma, cardinal tetras and rasboras.',
      nl: 'Zwartwateraquaria voor discus, Apistogramma, kardinaaltetra’s en rasbora’s.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh'],
    targets: {
      temperature: { ideal: [25, 29], acceptable: [24, 30] },
      ph: { ideal: [5.5, 7], acceptable: [5, 7.5] },
      ammonia: zero,
      nitrite: zero,
      nitrate: { ideal: [0, 10], acceptable: [0, 20] },
      gh: { ideal: [1, 6], acceptable: [0, 10] },
      kh: { ideal: [0, 3], acceptable: [0, 5] },
      phosphate: { ideal: [0, 1], acceptable: [0, 2] },
    },
    testEveryDays: 7,
  },
  riftlake: {
    id: 'riftlake',
    water: 'fresh',
    name: { en: 'African Rift Lake cichlids', nl: 'Afrikaanse cichliden (Malawi/Tanganyika)' },
    description: {
      en: 'Hard, alkaline water for Malawi and Tanganyika cichlids.',
      nl: 'Hard, basisch water voor cichliden uit het Malawi- en Tanganyikameer.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh'],
    targets: {
      temperature: { ideal: [24, 27], acceptable: [23, 28] },
      ph: { ideal: [7.8, 8.6], acceptable: [7.5, 9] },
      ammonia: zero,
      nitrite: zero,
      nitrate: { ideal: [0, 20], acceptable: [0, 30] },
      gh: { ideal: [10, 18], acceptable: [8, 25] },
      kh: { ideal: [10, 15], acceptable: [8, 18] },
      phosphate: { ideal: [0, 1], acceptable: [0, 2] },
    },
    testEveryDays: 7,
  },
  neocaridina: {
    id: 'neocaridina',
    water: 'fresh',
    name: { en: 'Shrimp (Neocaridina)', nl: 'Garnalen (Neocaridina)' },
    description: {
      en: 'Cherry shrimp and other Neocaridina in tap water or remineralised RO water.',
      nl: 'Red cherry en andere Neocaridina in kraanwater of geremineraliseerd osmosewater.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh', 'tds'],
    targets: {
      temperature: { ideal: [20, 25], acceptable: [18, 26] },
      ph: { ideal: [6.8, 7.6], acceptable: [6.5, 8] },
      ammonia: none,
      nitrite: none,
      nitrate: { ideal: [0, 20], acceptable: [0, 30] },
      gh: { ideal: [6, 12], acceptable: [4, 14] },
      kh: { ideal: [2, 8], acceptable: [0, 10] },
      tds: { ideal: [150, 250], acceptable: [100, 400] },
      phosphate: { ideal: [0, 1], acceptable: [0, 3] },
    },
    testEveryDays: 7,
  },
  caridina: {
    id: 'caridina',
    water: 'fresh',
    name: { en: 'Shrimp (Caridina)', nl: 'Garnalen (Caridina)' },
    description: {
      en: 'Crystal and bee shrimp on active soil with remineralised RO water.',
      nl: 'Crystal- en beegarnalen op actieve bodem met geremineraliseerd osmosewater.',
    },
    params: ['temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh', 'tds'],
    targets: {
      temperature: { ideal: [20, 23], acceptable: [18, 25] },
      ph: { ideal: [6, 6.8], acceptable: [5.5, 7.2] },
      ammonia: none,
      nitrite: none,
      nitrate: { ideal: [0, 10], acceptable: [0, 20] },
      gh: { ideal: [4, 6], acceptable: [3, 8] },
      kh: { ideal: [0, 2], acceptable: [0, 4] },
      tds: { ideal: [100, 150], acceptable: [80, 200] },
      phosphate: { ideal: [0, 1], acceptable: [0, 2] },
    },
    testEveryDays: 7,
  },
  marine: {
    id: 'marine',
    water: 'marine',
    name: { en: 'Marine fish-only', nl: 'Zeewater (alleen vissen)' },
    description: {
      en: 'Saltwater fish, with or without live rock, no corals.',
      nl: 'Zeewatervissen, met of zonder levend steen, zonder koralen.',
    },
    params: ['temperature', 'salinity', 'ph', 'ammonia', 'nitrite', 'nitrate', 'kh'],
    targets: {
      temperature: { ideal: [24, 27], acceptable: [22, 28] },
      salinity: { ideal: [sgToPpt(1.02), sgToPpt(1.025)], acceptable: [sgToPpt(1.018), sgToPpt(1.027)] },
      ph: { ideal: [8.1, 8.3], acceptable: [7.8, 8.4] },
      ammonia: zero,
      nitrite: zero,
      nitrate: { ideal: [0, 20], acceptable: [0, 40] },
      kh: { ideal: [7, 10], acceptable: [6, 12] },
      phosphate: { ideal: [0, 0.2], acceptable: [0, 0.5] },
      calcium: { ideal: [380, 450], acceptable: [350, 480] },
      magnesium: { ideal: [1250, 1350], acceptable: [1150, 1400] },
    },
    testEveryDays: 7,
  },
  reef: {
    id: 'reef',
    water: 'marine',
    name: { en: 'Reef (corals)', nl: 'Rifaquarium (koralen)' },
    description: {
      en: 'Saltwater with corals: soft corals, LPS and SPS.',
      nl: 'Zeewater met koralen: zachte koralen, LPS en SPS.',
    },
    params: ['temperature', 'salinity', 'ph', 'kh', 'calcium', 'magnesium', 'nitrate', 'phosphate', 'ammonia', 'nitrite'],
    targets: {
      temperature: { ideal: [24, 27], acceptable: [22.5, 28.5] },
      // SG 1.025–1.0265 covers natural seawater (35 ppt ≈ SG 1.0264).
      salinity: { ideal: [sgToPpt(1.025), sgToPpt(1.0265)], acceptable: [sgToPpt(1.023), sgToPpt(1.0275)] },
      ph: { ideal: [8.1, 8.3], acceptable: [7.8, 8.4] },
      ammonia: zero,
      nitrite: zero,
      // Corals need some nutrients: do not chase zero nitrate or phosphate.
      nitrate: { ideal: [2, 10], acceptable: [0, 20] },
      phosphate: { ideal: [0.03, 0.1], acceptable: [0, 0.2] },
      kh: { ideal: [7, 11], acceptable: [6, 12] },
      calcium: { ideal: [380, 450], acceptable: [350, 500] },
      magnesium: { ideal: [1250, 1350], acceptable: [1200, 1400] },
      potassium: { ideal: [380, 420], acceptable: [350, 450] },
    },
    testEveryDays: 3,
  },
};

export const PROFILE_IDS = Object.keys(PROFILES) as ProfileId[];

export const isProfileId = (value: unknown): value is ProfileId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PROFILES, value);
