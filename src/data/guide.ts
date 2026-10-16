import type { L10n } from '../lib/types';
import { FISH_IN_CYCLE_TIPS } from './tips';

export type GuideBlock =
  | { type: 'p'; text: L10n }
  | { type: 'h3'; text: L10n }
  | { type: 'ol' | 'ul'; items: L10n[] };

export interface GuideSection {
  id: string;
  title: L10n;
  blocks: GuideBlock[];
}

const l10n = (en: string, nl: string): L10n => ({ en, nl });
const p = (en: string, nl: string): GuideBlock => ({ type: 'p', text: l10n(en, nl) });
const h3 = (en: string, nl: string): GuideBlock => ({ type: 'h3', text: l10n(en, nl) });

export const GUIDE: GuideSection[] = [
  {
    id: 'start',
    title: l10n('Getting started', 'Aan de slag'),
    blocks: [
      p(
        'Fish and invertebrates live in their own waste. In a healthy aquarium, bacteria in the filter and on every surface break that waste down. Most beginner problems come from water that looks clear but is not safe yet: testing shows what you cannot see.',
        'Vissen en ongewervelden leven in hun eigen afval. In een gezond aquarium breken bacteriën in de filter en op elk oppervlak dat afval af. De meeste beginnersproblemen komen van water dat helder oogt maar nog niet veilig is: testen toont wat je niet kunt zien.',
      ),
      {
        type: 'ol',
        items: [
          l10n(
            'Add your aquarium and pick the type that matches the animals you have or want. The type sets the target ranges.',
            'Voeg je aquarium toe en kies het type dat past bij de dieren die je hebt of wilt. Het type bepaalt de streefwaarden.',
          ),
          l10n(
            'Treat tap water with a water conditioner that removes chlorine and chloramine before it goes into the tank.',
            'Behandel kraanwater met een waterverbeteraar die chloor en chlooramine verwijdert voor het in het aquarium gaat.',
          ),
          l10n(
            'Let the tank cycle before you add animals, and log a test every few days.',
            'Laat het aquarium inlopen voor je dieren toevoegt, en noteer om de paar dagen een test.',
          ),
          l10n(
            'Add animals a few at a time, and add them in Veyqua too: it narrows the targets to what all of them tolerate and warns about mismatches.',
            'Voeg dieren met een paar tegelijk toe, en voeg ze ook toe in Veyqua: het versmalt de streefwaarden tot wat ze allemaal verdragen en waarschuwt als iets niet past.',
          ),
          l10n(
            'Download a backup now and then: your data lives only in this browser.',
            'Download af en toe een back-up: je gegevens staan alleen in deze browser.',
          ),
        ],
      },
    ],
  },
  {
    id: 'cycle',
    title: l10n('The nitrogen cycle', 'De stikstofcyclus'),
    blocks: [
      p(
        'Waste and leftover food release ammonia, which is very toxic. One group of bacteria turns ammonia into nitrite, which is also toxic. A second group turns nitrite into nitrate, which is far less harmful: water changes remove it and plants use it. A new filter has hardly any of these bacteria. Growing them is called cycling and usually takes four to eight weeks.',
        'Afval en voedselresten geven ammoniak af, dat zeer giftig is. Een eerste groep bacteriën zet ammoniak om in nitriet, dat ook giftig is. Een tweede groep zet nitriet om in nitraat, dat veel minder schadelijk is: waterverversingen verwijderen het en planten nemen het op. Een nieuwe filter heeft nog nauwelijks zulke bacteriën. Ze laten groeien heet inlopen en duurt meestal vier tot acht weken.',
      ),
      h3('Cycling without animals (recommended)', 'Inlopen zonder dieren (aanbevolen)'),
      {
        type: 'ol',
        items: [
          l10n(
            'Dose pure ammonia (without soap or scent) to about 2 ppm, or add a pinch of fish food every day. Never go above 5 ppm.',
            'Doseer pure ammoniak (zonder zeep of geur) tot ongeveer 2 ppm, of geef elke dag een snufje visvoer. Ga nooit boven 5 ppm.',
          ),
          l10n(
            'Test ammonia and nitrite every few days and log the results. First ammonia falls while nitrite rises, then nitrite falls while nitrate rises.',
            'Test om de paar dagen ammoniak en nitriet en noteer de resultaten. Eerst daalt de ammoniak terwijl het nitriet stijgt, daarna daalt het nitriet terwijl het nitraat stijgt.',
          ),
          l10n(
            'Whenever ammonia gets close to zero, dose it back up to about 2 ppm.',
            'Telkens de ammoniak bijna op nul staat, doseer je opnieuw tot ongeveer 2 ppm.',
          ),
          l10n(
            'The tank is cycled when 2 ppm of ammonia is gone within 24 hours, with ammonia and nitrite both back at 0, several times in a row.',
            'Het aquarium is ingelopen als 2 ppm ammoniak binnen 24 uur weg is, met ammoniak en nitriet allebei terug op 0, en dat een paar keer na elkaar.',
          ),
          l10n(
            'Do a large water change to bring nitrate down, then add your first animals.',
            'Ververs een groot deel van het water om het nitraat te verlagen en voeg dan je eerste dieren toe.',
          ),
        ],
      },
      p(
        'Bottled nitrifying bacteria or filter media from a healthy tank can shorten this to one or two weeks.',
        'Flessenbacteriën of filtermateriaal uit een gezond aquarium kunnen dit inkorten tot een à twee weken.',
      ),
      h3('Animals already in the tank?', 'Zitten er al dieren in?'),
      { type: 'ul', items: FISH_IN_CYCLE_TIPS },
      p(
        'In Veyqua, set the tank to "Still cycling". The tank page then shows which stage you are in and tells you when the cycle looks complete.',
        'Zet het aquarium in Veyqua op "Loopt nog in". De aquariumpagina toont dan in welke fase je zit en meldt wanneer de cyclus rond lijkt.',
      ),
    ],
  },
  {
    id: 'testing',
    title: l10n('Testing the water', 'Het water testen'),
    blocks: [
      {
        type: 'ul',
        items: [
          l10n(
            'Cycling with animals in the tank: test ammonia and nitrite every day. Cycling without animals: every few days.',
            'Inlopen met dieren in het aquarium: test elke dag ammoniak en nitriet. Inlopen zonder dieren: om de paar dagen.',
          ),
          l10n(
            'Once the tank is established, test weekly, and also after big changes or when animals behave oddly.',
            'Is het aquarium ingelopen, test dan wekelijks, en ook na grote veranderingen of als dieren zich vreemd gedragen.',
          ),
          l10n(
            'Corals use up alkalinity and calcium, so reef tanks need those tested every few days.',
            'Koralen verbruiken alkaliniteit en calcium, dus in een rifaquarium test je die om de paar dagen.',
          ),
          l10n(
            'Follow the kit instructions exactly: shake the bottles, wait the stated time and read the colour in daylight against a white background.',
            'Volg de handleiding van je test precies: schud de flesjes, wacht de aangegeven tijd en lees de kleur af bij daglicht tegen een witte achtergrond.',
          ),
          l10n(
            'Check the expiry dates: old reagents give wrong readings.',
            'Let op de houdbaarheidsdatum: oude reagentia geven foute waarden.',
          ),
          l10n(
            'Log pH and temperature together with ammonia. Veyqua uses them to work out how much of the ammonia is in its toxic form (free NH₃).',
            'Noteer pH en temperatuur samen met ammoniak. Veyqua berekent daarmee hoeveel van de ammoniak in de giftige vorm (vrij NH₃) zit.',
          ),
          l10n(
            'Stable values matter more than perfect ones. Chasing a number with chemicals often causes harmful swings.',
            'Stabiele waarden zijn belangrijker dan perfecte. Met middeltjes een getal najagen veroorzaakt vaak schadelijke schommelingen.',
          ),
        ],
      },
    ],
  },
  {
    id: 'water-changes',
    title: l10n('Water changes', 'Water verversen'),
    blocks: [
      {
        type: 'ul',
        items: [
          l10n(
            'Water changes remove nitrate and other waste that the filter does not, and replenish minerals. Change enough, often enough, to keep nitrate within your tank’s target: the nitrate chart shows whether your routine keeps up.',
            'Waterverversingen verwijderen nitraat en ander afval dat de filter niet afbreekt, en vullen mineralen aan. Ververs genoeg en vaak genoeg om het nitraat binnen de streefwaarde van je aquarium te houden: de nitraatgrafiek toont of je routine volstaat.',
          ),
          l10n(
            'Use conditioned water at the same temperature. For marine tanks, mix new salt water to the same salinity.',
            'Gebruik behandeld water van dezelfde temperatuur. Meng bij zeewater nieuw zout water tot dezelfde saliniteit.',
          ),
          l10n(
            'In marine tanks, top up evaporated water with fresh (RO) water, never with salt water: the salt stays behind when water evaporates.',
            'Vul bij zeewater verdampt water aan met zoet osmosewater, nooit met zout water: het zout blijft achter als water verdampt.',
          ),
          l10n(
            'Rinse filter media in old tank water, never under the tap, so the bacteria survive.',
            'Spoel filtermateriaal in oud aquariumwater, nooit onder de kraan, zodat de bacteriën overleven.',
          ),
          l10n(
            'Log every water change in Veyqua: it reminds you when the next one is due and marks it on the charts.',
            'Noteer elke waterverversing in Veyqua: het herinnert je aan de volgende en toont ze op de grafieken.',
          ),
        ],
      },
    ],
  },
];

