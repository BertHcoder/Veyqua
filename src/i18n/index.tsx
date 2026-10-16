import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { L10n, Lang } from '../lib/types';
import { en, type MessageKey } from './en';
import { nl } from './nl';

const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { en, nl };

/** Message keys that come in `.one` / `.other` pairs. */
export type PluralKey = { [K in MessageKey]: K extends `${infer Base}.one` ? Base : never }[MessageKey];

export type Vars = Record<string, string | number>;

export interface I18n {
  lang: Lang;
  t: (key: MessageKey, vars?: Vars) => string;
  /** Picks the singular or plural form; `{count}` is filled in automatically. */
  tn: (key: PluralKey, count: number, vars?: Vars) => string;
  /** Picks the current language from bilingual data. */
  l: (text: L10n) => string;
}

export function detectLang(): Lang {
  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  for (const tag of preferred) {
    const code = tag.toLowerCase();
    if (code.startsWith('nl')) return 'nl';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

const fill = (text: string, vars?: Vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match)) : text;

export function createI18n(lang: Lang): I18n {
  const dict = DICTIONARIES[lang];
  const t = (key: MessageKey, vars?: Vars) => fill(dict[key], vars);
  return {
    lang,
    t,
    tn: (key, count, vars) => t(`${key}.${count === 1 ? 'one' : 'other'}` as MessageKey, { count, ...vars }),
    l: (text) => text[lang],
  };
}

const I18nContext = createContext<I18n>(createI18n('en'));

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => createI18n(lang), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export type { MessageKey };
