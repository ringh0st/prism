import { useEffect, useState } from 'react';
import Button from '../Button.jsx';
import { canRecordReplay, recordReplay } from '../../lib/replay/recordReplay.js';
import { sfx } from '../../audio/sfx.js';
import styles from './ReplayShare.module.css';

/** Share the video file with the system share sheet (TikTok, Reels, messages…), or download it. */
async function shareVideo(file) {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Lumipals', text: 'Can you solve it? Play free at lumipals.app' });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: file.name });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}

const STATUS = { shared: 'Shared! 🎉', saved: 'Saved to your downloads.', cancelled: '' };

/**
 * "Share replay" on the win screen: turns this solve into a short vertical video (the board, every tap,
 * the light finding each gem, the stars) and opens the share sheet. Hidden where browsers can't record.
 * @param replay { level, history, title, subtitle, stars, moves }
 */
export default function ReplayShare({ replay }) {
  const [video, setVideo] = useState(null);
  const [progress, setProgress] = useState(null);
  const [status, setStatus] = useState('');
  const previewUrl = useVideoUrl(video);
  if (!canRecordReplay()) return null;

  const make = async () => {
    sfx.tap();
    setStatus('');
    setProgress(0);
    try {
      const file = await recordReplay(replay.level, replay.history, { ...replay, par: replay.level.par }, setProgress);
      setVideo(file);
      sfx.sparkle();
    } catch {
      setStatus('Sorry, the video couldn’t be made on this device.');
    } finally {
      setProgress(null);
    }
  };

  const share = async () => setStatus(STATUS[await shareVideo(video)] ?? '');

  return (
    <div className={styles.replay}>
      {video ? (
        <>
          <video className={styles.preview} src={previewUrl} autoPlay loop muted playsInline aria-label="Your solve replay" />
          <Button icon="share" onClick={share}>
            Share video
          </Button>
        </>
      ) : progress !== null ? (
        <div className={styles.making} role="status">
          <span>Making your video…</span>
          <span className={styles.bar}>
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        </div>
      ) : (
        <Button variant="secondary" icon="play" onClick={make}>
          Share video
        </Button>
      )}
      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}
    </div>
  );
}

/** An object URL for the video preview, released when it changes. */
function useVideoUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) return undefined;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
