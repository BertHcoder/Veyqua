import { useState } from 'react';
import { CARE_ICON } from '../../components/careIcon';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { useI18n } from '../../i18n';
import { fromDateTimeInput, newId, toDateTimeInput } from '../../lib/dates';
import { CARE_EVENT_TYPES } from '../../lib/normalize';
import { parseNumber } from '../../lib/units';
import type { CareEvent, CareEventType, Tank } from '../../lib/types';
import { actions } from '../../store';
import { toast } from '../../toast';

interface CareDialogProps {
  tank: Tank;
  event?: CareEvent;
  initialType?: CareEventType;
  onClose: () => void;
}

export function CareDialog({ tank, event, initialType, onClose }: CareDialogProps) {
  const { t } = useI18n();
  const [type, setType] = useState<CareEventType>(event?.type ?? initialType ?? 'water-change');
  const [percent, setPercent] = useState(event?.percent === undefined ? '' : String(event.percent));
  const [when, setWhen] = useState(() => toDateTimeInput(event?.at ?? new Date().toISOString()));
  const [note, setNote] = useState(event?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const at = fromDateTimeInput(when);
    if (!at) return setError(t('form.badDate'));
    if (Date.parse(at) > Date.now() + 10 * 60_000) return setError(t('form.futureDate'));
    let size: number | undefined;
    if (type === 'water-change' && percent.trim() !== '') {
      const value = parseNumber(percent);
      if (value === null || value <= 0 || value > 100) return setError(t('care.badPercent'));
      size = Math.round(value);
    }
    actions.saveEvent(tank.id, { id: event?.id ?? newId(), at, type, percent: size, note: note.trim() || undefined });
    toast(t('toast.saved'));
    onClose();
  };

  return (
    <Dialog title={t(event ? 'care.editTitle' : 'care.title')} onClose={onClose}>
      <form
        className="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <fieldset className="choice-grid">
          <legend>{t('care.type')}</legend>
          {CARE_EVENT_TYPES.map((value) => (
            <label key={value} className="choice">
              <input type="radio" name="care-type" checked={type === value} onChange={() => setType(value)} />
              <Icon name={CARE_ICON[value]} />
              <span>{t(`care.${value}`)}</span>
            </label>
          ))}
        </fieldset>
        {type === 'water-change' && (
          <div className="field">
            <label htmlFor="care-percent">{t('care.percent')}</label>
            <div className="input-unit input-short">
              <input
                id="care-percent"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={percent}
                placeholder="25"
                onChange={(e) => {
                  setPercent(e.target.value);
                  setError(null);
                }}
                aria-describedby="care-percent-hint"
              />
              <span className="unit">%</span>
            </div>
            <p id="care-percent-hint" className="hint muted">
              {t('care.percentHint')}
            </p>
          </div>
        )}
        <div className="field">
          <label htmlFor="care-when">{t('care.when')}</label>
          <input
            id="care-when"
            type="datetime-local"
            value={when}
            max={toDateTimeInput(new Date().toISOString())}
            onChange={(e) => {
              setWhen(e.target.value);
              setError(null);
            }}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="care-note">{t('form.note')}</label>
          <textarea
            id="care-note"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('care.notePlaceholder')}
          />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('common.save')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
