import { useSyncExternalStore, type AnchorHTMLAttributes } from 'react';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

const withBasePath = (path: string) => `${BASE_PATH}${path}`;
const withoutBasePath = (path: string) =>
  path === BASE_PATH ? '/' : path.startsWith(`${BASE_PATH}/`) ? path.slice(BASE_PATH.length) : path;

if (typeof window !== 'undefined') window.addEventListener('popstate', notify);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function navigate(to: string, options: { replace?: boolean } = {}) {
  const target = withBasePath(to);
  if (target !== location.pathname) {
    history[options.replace ? 'replaceState' : 'pushState'](null, '', target);
    notify();
  }
  window.scrollTo(0, 0);
}

export const usePath = () => useSyncExternalStore(subscribe, () => withoutBasePath(location.pathname));

export type TankTab = 'overview' | 'charts' | 'log' | 'livestock';

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'tank'; id: string; tab: TankTab }
  | { name: 'edit'; id: string }
  | { name: 'settings' }
  | { name: 'guide' }
  | { name: 'not-found' };

export function matchRoute(path: string): Route {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return { name: 'home' };
  if (clean === '/new') return { name: 'new' };
  if (clean === '/settings') return { name: 'settings' };
  if (clean === '/guide') return { name: 'guide' };
  const match = /^\/tank\/([^/]+)(?:\/(charts|log|livestock|edit))?$/.exec(clean);
  if (match) {
    let id: string;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      return { name: 'not-found' };
    }
    if (match[2] === 'edit') return { name: 'edit', id };
    return { name: 'tank', id, tab: (match[2] as TankTab | undefined) ?? 'overview' };
  }
  return { name: 'not-found' };
}

export const tankPath = (id: string, tab: TankTab | 'edit' = 'overview') =>
  `/tank/${encodeURIComponent(id)}${tab === 'overview' ? '' : `/${tab}`}`;

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** An ordinary link that navigates without a page load; modified clicks keep their default behaviour. */
export function Link({ to, onClick, ...rest }: LinkProps) {
  return (
    <a
      href={withBasePath(to)}
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}
