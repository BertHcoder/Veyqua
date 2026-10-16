import { Sparkline } from '../../components/Chart';
import { Icon } from '../../components/Icon';
import { InsightCard, type InsightAction } from '../../components/InsightCard';
import { LevelPill } from '../../components/Status';
import { paramLabel, PARAMS } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { isReminder, type TankReport } from '../../engine/insights';
import { useI18n } from '../../i18n';
import { formatAgo } from '../../lib/dates';
import { formatNumber, formatRange, formatValue } from '../../lib/units';
import type { ParamId, Settings, Tank } from '../../lib/types';

interface OverviewProps {
  tank: Tank;
  report: TankReport;
  settings: Settings;
  onAction: (action: InsightAction) => void;
}

function recentValues(tank: Tank, param: ParamId): number[] {
  const values: number[] = [];
  for (const m of tank.measurements) {
    const value = m.values[param];
    if (value !== undefined) values.push(value);
  }
  return values.slice(-12);
}

export function Overview({ tank, report, settings, onAction }: OverviewProps) {
  const { t, l, lang } = useI18n();
  const profile = PROFILES[tank.profile];
  const quality = report.insights.filter((insight) => !isReminder(insight));
  const reminders = report.insights.filter(isReminder);
  const tested = new Set(report.readings.map((r) => r.param));
  const untested = tank.params.filter((param) => !tested.has(param));
  const lastTest = tank.measurements.at(-1);
  const lastWaterChange = tank.events.findLast((e) => e.type === 'water-change');
  const animals = tank.inhabitants
    .filter((i) => i.kind !== 'plant' && i.kind !== 'other')
    .reduce((sum, i) => sum + i.count, 0);
  const sources = new Set(report.readings.map((r) => r.target?.source));

  return (
    <div className="stack">
      <dl className="facts">
        <div>
          <dt>{t('overview.lastTest')}</dt>
          <dd>{lastTest ? formatAgo(lastTest.takenAt, lang) : t('overview.never')}</dd>
        </div>
        <div>
          <dt>{t('overview.lastWaterChange')}</dt>
          <dd>{lastWaterChange ? formatAgo(lastWaterChange.at, lang) : t('overview.never')}</dd>
        </div>
        <div>
          <dt>{t('overview.animals')}</dt>
          <dd>{animals}</dd>
        </div>
      </dl>

      <section className="stack-sm" aria-labelledby="insights-title">
        <h2 id="insights-title">{t('overview.insights')}</h2>
        {quality.length === 0 && lastTest && (
          <div className="all-good">
            <Icon name="check" />
            <p>{t('overview.allGood')}</p>
          </div>
        )}
        {[...quality, ...reminders].map((insight, index) => (
          <InsightCard
            key={`${insight.kind}-${index}`}
            insight={insight}
            tank={tank}
            settings={settings}
            onAction={onAction}
          />
        ))}
      </section>

      <section className="stack-sm" aria-labelledby="readings-title">
        <h2 id="readings-title">{t('overview.readings')}</h2>
        <ul className="readings card">
          {report.readings.map((reading) => (
            <li key={reading.param} className={reading.stale ? 'reading reading-stale' : 'reading'}>
              <div className="reading-name">
                <span className="reading-title">{l(paramLabel(reading.param, profile.water))}</span>
                {reading.target && (
                  <span className="muted small">
                    {t('overview.target', { range: formatRange(reading.param, reading.target.ideal, settings, lang) })}
                    {reading.target.source !== 'profile' && ` · ${t(`source.${reading.target.source}`)}`}
                  </span>
                )}
                {reading.freeNh3 !== undefined && (
                  <span className="muted small">
                    {t('overview.freeNh3', { value: `${formatNumber(reading.freeNh3, lang, 0, 3)}\u00a0ppm` })}
                  </span>
                )}
              </div>
              <Sparkline values={recentValues(tank, reading.param)} ideal={reading.target?.ideal} />
              <div className="reading-value">
                <strong>{formatValue(reading.param, reading.value, settings, lang)}</strong>
                <span className="muted small">{formatAgo(reading.at, lang)}</span>
              </div>
              {reading.stale ? (
                <span className="pill pill-none">{t('level.stale')}</span>
              ) : (
                <LevelPill level={reading.level} />
              )}
            </li>
          ))}
          {untested.map((param) => {
            const target = report.targets[param];
            return (
              <li key={param} className="reading reading-untested">
                <div className="reading-name">
                  <span className="reading-title">{l(paramLabel(param, profile.water))}</span>
                  {target && (
                    <span className="muted small">
                      {t('overview.target', { range: formatRange(param, target.ideal, settings, lang) })}
                    </span>
                  )}
                </div>
                <span className="sparkline sparkline-empty" aria-hidden="true" />
                <div className="reading-value">
                  <strong>—</strong>
                </div>
                <span className="pill pill-none">{t('overview.notTested')}</span>
              </li>
            );
          })}
        </ul>
        <p className="muted small">
          {t('overview.targetsFrom', { profile: l(profile.name) })}
          {sources.has('livestock') && ` ${t('overview.targetsLivestock')}`}
          {sources.has('custom') && ` ${t('overview.targetsCustom')}`}
        </p>
        {report.readings.length > 0 && (
          <details className="disclosure">
            <summary>{t('overview.whatMeans')}</summary>
            <dl className="glossary">
              {report.readings.map((reading) => (
                <div key={reading.param}>
                  <dt>{l(PARAMS[reading.param].name)}</dt>
                  <dd>{l(PARAMS[reading.param].about)}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </section>

      {tank.notes && (
        <section className="stack-sm" aria-labelledby="notes-title">
          <h2 id="notes-title">{t('overview.notes')}</h2>
          <p className="card prewrap">{tank.notes}</p>
        </section>
      )}
    </div>
  );
}
