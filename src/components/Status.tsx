import type { Level } from '../engine/evaluate';
import type { TankReport } from '../engine/insights';
import { useI18n } from '../i18n';
import { Icon, type IconName } from './Icon';

export type ReadingLevel = Level | 'cycling' | null;

const LEVEL_ICON: Record<Level | 'cycling', IconName> = { ok: 'check', warn: 'alert', bad: 'alert', cycling: 'clock' };

/** Status of a single reading, with an icon and text so it never relies on colour alone. */
export function LevelPill({ level }: { level: ReadingLevel }) {
  const { t } = useI18n();
  if (level === null) return <span className="pill pill-none">{t('level.none')}</span>;
  return (
    <span className={`pill pill-${level}`}>
      <Icon name={LEVEL_ICON[level]} size={14} />
      {t(`level.${level}`)}
    </span>
  );
}

const STATUS_ICON: Record<TankReport['status'], IconName> = { ok: 'check', warn: 'alert', bad: 'alert', none: 'test' };

export function StatusPill({ status }: { status: TankReport['status'] }) {
  const { t } = useI18n();
  return (
    <span className={`pill pill-${status}`}>
      <Icon name={STATUS_ICON[status]} size={14} />
      {t(`status.${status}`)}
    </span>
  );
}
