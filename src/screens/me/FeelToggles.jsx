import HelpTip from '../../components/game/HelpTip.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './FeelToggles.module.css';

/** Line art for each switch (24×24, drawn like the game's icons). */
const ART = {
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  haptics: (
    <>
      <rect x="7.5" y="3" width="9" height="18" rx="2.2" />
      <path d="M3.5 8v8M20.5 8v8" />
    </>
  ),
  board3d: (
    <>
      <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </>
  ),
  calmBoard: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" />
      <path d="M5 19 13 11" />
    </>
  ),
};

/**
 * Sound and feel as big picture switches (sound, music, vibration, a calm board, the 3D board): lit when on,
 * crossed out when off. What each does is behind the "?".
 */
export default function FeelToggles({ className = '' }) {
  const { settings, updateSettings } = usePlayer();
  const { t } = useI18n();
  const switches = [
    { id: 'sound', label: t('settings.sound'), isOn: settings.sound },
    { id: 'music', label: t('settings.music'), isOn: settings.music && settings.sound, isDisabled: !settings.sound },
    { id: 'haptics', label: t('settings.vibration'), isOn: settings.haptics },
    { id: 'calmBoard', label: t('settings.calm'), isOn: settings.calmBoard },
    { id: 'board3d', label: t('settings.board3d'), isOn: settings.board3d !== false },
  ];
  const flip = (id, isOn) => {
    updateSettings({ [id]: isOn });
    if (isOn) sfx.tap();
  };
  return (
    <section className={className} aria-labelledby="feel-title">
      <div className={styles.head}>
        <h2 id="feel-title">{t('settings.feel')}</h2>
        <HelpTip title={t('settings.feel')}>
          <ul>
            <li>{t(settings.sound ? 'settings.musicHint' : 'settings.musicNeedsSound')}</li>
            <li>{t('settings.vibrationHint')}</li>
            <li>{t('settings.calmHint')}</li>
            <li>{t('settings.board3dHint')}</li>
          </ul>
        </HelpTip>
      </div>
      <div className={styles.switches}>
        {switches.map((item) => (
          <button
            key={item.id}
            type="button"
            role="switch"
            aria-checked={item.isOn}
            disabled={item.isDisabled}
            className={`${styles.switch} ${item.isOn ? styles.on : ''}`}
            onClick={() => flip(item.id, !item.isOn)}
          >
            <span className={styles.art} aria-hidden="true">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ART[item.id]}
              </svg>
              <span className={styles.mark} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
