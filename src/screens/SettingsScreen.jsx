import { useEffect, useState } from 'react';
import ScreenHeader from '../components/game/ScreenHeader.jsx';
import BottomNav from '../components/game/BottomNav.jsx';
import Button from '../components/Button.jsx';
import Dialog from '../components/Dialog.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { APPLE_SIGN_IN_ENABLED, PRIVACY_URL, HOME_PAGE_URL, TERMS_URL } from '../lib/config.js';
import { fetchEnabledProviders } from '../lib/authProviders.js';
import PlayerCard from './me/PlayerCard.jsx';
import styles from './SettingsScreen.module.css';
import { APP_VERSION, COPYRIGHT_YEAR, STORE_NAME, STUDIO_NAME } from '../lib/appInfo.js';
import InstallSettingsCard from '../components/install/InstallSettingsCard.jsx';
import HowToPlayCard from './me/HowToPlayCard.jsx';
import LanguageCard from './me/LanguageCard.jsx';
import FeelToggles from './me/FeelToggles.jsx';
import BeamStyles from './me/BeamStyles.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';
import { areAllLevelsOpen, setAllLevelsOpen } from '../lib/openAllLevels.js';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="18" height="20" viewBox="0 0 17 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.4c-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-3-4.4zM11.5 3c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.6 3-1.5z"
      />
    </svg>
  );
}

const SYNC_ICONS = { local: 'phone', syncing: 'restart', synced: 'check', error: 'phone' };

function AccountCard() {
  const { user, isAdmin, signInWithGoogle, signInWithApple, signOut, deleteAccount } = useAuth();
  // The owner's testing switch: every level open on this device (no fake progress).
  const [isEveryLevelOpen, setIsEveryLevelOpen] = useState(areAllLevelsOpen);
  const { syncStatus } = usePlayer();
  const { t } = useI18n();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState('');
  // Apple sign-in: always in the iPhone app, and on the web once it's switched on in Supabase.
  const [hasApple, setHasApple] = useState(APPLE_SIGN_IN_ENABLED);
  useEffect(() => {
    if (APPLE_SIGN_IN_ENABLED || user) return undefined;
    let isCurrent = true;
    fetchEnabledProviders().then((providers) => isCurrent && setHasApple(Boolean(providers.apple)));
    return () => {
      isCurrent = false;
    };
  }, [user]);

  const startSignIn = async (signIn) => {
    setError('');
    const { error: signInError } = await signIn();
    if (signInError) setError(t('me.account.signInFailed'));
  };

  const confirmDelete = async () => {
    try {
      await deleteAccount();
      setIsConfirmingDelete(false);
    } catch {
      setError(t('me.account.deleteFailed'));
    }
  };

  return (
    <section className={styles.card} aria-labelledby="account-title">
      <h2 id="account-title">{t('me.account.title')}</h2>
      {user ? (
        <>
          <p className={`${styles.sync} ${styles[syncStatus] ?? ''}`} role="status">
            <Icon name={SYNC_ICONS[syncStatus] ?? 'check'} size={18} /> {t(`me.sync.${syncStatus}`)}
          </p>
          <div className={styles.buttonRow}>
            {isAdmin && (
              <Button as="a" href="#/admin" icon="edit">
                {t('me.account.editor')}
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="secondary"
                icon={isEveryLevelOpen ? 'check' : 'lock'}
                aria-pressed={isEveryLevelOpen}
                onClick={() => {
                  setAllLevelsOpen(!isEveryLevelOpen);
                  setIsEveryLevelOpen(!isEveryLevelOpen);
                }}
              >
                {t(isEveryLevelOpen ? 'me.account.levelsOpen' : 'me.account.openLevels')}
              </Button>
            )}
            <Button variant="secondary" onClick={signOut}>
              {t('me.account.signOut')}
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingDelete(true)}>
              {t('me.account.delete')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.sync}>
            <Icon name="user" size={18} /> {t('me.account.guest')}
          </p>
          <div className={styles.signInButtons}>
            {hasApple && (
              <button type="button" className={styles.appleButton} onClick={() => startSignIn(signInWithApple)}>
                <AppleLogo />
                <span>{t('me.account.apple')}</span>
              </button>
            )}
            <button type="button" className={styles.googleButton} onClick={() => startSignIn(signInWithGoogle)}>
              <GoogleLogo />
              <span>{t('me.account.google')}</span>
            </button>
          </div>
        </>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {isConfirmingDelete && (
        <Dialog title={t('me.delete.title')} onClose={() => setIsConfirmingDelete(false)}>
          <p className={styles.dialogText}>{t('me.delete.text')}</p>
          <div className={styles.buttonRow}>
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)} data-autofocus>
              {t('ui.cancel')}
            </Button>
            <Button onClick={confirmDelete}>{t('me.delete.confirm')}</Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

export default function SettingsScreen() {
  const { resetLocalProgress } = usePlayer();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('nav.me')} />
      <main className={styles.main}>
        <PlayerCard />

        <LanguageCard className={styles.card} />

        <AccountCard />

        <HowToPlayCard className={styles.card} />

        <FeelToggles className={styles.card} />

        <BeamStyles className={styles.card} />

        <InstallSettingsCard className={styles.card} />

        <section className={styles.card} aria-labelledby="data-title">
          <h2 id="data-title">{t('me.data.title')}</h2>
          <Button variant="secondary" onClick={() => setIsConfirmingReset(true)}>
            {t('me.data.reset')}
          </Button>
          <p className={styles.links}>
            <a href={HOME_PAGE_URL}>{t('me.data.about')}</a>
            <a href={PRIVACY_URL}>{t('me.data.privacy')}</a>
            <a href={TERMS_URL}>{t('me.data.terms')}</a>
          </p>
          <p className={styles.about}>
            {STORE_NAME} · {t('me.data.version', { version: APP_VERSION })}
            <br />
            {/* Latin text: kept in its own left-to-right order on a Hebrew page */}
            <bdi dir="ltr">
              © {COPYRIGHT_YEAR} {STUDIO_NAME}
            </bdi>
          </p>
        </section>
      </main>
      <BottomNav active="settings" />

      {isConfirmingReset && (
        <Dialog title={t('me.reset.title')} onClose={() => setIsConfirmingReset(false)}>
          <p className={styles.dialogText}>{t('me.reset.text')}</p>
          <div className={styles.buttonRow}>
            <Button variant="secondary" onClick={() => setIsConfirmingReset(false)} data-autofocus>
              {t('ui.cancel')}
            </Button>
            <Button
              onClick={() => {
                resetLocalProgress();
                setIsConfirmingReset(false);
              }}
            >
              {t('me.reset.confirm')}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
