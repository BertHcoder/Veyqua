import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { useI18n } from '../i18n';
import { Link } from '../router';

export function NotFound() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t('notFound.title')} · Veyqua`;
  }, [t]);

  return (
    <div className="page page-narrow empty-page">
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.body')}</p>
      <Link to="/" className="btn btn-primary">
        <Icon name="home" />
        {t('notFound.home')}
      </Link>
    </div>
  );
}
