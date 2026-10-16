import type { L10n, ParamId, Water } from '../lib/types';

export interface ParamDef {
  id: ParamId;
  name: L10n;
  /** Chemical notation or abbreviation shown next to the name. */
  symbol?: string;
  about: L10n;
  /** Values printed on common drop-test colour charts, for quick entry (canonical units). */
  kitSteps?: number[];
  /** Readings outside this range are almost certainly typos (canonical units). */
  plausible: [number, number];
  /** Largest change per day that animals tolerate well (canonical units), used to flag swings. */
  maxDailyChange?: number;
  /** Water types where this parameter is commonly tested. */
  waters: Water[];
}

export const PARAMS: Record<ParamId, ParamDef> = {
  temperature: {
    id: 'temperature',
    waters: ['fresh', 'marine'],
    name: { en: 'Temperature', nl: 'Temperatuur' },
    about: {
      en: 'Fish and invertebrates are cold-blooded: water temperature sets their metabolism, oxygen needs and immune response. Keep it stable within the range your animals need; tropical tanks need a heater with a thermostat.',
      nl: 'Vissen en ongewervelden zijn koudbloedig: de watertemperatuur bepaalt hun stofwisseling, zuurstofbehoefte en weerstand. Houd ze stabiel binnen het bereik dat je dieren nodig hebben; een tropisch aquarium heeft een verwarming met thermostaat nodig.',
    },
    plausible: [0, 40],
    maxDailyChange: 1,
  },
  ph: {
    id: 'ph',
    waters: ['fresh', 'marine'],
    name: { en: 'pH', nl: 'pH' },
    about: {
      en: 'How acidic (below 7) or alkaline (above 7) the water is. Most fish adapt to a stable pH within their range; sudden changes do more harm than a slightly "wrong" value. pH also decides how toxic ammonia is.',
      nl: 'Hoe zuur (onder 7) of basisch (boven 7) het water is. De meeste vissen passen zich aan een stabiele pH binnen hun bereik aan; plotse schommelingen zijn schadelijker dan een iets "verkeerde" waarde. De pH bepaalt ook hoe giftig ammoniak is.',
    },
    plausible: [3, 11],
    maxDailyChange: 0.3,
  },
  ammonia: {
    id: 'ammonia',
    waters: ['fresh', 'marine'],
    name: { en: 'Ammonia', nl: 'Ammoniak' },
    symbol: 'NH₃/NH₄⁺',
    about: {
      en: 'Produced by fish waste, uneaten food and decaying matter. Highly toxic. A cycled filter converts it to nitrite within hours, so a healthy tank reads 0. The toxic share (free NH₃) rises with pH and temperature.',
      nl: 'Ontstaat uit uitwerpselen, voedselresten en rottend materiaal. Zeer giftig. Een ingelopen filter zet het binnen enkele uren om in nitriet, dus een gezond aquarium meet 0. Het giftige deel (vrij NH₃) stijgt met de pH en de temperatuur.',
    },
    kitSteps: [0, 0.25, 0.5, 1, 2, 4, 8],
    plausible: [0, 20],
  },
  nitrite: {
    id: 'nitrite',
    waters: ['fresh', 'marine'],
    name: { en: 'Nitrite', nl: 'Nitriet' },
    symbol: 'NO₂⁻',
    about: {
      en: 'The middle step of the nitrogen cycle. Toxic: it blocks oxygen transport in the blood. A cycled tank reads 0; any nitrite means the filter bacteria cannot keep up.',
      nl: 'De tussenstap van de stikstofcyclus. Giftig: het verhindert het zuurstoftransport in het bloed. Een ingelopen aquarium meet 0; elk spoor nitriet betekent dat de filterbacteriën het niet bijhouden.',
    },
    kitSteps: [0, 0.25, 0.5, 1, 2, 5],
    plausible: [0, 20],
  },
  nitrate: {
    id: 'nitrate',
    waters: ['fresh', 'marine'],
    name: { en: 'Nitrate', nl: 'Nitraat' },
    symbol: 'NO₃⁻',
    about: {
      en: 'The end product of the nitrogen cycle. Far less toxic, but it builds up over time and feeds algae. Regular water changes and plants keep it down. Planted tanks and reefs do need a little.',
      nl: 'Het eindproduct van de stikstofcyclus. Veel minder giftig, maar het stapelt zich op en voedt algen. Regelmatige waterverversingen en planten houden het laag. Plantenaquaria en rifaquaria hebben er wel een beetje van nodig.',
    },
    kitSteps: [0, 5, 10, 20, 40, 80, 160],
    plausible: [0, 500],
  },
  gh: {
    id: 'gh',
    waters: ['fresh'],
    name: { en: 'GH (general hardness)', nl: 'GH (totale hardheid)' },
    about: {
      en: 'Dissolved calcium and magnesium. It matters for the salt balance of fish, moulting shrimp and plant growth. Soft-water species such as tetras and discus like it low; livebearers and African cichlids like it high.',
      nl: 'Opgeloste calcium en magnesium. Belangrijk voor de zouthuishouding van vissen, vervellende garnalen en plantengroei. Zachtwatersoorten zoals tetra’s en discus houden van laag; levendbarenden en Afrikaanse cichliden van hoog.',
    },
    plausible: [0, 50],
  },
  kh: {
    id: 'kh',
    waters: ['fresh', 'marine'],
    name: { en: 'KH / alkalinity', nl: 'KH / alkaliniteit' },
    about: {
      en: 'Carbonate hardness: the buffer that keeps pH stable. When KH runs out, pH can crash suddenly. In reef tanks it is called alkalinity, and corals use it up to build their skeletons.',
      nl: 'Carbonaathardheid: de buffer die de pH stabiel houdt. Raakt de KH op, dan kan de pH plots instorten. In rifaquaria heet dit alkaliniteit; koralen verbruiken ze om hun skelet op te bouwen.',
    },
    plausible: [0, 40],
    // Reef corals react badly to fast alkalinity swings.
    maxDailyChange: 1.5,
  },
  phosphate: {
    id: 'phosphate',
    waters: ['fresh', 'marine'],
    name: { en: 'Phosphate', nl: 'Fosfaat' },
    symbol: 'PO₄³⁻',
    about: {
      en: 'Comes from food and waste. Plants and corals need a little, but excess phosphate is a main driver of algae. Reef tanks aim for low, not zero.',
      nl: 'Komt uit voer en afval. Planten en koralen hebben er een beetje van nodig, maar te veel fosfaat is een hoofdoorzaak van algen. Rifaquaria mikken op laag, niet op nul.',
    },
    plausible: [0, 20],
  },
  salinity: {
    id: 'salinity',
    waters: ['marine'],
    name: { en: 'Salinity', nl: 'Saliniteit' },
    about: {
      en: 'The amount of dissolved salt, measured as specific gravity (SG) or in ppt. Natural seawater is about 35 ppt (SG 1.026). Top up evaporated water with fresh (RO) water, never with salt water.',
      nl: 'De hoeveelheid opgelost zout, gemeten als soortelijk gewicht (SG) of in ppt. Natuurlijk zeewater zit rond 35 ppt (SG 1,026). Vul verdampt water bij met zoet (osmose)water, nooit met zout water.',
    },
    plausible: [0, 50],
    // About SG 0.002 per day.
    maxDailyChange: 2.6,
  },
  calcium: {
    id: 'calcium',
    waters: ['marine'],
    name: { en: 'Calcium', nl: 'Calcium' },
    symbol: 'Ca',
    about: {
      en: 'Corals, clams and coralline algae use calcium to build their skeletons. Keep it close to natural seawater and in balance with alkalinity and magnesium.',
      nl: 'Koralen, doopvontschelpen en kalkalgen gebruiken calcium om hun skelet op te bouwen. Houd het dicht bij natuurlijk zeewater en in evenwicht met alkaliniteit en magnesium.',
    },
    plausible: [0, 1000],
  },
  magnesium: {
    id: 'magnesium',
    waters: ['marine'],
    name: { en: 'Magnesium', nl: 'Magnesium' },
    symbol: 'Mg',
    about: {
      en: 'Keeps calcium and alkalinity from precipitating out of the water. When magnesium is low, calcium and alkalinity are hard to keep stable.',
      nl: 'Voorkomt dat calcium en alkaliniteit neerslaan. Is magnesium te laag, dan zijn calcium en alkaliniteit moeilijk stabiel te houden.',
    },
    plausible: [0, 3000],
    maxDailyChange: 100,
  },
  potassium: {
    id: 'potassium',
    waters: ['fresh', 'marine'],
    name: { en: 'Potassium', nl: 'Kalium' },
    symbol: 'K',
    about: {
      en: 'A major plant nutrient, usually supplied with fertiliser, and one of the main ions in seawater. In planted tanks a shortage shows as small holes in older leaves.',
      nl: 'Een belangrijke plantenvoedingsstof, meestal via meststof toegediend, en een van de hoofdionen in zeewater. In plantenaquaria toont een tekort zich als gaatjes in oudere bladeren.',
    },
    plausible: [0, 1000],
  },
  tds: {
    id: 'tds',
    waters: ['fresh'],
    name: { en: 'TDS', nl: 'TDS' },
    about: {
      en: 'Total dissolved solids: everything dissolved in the water, measured with a TDS pen. Shrimp keepers use it to check remineralised RO water and to spot build-up between water changes.',
      nl: 'Totaal opgeloste stoffen: alles wat in het water is opgelost, gemeten met een TDS-meter. Garnalenhouders gebruiken het om geremineraliseerd osmosewater te controleren en ophoping tussen waterverversingen te zien.',
    },
    plausible: [0, 5000],
  },
  co2: {
    id: 'co2',
    waters: ['fresh'],
    name: { en: 'CO₂', nl: 'CO₂' },
    about: {
      en: 'Carbon dioxide feeds plant growth. Tanks with CO₂ injection aim for the target range; too much suffocates fish. Estimate it with a drop checker or from pH and KH.',
      nl: 'Koolstofdioxide voedt de plantengroei. Aquaria met CO₂-toevoeging mikken op het doelbereik; te veel verstikt vissen. Schat het met een CO₂-indicator (drop checker) of op basis van pH en KH.',
    },
    plausible: [0, 150],
  },
  iron: {
    id: 'iron',
    waters: ['fresh'],
    name: { en: 'Iron', nl: 'IJzer' },
    symbol: 'Fe',
    about: {
      en: 'A trace nutrient for plants, supplied with fertiliser. A shortage shows as pale or yellow new leaves; too much feeds algae.',
      nl: 'Een sporenelement voor planten, toegediend via meststof. Een tekort geeft bleke of gele nieuwe bladeren; te veel voedt algen.',
    },
    plausible: [0, 10],
  },
};

export const PARAM_IDS = Object.keys(PARAMS) as ParamId[];

export const isParamId = (value: unknown): value is ParamId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(PARAMS, value);

const SHORT: Partial<Record<ParamId, L10n>> = {
  gh: { en: 'GH', nl: 'GH' },
  kh: { en: 'KH', nl: 'KH' },
};
const ALKALINITY: L10n = { en: 'Alkalinity (KH)', nl: 'Alkaliniteit (KH)' };

/** Name for sentences and tables: "GH" rather than "GH (general hardness)", and alkalinity for KH in salt water. */
export function paramLabel(param: ParamId, water: Water): L10n {
  if (param === 'kh' && water === 'marine') return ALKALINITY;
  return SHORT[param] ?? PARAMS[param].name;
}