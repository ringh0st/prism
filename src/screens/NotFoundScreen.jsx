import Button from '../components/Button.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

export default function NotFoundScreen() {
  const { t } = useI18n();
  return (
    <main style={{ display: 'grid', placeItems: 'center', gap: 16, minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
      <h1>{t('ui.notFound.title')}</h1>
      <p>{t('ui.notFound.text')}</p>
      <Button as="a" href="#/">
        {t('ui.notFound.back')}
      </Button>
    </main>
  );
}
