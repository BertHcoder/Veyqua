import type { CycleStage } from '../engine/cycle';
import type { L10n, ParamId, ProfileId, Water } from '../lib/types';
import { PROFILES } from './profiles';

interface Tip {
  text: L10n;
  /** Only for this water type. */
  water?: Water;
  /** Only for these tank types. */
  profiles?: ProfileId[];
}

const SHRIMP: ProfileId[] = ['neocaridina', 'caridina'];

const tip = (en: string, nl: string, only: Omit<Tip, 'text'> = {}): Tip => ({ text: { en, nl }, ...only });

const WATER_CHANGE_NOW = tip(
  'Change 25–50% of the water now, with dechlorinated water at the same temperature.',
  'Ververs nu 25–50% van het water, met ontchloord water van dezelfde temperatuur.',
);
const CHECK_FILTER = tip(
  'Check the filter: was it switched off, or cleaned with tap water? Rinse filter media only in old tank water.',
  'Controleer de filter: stond hij uit, of werd hij met kraanwater gereinigd? Spoel filtermateriaal alleen in oud aquariumwater.',
);
const RO_MIX = tip(
  'Mix your change water with reverse osmosis (RO) water to bring it down.',
  'Meng het verversingswater met osmosewater om de waarde te verlagen.',
  { water: 'fresh' },
);
const CALCAREOUS = tip(
  'Remove rocks and substrate that release minerals, such as limestone, coral sand or shells.',
  'Verwijder stenen en bodemgrond die mineralen afgeven, zoals kalksteen, koraalzand of schelpen.',
  { water: 'fresh' },
);
const GRADUALLY = tip(
  'Adjust it gradually, over several water changes.',
  'Pas ze geleidelijk aan, over meerdere waterverversingen.',
);
const CALIBRATE = tip(
  'Calibrate your refractometer with 35 ppt calibration fluid (SG 1.026), not with RO water.',
  'Kalibreer je refractometer met kalibratievloeistof van 35 ppt (SG 1,026), niet met osmosewater.',
);

