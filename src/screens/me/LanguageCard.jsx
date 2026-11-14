import { usePlayer } from '../../state/PlayerContext.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { LANGUAGES } from '../../i18n/translate.js';
import styles from './LanguageCard.module.css';

/** Choose the game's language. Each one is written in itself, so anyone can find theirs. */
export default function LanguageCard({ className = '' }) {
  const { updateSettings } = usePlayer();
  const { t, lang } = useI18n();
  return (
    <section className={`${className} ${styles.card}`} aria-labelledby="language-title">
      <h2 id="language-title">
        <span aria-hidden="true">🌐</span> {t('settings.language')}
      </h2>
      <div className={styles.options} role="radiogroup" aria-labelledby="language-title">
        {LANGUAGES.map((language) => (
          <button
            key={language.id}
            type="button"
            role="radio"
            aria-checked={language.id === lang}
            lang={language.id}
            dir={language.dir}
            className={`${styles.option} ${language.id === lang ? styles.selected : ''}`}
            onClick={() => updateSettings({ language: language.id })}
          >
            {language.name}
          </button>
        ))}
      </div>
    </section>
  );
}
