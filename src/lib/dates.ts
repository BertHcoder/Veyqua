import type { Lang } from './types';

export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

export const locale = (lang: Lang) => (lang === 'nl' ? 'nl-BE' : 'en-GB');

/** Local calendar date as YYYY-MM-DD. */
export function isoDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midnight of a YYYY-MM-DD date. */
export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

/** ISO timestamp → value for <input type="datetime-local">. */
export function toDateTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) → ISO timestamp. */
export function fromDateTimeInput(value: string): string | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function daysBetween(fromMs: number, toMs: number): number {
  return Math.floor((toMs - fromMs) / DAY_MS);
}

export function daysSince(iso: string, now = Date.now()): number {
  return daysBetween(new Date(iso).getTime(), now);
}

/** Calendar days between a date and now (yesterday = 1), robust to DST changes. */
export function calendarDaysSince(iso: string, now = Date.now()): number {
  const then = iso.length === 10 ? parseIsoDate(iso) : new Date(iso);
  const today = new Date(now);
  return Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime()) /
      DAY_MS,
  );
}

export function formatDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short', year: 'numeric' }).format(
    iso.length === 10 ? parseIsoDate(iso) : new Date(iso),
  );
}

export function formatShortDate(ms: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'short' }).format(new Date(ms));
}

export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat(locale(lang), {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago". */
export function formatAgo(iso: string, lang: Lang, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  const calendarDays = calendarDaysSince(iso, now);
  if (calendarDays < 14) return rtf.format(-Math.max(0, calendarDays), 'day');
  if (calendarDays < 60) return rtf.format(-Math.round(calendarDays / 7), 'week');
  if (calendarDays < 730) return rtf.format(-Math.round(calendarDays / 30.44), 'month');
  return rtf.format(-Math.round(calendarDays / 365.25), 'year');
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
