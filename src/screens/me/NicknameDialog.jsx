import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { NICKNAME_NAMES, NICKNAME_WORDS } from '../../game/nicknames.js';
import { setNicknameOnServer } from '../../lib/economyApi.js';
import { sfx } from '../../audio/sfx.js';
import styles from './NicknameDialog.module.css';

function WordPicker({ label, words, value, onChange }) {
  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.chips}>
        {words.map((word) => (
          <button key={word} type="button" aria-pressed={value === word} className={`${styles.chip} ${value === word ? styles.chipOn : ''}`} onClick={() => onChange(word)}>
            {word}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Build a nickname from two safe word lists; the server adds the number. */
export default function NicknameDialog({ current, onSaved, onClose }) {
  const { progress, refresh } = usePlayer();
  const [first, second] = current?.split(' ') ?? [];
  const [word, setWord] = useState(NICKNAME_WORDS.includes(first) ? first : null);
  const [name, setName] = useState(NICKNAME_NAMES.includes(second) ? second : null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setIsSaving(true);
    setError('');
    try {
      const state = await setNicknameOnServer(word, name);
      sfx.sparkle();
      refresh();
      onSaved(state.nickname);
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  };

  return (
    <Dialog title="Your nickname" onClose={onClose}>
      <div className={styles.preview}>
        {progress.pal.id && <PalArt palId={progress.pal.id} xp={progress.pal.owned[progress.pal.id]?.xp ?? 0} accessory={progress.pal.accessory} size={56} />}
        <span className="game-title">
          {word ?? '…'} {name ?? '…'} <span className={styles.number}>##</span>
        </span>
      </div>
      <p className={styles.note}>This is how everyone sees you on the Top board. Your real name stays private.</p>
      <WordPicker label="1. Pick a word" words={NICKNAME_WORDS} value={word} onChange={setWord} />
      <WordPicker label="2. Pick a name" words={NICKNAME_NAMES} value={name} onChange={setName} />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button size="lg" disabled={!word || !name || isSaving} onClick={save} data-autofocus>
        {isSaving ? 'Saving…' : 'Save nickname'}
      </Button>
    </Dialog>
  );
}
