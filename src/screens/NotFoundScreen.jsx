import Button from '../components/Button.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

/** A level that doesn't exist, or (with `onRetry`) one that couldn't be downloaded: offline for a moment. */
export default function NotFoundScreen({ onRetry = null }) {
  const { t } = useI18n();
  return (
    <main style={{ display: 'grid', placeItems: 'center', gap: 16, minHeight: '100dvh', padding: 24, textAlign: 'center' }}>
      <h1>{t(onRetry ? 'ui.offline.title' : 'ui.notFound.title')}</h1>
      <p>{t(onRetry ? 'ui.offline.text' : 'ui.notFound.text')}</p>
      {onRetry && (
        <Button size="lg" onClick={onRetry} data-autofocus>
          {t('ui.offline.retry')}
        </Button>
      )}
      <Button as="a" href="#/" variant={onRetry ? 'secondary' : undefined}>
        {t('ui.notFound.back')}
      </Button>
    </main>
  );
}
