import { useEffect, useLayoutEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { detectLang, I18nProvider } from './i18n';
import { matchRoute, usePath } from './router';
import { useAppData } from './store';
import { Dashboard } from './views/Dashboard';
import { Guide } from './views/Guide';
import { NotFound } from './views/NotFound';
import { Settings } from './views/Settings';
import { TankForm } from './views/TankForm';
import { TankView } from './views/TankView';

function Page({ path }: { path: string }) {
  const route = matchRoute(path);
  switch (route.name) {
    case 'home':
      return <Dashboard />;
    case 'new':
      return <TankForm />;
    case 'tank':
      return <TankView key={route.id} id={route.id} tab={route.tab} />;
    case 'edit':
      return <TankForm key={route.id} id={route.id} />;
    case 'settings':
      return <Settings />;
    case 'guide':
      return <Guide />;
    case 'not-found':
      return <NotFound />;
  }
}

export function App() {
  const { settings } = useAppData();
  const lang = settings.lang ?? detectLang();
  const path = usePath();
  const firstPath = useRef(path);

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useLayoutEffect(() => {
    if (settings.theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // After navigating, start keyboard and screen reader users at the top of the new page.
  useEffect(() => {
    if (path !== firstPath.current) document.getElementById('main')?.focus({ preventScroll: true });
    firstPath.current = '';
  }, [path]);

  return (
    <I18nProvider lang={lang}>
      <Layout>
        <Page path={path} />
      </Layout>
    </I18nProvider>
  );
}