const TIPS: Partial<Record<ParamId, { low?: Tip[]; high?: Tip[] }>> = {
  temperature: {
    high: [
      tip(
        'Check the heater: a thermostat that sticks can overheat the tank quickly.',
        'Controleer de verwarming: een thermostaat die blijft hangen kan het water snel oververhitten.',
      ),
      tip(
        'Warm water holds less oxygen: increase surface movement or add an air stone.',
        'Warm water bevat minder zuurstof: zorg voor meer oppervlaktebeweging of plaats een uitstroomsteen.',
      ),
      tip(
        'Cool down gradually: open the lid, switch off the lights and let a fan blow across the water surface.',
        'Koel geleidelijk af: open het deksel, doe de verlichting uit en laat een ventilator over het wateroppervlak blazen.',
      ),
    ],
    low: [
      tip(
        'Unheated tanks follow the room temperature: keep the tank away from windows and outside doors, or use a heater in winter.',
        'Onverwarmde aquaria volgen de kamertemperatuur: houd het aquarium weg van ramen en buitendeuren, of gebruik in de winter een verwarming.',
        { profiles: ['coldwater'] },
      ),
      tip(
        'Check that the heater works, is set correctly and is powerful enough for the volume.',
        'Controleer of de verwarming werkt, juist is ingesteld en krachtig genoeg is voor het volume.',
      ),
      tip('Raise the temperature gradually, not all at once.', 'Verhoog de temperatuur geleidelijk, niet in één keer.'),
      tip(
        'Bring new water to the same temperature during water changes.',
        'Breng nieuw water bij een waterverversing op dezelfde temperatuur.',
      ),
    ],
  },
  ph: {
    high: [
      tip(
        'In a reef, high pH usually comes from dosing kalkwasser or alkalinity: lower the dose.',
        'In een rifaquarium komt een hoge pH meestal door het doseren van kalkwater of alkaliniteit: verlaag de dosis.',
        { water: 'marine' },
      ),
      tip(
        'Avoid pH-lowering products: a sudden drop does more harm than a stable value that is slightly too high.',
        'Vermijd pH-verlagende middelen: een plotse daling is schadelijker dan een stabiele, iets te hoge waarde.',
        { water: 'fresh' },
      ),
      tip(
        'Look for the cause: limestone, coral sand, shells and some decorations raise pH and hardness. Test your tap water too.',
        'Zoek de oorzaak: kalksteen, koraalzand, schelpen en sommige decoratie verhogen de pH en de hardheid. Test ook je kraanwater.',
        { water: 'fresh' },
      ),
      RO_MIX,
      tip(
        'pH probes drift: calibrate them regularly.',
        'pH-sondes verlopen: kalibreer ze regelmatig.',
        { water: 'marine' },
      ),
    ],
    low: [
      tip(
        'With CO₂ injection the pH drops during the day, which is normal. Fish gasping at the surface means too much CO₂.',
        'Met CO₂-toevoeging daalt de pH overdag, dat is normaal. Happen vissen naar lucht aan het oppervlak, dan is er te veel CO₂.',
        { profiles: ['planted'] },
      ),
      tip(
        'Test KH: with little carbonate buffer, the pH can drop quickly.',
        'Test de KH: met weinig carbonaatbuffer kan de pH snel dalen.',
        { water: 'fresh' },
      ),
      tip(
        'Change some water: waste that builds up slowly acidifies the water.',
        'Ververs een deel van het water: afval dat zich opstapelt, verzuurt het water langzaam.',
        { water: 'fresh' },
      ),
      tip(
        'Raise it slowly if needed, for example with a KH buffer. Avoid big jumps.',
        'Verhoog ze indien nodig langzaam, bijvoorbeeld met een KH-buffer. Vermijd grote sprongen.',
        { water: 'fresh' },
      ),
      tip(
        'Low pH is common at night and in closed rooms with a lot of CO₂ in the air: improve surface movement and air the room.',
        'Een lage pH komt vaak voor ’s nachts en in gesloten ruimtes met veel CO₂ in de lucht: zorg voor meer oppervlaktebeweging en verlucht de kamer.',
        { water: 'marine' },
      ),
      tip(
        'Check alkalinity: when it is low, pH drops as well.',
        'Controleer de alkaliniteit: is die te laag, dan daalt de pH mee.',
        { water: 'marine' },
      ),
    ],
  },
  ammonia: {
    high: [
      WATER_CHANGE_NOW,
      tip(
        'Feed less, and remove uneaten food and anything dead or rotting.',
        'Voer minder en verwijder voedselresten en alles wat dood is of rot.',
      ),
      CHECK_FILTER,
      tip(
        'A water conditioner that binds ammonia protects your animals temporarily while the bacteria catch up.',
        'Een waterverbeteraar die ammoniak bindt, beschermt je dieren tijdelijk tot de bacteriën het weer bijhouden.',
      ),
      tip(
        'Added many animals at once? Add new ones in small groups so the filter bacteria can keep up.',
        'Veel dieren tegelijk toegevoegd? Voeg nieuwe dieren in kleine groepen toe, zodat de filterbacteriën kunnen volgen.',
      ),
    ],
  },
  nitrite: {
    high: [
      WATER_CHANGE_NOW,
      tip('Feed less until nitrite is back at 0.', 'Voer minder tot het nitriet terug op 0 staat.'),
      CHECK_FILTER,
      tip(
        'Nitrite in an established tank means the bacteria took a hit: think of medication, a thorough filter clean or a power cut.',
        'Nitriet in een ingelopen aquarium betekent dat de bacteriën een klap kregen: denk aan medicatie, een grondige filterreiniging of een stroomonderbreking.',
      ),
    ],
  },
  nitrate: {
    high: [
      tip('Change water more often, or more at a time.', 'Ververs vaker water, of meer per keer.'),
      tip(
        'Siphon the substrate and clean the filter regularly, in old tank water.',
        'Hevel de bodem af en reinig de filter regelmatig, in oud aquariumwater.',
      ),
      tip('Feed less, and avoid overstocking.', 'Voer minder en vermijd overbevolking.'),
      tip(
        'Fast-growing and floating plants take up nitrate.',
        'Snelgroeiende planten en drijfplanten nemen nitraat op.',
        { water: 'fresh' },
      ),
      tip(
        'Test your tap water: if it already contains nitrate, use (partly) RO water.',
        'Test je kraanwater: bevat het al nitraat, gebruik dan (deels) osmosewater.',
        { water: 'fresh' },
      ),
      tip(
        'Run a protein skimmer, grow macroalgae in a refugium, or consider carbon dosing.',
        'Gebruik een eiwitafschuimer, kweek macroalgen in een refugium, of overweeg koolstofdosering.',
        { water: 'marine' },
      ),
    ],
    low: [
      tip(
        'Your plants use up all the nitrate: add a fertiliser with nitrogen.',
        'Je planten verbruiken al het nitraat: voeg een meststof met stikstof toe.',
        { profiles: ['planted'] },
      ),
      tip(
        'Nitrate at zero can starve corals and favour cyanobacteria and dinoflagellates: feed a little more or reduce nutrient export.',
        'Nitraat op nul kan koralen uithongeren en cyanobacteriën en dinoflagellaten bevoordelen: voer iets meer of verminder de nutriëntenexport.',
        { profiles: ['reef'] },
      ),
    ],
  },
  gh: {
    high: [RO_MIX, CALCAREOUS, GRADUALLY],
    low: [
      tip(
        'Add minerals with a GH remineraliser, especially if you use RO or rain water.',
        'Voeg mineralen toe met een GH-mineralenzout, zeker als je osmose- of regenwater gebruikt.',
      ),
      tip(
        'Shrimp need calcium and magnesium to moult: raise GH slowly to avoid moulting problems.',
        'Garnalen hebben calcium en magnesium nodig om te vervellen: verhoog de GH langzaam om vervellingsproblemen te voorkomen.',
        { profiles: SHRIMP },
      ),
      GRADUALLY,
    ],
  },
  kh: {
    high: [
      tip(
        'Lower or pause alkalinity dosing; corals will use up the excess.',
        'Verlaag of pauzeer de alkaliniteitsdosering; de koralen verbruiken het overschot.',
        { water: 'marine' },
      ),
      tip(
        'Bring it down slowly: fast swings in alkalinity stress corals.',
        'Breng ze langzaam omlaag: snelle schommelingen in alkaliniteit stressen koralen.',
        { water: 'marine' },
      ),
      RO_MIX,
      CALCAREOUS,
    ],
    low: [
      tip(
        'Low KH means little buffer: the pH can suddenly crash.',
        'Een lage KH betekent weinig buffer: de pH kan plots instorten.',
        { water: 'fresh' },
      ),
      tip(
        'Change water regularly and raise KH slowly with a KH buffer or a little baking soda (sodium bicarbonate).',
        'Ververs regelmatig water en verhoog de KH langzaam met een KH-buffer of een beetje zuiveringszout (natriumbicarbonaat).',
        { water: 'fresh' },
      ),
      tip(
        'Corals use alkalinity to grow: dose an alkalinity supplement, such as a two-part system or kalkwasser.',
        'Koralen verbruiken alkaliniteit om te groeien: doseer een alkaliniteitssupplement, zoals een twee-componentensysteem of kalkwater.',
        { water: 'marine' },
      ),
      tip(
        'Raise it slowly, by no more than about 1 dKH per day.',
        'Verhoog ze langzaam, met hoogstens ongeveer 1 dKH per dag.',
        { water: 'marine' },
      ),
    ],
  },
  phosphate: {
    high: [
      tip('Feed less, and rinse frozen food before feeding.', 'Voer minder en spoel diepvriesvoer af voor het voeren.'),
      tip(
        'Change water, and test your tap water for phosphate.',
        'Ververs water en test je kraanwater op fosfaat.',
      ),
      tip(
        'Plants compete with algae for phosphate: more (fast-growing) plants help.',
        'Planten concurreren met algen om fosfaat: meer (snelgroeiende) planten helpen.',
        { water: 'fresh' },
      ),
      tip(
        'A phosphate remover such as GFO helps. Lower it gradually: a sudden drop stresses corals.',
        'Een fosfaatverwijderaar zoals GFO helpt. Verlaag geleidelijk: een plotse daling stresst koralen.',
        { water: 'marine' },
      ),
    ],
    low: [
      tip(
        'Add a fertiliser with phosphate; a shortage slows plant growth.',
        'Voeg een meststof met fosfaat toe; een tekort remt de plantengroei.',
        { profiles: ['planted'] },
      ),
      tip(
        'Phosphate at zero can starve corals: use less phosphate remover or feed a little more.',
        'Fosfaat op nul kan koralen uithongeren: gebruik minder fosfaatverwijderaar of voer iets meer.',
        { profiles: ['reef'] },
      ),
    ],
  },
  salinity: {
    high: [
      tip(
        'Top up evaporated water with fresh RO water only, never with salt water.',
        'Vul verdampt water alleen aan met zoet osmosewater, nooit met zout water.',
      ),
      tip(
        'Lower it gradually by replacing a little tank water with fresh RO water each day.',
        'Verlaag ze geleidelijk door elke dag een beetje aquariumwater te vervangen door zoet osmosewater.',
      ),
      CALIBRATE,
    ],
    low: [
      tip(
        'Check the automatic top-off: is it adding too much fresh water?',
        'Controleer de automatische bijvulling: voegt die te veel zoet water toe?',
      ),
      tip(
        'Raise it gradually, with water changes using slightly saltier water.',
        'Verhoog ze geleidelijk, met waterverversingen met iets zouter water.',
      ),
      CALIBRATE,
    ],
  },
  calcium: {
    high: [
      tip(
        'Pause calcium dosing; corals and coralline algae will use up the excess.',
        'Pauzeer de calciumdosering; koralen en kalkalgen verbruiken het overschot.',
      ),
      tip(
        'Keep calcium, alkalinity and magnesium in balance: test all three.',
        'Houd calcium, alkaliniteit en magnesium in evenwicht: test ze alle drie.',
      ),
    ],
    low: [
      tip(
        'Check magnesium first: when it is low, calcium is hard to keep up.',
        'Controleer eerst magnesium: is dat te laag, dan blijft calcium moeilijk op peil.',
      ),
      tip(
        'Dose calcium, for example with a two-part system, kalkwasser or a calcium reactor, and raise it gradually.',
        'Doseer calcium, bijvoorbeeld met een twee-componentensysteem, kalkwater of een kalkreactor, en verhoog het geleidelijk.',
      ),
    ],
  },
  magnesium: {
    high: [
      tip(
        'Pause magnesium dosing; water changes bring it back down.',
        'Pauzeer de magnesiumdosering; waterverversingen brengen het weer omlaag.',
      ),
    ],
    low: [
      tip(
        'Dose a magnesium supplement and raise it gradually over several days.',
        'Doseer een magnesiumsupplement en verhoog het geleidelijk over meerdere dagen.',
      ),
    ],
  },
  potassium: {
    high: [
      tip(
        'Dose less potassium or fertiliser; water changes bring it down.',
        'Doseer minder kalium of meststof; waterverversingen brengen het omlaag.',
      ),
    ],
    low: [
      tip(
        'Add a potassium fertiliser. A shortage shows as small holes in older leaves.',
        'Voeg een kaliummeststof toe. Een tekort toont zich als gaatjes in oudere bladeren.',
        { water: 'fresh' },
      ),
      tip(
        'Dose a potassium supplement slowly, and test again before dosing more.',
        'Doseer langzaam een kaliumsupplement en test opnieuw voor je meer doseert.',
        { water: 'marine' },
      ),
    ],
  },
  tds: {
    high: [
      tip(
        'Change water with remineralised RO water: dissolved substances build up between changes.',
        'Ververs met geremineraliseerd osmosewater: opgeloste stoffen stapelen zich op tussen verversingen.',
      ),
      tip(
        'Check that you are not overdosing minerals or fertiliser.',
        'Controleer of je niet te veel mineralen of meststof doseert.',
      ),
    ],
    low: [
      tip(
        'Remineralise your RO water to the target with a shrimp mineral salt.',
        'Remineraliseer je osmosewater tot de doelwaarde met een garnalenmineralenzout.',
      ),
    ],
  },
  co2: {
    high: [
      tip(
        'Fish gasping at the surface? Switch off the CO₂ and increase surface movement right away.',
        'Happen de vissen naar lucht aan het oppervlak? Zet de CO₂ uit en zorg meteen voor meer oppervlaktebeweging.',
      ),
      tip(
        'Then lower the bubble rate a little and watch the drop checker: yellow means too much.',
        'Verlaag daarna het aantal bellen een beetje en volg de CO₂-indicator: geel betekent te veel.',
      ),
    ],
    low: [
      tip(
        'Increase the bubble rate gradually while watching your fish.',
        'Verhoog het aantal bellen geleidelijk en let daarbij op je vissen.',
      ),
      tip('Good flow spreads CO₂ through the whole tank.', 'Een goede stroming verspreidt de CO₂ door het hele aquarium.'),
    ],
  },
  iron: {
    high: [
      tip(
        'Dose less iron or all-in-one fertiliser: excess iron feeds algae.',
        'Doseer minder ijzer- of alles-in-één-meststof: een overschot voedt algen.',
      ),
    ],
    low: [
      tip(
        'Add a fertiliser with iron. A shortage shows as pale or yellow new leaves.',
        'Voeg een meststof met ijzer toe. Een tekort geeft bleke of gele nieuwe bladeren.',
      ),
    ],
  },
};

