import { useEffect, useState } from 'react';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { glowUpsAvailable, glowUpsEarned } from '../../game/pals.js';
import { readJson, writeJson } from '../../lib/storage.js';
import GlowUpDialog from './GlowUpDialog.jsx';

const SEEN_KEY = 'prism.seenGlowUps.v1';

/** Opens the Glow-up chooser once each time a world is finished (on menu screens). */
export default function GlowUpNotice() {
  const { progress } = usePlayer();
  const earned = glowUpsEarned(progress);
  const hasNew = glowUpsAvailable(progress) > 0 && earned > readJson(SEEN_KEY, 0);
  const [isOpen, setIsOpen] = useState(false);

  // Stays open after the Glow-up is spent, so the "grew!" celebration can show.
  useEffect(() => {
    if (hasNew) setIsOpen(true);
  }, [hasNew]);

  if (!isOpen) return null;
  const close = () => {
    writeJson(SEEN_KEY, earned);
    setIsOpen(false);
  };
  return <GlowUpDialog onClose={close} />;
}
