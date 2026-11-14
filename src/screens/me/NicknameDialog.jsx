import { useId, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { stageOf } from '../../game/pals.js';
import { NICKNAME_MAX, nicknameProblem, randomNickname } from '../../game/nicknames.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { errorText } from '../../i18n/meText.js';
import styles from './NicknameDialog.module.css';

/** Type your Top-board nickname, or roll a random one. Checked here and again on the server. */
export default function NicknameDialog({ current, onSaved, onClose }) {
  const { progress, setNickname: saveNickname } = usePlayer();
  const { t, lang } = useI18n();
  const inputId = useId();
  const hintId = useId();
  const [nickname, setNickname] = useState(current ?? randomNickname());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const problem = nicknameProblem(nickname, lang);

  const roll = () => {
    sfx.tap();
    setError('');
    setNickname(randomNickname());
  };

  const save = async (event) => {
    event.preventDefault();
    if (problem) return;
    setIsSaving(true);
    setError('');
    try {
      await saveNickname(nickname);
      sfx.sparkle();
      onSaved();
    } catch (saveError) {
      setError(errorText(t, saveError.message));
      setIsSaving(false);
    }
  };

  return (
    <Dialog title={t('me.nickname.title')} onClose={onClose}>
      <form onSubmit={save}>
        <div className={styles.preview}>
          {progress.pal.id && (
            <PalArt palId={progress.pal.id} stage={stageOf(progress.pal.owned[progress.pal.id])} wearing={progress.pal.wearing} size={56} />
          )}
          <span className="game-title">{nickname.trim() || '…'}</span>
        </div>
        <label htmlFor={inputId} className={styles.label}>
          {t('me.nickname.type')}
        </label>
        <div className={styles.field}>
          <input
            id={inputId}
            className={styles.input}
            value={nickname}
            maxLength={NICKNAME_MAX + 4}
            autoComplete="off"
            spellCheck="false"
            aria-describedby={hintId}
            aria-invalid={Boolean(problem)}
            onChange={(event) => {
              setError('');
              setNickname(event.target.value);
            }}
            data-autofocus
          />
          <button type="button" className={styles.dice} onClick={roll} aria-label={t('me.nickname.random')}>
            🎲
          </button>
        </div>
        <p id={hintId} className={problem || error ? styles.problem : styles.note} role="status">
          {error || problem || t('me.nickname.note')}
        </p>
        <Button size="lg" type="submit" disabled={Boolean(problem) || isSaving}>
          {t(isSaving ? 'me.nickname.saving' : 'me.nickname.save')}
        </Button>
      </form>
    </Dialog>
  );
}
