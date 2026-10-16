import { useState } from 'react';
import { CARE_ICON } from '../../components/careIcon';
import { ConfirmDialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { paramLabel, PARAM_IDS } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { levelOf } from '../../engine/evaluate';
import { hasLivestock, type TankReport } from '../../engine/insights';
import { useI18n } from '../../i18n';
import { downloadFile, tankToCsv } from '../../lib/backup';
import { formatDateTime, isoDate } from '../../lib/dates';
import { formatValue } from '../../lib/units';
import type { CareEvent, Measurement, ParamId, Settings, Tank } from '../../lib/types';
import { actions } from '../../store';
import { toast } from '../../toast';
import type { TankDialog } from '../TankView';

type Entry = { kind: 'test'; at: string; item: Measurement } | { kind: 'care'; at: string; item: CareEvent };
type Filter = 'all' | 'test' | 'care';

const PAGE = 50;
const NITROGEN: ParamId[] = ['ammonia', 'nitrite', 'nitrate'];

const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'aquarium';

interface JournalProps {
  tank: Tank;
  report: TankReport;
  settings: Settings;
  openDialog: (dialog: TankDialog) => void;
}

export function Journal({ tank, report, settings, openDialog }: JournalProps) {
  const { t, l, lang } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(PAGE);
  const [toDelete, setToDelete] = useState<Entry | null>(null);
  const water = PROFILES[tank.profile].water;
  const fishlessCycle = tank.cycling && !hasLivestock(tank);
  const entries: Entry[] = [
    ...tank.measurements.map((item): Entry => ({ kind: 'test', at: item.takenAt, item })),
    ...tank.events.map((item): Entry => ({ kind: 'care', at: item.at, item })),
  ]
    .filter((entry) => filter === 'all' || entry.kind === filter)
    .sort((a, b) => b.at.localeCompare(a.at));

  if (tank.measurements.length === 0 && tank.events.length === 0) {
    return (
      <div className="empty card">
        <p>{t('journal.empty')}</p>
        <div className="toolbar">
          <button type="button" className="btn btn-primary" onClick={() => openDialog({ type: 'test' })}>
            <Icon name="test" />
            {t('action.logTest')}
          </button>
          <button type="button" className="btn" onClick={() => openDialog({ type: 'care' })}>
            <Icon name="wave" />
            {t('action.logCare')}
          </button>
        </div>
      </div>
    );
  }

  const exportCsv = () => {
    downloadFile(
      `veyqua-${slug(tank.name)}-${isoDate()}.csv`,
      `\ufeff${tankToCsv(tank, settings, lang)}`,
      'text/csv;charset=utf-8',
    );
  };

  const order = (values: Measurement['values']) =>
    [...tank.params, ...PARAM_IDS.filter((p) => !tank.params.includes(p))].filter(
      (param): param is ParamId => values[param] !== undefined,
    );

  return (
    <div className="stack">
      <div className="toolbar toolbar-split">
        <fieldset className="segmented">
          <legend className="sr-only">{t('journal.filter')}</legend>
          {(['all', 'test', 'care'] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="journal-filter"
                checked={filter === value}
                onChange={() => {
                  setFilter(value);
                  setLimit(PAGE);
                }}
              />
              <span>{t(`journal.filter.${value}`)}</span>
            </label>
          ))}
        </fieldset>
        {tank.measurements.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            <Icon name="download" />
            {t('journal.csv')}
          </button>
        )}
      </div>

      {entries.length === 0 && (
        <div className="empty card">
          <p>{t('journal.noneOfType')}</p>
        </div>
      )}

      <ol className="journal">
        {entries.slice(0, limit).map((entry) => (
          <li key={entry.item.id} className="entry card">
            <Icon
              name={entry.kind === 'test' ? 'test' : CARE_ICON[entry.item.type]}
              className="entry-icon"
            />
            <div className="entry-main">
              <div className="entry-head">
                <h3>
                  {entry.kind === 'test'
                    ? t('journal.test')
                    : entry.item.type === 'water-change' && entry.item.percent
                      ? t('journal.waterChangePercent', { percent: entry.item.percent })
                      : t(`care.${entry.item.type}`)}
                </h3>
                <time dateTime={entry.at} className="muted small">
                  {formatDateTime(entry.at, lang)}
                </time>
              </div>
              {entry.kind === 'test' && (
                <ul className="chips">
                  {order(entry.item.values).map((param) => {
                    const value = entry.item.values[param] as number;
                    const target = report.targets[param];
                    let level: string = target ? levelOf(value, target) : 'none';
                    if (fishlessCycle && NITROGEN.includes(param) && level !== 'ok' && level !== 'none') level = 'cycling';
                    return (
                      <li key={param} className={`chip chip-${level}`}>
                        <span className="chip-label">{l(paramLabel(param, water))}</span>{' '}
                        {formatValue(param, value, settings, lang)}
                      </li>
                    );
                  })}
                </ul>
              )}
              {entry.item.note && <p className="prewrap">{entry.item.note}</p>}
            </div>
            <div className="entry-actions">
              <button
                type="button"
                className="icon-btn"
                aria-label={t('action.edit')}
                title={t('action.edit')}
                onClick={() =>
                  openDialog(
                    entry.kind === 'test' ? { type: 'test', measurement: entry.item } : { type: 'care', event: entry.item },
                  )
                }
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('action.delete')}
                title={t('action.delete')}
                onClick={() => setToDelete(entry)}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      {entries.length > limit && (
        <button type="button" className="btn btn-block" onClick={() => setLimit(limit + PAGE)}>
          {t('journal.more', { count: entries.length - limit })}
        </button>
      )}

      {toDelete && (
        <ConfirmDialog
          title={t(toDelete.kind === 'test' ? 'journal.deleteTest' : 'journal.deleteCare')}
          message={t('journal.deleteBody', { date: formatDateTime(toDelete.at, lang) })}
          confirmLabel={t('action.delete')}
          onClose={() => setToDelete(null)}
          onConfirm={() => {
            if (toDelete.kind === 'test') actions.deleteMeasurement(tank.id, toDelete.item.id);
            else actions.deleteEvent(tank.id, toDelete.item.id);
            toast(t('toast.deleted'));
          }}
        />
      )}
    </div>
  );
}
