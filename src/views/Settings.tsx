import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { useI18n } from '../i18n';
import { formatAgo, formatDate } from '../lib/dates';
import { storedBytes } from '../lib/storage';
import type { Lang } from '../lib/types';
import { formatNumber } from '../lib/units';
import { promptInstall, useCanInstall } from '../pwa';
import { Link, navigate } from '../router';
import { actions, useAppData } from '../store';
import { toast } from '../toast';
import { RestoreButton } from './dialogs/RestoreDialog';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ChoiceProps<T extends string> {
  name: string;
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

function Choice<T extends string>({ name, legend, value, options, onChange }: ChoiceProps<T>) {
  return (
    <fieldset className="field">
      <legend>{legend}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value}>
            <input type="radio" name={name} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

type Persisted = 'unknown' | 'yes' | 'no';

/** Whether the browser promised not to evict our storage when the disk fills up. */
function usePersisted(): [Persisted, () => Promise<boolean>] {
  const [state, setState] = useState<Persisted>('unknown');
  useEffect(() => {
    let active = true;
    navigator.storage
      ?.persisted?.()
      .then((value) => active && setState(value ? 'yes' : 'no'))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const request = async () => {
    const granted = await navigator.storage.persist().catch(() => false);
    setState(granted ? 'yes' : 'no');
    return granted;
  };
  return [state, request];
}

const isStandalone = () => typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;

export function Settings() {
  const { t, tn, lang } = useI18n();
  const { settings, tanks } = useAppData();
  const canInstall = useCanInstall();
  const [persisted, requestPersist] = usePersisted();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    document.title = `${t('settings.title')} · Veyqua`;
  }, [t]);

  const bytes = storedBytes();
  const size =
    bytes < 1024 * 1024
      ? `${formatNumber(Math.max(1, bytes / 1024), lang, 0, 0)}\u00a0KB`
      : `${formatNumber(bytes / 1024 / 1024, lang, 0, 1)}\u00a0MB`;

  return (
    <div className="page page-narrow settings">
      <h1>{t('settings.title')}</h1>

      <section className="card stack-sm" aria-labelledby="display-title">
        <h2 id="display-title">{t('settings.display')}</h2>
        <Choice<Lang | 'auto'>
          name="lang"
          legend={t('settings.language')}
          value={settings.lang ?? 'auto'}
          options={[
            { value: 'auto', label: t('settings.langAuto') },
            { value: 'en', label: 'English' },
            { value: 'nl', label: 'Nederlands' },
          ]}
          onChange={(value) => actions.updateSettings({ lang: value === 'auto' ? undefined : value })}
        />
        <Choice
          name="theme"
          legend={t('settings.theme')}
          value={settings.theme}
          options={[
            { value: 'system', label: t('settings.theme.system') },
            { value: 'light', label: t('settings.theme.light') },
            { value: 'dark', label: t('settings.theme.dark') },
          ]}
          onChange={(theme) => actions.updateSettings({ theme })}
        />
      </section>

      <section className="card stack-sm" aria-labelledby="units-title">
        <h2 id="units-title">{t('settings.units')}</h2>
        <p className="muted">{t('settings.unitsHint')}</p>
        <Choice
          name="temperature"
          legend={t('settings.temperature')}
          value={settings.temperatureUnit}
          options={[
            { value: 'C', label: '°C' },
            { value: 'F', label: '°F' },
          ]}
          onChange={(temperatureUnit) => actions.updateSettings({ temperatureUnit })}
        />
        <Choice
          name="volume"
          legend={t('settings.volume')}
          value={settings.volumeUnit}
          options={[
            { value: 'L', label: t('settings.litres') },
            { value: 'gal', label: t('settings.gallons') },
          ]}
          onChange={(volumeUnit) => actions.updateSettings({ volumeUnit })}
        />
        <Choice
          name="hardness"
          legend={t('settings.hardness')}
          value={settings.hardnessUnit}
          options={[
            { value: 'dH', label: '°dH (dGH/dKH)' },
            { value: 'ppm', label: 'ppm CaCO₃' },
          ]}
          onChange={(hardnessUnit) => actions.updateSettings({ hardnessUnit })}
        />
        <Choice
          name="salinity"
          legend={t('settings.salinity')}
          value={settings.salinityUnit}
          options={[
            { value: 'sg', label: t('settings.sg') },
            { value: 'ppt', label: 'ppt (‰)' },
          ]}
          onChange={(salinityUnit) => actions.updateSettings({ salinityUnit })}
        />
      </section>

      <section className="card stack-sm" aria-labelledby="data-title">
        <h2 id="data-title">{t('settings.data')}</h2>
        <p>{t('settings.dataIntro')}</p>
        <p className="muted">
          {settings.lastBackupAt
            ? t('settings.lastBackup', {
                ago: formatAgo(settings.lastBackupAt, lang),
                date: formatDate(settings.lastBackupAt, lang),
              })
            : t('settings.noBackup')}
        </p>
        <div className="toolbar">
          {tanks.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                actions.exportBackup();
                toast(t('backup.done'));
              }}
            >
              <Icon name="download" />
              {t('backup.download')}
            </button>
          )}
          <RestoreButton />
        </div>
        <p className="muted small">{t('settings.storage', { size })}</p>
        {persisted === 'yes' && <p className="muted small">{t('settings.persisted')}</p>}
        {persisted === 'no' && (
          <div className="stack-sm">
            <p className="muted small">{t('settings.persistHint')}</p>
            <div>
              <button
                type="button"
                className="btn btn-small"
                onClick={async () => {
                  if (!(await requestPersist())) toast(t('settings.persistDenied'));
                }}
              >
                {t('settings.persist')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card stack-sm" aria-labelledby="app-title">
        <h2 id="app-title">{t('settings.app')}</h2>
        <p>{t('settings.appBody')}</p>
        {isStandalone() ? (
          <p className="muted">{t('settings.installed')}</p>
        ) : canInstall ? (
          <div>
            <button type="button" className="btn btn-primary" onClick={() => void promptInstall()}>
              <Icon name="download" />
              {t('settings.install')}
            </button>
          </div>
        ) : (
          <p className="muted">{t('settings.installManual')}</p>
        )}
      </section>

      <section className="card stack-sm" aria-labelledby="about-title">
        <h2 id="about-title">{t('settings.about')}</h2>
        <p>{t('settings.privacy')}</p>
        <p>{t('settings.disclaimer')}</p>
        <p>
          <Link to="/guide#sources">{t('settings.sources')}</Link>
        </p>
        <p className="muted small">
          {t('settings.madeBy')}{' '}
          <a href="https://itaanhuys.com" target="_blank" rel="noopener">
            IT aan Huys
          </a>
        </p>
      </section>

      <section className="card danger-zone stack-sm" aria-labelledby="delete-title">
        <h2 id="delete-title">{t('settings.deleteTitle')}</h2>
        <p>{t('settings.deleteBody')}</p>
        <div>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" />
            {t('settings.deleteAll')}
          </button>
        </div>
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title={t('settings.deleteConfirmTitle')}
          message={t('settings.deleteConfirmBody', { tanks: tn('restore.tanks', tanks.length) })}
          confirmLabel={t('settings.deleteAll')}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            actions.clearAll();
            toast(t('settings.deleted'));
            navigate('/');
          }}
        />
      )}
    </div>
  );
}