/** What each status colour means, shown next to the matching pill. */
export const LEVEL_HELP: Record<'ok' | 'warn' | 'bad' | 'cycling', L10n> = {
  ok: l10n('Within the ideal range for this tank.', 'Binnen het ideale bereik voor dit aquarium.'),
  warn: l10n(
    'Outside the ideal range but tolerable for a while. Keep an eye on it and correct gradually.',
    'Buiten het ideale bereik, maar een tijdje aanvaardbaar. Hou het in de gaten en stuur geleidelijk bij.',
  ),
  bad: l10n(
    'Outside the safe range. Act now: the tank page tells you how.',
    'Buiten het veilige bereik. Grijp nu in: de aquariumpagina vertelt je hoe.',
  ),
  cycling: l10n(
    'Expected while a tank without animals is cycling.',
    'Normaal zolang een aquarium zonder dieren inloopt.',
  ),
};

export interface Source {
  title: string;
  url: string;
}

export const SOURCES: { topic: L10n; items: Source[] }[] = [
  {
    topic: l10n('Nitrogen cycle and ammonia', 'Stikstofcyclus en ammoniak'),
    items: [
      { title: 'UF/IFAS Extension – Ammonia in Aquatic Systems (FA031)', url: 'https://ask.ifas.ufl.edu/publication/FA031' },
      {
        title: 'Emerson et al. (1975) – Aqueous ammonia equilibrium calculations',
        url: 'https://doi.org/10.1139/f75-274',
      },
      {
        title: 'SRAC Publication 463 – Ammonia in Fish Ponds',
        url: 'https://aquaculture.mgcafe.uky.edu/sites/aquaculture.ca.uky.edu/files/srac_463_ammonia_in_fish_ponds.pdf',
      },
      {
        title: 'Dr. Tim’s Aquatics – Quick guide to fishless cycling',
        url: 'https://www.drtimsaquatics.com/resources/library/quick-guide-to-fishless-cycling-with-one-and-only/',
      },
      { title: 'Aquarium Science – Safe ammonia levels', url: 'https://aquariumscience.org/5-2-safe-ammonia-levels/' },
    ],
  },
  {
    topic: l10n('Freshwater and plants', 'Zoetwater en planten'),
    items: [
      { title: 'Seriously Fish – species profiles', url: 'https://www.seriouslyfish.com/' },
      { title: 'JBL – Water values in the aquarium', url: 'https://www.jbl.de/en/blog/detail/134' },
      {
        title: 'Tropica – Fertiliser and CO₂',
        url: 'https://tropica.com/en/guide/make-your-aquarium-a-success/fertiliser-and-co2/',
      },
      {
        title: 'Practical Fishkeeping – What water temperature do goldfish need?',
        url: 'https://www.practicalfishkeeping.co.uk/features/what-water-temperature-do-goldfish-need/',
      },
      { title: 'Malawi Cichlids – Water chemistry', url: 'https://www.malawicichlids.co.uk/care-guides/water-chemistry/' },
    ],
  },
  {
    topic: l10n('Shrimp', 'Garnalen'),
    items: [
      {
        title: 'Cherry Shrimps – Neocaridina water parameters',
        url: 'https://www.cherryshrimps.co.uk/guides/water/neocaridina-water-parameters/',
      },
      { title: 'Caridina UK – Testing water parameters', url: 'https://www.caridina.co.uk/testing-water-parameters/' },
      {
        title: 'Dennerle – Guide to shrimp in the aquarium',
        url: 'https://dennerle.com/en/blogs/guide/dein-leitfaden-fur-garnelen-im-aquarium',
      },
    ],
  },
  {
    topic: l10n('Marine and reef', 'Zeewater en rif'),
    items: [
      {
        title: 'Randy Holmes-Farley – Reef aquarium water parameters (Reefkeeping, 2004)',
        url: 'https://web.archive.org/web/20240523225818/http://reefkeeping.com/issues/2004-05/rhf/',
      },
      { title: 'Bulk Reef Supply – Reef tank parameters', url: 'https://www.bulkreefsupply.com/content/post/reef-tank-parameters' },
      {
        title: 'Red Sea – Reef Care Program',
        url: 'https://redseafish.com/wp-content/uploads/2020/02/R99534-RCR-New-2020-Mixed-EN-optimised-1.pdf',
      },
      { title: 'LiveAquaria – marine species care', url: 'https://www.liveaquaria.com/' },
    ],
  },
];
