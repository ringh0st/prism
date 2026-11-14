import { useState } from 'react';
import Lumi from '../components/game/Lumi.jsx';

const LINES = ['Polishing mirrors…', 'Waking up the gems…', 'Untangling beams…', 'Counting photons…', 'Fluffing the rainbows…'];

export default function LoadingScreen() {
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)]);
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }} aria-busy="true">
      <Lumi mood="excited" size={130} line={line} bubbleSide="top" />
    </main>
  );
}
