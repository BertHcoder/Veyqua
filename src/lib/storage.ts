import { defaultSettings, normalizeData } from './normalize';
import type { AppData } from './types';

export const STORAGE_KEY = 'veyqua:data';

export const emptyData = (): AppData => ({ version: 1, settings: defaultSettings(), tanks: [] });

export function loadData(): AppData {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return emptyData();
  }
  if (!raw) return emptyData();
  try {
    const result = normalizeData(JSON.parse(raw));
    if (result.ok) return result.data;
  } catch {
    // Unreadable JSON: handled below.
  }
  // Keep a copy of unreadable data so it is never silently lost.
  try {
    localStorage.setItem(`${STORAGE_KEY}:unreadable:${Date.now()}`, raw);
  } catch {
    // Nothing more we can do.
  }
  return emptyData();
}

export type SaveResult = 'ok' | 'quota' | 'unavailable';

export function saveData(data: AppData): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return 'ok';
  } catch (error) {
    return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)
      ? 'quota'
      : 'unavailable';
  }
}

/** Approximate size of the stored data in bytes (UTF-16 in localStorage). */
export function storedBytes(): number {
  try {
    return (localStorage.getItem(STORAGE_KEY)?.length ?? 0) * 2;
  } catch {
    return 0;
  }
}