/** Practical steps for a value that is too low or too high in this type of tank. */
export function tipsFor(param: ParamId, direction: 'low' | 'high', profile: ProfileId): L10n[] {
  const water = PROFILES[profile].water;
  return (TIPS[param]?.[direction] ?? [])
    .filter((t) => (!t.water || t.water === water) && (!t.profiles || t.profiles.includes(profile)))
    .map((t) => t.text);
}

const l10n = (en: string, nl: string): L10n => ({ en, nl });

/** Guidance per stage of a fishless cycle. */
export const CYCLE_TIPS: Record<CycleStage, L10n[]> = {
  start: [
    l10n(
      'Add an ammonia source: dose pure ammonia (without additives) to about 2 ppm, or add a pinch of fish food every day.',
      'Voeg een ammoniakbron toe: doseer pure ammoniak (zonder toevoegingen) tot ongeveer 2 ppm, of geef elke dag een snufje visvoer.',
    ),
    l10n(
      'Bottled nitrifying bacteria or filter media from an established tank speed things up.',
      'Flessenbacteriën of filtermateriaal uit een ingelopen aquarium versnellen het proces.',
    ),
    l10n(
      'Keep the filter and heater running, and test ammonia and nitrite every few days.',
      'Laat filter en verwarming draaien en test ammoniak en nitriet om de paar dagen.',
    ),
  ],
  ammonia: [
    l10n(
      'Bacteria that feed on ammonia are multiplying. When ammonia drops, dose it back up to about 2 ppm.',
      'Bacteriën die ammoniak omzetten, vermenigvuldigen zich. Daalt de ammoniak, doseer dan opnieuw tot ongeveer 2 ppm.',
    ),
    l10n(
      'Nitrite usually starts to show up after one to two weeks.',
      'Na een à twee weken verschijnt meestal nitriet.',
    ),
  ],
  nitrite: [
    l10n(
      'Bacteria that feed on nitrite are growing now. This is often the longest stage.',
      'Nu groeien de bacteriën die nitriet omzetten. Dit is vaak de langste fase.',
    ),
    l10n(
      'Keep dosing ammonia to about 2 ppm whenever it reaches zero.',
      'Blijf ammoniak doseren tot ongeveer 2 ppm telkens het op nul staat.',
    ),
    l10n(
      'Nitrite off the chart for weeks? A large water change can get the cycle moving again.',
      'Staat het nitriet al weken buiten de kleurenkaart? Een grote waterverversing kan de cyclus weer op gang brengen.',
    ),
  ],
  done: [
    l10n(
      'To confirm: dose ammonia to 2 ppm. If ammonia and nitrite both read 0 after 24 hours, the cycle is complete.',
      'Ter controle: doseer ammoniak tot 2 ppm. Staan ammoniak en nitriet na 24 uur allebei op 0, dan is de cyclus rond.',
    ),
    l10n(
      'Then do a large water change to bring nitrate down before you add animals.',
      'Doe daarna een grote waterverversing om het nitraat te verlagen voor je dieren toevoegt.',
    ),
    l10n(
      'Add animals gradually, a few at a time, so the bacteria can keep up.',
      'Voeg dieren geleidelijk toe, telkens een paar, zodat de bacteriën kunnen volgen.',
    ),
  ],
};

/** Guidance when animals are already in a tank that is still cycling. */
export const FISH_IN_CYCLE_TIPS: L10n[] = [
  l10n('Test ammonia and nitrite every day.', 'Test elke dag ammoniak en nitriet.'),
  l10n(
    'Change 25–50% of the water whenever ammonia or nitrite reads 0.25 ppm or more.',
    'Ververs 25–50% van het water zodra ammoniak of nitriet 0,25 ppm of meer aangeeft.',
  ),
  l10n(
    'Feed sparingly, and add no more animals until ammonia and nitrite stay at 0.',
    'Voer spaarzaam en voeg geen dieren meer toe tot ammoniak en nitriet op 0 blijven.',
  ),
  l10n(
    'A water conditioner that binds ammonia and nitrite helps protect them in the meantime.',
    'Een waterverbeteraar die ammoniak en nitriet bindt, helpt hen intussen te beschermen.',
  ),
];
