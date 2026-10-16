import { useRef, useState } from 'react';
import { ConfirmDialog, Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { useI18n } from '../../i18n';
import { parseBackup } from '../../lib/backup';
import { formatDateTime } from '../../lib/dates';
import type { AppData } from '../../lib/types';
import { navigate } from '../../router';
import { actions, useAppData } from '../../store';
import { toast } from '../../toast';

const MAX_BYTES = 20 * 1024 * 1024;

interface Loaded {
  data: AppData;
  exportedAt?: string;
}

/** A button that restores a backup file: preview first, then merge or replace. */
export function RestoreButton({ className = 'btn' }: { className?: string }) {
  const { t, tn, lang } = useI18n();
  const current = useAppData();
  const input = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const read = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) return setError(t('restore.error.format'));
    const result = parseBackup(await file.text());
    if (!result.ok) return setError(t(`restore.error.${result.reason}`));
    setLoaded({ data: result.data, exportedAt: result.exportedAt });
  };

  const close = () => {
    setLoaded(null);
    setConfirmReplace(false);
  };

  const tests = loaded?.data.tanks.reduce((sum, tank) => sum + tank.measurements.length, 0) ?? 0;
  const empty = current.tanks.length === 0;

  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        <Icon name="upload" />
        {t('restore.button')}
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) void read(file);
        }}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {loaded && !confirmReplace && (
        <Dialog title={t('restore.title')} onClose={close}>
          <div className="stack-sm">
            <p>
              {loaded.exportedAt
                ? t('restore.summaryDated', { date: formatDateTime(loaded.exportedAt, lang) })
                : t('restore.summary')}{' '}
              <strong>
                {tn('restore.tanks', loaded.data.tanks.length)}, {tn('restore.tests', tests)}
              </strong>
            </p>
            {empty ? (
              <div className="actions">
                <button type="button" className="btn" onClick={close}>
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    actions.replaceAll(loaded.data);
                    close();
                    toast(t('restore.done'));
                    navigate('/');
                  }}
                >
                  {t('restore.restore')}
                </button>
              </div>
            ) : (
              <>
                <div className="option card card-soft">
                  <h3>{t('restore.mergeTitle')}</h3>
                  <p className="muted">{t('restore.mergeBody')}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const result = actions.merge(loaded.data);
                      close();
                      toast(
                        result.addedTanks + result.addedEntries === 0
                          ? t('restore.nothingNew')
                          : t('restore.merged', {
                              tanks: tn('restore.tanks', result.addedTanks),
                              entries: tn('restore.entries', result.addedEntries),
                            }),
                      );
                      navigate('/');
                    }}
                  >
                    {t('restore.merge')}
                  </button>
                </div>
                <div className="option card card-soft">
                  <h3>{t('restore.replaceTitle')}</h3>
                  <p className="muted">{t('restore.replaceBody')}</p>
                  <button type="button" className="btn btn-danger" onClick={() => setConfirmReplace(true)}>
                    {t('restore.replace')}
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog>
      )}
      {loaded && confirmReplace && (
        <ConfirmDialog
          title={t('restore.replaceTitle')}
          message={t('restore.replaceConfirm', { tanks: tn('restore.tanks', current.tanks.length) })}
          confirmLabel={t('restore.replace')}
          onClose={close}
          onConfirm={() => {
            actions.replaceAll(loaded.data);
            toast(t('restore.done'));
            navigate('/');
          }}
        />
      )}
    </>
  );
}
