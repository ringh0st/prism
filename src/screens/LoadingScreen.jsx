import { useState } from 'react';
import Lumi from '../components/game/Lumi.jsx';
import { useI18n } from '../i18n/I18nContext.jsx';

const LINES = ['Polishing mirrors…', 'Waking up the gems…', 'Untangling beams…', 'Counting photons…', 'Fluffing the rainbows…'];

export default function LoadingScreen() {
  const { line: pickLine } = useI18n();
  const [line] = useState(() => pickLine('quips.loading', LINES));
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }} aria-busy="true">
      <Lumi mood="excited" size={130} line={line} />
    </main>
  );
}
