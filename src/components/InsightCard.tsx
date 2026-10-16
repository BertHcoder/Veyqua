import { paramLabel } from '../data/parameters';
import { PROFILES } from '../data/profiles';
import type { Species } from '../data/species';
import { CYCLE_TIPS, FISH_IN_CYCLE_TIPS, tipsFor } from '../data/tips';
import type { CycleStage } from '../engine/cycle';
import type { Insight } from '../engine/insights';
import { useI18n, type I18n } from '../i18n';
import { formatAgo, locale } from '../lib/dates';
import { formatDelta, formatNumber, formatRange, formatValue, formatVolume } from '../lib/units';
import type { ParamId, Settings, Tank } from '../lib/types';
import { Icon } from './Icon';

export type InsightAction = 'log-test' | 'log-water-change' | 'mark-cycled' | 'edit' | 'livestock';

interface Described {
  title: string;
  body: string[];
  tips: string[];
  action?: InsightAction;
}

const STAGES: CycleStage[] = ['start', 'ammonia', 'nitrite', 'done'];

export function describeInsight(insight: Insight, tank: Tank, settings: Settings, i18n: I18n): Described {
  const { t, tn, l, lang } = i18n;
  const water = PROFILES[tank.profile].water;
  const name = (param: ParamId) => l(paramLabel(param, water));
  const value = (param: ParamId, v: number) => formatValue(param, v, settings, lang);
  const list = (species: Species[]) =>
    new Intl.ListFormat(locale(lang), { type: 'conjunction' }).format(species.map((s) => l(s.name)));

  switch (insight.kind) {
    case 'param': {
      const { param } = insight;
      const body = [
        t('insight.param.body', {
          value: value(param, insight.value),
          ago: formatAgo(insight.at, lang),
          ideal: formatRange(param, insight.target.ideal, settings, lang),
        }),
      ];
      if (insight.freeNh3 !== undefined) {
        body.push(t('insight.param.nh3', { nh3: `${formatNumber(insight.freeNh3, lang, 0, 3)}\u00a0ppm` }));
      }
      if (insight.species.length > 0) body.push(t('insight.param.species', { names: list(insight.species) }));
      const nitrogen = param === 'ammonia' || param === 'nitrite' || param === 'nitrate';
      return {
        title: t(insight.direction === 'high' ? 'insight.param.high' : 'insight.param.low', { param: name(param) }),
        body,
        tips: tipsFor(param, insight.direction, tank.profile).map(l),
        action: nitrogen && insight.direction === 'high' ? 'log-water-change' : undefined,
      };
    }
    case 'cycle': {
      const body = [t(`insight.cycle.${insight.stage}`)];
      if (insight.days !== undefined && insight.stage !== 'done') {
        body.push(t('insight.cycle.days', { days: tn('common.days', Math.max(insight.days, 0)) }));
      }
      if (insight.withLivestock) body.unshift(t('insight.cycle.withLivestock'));
      return {
        title: t('insight.cycle.title', { stage: t(`cycle.${insight.stage}`) }),
        body,
        tips: (insight.withLivestock ? FISH_IN_CYCLE_TIPS : CYCLE_TIPS[insight.stage]).map(l),
        action: insight.stage === 'done' ? 'mark-cycled' : 'log-test',
      };
    }
    case 'trend':
      return {
        title: t(insight.perWeek > 0 ? 'insight.trend.up' : 'insight.trend.down', { param: name(insight.param) }),
        body: [
          t('insight.trend.body', {
            rate: formatDelta(insight.param, insight.perWeek, settings, lang),
            bound: value(insight.param, insight.bound),
            days: tn('common.days', insight.days),
          }),
        ],
        tips: tipsFor(insight.param, insight.perWeek > 0 ? 'high' : 'low', tank.profile)
          .slice(0, 3)
          .map(l),
      };
    case 'swing': {
      const time =
        insight.hours < 24
          ? tn('common.hours', Math.max(1, Math.round(insight.hours)))
          : tn('common.days', Math.round(insight.hours / 24));
      return {
        title: t('insight.swing.title', { param: name(insight.param) }),
        body: [
          t('insight.swing.body', {
            from: value(insight.param, insight.from),
            to: value(insight.param, insight.to),
            time,
          }),
        ],
        tips: [t('insight.swing.tip1'), t('insight.swing.tip2')],
      };
    }
    case 'water':
      return {
        title: t('insight.water.title'),
        body: [t(water === 'fresh' ? 'insight.water.inFresh' : 'insight.water.inMarine', { names: list(insight.species) })],
        tips: [],
        action: 'livestock',
      };
    case 'conflict': {
      const { param, low, high } = insight;
      const lowMax = low.ranges[param]?.[1];
      const highMin = high.ranges[param]?.[0];
      return {
        title: t('insight.conflict.title', { param: name(param) }),
        body: [
          t('insight.conflict.body', {
            low: l(low.name),
            lowMax: lowMax === null || lowMax === undefined ? '' : value(param, lowMax),
            high: l(high.name),
            highMin: highMin === null || highMin === undefined ? '' : value(param, highMin),
          }),
        ],
        tips: [],
        action: 'livestock',
      };
    }
    case 'group':
      return {
        title: t('insight.group.title', { name: l(insight.species.name) }),
        body: [t('insight.group.body', { min: insight.species.minGroup ?? 1, count: insight.count })],
        tips: [l(insight.species.care)],
        action: 'livestock',
      };
    case 'volume':
      return {
        title: t('insight.volume.title', { name: l(insight.species.name) }),
        body: [
          t('insight.volume.body', {
            min: formatVolume(insight.species.minVolumeL ?? 0, settings.volumeUnit, lang),
            volume: formatVolume(insight.volumeL, settings.volumeUnit, lang),
          }),
        ],
        tips: [],
        action: 'livestock',
      };
    case 'reef':
      return {
        title: t(insight.severity === 'warn' ? 'insight.reef.no' : 'insight.reef.caution', {
          name: l(insight.species.name),
        }),
        body: [l(insight.species.care)],
        tips: [],
      };
    case 'coral-profile':
      return { title: t('insight.coralProfile.title'), body: [t('insight.coralProfile.body')], tips: [], action: 'edit' };
    case 'first-test':
      return { title: t('insight.firstTest.title'), body: [t('insight.firstTest.body')], tips: [], action: 'log-test' };
    case 'test-due':
      return {
        title: t('insight.testDue.title'),
        body: [t('insight.testDue.body', { days: tn('common.days', insight.days), every: tn('common.days', insight.every) })],
        tips: [],
        action: 'log-test',
      };
    case 'water-change-due':
      return {
        title: t('insight.wcDue.title'),
        body: [
          insight.days === null
            ? t('insight.wcDue.never', { every: tn('common.days', insight.every) })
            : t('insight.wcDue.body', {
                days: tn('common.days', insight.days),
                every: tn('common.days', insight.every),
              }),
        ],
        tips: [],
        action: 'log-water-change',
      };
  }
}

