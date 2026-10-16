import { useState } from 'react';
import { ConfirmDialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { InsightCard, type InsightAction } from '../../components/InsightCard';
import { paramLabel } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { getSpecies } from '../../data/species';
import type { Insight, TankReport } from '../../engine/insights';
import { SPECIES_PARAMS, speciesOverlap, tankSpecies } from '../../engine/targets';
import { useI18n } from '../../i18n';
import { formatDate } from '../../lib/dates';
import { INHABITANT_KINDS } from '../../lib/normalize';
import { formatRange } from '../../lib/units';
import type { Inhabitant, Settings, Tank } from '../../lib/types';
import { actions } from '../../store';
import { toast } from '../../toast';
import type { TankDialog } from '../TankView';

const COMPAT_KINDS: Insight['kind'][] = ['water', 'conflict', 'group', 'volume', 'reef', 'coral-profile'];

interface LivestockProps {
  tank: Tank;
  report: TankReport;
  settings: Settings;
  openDialog: (dialog: TankDialog) => void;
  onAction: (action: InsightAction) => void;
}

export function Livestock({ tank, report, settings, openDialog, onAction }: LivestockProps) {
  const { t, l, lang } = useI18n();
  const [toDelete, setToDelete] = useState<Inhabitant | null>(null);
  const water = PROFILES[tank.profile].water;
  const compat = report.insights.filter((insight) => COMPAT_KINDS.includes(insight.kind));
  const species = tankSpecies(tank).filter((s) => s.water === water);
  const nameOf = (inhabitant: Inhabitant) => {
    const known = getSpecies(inhabitant.speciesId);
    return known ? l(known.name) : inhabitant.name;
  };
  const sorted = [...tank.inhabitants].sort(
    (a, b) =>
      INHABITANT_KINDS.indexOf(a.kind) - INHABITANT_KINDS.indexOf(b.kind) || nameOf(a).localeCompare(nameOf(b), lang),
  );
  const comfort = SPECIES_PARAMS.flatMap((param) => {
    const overlap = speciesOverlap(species, param);
    return overlap ? [{ param, overlap }] : [];
  });

  const addButton = (
    <button type="button" className="btn btn-primary" onClick={() => openDialog({ type: 'inhabitant' })}>
      <Icon name="plus" />
      {t('livestock.add')}
    </button>
  );

  if (tank.inhabitants.length === 0) {
    return (
      <div className="empty card">
        <p>{t('livestock.empty')}</p>
        {addButton}
      </div>
    );
  }

  return (
    <div className="stack">
      {compat.length > 0 && (
        <section className="stack-sm" aria-labelledby="compat-title">
          <h2 id="compat-title">{t('livestock.checks')}</h2>
          {compat.map((insight, index) => (
            <InsightCard key={`${insight.kind}-${index}`} insight={insight} tank={tank} settings={settings} onAction={onAction} />
          ))}
        </section>
      )}

      {comfort.length > 0 && (
        <section className="stack-sm" aria-labelledby="comfort-title">
          <h2 id="comfort-title">{t('livestock.comfort')}</h2>
          <p className="muted">{t('livestock.comfortIntro')}</p>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('livestock.param')}</th>
                  <th scope="col">{t('livestock.range')}</th>
                  <th scope="col">{t('livestock.limitedBy')}</th>
                </tr>
              </thead>
              <tbody>
                {comfort.map(({ param, overlap }) => {
                  const limiters = [...new Set([overlap.lowFrom, overlap.highFrom])].filter((s) => s !== undefined);
                  return (
                    <tr key={param}>
                      <th scope="row">{l(paramLabel(param, water))}</th>
                      <td>
                        {overlap.conflict ? (
                          <span className="text-bad">{t('livestock.noOverlap')}</span>
                        ) : (
                          formatRange(param, overlap.range, settings, lang)
                        )}
                      </td>
                      <td>{limiters.map((s) => l(s.name)).join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="stack-sm" aria-labelledby="inhabitants-title">
        <div className="section-head">
          <h2 id="inhabitants-title">{t('livestock.title')}</h2>
          {addButton}
        </div>
        <ul className="inhabitants">
          {sorted.map((inhabitant) => {
            const known = getSpecies(inhabitant.speciesId);
            return (
              <li key={inhabitant.id} className="inhabitant card">
                <div className="inhabitant-main">
                  <h3>
                    {nameOf(inhabitant)} <span className="count">× {inhabitant.count}</span>
                  </h3>
                  <p className="muted small">
                    {known?.scientificName && <i>{known.scientificName}</i>}
                    {known?.scientificName && ' · '}
                    {t(`kind.${inhabitant.kind}`)}
                    {inhabitant.addedOn && ` · ${t('livestock.since', { date: formatDate(inhabitant.addedOn, lang) })}`}
                  </p>
                  {inhabitant.note && <p className="prewrap">{inhabitant.note}</p>}
                  {known && (
                    <details className="disclosure">
                      <summary>{t('livestock.care')}</summary>
                      <p>{l(known.care)}</p>
                    </details>
                  )}
                </div>
                <div className="entry-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t('action.editName', { name: nameOf(inhabitant) })}
                    title={t('action.edit')}
                    onClick={() => openDialog({ type: 'inhabitant', inhabitant })}
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t('action.deleteName', { name: nameOf(inhabitant) })}
                    title={t('action.delete')}
                    onClick={() => setToDelete(inhabitant)}
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {toDelete && (
        <ConfirmDialog
          title={t('livestock.deleteTitle')}
          message={t('livestock.deleteBody', { name: nameOf(toDelete) })}
          confirmLabel={t('action.delete')}
          onClose={() => setToDelete(null)}
          onConfirm={() => {
            actions.deleteInhabitant(tank.id, toDelete.id);
            toast(t('toast.deleted'));
          }}
        />
      )}
    </div>
  );
}
