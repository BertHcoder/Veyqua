import { useSyncExternalStore } from 'react';
import { demoTanks } from './data/demo';
import { backupFileName, createBackupJson, downloadFile, mergeData, type MergeResult } from './lib/backup';
import { newId } from './lib/dates';
import { emptyData, loadData, saveData, STORAGE_KEY, type SaveResult } from './lib/storage';
import type { AppData, CareEvent, Inhabitant, Lang, Measurement, Settings, Tank } from './lib/types';

let data: AppData = loadData();
let saveResult: SaveResult = 'ok';
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: AppData) {
  data = next;
  saveResult = saveData(next);
  emit();
}

// Another tab changed the data: pick it up so tabs never overwrite each other.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      data = loadData();
      emit();
    }
  });
}

export const useAppData = () => useSyncExternalStore(subscribe, () => data);
export const useSaveResult = () => useSyncExternalStore(subscribe, () => saveResult);
export const getData = () => data;

export type TankInput = Omit<Tank, 'id' | 'inhabitants' | 'measurements' | 'events' | 'createdAt' | 'updatedAt'>;

const now = () => new Date().toISOString();

const upsert = <T extends { id: string }>(list: T[], item: T): T[] =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

function changeTank(id: string, change: (tank: Tank) => Partial<Tank>) {
  commit({
    ...data,
    tanks: data.tanks.map((tank) => (tank.id === id ? { ...tank, ...change(tank), updatedAt: now() } : tank)),
  });
}

export const actions = {
  addTank(input: TankInput): string {
    const stamp = now();
    const tank: Tank = { ...input, id: newId(), inhabitants: [], measurements: [], events: [], createdAt: stamp, updatedAt: stamp };
    commit({ ...data, tanks: [...data.tanks, tank] });
    return tank.id;
  },
  updateTank(id: string, input: TankInput) {
    changeTank(id, () => input);
  },
  deleteTank(id: string) {
    commit({ ...data, tanks: data.tanks.filter((tank) => tank.id !== id) });
  },
  markCycled(id: string) {
    changeTank(id, () => ({ cycling: false }));
  },
  saveMeasurement(tankId: string, measurement: Measurement) {
    changeTank(tankId, (tank) => ({
      measurements: upsert(tank.measurements, measurement).sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
    }));
  },
  deleteMeasurement(tankId: string, id: string) {
    changeTank(tankId, (tank) => ({ measurements: tank.measurements.filter((m) => m.id !== id) }));
  },
  saveEvent(tankId: string, event: CareEvent) {
    changeTank(tankId, (tank) => ({
      events: upsert(tank.events, event).sort((a, b) => a.at.localeCompare(b.at)),
    }));
  },
  deleteEvent(tankId: string, id: string) {
    changeTank(tankId, (tank) => ({ events: tank.events.filter((e) => e.id !== id) }));
  },
  saveInhabitant(tankId: string, inhabitant: Inhabitant) {
    changeTank(tankId, (tank) => ({ inhabitants: upsert(tank.inhabitants, inhabitant) }));
  },
  deleteInhabitant(tankId: string, id: string) {
    changeTank(tankId, (tank) => ({ inhabitants: tank.inhabitants.filter((i) => i.id !== id) }));
  },
  updateSettings(patch: Partial<Settings>) {
    commit({ ...data, settings: { ...data.settings, ...patch } });
  },
  replaceAll(next: AppData) {
    commit(next);
  },
  merge(incoming: AppData): MergeResult {
    const result = mergeData(data, incoming);
    commit(result.data);
    return result;
  },
  addDemo(lang: Lang) {
    commit({ ...data, tanks: [...data.tanks, ...demoTanks(lang)] });
  },
  /** Downloads everything as a JSON file and remembers when, for the backup reminder. */
  exportBackup() {
    downloadFile(backupFileName(), createBackupJson(data), 'application/json');
    commit({ ...data, settings: { ...data.settings, lastBackupAt: now(), backupReminderSnoozedUntil: undefined } });
  },
  clearAll() {
    commit(emptyData());
  },
};
