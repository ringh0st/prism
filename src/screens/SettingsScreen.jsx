import { useState } from 'react';
import ScreenHeader from '../components/game/ScreenHeader.jsx';
import BottomNav from '../components/game/BottomNav.jsx';
import Button from '../components/Button.jsx';
import Dialog from '../components/Dialog.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { BEAM_THEMES, totalStars } from '../game/progress.js';
import { APPLE_SIGN_IN_ENABLED, PRIVACY_URL, HOME_PAGE_URL, TERMS_URL } from '../lib/config.js';
import PlayerCard from './me/PlayerCard.jsx';
import styles from './SettingsScreen.module.css';
import { APP_VERSION, COPYRIGHT_YEAR, STORE_NAME, STUDIO_NAME } from '../lib/appInfo.js';

const SYNC_LABELS = {
  local: 'Progress is saved on this device.',
  syncing: 'Syncing your progress…',
  synced: 'Progress is saved to your account.',
  error: 'Could not sync right now. Progress is safe on this device and will sync later.',
};

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

function Toggle({ id, label, description, checked, onChange }) {
  return (
    <label className={styles.toggleRow} htmlFor={id}>
      <span>
        <span className={styles.rowTitle}>{label}</span>
        {description && <span className={styles.rowHint}>{description}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" className={styles.switch} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function AccountCard() {
  const { user, isAdmin, signInWithGoogle, signInWithApple, signOut, deleteAccount } = useAuth();
  const { syncStatus } = usePlayer();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [error, setError] = useState('');

  const startSignIn = async (signIn) => {
    setError('');
    const { error: signInError } = await signIn();
    if (signInError) setError('Sign-in did not work. Please try again.');
  };

  const confirmDelete = async () => {
    try {
      await deleteAccount();
      setIsConfirmingDelete(false);
    } catch {
      setError('Could not delete your account. Please try again or email us.');
    }
  };

  return (
    <section className={styles.card} aria-labelledby="account-title">
      <h2 id="account-title">Account</h2>
      {user ? (
        <>
          <p className={styles.rowHint}>{SYNC_LABELS[syncStatus]}</p>
          <div className={styles.buttonRow}>
            {isAdmin && (
              <Button as="a" href="#/admin" icon="edit">
                Level editor
              </Button>
            )}
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
            <Button variant="ghost" onClick={() => setIsConfirmingDelete(true)}>
              Delete account
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.rowHint}>You’re playing as a guest. Sign in to keep your stars, sparks and streak on all your devices.</p>
          <div className={styles.signInButtons}>
            {APPLE_SIGN_IN_ENABLED && (
              <button type="button" className={styles.appleButton} onClick={() => startSignIn(signInWithApple)}>
                <AppleLogo />
                <span>Sign in with Apple</span>
              </button>
            )}
            <button type="button" className={styles.googleButton} onClick={() => startSignIn(signInWithGoogle)}>
              <GoogleLogo />
              <span>Sign in with Google</span>
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
        <Dialog title="Delete account?" onClose={() => setIsConfirmingDelete(false)}>
          <p className={styles.dialogText}>
            This permanently deletes your account and all saved progress from our servers. Progress on this device stays.
          </p>
          <div className={styles.buttonRow}>
            <Button variant="secondary" onClick={() => setIsConfirmingDelete(false)} data-autofocus>
              Cancel
            </Button>
            <Button onClick={confirmDelete}>Delete forever</Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

export default function SettingsScreen() {
  const { progress, settings, updateSettings, setBeamTheme, resetLocalProgress } = usePlayer();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const stars = totalStars(progress);

  return (
    <div className={styles.page}>
      <ScreenHeader title="Me" />
      <main className={styles.main}>
        <PlayerCard />

        <AccountCard />

        <section className={styles.card} aria-labelledby="feel-title">
          <h2 id="feel-title">Sound & feel</h2>
          <Toggle id="sound" label="Sound effects" checked={settings.sound} onChange={(sound) => updateSettings({ sound })} />
          <Toggle
            id="haptics"
            label="Vibration"
            description="On supported phones"
            checked={settings.haptics}
            onChange={(haptics) => updateSettings({ haptics })}
          />
        </section>

        <section className={styles.card} aria-labelledby="beam-title">
          <h2 id="beam-title">Beam style</h2>
          <p className={styles.rowHint}>Unlock new sunlight colors by collecting stars. You have {stars} ★.</p>
          <div className={styles.themes} role="radiogroup" aria-labelledby="beam-title">
            {BEAM_THEMES.map((theme) => {
              const isUnlocked = stars >= theme.starsToUnlock;
              const isSelected = progress.beamTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={!isUnlocked}
                  className={`${styles.theme} ${isSelected ? styles.themeSelected : ''}`}
                  onClick={() => isUnlocked && setBeamTheme(theme.id)}
                >
                  <span className={styles.themeSwatch} style={{ background: theme.color, color: theme.color }}>
                    {!isUnlocked && <Icon name="lock" size={16} />}
                  </span>
                  <span className={styles.themeName}>{theme.name}</span>
                  <span className={styles.rowHint}>{isUnlocked ? (isSelected ? 'In use' : 'Unlocked') : `${theme.starsToUnlock} ★`}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.card} aria-labelledby="data-title">
          <h2 id="data-title">Data</h2>
          <Button variant="secondary" onClick={() => setIsConfirmingReset(true)}>
            Reset progress on this device
          </Button>
          <p className={styles.links}>
            <a href={HOME_PAGE_URL}>About Lumipals</a>
            <a href={PRIVACY_URL}>Privacy Policy</a>
            <a href={TERMS_URL}>Terms & refunds</a>
          </p>
          <p className={styles.about}>
            {STORE_NAME} · Version {APP_VERSION}
            <br />© {COPYRIGHT_YEAR} {STUDIO_NAME}
          </p>
        </section>
      </main>
      <BottomNav active="settings" />

      {isConfirmingReset && (
        <Dialog title="Reset progress?" onClose={() => setIsConfirmingReset(false)}>
          <p className={styles.dialogText}>
            Stars, sparks and streak on this device go back to zero. Your account progress (if signed in) is not deleted.
          </p>
          <div className={styles.buttonRow}>
            <Button variant="secondary" onClick={() => setIsConfirmingReset(false)} data-autofocus>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resetLocalProgress();
                setIsConfirmingReset(false);
              }}
            >
              Reset
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
