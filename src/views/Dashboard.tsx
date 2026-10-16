import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { describeInsight } from '../components/InsightCard';
import { StatusPill } from '../components/Status';
import { paramLabel, PARAMS } from '../data/parameters';
import { PROFILES } from '../data/profiles';
import { analyzeTank, isReminder, type TankReport } from '../engine/insights';
import { useI18n } from '../i18n';
import { calendarDaysSince, DAY_MS, formatAgo } from '../lib/dates';
import { formatValue, formatVolume } from '../lib/units';
import type { ParamId, Settings, Tank } from '../lib/types';
import { Link, navigate, tankPath } from '../router';
import { actions, useAppData } from '../store';
import { toast } from '../toast';
import { LogTestDialog } from './dialogs/LogTestDialog';
import { RestoreButton } from './dialogs/RestoreDialog';

type Sort = 'attention' | 'name' | 'tested';
const STATUS_RANK: Record<TankReport['status'], number> = { bad: 0, warn: 1, none: 2, ok: 3 };

function Welcome() {
  const { t, lang } = useI18n();
  return (
    <div className="welcome">
      <section className="hero">
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          width="96"
          height="96"
          className="hero-logo"
        />
        <h1>{t('welcome.title')}</h1>
        <p className="lead">{t('welcome.lead')}</p>
        <div className="toolbar toolbar-center">
          <Link to="/new" className="btn btn-primary btn-large">
            <Icon name="plus" />
            {t('welcome.start')}
          </Link>
          <button
            type="button"
            className="btn btn-large"
            onClick={() => {
              actions.addDemo(lang);
              toast(t('welcome.demoAdded'));
            }}
          >
            <Icon name="sparkle" />
            {t('welcome.demo')}
          </button>
        </div>
        <div className="restore-inline">
          <RestoreButton className="link-btn" />
        </div>
      </section>
      <ul className="features">
        <li className="card">
          <Icon name="chart" className="feature-icon" />
          <h2>{t('welcome.f1.title')}</h2>
          <p>{t('welcome.f1.body')}</p>
        </li>
        <li className="card">
          <Icon name="sparkle" className="feature-icon" />
          <h2>{t('welcome.f2.title')}</h2>
          <p>{t('welcome.f2.body')}</p>
        </li>
        <li className="card">
          <Icon name="check" className="feature-icon" />
          <h2>{t('welcome.f3.title')}</h2>
          <p>{t('welcome.f3.body')}</p>
        </li>
      </ul>
    </div>
  );
}

/** Nudges towards a backup: everything lives in this browser only. */
function BackupBanner({ settings, tanks }: { settings: Settings; tanks: Tank[] }) {
  const { t, lang } = useI18n();
  const now = Date.now();
  if (settings.backupReminderSnoozedUntil && Date.parse(settings.backupReminderSnoozedUntil) > now) return null;
  const oldest = Math.min(...tanks.map((tank) => Date.parse(tank.createdAt)));
  const due = settings.lastBackupAt
    ? calendarDaysSince(settings.lastBackupAt, now) > 30
    : now - oldest >= 7 * DAY_MS;
  if (!due) return null;
  return (
    <div className="banner banner-info" role="region" aria-label={t('backup.reminderLabel')}>
      <Icon name="download" />
      <p>
        {settings.lastBackupAt
          ? t('backup.reminderOld', { ago: formatAgo(settings.lastBackupAt, lang) })
          : t('backup.reminderNever')}
      </p>
      <div className="banner-actions">
        <button
          type="button"
          className="btn btn-small btn-primary"
          onClick={() => {
            actions.exportBackup();
            toast(t('backup.done'));
          }}
        >
          {t('backup.download')}
        </button>
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={() =>
            actions.updateSettings({ backupReminderSnoozedUntil: new Date(now + 14 * DAY_MS).toISOString() })
          }
        >
          {t('backup.later')}
        </button>
      </div>
    </div>
  );
}

const MINI_PARAMS = 5;

function miniLabel(param: ParamId, tank: Tank, l: (text: { en: string; nl: string }) => string): string {
  if (param === 'temperature') return '';
  if (param === 'ammonia') return 'NH₃';
  return PARAMS[param].symbol ?? l(paramLabel(param, PROFILES[tank.profile].water));
}

