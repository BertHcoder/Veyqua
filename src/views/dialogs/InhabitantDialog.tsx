import { useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { paramLabel } from '../../data/parameters';
import { PROFILES } from '../../data/profiles';
import { getSpecies, SPECIES, type Species } from '../../data/species';
import { SPECIES_PARAMS } from '../../engine/targets';
import { useI18n } from '../../i18n';
import { isoDate, newId } from '../../lib/dates';
import { INHABITANT_KINDS } from '../../lib/normalize';
import { formatRange, formatVolume } from '../../lib/units';
import type { Inhabitant, InhabitantKind, Tank } from '../../lib/types';
import { actions, useAppData } from '../../store';
import { toast } from '../../toast';

const fold = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function SpeciesFacts({ species }: { species: Species }) {
  const { t, l, lang } = useI18n();
  const { settings } = useAppData();
  const ranges = SPECIES_PARAMS.flatMap((param) => {
    const range = species.ranges[param];
    return range ? [`${l(paramLabel(param, species.water))} ${formatRange(param, range, settings, lang)}`] : [];
  });
  return (
    <div className="species-facts">
      <p>
        <strong>{l(species.name)}</strong>
        {species.scientificName && (
          <>
            {' '}
            <i className="muted">{species.scientificName}</i>
          </>
        )}
      </p>
      <ul className="facts-list">
        {ranges.length > 0 && <li>{ranges.join(' · ')}</li>}
        {species.minGroup && species.minGroup > 1 && <li>{t('species.group', { count: species.minGroup })}</li>}
        {species.minVolumeL && (
          <li>{t('species.volume', { volume: formatVolume(species.minVolumeL, settings.volumeUnit, lang) })}</li>
        )}
        {species.reefSafe !== undefined && (
          <li>
            {t(species.reefSafe === true ? 'species.reefSafe' : species.reefSafe === false ? 'species.notReefSafe' : 'species.reefCaution')}
          </li>
        )}
      </ul>
      <p className="muted">{l(species.care)}</p>
    </div>
  );
}

interface InhabitantDialogProps {
  tank: Tank;
  inhabitant?: Inhabitant;
  onClose: () => void;
}

export function InhabitantDialog({ tank, inhabitant, onClose }: InhabitantDialogProps) {
  const { t, l, lang } = useI18n();
  const water = PROFILES[tank.profile].water;
  const [speciesId, setSpeciesId] = useState(inhabitant?.speciesId);
  const [custom, setCustom] = useState(inhabitant !== undefined && !getSpecies(inhabitant.speciesId));
  const [query, setQuery] = useState('');
  const [name, setName] = useState(inhabitant?.name ?? '');
  const [kind, setKind] = useState<InhabitantKind>(inhabitant?.kind ?? 'fish');
  const [count, setCount] = useState(String(inhabitant?.count ?? 1));
  const [addedOn, setAddedOn] = useState(inhabitant?.addedOn ?? isoDate());
  const [note, setNote] = useState(inhabitant?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const species = getSpecies(speciesId);
  const title = t(inhabitant ? 'livestock.editTitle' : 'livestock.addTitle');

  if (!species && !custom) {
    const q = fold(query.trim());
    const matches = SPECIES.filter((s) => s.water === water)
      .filter(
        (s) =>
          q === '' ||
          fold(s.name.en).includes(q) ||
          fold(s.name.nl).includes(q) ||
          fold(s.scientificName ?? '').includes(q),
      )
      .sort((a, b) => l(a.name).localeCompare(l(b.name), lang));
    return (
      <Dialog title={title} onClose={onClose} wide>
        <div className="stack-sm">
          <div className="field">
            <label htmlFor="species-search">{t('species.search')}</label>
            <div className="input-icon">
              <Icon name="search" size={18} />
              <input
                id="species-search"
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(water === 'marine' ? 'species.placeholderMarine' : 'species.placeholderFresh')}
              />
            </div>
          </div>
          <ul className="species-list" aria-label={t('species.results')}>
            {matches.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="species-option"
                  onClick={() => {
                    setSpeciesId(s.id);
                    setKind(s.kind);
                    if (!inhabitant) setCount(String(s.minGroup ?? 1));
                  }}
                >
                  <span>
                    <strong>{l(s.name)}</strong>
                    {s.scientificName && <i className="muted"> {s.scientificName}</i>}
                  </span>
                  <span className="muted small">{t(`kind.${s.kind}`)}</span>
                </button>
              </li>
            ))}
          </ul>
          {matches.length === 0 && <p className="muted">{t('species.none')}</p>}
          <div className="custom-entry">
            <p className="muted">{t('species.notListed')}</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setCustom(true);
                setName(query.trim());
              }}
            >
              <Icon name="plus" />
              {t('species.addOwn')}
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  const save = () => {
    const finalName = species ? l(species.name) : name.trim();
    if (!finalName) return setError(t('livestock.nameRequired'));
    const amount = Number(count);
    if (!Number.isInteger(amount) || amount < 1 || amount > 9999) return setError(t('livestock.badCount'));
    actions.saveInhabitant(tank.id, {
      id: inhabitant?.id ?? newId(),
      speciesId: species?.id,
      name: finalName.slice(0, 80),
      kind: species ? species.kind : kind,
      count: amount,
      addedOn: addedOn || undefined,
      note: note.trim() || undefined,
    });
    toast(t('toast.saved'));
    onClose();
  };

  return (
    <Dialog title={title} onClose={onClose} wide>
      <form
        className="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {species ? (
          <div className="card card-soft">
            <SpeciesFacts species={species} />
            <button
              type="button"
              className="btn btn-small"
              onClick={() => {
                setSpeciesId(undefined);
                setCustom(false);
              }}
            >
              {t('species.change')}
            </button>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="inhabitant-name">{t('livestock.name')}</label>
              <input
                id="inhabitant-name"
                type="text"
                maxLength={80}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="inhabitant-kind">{t('livestock.kind')}</label>
              <select id="inhabitant-kind" value={kind} onChange={(e) => setKind(e.target.value as InhabitantKind)}>
                {INHABITANT_KINDS.map((value) => (
                  <option key={value} value={value}>
                    {t(`kind.${value}`)}
                  </option>
                ))}
              </select>
            </div>
            {!inhabitant && (
              <button type="button" className="link-btn" onClick={() => setCustom(false)}>
                {t('species.backToList')}
              </button>
            )}
          </>
        )}
        <div className="field-row">
          <div className="field">
            <label htmlFor="inhabitant-count">{t('livestock.count')}</label>
            <input
              id="inhabitant-count"
              type="number"
              min={1}
              max={9999}
              step={1}
              inputMode="numeric"
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
                setError(null);
              }}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="inhabitant-added">{t('livestock.addedOn')}</label>
            <input
              id="inhabitant-added"
              type="date"
              value={addedOn}
              max={isoDate()}
              onChange={(e) => setAddedOn(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="inhabitant-note">{t('form.note')}</label>
          <textarea
            id="inhabitant-note"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
