import { useId, useMemo, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { InsightCard, type InsightAction } from '../../components/InsightCard';
import { LevelPill, type ReadingLevel } from '../../components/Status';
import { paramLabel, PARAM_IDS, PARAMS } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { levelOf } from '../../engine/evaluate';
import { analyzeTank, hasLivestock, isReminder, type Insight } from '../../engine/insights';
import { effectiveTargets, type Target } from '../../engine/targets';
import { useI18n } from '../../i18n';
import { fromDateTimeInput, newId, toDateTimeInput } from '../../lib/dates';
import { displayUnit, formatRange, formatValue, parseDisplayValue, toInputValue } from '../../lib/units';
import type { Measurement, ParamId, Settings, Tank } from '../../lib/types';
import { actions, getData, useAppData } from '../../store';
import { toast } from '../../toast';

const NITROGEN: ParamId[] = ['ammonia', 'nitrite', 'nitrate'];
/** Allow a little clock skew between devices before calling a time "in the future". */
const FUTURE_SLACK_MS = 10 * 60_000;

type Check = { state: 'empty' } | { state: 'invalid' } | { state: 'implausible' } | { state: 'ok'; value: number };

function check(param: ParamId, input: string, settings: Settings): Check {
  if (input.trim() === '') return { state: 'empty' };
  const value = parseDisplayValue(param, input, settings);
  if (value === null) return { state: 'invalid' };
  const [min, max] = PARAMS[param].plausible;
  if (value < min - 1e-9 || value > max + 1e-9) return { state: 'implausible' };
  return { state: 'ok', value: Math.round(value * 10_000) / 10_000 };
}

interface FieldProps {
  param: ParamId;
  tank: Tank;
  input: string;
  onChange: (value: string) => void;
  target?: Target;
  settings: Settings;
  fishlessCycle: boolean;
}

function ParamField({ param, tank, input, onChange, target, settings, fishlessCycle }: FieldProps) {
  const { t, l, lang } = useI18n();
  const id = useId();
  const def = PARAMS[param];
  const unit = displayUnit(param, settings);
  const name = l(paramLabel(param, PROFILES[tank.profile].water));
  const result = check(param, input, settings);
  let level: ReadingLevel = null;
  if (result.state === 'ok' && target) {
    level = levelOf(result.value, target);
    if (fishlessCycle && NITROGEN.includes(param) && level !== 'ok') level = 'cycling';
  }
  const problem = result.state === 'invalid' || result.state === 'implausible';

  return (
    <div className="field param-field">
      <label htmlFor={id}>
        {name}
        {def.symbol && <span className="muted"> {def.symbol}</span>}
      </label>
      <div className="input-unit">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={input}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={problem || undefined}
          aria-describedby={`${id}-hint`}
        />
        {unit.label && <span className="unit">{unit.label}</span>}
      </div>
      {def.kitSteps && (
        <div className="kit-steps" role="group" aria-label={t('test.kitSteps', { param: name })}>
          {def.kitSteps.map((step) => {
            const text = toInputValue(param, step, settings, lang);
            return (
              <button
                key={step}
                type="button"
                className="chip-btn"
                aria-pressed={result.state === 'ok' && Math.abs(result.value - step) < 1e-9}
                onClick={() => onChange(text)}
              >
                {text}
              </button>
            );
          })}
        </div>
      )}
      <p id={`${id}-hint`} className={problem ? 'hint hint-error' : 'hint'}>
        {result.state === 'invalid' && t('test.notNumber')}
        {result.state === 'implausible' &&
          t('test.implausible', {
            min: formatValue(param, def.plausible[0], settings, lang),
            max: formatValue(param, def.plausible[1], settings, lang),
          })}
        {!problem && level && <LevelPill level={level} />}
        {!problem && target && (
          <span className="muted">{t('overview.target', { range: formatRange(param, target.ideal, settings, lang) })}</span>
        )}
      </p>
    </div>
  );
}

interface LogTestDialogProps {
  tank: Tank;
  measurement?: Measurement;
  onClose: () => void;
  onAction: (action: InsightAction) => void;
}

export function LogTestDialog({ tank, measurement, onClose, onAction }: LogTestDialogProps) {
  const { t, lang } = useI18n();
  const { settings } = useAppData();
  const water = PROFILES[tank.profile].water;
  const targets = useMemo(() => effectiveTargets(tank), [tank]);
  const fishlessCycle = tank.cycling && !hasLivestock(tank);
  const extra = PARAM_IDS.filter(
    (p) => !tank.params.includes(p) && (PARAMS[p].waters.includes(water) || measurement?.values[p] !== undefined),
  );
  const [when, setWhen] = useState(() => toDateTimeInput(measurement?.takenAt ?? new Date().toISOString()));
  const [inputs, setInputs] = useState<Partial<Record<ParamId, string>>>(() => {
    const initial: Partial<Record<ParamId, string>> = {};
    for (const param of PARAM_IDS) {
      const value = measurement?.values[param];
      if (value !== undefined) initial[param] = toInputValue(param, value, settings, lang);
    }
    return initial;
  });
  const [note, setNote] = useState(measurement?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Insight[] | null>(null);
  const [extraOpen] = useState(() => extra.some((p) => measurement?.values[p] !== undefined));

  const field = (param: ParamId) => (
    <ParamField
      key={param}
      param={param}
      tank={tank}
      input={inputs[param] ?? ''}
      onChange={(value) => {
        setInputs((current) => ({ ...current, [param]: value }));
        setError(null);
      }}
      target={targets[param]}
      settings={settings}
      fishlessCycle={fishlessCycle}
    />
  );

  const save = () => {
    const takenAt = fromDateTimeInput(when);
    if (!takenAt) return setError(t('form.badDate'));
    if (Date.parse(takenAt) > Date.now() + FUTURE_SLACK_MS) return setError(t('form.futureDate'));
    const values: Partial<Record<ParamId, number>> = {};
    for (const param of PARAM_IDS) {
      const result = check(param, inputs[param] ?? '', settings);
      if (result.state === 'invalid' || result.state === 'implausible') return setError(t('test.fixErrors'));
      if (result.state === 'ok') values[param] = result.value;
    }
    if (Object.keys(values).length === 0) return setError(t('test.noValues'));

    actions.saveMeasurement(tank.id, { id: measurement?.id ?? newId(), takenAt, values, note: note.trim() || undefined });
    if (measurement) {
      toast(t('toast.saved'));
      onClose();
      return;
    }
    const updated = getData().tanks.find((x) => x.id === tank.id);
    const logged = Object.keys(values) as ParamId[];
    const relevant = updated
      ? analyzeTank(updated).insights.filter(
          (i) =>
            !isReminder(i) &&
            (i.kind === 'cycle' || ((i.kind === 'param' || i.kind === 'trend' || i.kind === 'swing') && logged.includes(i.param))),
        )
      : [];
    setResults(relevant);
  };

  if (results) {
    return (
      <Dialog title={t('test.resultsTitle')} onClose={onClose} wide>
        <div className="stack-sm">
          {results.length === 0 ? (
            <div className="all-good">
              <Icon name="check" />
              <p>{t('test.allGood')}</p>
            </div>
          ) : (
            <>
              <p>{t('test.resultsIntro')}</p>
              {results.map((insight, index) => (
                <InsightCard key={`${insight.kind}-${index}`} insight={insight} tank={tank} settings={settings} onAction={onAction} />
              ))}
            </>
          )}
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              {t('common.done')}
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title={t(measurement ? 'test.editTitle' : 'test.title')} onClose={onClose} wide>
      <form
        className="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <p className="muted">{t('test.intro')}</p>
        <div className="field">
          <label htmlFor="test-when">{t('test.when')}</label>
          <input
            id="test-when"
            type="datetime-local"
            value={when}
            max={toDateTimeInput(new Date().toISOString())}
            onChange={(event) => {
              setWhen(event.target.value);
              setError(null);
            }}
            required
          />
        </div>
        <div className="param-grid">{tank.params.map(field)}</div>
        {extra.length > 0 && (
          <details className="disclosure" open={extraOpen || undefined}>
            <summary>{t('test.otherParams')}</summary>
            <div className="param-grid">{extra.map(field)}</div>
          </details>
        )}
        <div className="field">
          <label htmlFor="test-note">{t('form.note')}</label>
          <textarea
            id="test-note"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('test.notePlaceholder')}
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
            {t(measurement ? 'common.save' : 'test.save')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