function TankCard({
  tank,
  report,
  settings,
  onLogTest,
}: {
  tank: Tank;
  report: TankReport;
  settings: Settings;
  onLogTest: () => void;
}) {
  const i18n = useI18n();
  const { t, l, lang } = i18n;
  const top = report.insights.find((i) => !isReminder(i) && i.severity !== 'info') ?? report.insights.find(isReminder);
  const lastTest = tank.measurements.at(-1);
  const readings = report.readings.filter((r) => !r.stale && tank.params.includes(r.param)).slice(0, MINI_PARAMS);
  const facts = [l(PROFILES[tank.profile].name), tank.volumeL ? formatVolume(tank.volumeL, settings.volumeUnit, lang) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <li className={`tank-card card tank-card-${report.status}`}>
      <div className="tank-card-head">
        <h2>
          <Link to={tankPath(tank.id)} className="stretched">
            {tank.name}
          </Link>
        </h2>
        <StatusPill status={report.status} />
      </div>
      <p className="muted small">
        {facts}
        {tank.cycling && ` · ${t('tank.cycling')}`}
      </p>
      {readings.length > 0 && (
        <ul className="mini-readings" aria-label={t('overview.readings')}>
          {readings.map((r) => {
            const label = miniLabel(r.param, tank, l);
            return (
              <li key={r.param} className={`mini mini-${r.level ?? 'none'}`}>
                {label && <span className="mini-label">{label}</span>} {formatValue(r.param, r.value, settings, lang)}
              </li>
            );
          })}
        </ul>
      )}
      {top && (
        <p className={`tank-card-note note-${top.severity}`}>
          <Icon name={top.severity === 'info' ? 'info' : 'alert'} size={16} />
          {describeInsight(top, tank, settings, i18n).title}
        </p>
      )}
      <div className="tank-card-foot">
        <span className="muted small">
          {lastTest ? t('dash.lastTest', { ago: formatAgo(lastTest.takenAt, lang) }) : t('dash.noTests')}
        </span>
        <button type="button" className="btn btn-small" onClick={onLogTest}>
          <Icon name="test" size={16} />
          {t('action.logTest')}
        </button>
      </div>
    </li>
  );
}

export function Dashboard() {
  const { t, tn, l, lang } = useI18n();
  const { tanks, settings } = useAppData();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('attention');
  const [testFor, setTestFor] = useState<string | null>(null);
  const reports = useMemo(() => new Map(tanks.map((tank) => [tank.id, analyzeTank(tank)])), [tanks]);

  useEffect(() => {
    document.title = tanks.length > 0 ? `${t('dash.title')} · Veyqua` : t('meta.title');
  }, [tanks.length, t]);

  if (tanks.length === 0) return <Welcome />;

  const needsAttention = tanks.filter((tank) => {
    const status = reports.get(tank.id)?.status;
    return status === 'bad' || status === 'warn';
  }).length;
  const withReminders = tanks.filter((tank) => (reports.get(tank.id)?.reminders ?? 0) > 0).length;
  const q = query.trim().toLowerCase();
  const lastTestMs = (tank: Tank) => (tank.measurements.length ? Date.parse(tank.measurements.at(-1)!.takenAt) : 0);
  const shown = tanks
    .filter((tank) => !q || tank.name.toLowerCase().includes(q) || l(PROFILES[tank.profile].name).toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'tested') return lastTestMs(a) - lastTestMs(b) || a.name.localeCompare(b.name, lang);
      if (sort === 'attention') {
        const rank = STATUS_RANK[reports.get(a.id)!.status] - STATUS_RANK[reports.get(b.id)!.status];
        if (rank !== 0) return rank;
      }
      return a.name.localeCompare(b.name, lang, { numeric: true });
    });
  const testTank = testFor ? tanks.find((tank) => tank.id === testFor) : undefined;

  return (
    <div className="page">
      <header className="page-head">
        <div className="title-row title-row-split">
          <h1>{t('dash.title')}</h1>
          <Link to="/new" className="btn btn-primary">
            <Icon name="plus" />
            {t('dash.add')}
          </Link>
        </div>
        <p className="muted">
          {tn('dash.tanks', tanks.length)}
          {needsAttention > 0 && ` · ${tn('dash.attention', needsAttention)}`}
          {withReminders > 0 && ` · ${tn('dash.reminders', withReminders)}`}
        </p>
      </header>

      <BackupBanner settings={settings} tanks={tanks} />

      {tanks.length > 3 && (
        <div className="toolbar toolbar-split">
          <div className="input-icon">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('dash.search')}
              aria-label={t('dash.search')}
            />
          </div>
          <label className="inline-field">
            <span>{t('dash.sort')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="attention">{t('dash.sort.attention')}</option>
              <option value="name">{t('dash.sort.name')}</option>
              <option value="tested">{t('dash.sort.tested')}</option>
            </select>
          </label>
        </div>
      )}

      {shown.length === 0 ? (
        <p className="empty card">{t('dash.noMatch')}</p>
      ) : (
        <ul className="tank-grid">
          {shown.map((tank) => (
            <TankCard
              key={tank.id}
              tank={tank}
              report={reports.get(tank.id)!}
              settings={settings}
              onLogTest={() => setTestFor(tank.id)}
            />
          ))}
        </ul>
      )}

      {testTank && (
        <LogTestDialog
          tank={testTank}
          onClose={() => setTestFor(null)}
          onAction={(action) => {
            setTestFor(null);
            navigate(action === 'livestock' ? tankPath(testTank.id, 'livestock') : tankPath(testTank.id));
          }}
        />
      )}
    </div>
  );
}
