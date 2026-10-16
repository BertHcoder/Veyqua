import type { ReactNode } from 'react';
import { useI18n } from '../i18n';
import { Link, usePath } from '../router';
import { useSaveResult } from '../store';
import { useToast } from '../toast';
import { Icon, type IconName } from './Icon';

const NAV: { to: string; icon: IconName; key: 'nav.tanks' | 'nav.guide' | 'nav.settings' }[] = [
  { to: '/', icon: 'home', key: 'nav.tanks' },
  { to: '/guide', icon: 'book', key: 'nav.guide' },
  { to: '/settings', icon: 'settings', key: 'nav.settings' },
];

function isActive(path: string, to: string) {
  if (to === '/') return path === '/' || path === '/new' || path.startsWith('/tank/');
  return path === to || path.startsWith(`${to}/`);
}

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const path = usePath();
  const saveResult = useSaveResult();
  const message = useToast();

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label={t('nav.home')}>
          <img src="/icons/icon-96.png" alt="" width="32" height="32" />
          <span>Veyqua</span>
        </Link>
        <nav className="nav" aria-label={t('nav.label')}>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="nav-link"
              aria-current={isActive(path, item.to) ? 'page' : undefined}
            >
              <Icon name={item.icon} />
              <span>{t(item.key)}</span>
            </Link>
          ))}
        </nav>
      </header>
      {saveResult !== 'ok' && (
        <div className="banner banner-bad" role="alert">
          <Icon name="alert" />
          <p>{t(saveResult === 'quota' ? 'storage.quota' : 'storage.unavailable')}</p>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="footer">
        <p>
          {t('footer.local')} ·{' '}
          <a href="https://itaanhuys.com" target="_blank" rel="noopener">
            IT aan Huys
          </a>
        </p>
      </footer>
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast" key={message.id}>
            <Icon name="check" />
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