const ACTION_LABEL = {
  'log-test': 'action.logTest',
  'log-water-change': 'action.logWaterChange',
  'mark-cycled': 'action.markCycled',
  edit: 'action.editTank',
  livestock: 'action.viewLivestock',
} as const;

interface InsightCardProps {
  insight: Insight;
  tank: Tank;
  settings: Settings;
  onAction?: (action: InsightAction) => void;
}

export function InsightCard({ insight, tank, settings, onAction }: InsightCardProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const { title, body, tips, action } = describeInsight(insight, tank, settings, i18n);
  return (
    <article className={`insight insight-${insight.severity}`}>
      <Icon name={insight.severity === 'info' ? 'info' : 'alert'} className="insight-icon" />
      <div className="insight-main">
        <h3>{title}</h3>
        {body.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {insight.kind === 'cycle' && (
          <ol className="stepper" aria-label={t('cycle.progress')}>
            {STAGES.map((stage, index) => {
              const current = STAGES.indexOf(insight.stage);
              const state = index < current ? 'done' : index === current ? 'current' : 'todo';
              return (
                <li key={stage} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                  {t(`cycle.${stage}`)}
                </li>
              );
            })}
          </ol>
        )}
        {tips.length > 0 && (
          <div className="tips">
            <h4>{t('insight.tips')}</h4>
            <ul>
              {tips.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </div>
        )}
        {action && onAction && (
          <button type="button" className="btn btn-small" onClick={() => onAction(action)}>
            {t(ACTION_LABEL[action])}
          </button>
        )}
      </div>
    </article>
  );
}
