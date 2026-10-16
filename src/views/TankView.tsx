import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import type { InsightAction } from '../components/InsightCard';
import { StatusPill } from '../components/Status';
import { PROFILES } from '../data/profiles';
import { analyzeTank } from '../engine/insights';
import { useI18n } from '../i18n';
import { formatDate } from '../lib/dates';
import { formatVolume } from '../lib/units';
import type { CareEvent, CareEventType, Inhabitant, Measurement } from '../lib/types';
import { Link, navigate, tankPath, type TankTab } from '../router';
import { actions, useAppData } from '../store';
import { toast } from '../toast';
import { CareDialog } from './dialogs/CareDialog';
import { InhabitantDialog } from './dialogs/InhabitantDialog';
import { LogTestDialog } from './dialogs/LogTestDialog';
import { NotFound } from './NotFound';
import { Charts } from './tank/Charts';
import { Journal } from './tank/Journal';
import { Livestock } from './tank/Livestock';
import { Overview } from './tank/Overview';

export type TankDialog =
  | { type: 'test'; measurement?: Measurement }
  | { type: 'care'; event?: CareEvent; careType?: CareEventType }
  | { type: 'inhabitant'; inhabitant?: Inhabitant };

const TABS: { tab: TankTab; key: 'tab.overview' | 'tab.charts' | 'tab.log' | 'tab.livestock' }[] = [
  { tab: 'overview', key: 'tab.overview' },
  { tab: 'charts', key: 'tab.charts' },
  { tab: 'log', key: 'tab.log' },
  { tab: 'livestock', key: 'tab.livestock' },
];

export function TankView({ id, tab }: { id: string; tab: TankTab }) {
  const { t, l, lang } = useI18n();
  const { tanks, settings } = useAppData();
  const tank = tanks.find((x) => x.id === id);
  const report = useMemo(() => (tank ? analyzeTank(tank) : null), [tank]);
  const [dialog, setDialog] = useState<TankDialog | null>(null);

  useEffect(() => {
    if (tank) document.title = `${tank.name} · Veyqua`;
  }, [tank]);

  if (!tank || !report) return <NotFound />;

  const onAction = (action: InsightAction) => {
    if (action === 'log-test') setDialog({ type: 'test' });
    else if (action === 'log-water-change') setDialog({ type: 'care', careType: 'water-change' });
    else if (action === 'mark-cycled') {
      actions.markCycled(tank.id);
      toast(t('toast.cycled'));
    } else if (action === 'edit') navigate(tankPath(tank.id, 'edit'));
    else navigate(tankPath(tank.id, 'livestock'));
  };

  const facts = [
    l(PROFILES[tank.profile].name),
    tank.volumeL ? formatVolume(tank.volumeL, settings.volumeUnit, lang) : null,
    tank.startedOn ? t('tank.since', { date: formatDate(tank.startedOn, lang) }) : null,
  ].filter(Boolean);

  return (
    <div className="page">
      <Link to="/" className="back-link">
        <Icon name="back" size={18} />
        {t('nav.tanks')}
      </Link>
      <header className="page-head">
        <div className="title-row">
          <h1>{tank.name}</h1>
          <StatusPill status={report.status} />
          {tank.cycling && <span className="pill pill-cycling">{t('tank.cycling')}</span>}
        </div>
        <p className="muted">{facts.join(' · ')}</p>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => setDialog({ type: 'test' })}>
            <Icon name="test" />
            {t('action.logTest')}
          </button>
          <button type="button" className="btn" onClick={() => setDialog({ type: 'care' })}>
            <Icon name="wave" />
            {t('action.logCare')}
          </button>
          <Link to={tankPath(tank.id, 'edit')} className="btn btn-ghost">
            <Icon name="edit" />
            {t('action.edit')}
          </Link>
        </div>
      </header>

      <nav className="tabs" aria-label={t('tab.label')}>
        {TABS.map((item) => (
          <Link
            key={item.tab}
            to={tankPath(tank.id, item.tab)}
            className="tab"
            aria-current={tab === item.tab ? 'page' : undefined}
          >
            {t(item.key)}
            {item.tab === 'livestock' && tank.inhabitants.length > 0 && (
              <span className="tab-count">{tank.inhabitants.length}</span>
            )}
          </Link>
        ))}
      </nav>

      {tab === 'overview' && <Overview tank={tank} report={report} settings={settings} onAction={onAction} />}
      {tab === 'charts' && <Charts tank={tank} report={report} settings={settings} />}
      {tab === 'log' && <Journal tank={tank} report={report} settings={settings} openDialog={setDialog} />}
      {tab === 'livestock' && (
        <Livestock tank={tank} report={report} settings={settings} openDialog={setDialog} onAction={onAction} />
      )}

      {dialog?.type === 'test' && (
        <LogTestDialog
          tank={tank}
          measurement={dialog.measurement}
          onClose={() => setDialog(null)}
          onAction={(action) => {
            setDialog(null);
            onAction(action);
          }}
        />
      )}
      {dialog?.type === 'care' && (
        <CareDialog tank={tank} event={dialog.event} initialType={dialog.careType} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'inhabitant' && (
        <InhabitantDialog tank={tank} inhabitant={dialog.inhabitant} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
