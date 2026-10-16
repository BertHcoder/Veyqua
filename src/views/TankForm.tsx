import { useEffect, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { paramLabel, PARAM_IDS, PARAMS } from '../data/parameters';
import { PROFILE_IDS, PROFILES } from '../data/profiles';
import { useI18n } from '../i18n';
import { calendarDaysSince, isoDate } from '../lib/dates';
import {
  displayUnit,
  formatNumber,
  parseDisplayValue,
  parseNumber,
  toInputValue,
  volumeFromDisplay,
  volumeToDisplay,
} from '../lib/units';
import type { ParamId, ProfileId, Range, Settings, Tank, Water } from '../lib/types';
import { Link, navigate, tankPath } from '../router';
import { actions, useAppData, type TankInput } from '../store';
import { toast } from '../toast';
import { NotFound } from './NotFound';

/** Tanks set up longer ago than this are assumed to be cycled. */
const CYCLED_AFTER_DAYS = 42;
const WATERS: Water[] = ['fresh', 'marine'];

type Errors = Partial<Record<'name' | 'volume' | 'startedOn' | 'testEvery' | 'wcEvery' | 'params' | ParamId, string>>;

export function TankForm({ id }: { id?: string }) {
  const { tanks, settings } = useAppData();
  const tank = id === undefined ? undefined : tanks.find((x) => x.id === id);
  if (id !== undefined && !tank) return <NotFound />;
  return <TankFormInner key={id ?? 'new'} tank={tank} settings={settings} />;
}

function orderParams(selected: ParamId[], profile: ProfileId): ParamId[] {
  const first = PROFILES[profile].params.filter((p) => selected.includes(p));
  return [...first, ...PARAM_IDS.filter((p) => selected.includes(p) && !first.includes(p))];
}

function TankFormInner({ tank, settings }: { tank?: Tank; settings: Settings }) {
  const { t, l, lang } = useI18n();
  const [name, setName] = useState(tank?.name ?? '');
  const [profile, setProfile] = useState<ProfileId>(tank?.profile ?? 'tropical');
  const [volume, setVolume] = useState(
    tank?.volumeL ? formatNumber(volumeToDisplay(tank.volumeL, settings.volumeUnit), lang, 0, 1) : '',
  );
  const [startedOn, setStartedOn] = useState(tank ? (tank.startedOn ?? '') : isoDate());
  const [cycling, setCycling] = useState(tank?.cycling ?? true);
  const [cyclingTouched, setCyclingTouched] = useState(tank !== undefined);
  const [testEvery, setTestEvery] = useState(
    tank ? (tank.testEveryDays?.toString() ?? '') : String(PROFILES.tropical.testEveryDays),
  );
  const [testTouched, setTestTouched] = useState(tank !== undefined);
  const [wcEvery, setWcEvery] = useState(tank ? (tank.waterChangeEveryDays?.toString() ?? '') : '7');
  const [params, setParams] = useState<ParamId[]>(tank?.params ?? PROFILES.tropical.params);
  const [paramsTouched, setParamsTouched] = useState(tank !== undefined);
  const [targets, setTargets] = useState<Partial<Record<ParamId, [string, string]>>>(() => {
    const initial: Partial<Record<ParamId, [string, string]>> = {};
    for (const [param, range] of Object.entries(tank?.targets ?? {}) as [ParamId, Range][]) {
      initial[param] = [
        toInputValue(param, range[0], settings, lang),
        toInputValue(param, range[1], settings, lang),
      ];
    }
    return initial;
  });
  const [notes, setNotes] = useState(tank?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const water = PROFILES[profile].water;

  useEffect(() => {
    document.title = `${tank ? t('form.editTitle') : t('form.newTitle')} · Veyqua`;
  }, [tank, t]);

  const chooseProfile = (next: ProfileId) => {
    setProfile(next);
    if (!paramsTouched) setParams(PROFILES[next].params);
    else if (PROFILES[next].water !== water) {
      setParams((current) => [
        ...new Set([...current.filter((p) => PARAMS[p].waters.includes(PROFILES[next].water)), ...PROFILES[next].params]),
      ]);
    }
    if (!testTouched) setTestEvery(String(PROFILES[next].testEveryDays));
  };

  const changeStart = (value: string) => {
    setStartedOn(value);
    if (!cyclingTouched && value) setCycling(calendarDaysSince(value) < CYCLED_AFTER_DAYS);
  };

  const available = PARAM_IDS.filter((p) => PARAMS[p].waters.includes(water) || params.includes(p));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = {};
    const trimmed = name.trim();
    if (!trimmed) found.name = t('form.nameRequired');

    let volumeL: number | undefined;
    if (volume.trim()) {
      const value = parseNumber(volume);
      if (value === null || value <= 0 || volumeFromDisplay(value, settings.volumeUnit) > 100_000) {
        found.volume = t('form.badVolume');
      } else {
        volumeL = Math.round(volumeFromDisplay(value, settings.volumeUnit) * 10) / 10;
      }
    }
    if (startedOn && startedOn > isoDate()) found.startedOn = t('form.futureDate');

    const interval = (text: string, key: 'testEvery' | 'wcEvery') => {
      if (!text.trim()) return undefined;
      const value = parseNumber(text);
      if (value === null || !Number.isInteger(value) || value < 1 || value > 365) {
        found[key] = t('form.badInterval');
        return undefined;
      }
      return value;
    };
    const testEveryDays = interval(testEvery, 'testEvery');
    const waterChangeEveryDays = interval(wcEvery, 'wcEvery');

    const tracked = orderParams(params, profile);
    if (tracked.length === 0) found.params = t('form.paramsRequired');

    const custom: Partial<Record<ParamId, Range>> = {};
    for (const param of tracked) {
      const [minText = '', maxText = ''] = targets[param] ?? [];
      if (!minText.trim() && !maxText.trim()) continue;
      const min = minText.trim() ? parseDisplayValue(param, minText, settings) : null;
      const max = maxText.trim() ? parseDisplayValue(param, maxText, settings) : null;
      if ((minText.trim() && min === null) || (maxText.trim() && max === null) || (min !== null && max !== null && min > max)) {
        found[param] = t('form.badTarget');
        continue;
      }
      const round = (v: number | null) => (v === null ? null : Math.round(v * 10_000) / 10_000);
      custom[param] = [round(min), round(max)];
    }

    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const input: TankInput = {
      name: trimmed.slice(0, 60),
      profile,
      volumeL,
      startedOn: startedOn || undefined,
      cycling,
      params: tracked,
      targets: custom,
      testEveryDays,
      waterChangeEveryDays,
      notes: notes.trim() || undefined,
    };
    if (tank) {
      actions.updateTank(tank.id, input);
      toast(t('toast.saved'));
      navigate(tankPath(tank.id));
    } else {
      const newId = actions.addTank(input);
      toast(t('toast.tankAdded', { name: input.name }));
      navigate(tankPath(newId), { replace: true });
    }
  };

  const errorText = (key: keyof Errors) =>
    errors[key] ? (
      <p id={`error-${key}`} className="hint hint-error">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="page page-narrow">
      <Link to={tank ? tankPath(tank.id) : '/'} className="back-link">
        <Icon name="back" size={18} />
        {tank ? tank.name : t('nav.tanks')}
      </Link>
      <h1>{tank ? t('form.editTitle') : t('form.newTitle')}</h1>
      <form className="form stack" noValidate onSubmit={submit}>
        <div className="field">
          <label htmlFor="tank-name">{t('form.name')}</label>
          <input
            id="tank-name"
            type="text"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.namePlaceholder')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'error-name' : undefined}
            required
          />
          {errorText('name')}
        </div>

        <fieldset className="stack-sm">
          <legend>{t('form.profile')}</legend>
          <p className="hint muted">{t('form.profileHint')}</p>
          {WATERS.map((w) => (
            <div key={w} className="stack-sm">
              <h3 className="group-title">{t(`water.${w}`)}</h3>
              <div className="profile-grid">
                {PROFILE_IDS.filter((p) => PROFILES[p].water === w).map((p) => (
                  <label key={p} className="profile-option">
                    <input type="radio" name="profile" checked={profile === p} onChange={() => chooseProfile(p)} />
                    <span className="profile-name">{l(PROFILES[p].name)}</span>
                    <span className="muted small">{l(PROFILES[p].description)}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <div className="field-row">
          <div className="field">
            <label htmlFor="tank-volume">{t('form.volume')}</label>
            <div className="input-unit">
              <input
                id="tank-volume"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                aria-invalid={errors.volume ? true : undefined}
                aria-describedby={errors.volume ? 'error-volume' : 'tank-volume-hint'}
              />
              <span className="unit">{settings.volumeUnit === 'gal' ? 'gal' : 'L'}</span>
            </div>
            {errorText('volume') ?? (
              <p id="tank-volume-hint" className="hint muted">
                {t('form.volumeHint')}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor="tank-start">{t('form.startedOn')}</label>
            <input
              id="tank-start"
              type="date"
              value={startedOn}
              max={isoDate()}
              onChange={(e) => changeStart(e.target.value)}
              aria-invalid={errors.startedOn ? true : undefined}
              aria-describedby={errors.startedOn ? 'error-startedOn' : undefined}
            />
            {errorText('startedOn')}
          </div>
        </div>

        <fieldset className="stack-sm">
          <legend>{t('form.cycleStatus')}</legend>
          <div className="choice-list">
            <label className="choice-row">
              <input
                type="radio"
                name="cycling"
                checked={cycling}
                onChange={() => {
                  setCycling(true);
                  setCyclingTouched(true);
                }}
              />
              <span>
                <strong>{t('form.cyclingYes')}</strong>
                <span className="muted small">{t('form.cyclingYesHint')}</span>
              </span>
            </label>
            <label className="choice-row">
              <input
                type="radio"
                name="cycling"
                checked={!cycling}
                onChange={() => {
                  setCycling(false);
                  setCyclingTouched(true);
                }}
              />
              <span>
                <strong>{t('form.cyclingNo')}</strong>
                <span className="muted small">{t('form.cyclingNoHint')}</span>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset className="stack-sm">
          <legend>{t('form.reminders')}</legend>
          <p className="hint muted">{t('form.remindersHint')}</p>
          <div className="field-row">
            <div className="field">
              <label htmlFor="tank-test-every">{t('form.testEvery')}</label>
              <div className="input-unit input-short">
                <input
                  id="tank-test-every"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={testEvery}
                  onChange={(e) => {
                    setTestEvery(e.target.value);
                    setTestTouched(true);
                  }}
                  aria-invalid={errors.testEvery ? true : undefined}
                  aria-describedby={errors.testEvery ? 'error-testEvery' : undefined}
                />
                <span className="unit">{t('form.days')}</span>
              </div>
              {errorText('testEvery')}
            </div>
            <div className="field">
              <label htmlFor="tank-wc-every">{t('form.waterChangeEvery')}</label>
              <div className="input-unit input-short">
                <input
                  id="tank-wc-every"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={wcEvery}
                  onChange={(e) => setWcEvery(e.target.value)}
                  aria-invalid={errors.wcEvery ? true : undefined}
                  aria-describedby={errors.wcEvery ? 'error-wcEvery' : undefined}
                />
                <span className="unit">{t('form.days')}</span>
              </div>
              {errorText('wcEvery')}
            </div>
          </div>
        </fieldset>

        <fieldset className="stack-sm">
          <legend>{t('form.params')}</legend>
          <p className="hint muted">{t('form.paramsHint')}</p>
          <div className="check-grid">
            {available.map((param) => (
              <label key={param} className="check">
                <input
                  type="checkbox"
                  checked={params.includes(param)}
                  onChange={(e) => {
                    setParamsTouched(true);
                    setParams((current) =>
                      e.target.checked ? [...current, param] : current.filter((p) => p !== param),
                    );
                  }}
                />
                <span>{l(paramLabel(param, water))}</span>
              </label>
            ))}
          </div>
          {errorText('params')}
        </fieldset>

        <details className="disclosure" open={Object.keys(targets).length > 0 || undefined}>
          <summary>{t('form.customTargets')}</summary>
          <div className="stack-sm">
            <p className="hint muted">{t('form.customTargetsHint')}</p>
            {orderParams(params, profile).map((param) => {
              const base = PROFILES[profile].targets[param]?.ideal;
              const unit = displayUnit(param, settings).label;
              const [minText = '', maxText = ''] = targets[param] ?? [];
              const set = (index: 0 | 1, value: string) =>
                setTargets((current) => {
                  const next: [string, string] = [...(current[param] ?? ['', ''])];
                  next[index] = value;
                  return { ...current, [param]: next };
                });
              const label = l(paramLabel(param, water));
              return (
                <div key={param} className="target-row">
                  <span className="target-name">
                    {label}
                    {unit && <span className="muted"> ({unit})</span>}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label={t('form.targetMin', { param: label })}
                    placeholder={base?.[0] === null || base === undefined ? t('form.noLimit') : toInputValue(param, base[0], settings, lang)}
                    value={minText}
                    onChange={(e) => set(0, e.target.value)}
                    aria-invalid={errors[param] ? true : undefined}
                    aria-describedby={errors[param] ? `error-${param}` : undefined}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-label={t('form.targetMax', { param: label })}
                    placeholder={base?.[1] === null || base === undefined ? t('form.noLimit') : toInputValue(param, base[1], settings, lang)}
                    value={maxText}
                    onChange={(e) => set(1, e.target.value)}
                    aria-invalid={errors[param] ? true : undefined}
                  />
                  {errorText(param)}
                </div>
              );
            })}
          </div>
        </details>

        <div className="field">
          <label htmlFor="tank-notes">{t('form.notes')}</label>
          <textarea
            id="tank-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('form.notesPlaceholder')}
          />
        </div>

        <div className="actions">
          <Link to={tank ? tankPath(tank.id) : '/'} className="btn">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            {tank ? t('common.save') : t('form.create')}
          </button>
        </div>
      </form>

      {tank && (
        <section className="danger-zone card" aria-labelledby="danger-title">
          <h2 id="danger-title">{t('form.deleteTitle')}</h2>
          <p className="muted">{t('form.deleteBody')}</p>
          <button type="button" className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" />
            {t('form.delete')}
          </button>
        </section>
      )}
      {tank && confirmDelete && (
        <ConfirmDialog
          title={t('form.deleteConfirmTitle', { name: tank.name })}
          message={t('form.deleteConfirmBody')}
          confirmLabel={t('form.delete')}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            actions.deleteTank(tank.id);
            toast(t('toast.tankDeleted', { name: tank.name }));
            navigate('/', { replace: true });
          }}
        />
      )}
    </div>
  );
}
