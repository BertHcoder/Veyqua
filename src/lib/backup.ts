import { PARAM_IDS, PARAMS } from '../data/parameters';
import { isoDate } from './dates';
import { normalizeData } from './normalize';
import { displayUnit } from './units';
import type { AppData, Lang, Settings, Tank } from './types';

export interface BackupFile {
  app: 'veyqua';
  version: 1;
  exportedAt: string;
  data: AppData;
}

export function createBackupJson(data: AppData, now = new Date()): string {
  const file: BackupFile = { app: 'veyqua', version: 1, exportedAt: now.toISOString(), data };
  return JSON.stringify(file, null, 2);
}

export const backupFileName = (now = new Date()) => `veyqua-backup-${isoDate(now)}.json`;

export type ParsedBackup =
  | { ok: true; data: AppData; exportedAt?: string }
  | { ok: false; reason: 'json' | 'format' | 'version' };

export function parseBackup(json: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'json' };
  }
  const result = normalizeData(parsed);
  if (!result.ok) return result;
  const exportedAt =
    typeof parsed === 'object' && parsed !== null && 'exportedAt' in parsed && typeof parsed.exportedAt === 'string'
      ? parsed.exportedAt
      : undefined;
  return { ok: true, data: result.data, exportedAt };
}

export interface MergeResult {
  data: AppData;
  addedTanks: number;
  addedEntries: number;
}

function addMissing<T extends { id: string }>(current: T[], incoming: T[]): { items: T[]; added: number } {
  const ids = new Set(current.map((item) => item.id));
  const extra = incoming.filter((item) => !ids.has(item.id));
  return { items: [...current, ...extra], added: extra.length };
}

/**
 * Adds aquariums and entries from a backup that are missing on this device.
 * Nothing on this device is overwritten or deleted; settings stay as they are.
 */
export function mergeData(current: AppData, incoming: AppData): MergeResult {
  let addedTanks = 0;
  let addedEntries = 0;
  const tanks = current.tanks.map((tank) => {
    const other = incoming.tanks.find((t) => t.id === tank.id);
    if (!other) return tank;
    const measurements = addMissing(tank.measurements, other.measurements);
    const events = addMissing(tank.events, other.events);
    const inhabitants = addMissing(tank.inhabitants, other.inhabitants);
    const added = measurements.added + events.added + inhabitants.added;
    if (added === 0) return tank;
    addedEntries += added;
    return {
      ...tank,
      measurements: measurements.items.sort((a, b) => a.takenAt.localeCompare(b.takenAt)),
      events: events.items.sort((a, b) => a.at.localeCompare(b.at)),
      inhabitants: inhabitants.items,
      updatedAt: new Date().toISOString(),
    };
  });
  const known = new Set(current.tanks.map((t) => t.id));
  for (const tank of incoming.tanks) {
    if (!known.has(tank.id)) {
      tanks.push(tank);
      addedTanks += 1;
    }
  }
  return { data: { ...current, tanks }, addedTanks, addedEntries };
}

const csvCell = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
// Spreadsheet apps run free text that starts like a formula; numbers are left alone so negatives stay numeric.
const csvText = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);

/** Test results of one aquarium as CSV, in the user's display units. */
export function tankToCsv(tank: Tank, settings: Settings, lang: Lang): string {
  const used = PARAM_IDS.filter((p) => tank.measurements.some((m) => m.values[p] !== undefined));
  const header = [
    lang === 'nl' ? 'Datum' : 'Date',
    ...used.map((p) => {
      const unit = displayUnit(p, settings).label;
      return unit ? `${PARAMS[p].name[lang]} (${unit})` : PARAMS[p].name[lang];
    }),
    lang === 'nl' ? 'Notitie' : 'Note',
  ];
  const rows = tank.measurements.map((m) => {
    const d = new Date(m.takenAt);
    const when = `${isoDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const values = used.map((p) => {
      const v = m.values[p];
      if (v === undefined) return '';
      const unit = displayUnit(p, settings);
      return String(Number(unit.toDisplay(v).toFixed(unit.maxDecimals)));
    });
    return [when, ...values, csvText(m.note ?? '')];
  });
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function downloadFile(fileName: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
