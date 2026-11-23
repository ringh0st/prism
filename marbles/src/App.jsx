/* global __APP_VERSION__ */
import { useEffect, useRef, useState } from 'react';
import Yard from './components/Yard.jsx';
import { MODES, newGame } from './game/rules.js';
import { LEVELS } from './game/ai.js';
import { CHALLENGES, newChallenge, starsFor } from './game/challenges.js';
import { sfx } from './game/audio.js';
import { store } from './storage.js';

const SHOOTERS = [
  { id: 'shooter', name: 'Glass', blurb: 'Balanced' },
  { id: 'steelie', name: 'Steelie', blurb: 'Heavy: plows through' },
  { id: 'jumbo', name: 'Jumbo', blurb: 'Big: easy to hit with' },
];
const RIVALS = [
  { id: 'easy', name: 'Computer · Easy' },
  { id: 'normal', name: 'Computer · Normal' },
  { id: 'hard', name: 'Computer · Hard' },
  { id: 'two', name: '2 players · one phone' },
];
const SPLASH_MS = 2200;

const Icon = {
  home: <path d="M4 11.5 12 4l8 7.5M6.5 10v9h11v-9M10 19v-5h4v5" />,
  sound: <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />,
  mute: <path d="M11 5 6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6" />,
  again: <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" />,
};
const Glyph = ({ name }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {Icon[name]}
  </svg>
);
const Stars = ({ count }) => (
  <span className="stars" aria-label={`${count} of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <i key={n} className={n <= count ? 'on' : ''}>
        ★
      </i>
    ))}
  </span>
);

export default function App() {
  const [phase, setPhase] = useState('splash'); // splash | home | play
  const [mode, setMode] = useState(() => store.get('marbles.mode', 'ring'));
  const [rival, setRival] = useState(() => store.get('marbles.rival', 'easy'));
  const [shooter, setShooter] = useState(() => store.get('marbles.shooter', 'shooter'));
  const [soundOn, setSoundOn] = useState(() => store.get('marbles.sound', true));
  const [stars, setStars] = useState(() => store.get('marbles.stars', {}));
  // The match being played: { game, rival, challenge } and a counter that goes up after every shot.
  const [match, setMatch] = useState(null);
  const [, setShot] = useState(0);
  const [note, setNote] = useState(null);
  const noteTimer = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setPhase((p) => (p === 'splash' ? 'home' : p)), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    sfx.setOn(soundOn);
    store.set('marbles.sound', soundOn);
  }, [soundOn]);

  const say = (text) => {
    clearTimeout(noteTimer.current);
    setNote({ text, id: performance.now() });
    noteTimer.current = setTimeout(() => setNote(null), 1900);
  };

  const startGame = () => {
    sfx.unlock();
    sfx.click();
    store.set('marbles.mode', mode);
    store.set('marbles.rival', rival);
    store.set('marbles.shooter', shooter);
    const game = newGame(mode, { seed: Math.floor(Math.random() * 1e9), shooters: { you: shooter, foe: 'shooter' } });
    setMatch({ game, rival, challenge: null });
    setNote(null);
    setPhase('play');
  };
  const startChallenge = (challenge) => {
    sfx.unlock();
    sfx.click();
    setMatch({ game: newChallenge(challenge, shooter), rival: null, challenge });
    setNote(null);
    setPhase('play');
  };
  const goHome = () => {
    sfx.click();
    setMatch(null);
    setPhase('home');
  };

  const names = match?.rival === 'two' ? { you: 'Player 1', foe: 'Player 2' } : { you: 'You', foe: 'Computer' };
  const onShot = (result) => {
    setShot((n) => n + 1);
    const { game, challenge } = match;
    if (!result) return say('Bakol! The pebbles are swept off.');
    if (game.winner) {
      if (challenge && game.winner === 'you') {
        const earned = starsFor(challenge, game.shots);
        const next = { ...stars, [challenge.id]: Math.max(stars[challenge.id] ?? 0, earned) };
        setStars(next);
        store.set('marbles.stars', next);
      }
      return;
    }
    const who = names[game.last.side];
    if (result.foul) say(`${who}: into the mor! One marble back.`);
    else if (result.won > 1) say(`${who}: ${result.won} marbles! Shoot again.`);
    else if (result.won === 1) say(challenge ? 'Got one!' : `${who}: got one! Shoot again.`);
    else say(challenge ? 'Missed.' : `Missed. ${names[game.turn]}${game.turn === 'you' && match.rival !== 'two' ? 'r' : '’s'} turn.`);
  };

  if (phase === 'splash') {
    return (
      <div className="splash" onClick={() => setPhase('home')} role="dialog" aria-label="Marbles, a Rinny's Games production. Tap to skip.">
        <div className="splash-marbles" aria-hidden="true">
          <span className="m m1" />
          <span className="m m2" />
          <span className="m m3" />
        </div>
        <h1>Marbles</h1>
        <p className="hebrew" lang="he" dir="rtl">
          גולות
        </p>
        <footer>
          <p>
            A <b>Rinny’s Games</b> production
          </p>
          <small>Version {__APP_VERSION__} · © 2026 Rinny’s Games</small>
        </footer>
      </div>
    );
  }

  const top = (
    <header className="topbar">
      <div className="brand">
        <span className="m m1 tiny" aria-hidden="true" />
        Marbles
      </div>
      <div className="actions">
        {phase === 'home' ? (
          <a className="icon-btn" href="../" aria-label="All games" title="All games">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="2.5" />
              <rect x="13" y="3" width="8" height="8" rx="2.5" />
              <rect x="3" y="13" width="8" height="8" rx="2.5" />
              <rect x="13" y="13" width="8" height="8" rx="2.5" />
            </svg>
          </a>
        ) : (
          <button className="icon-btn" onClick={goHome} aria-label="Home">
            <Glyph name="home" />
          </button>
        )}
        <button className="icon-btn" onClick={() => setSoundOn((on) => !on)} aria-label={soundOn ? 'Sound off' : 'Sound on'}>
          <Glyph name={soundOn ? 'sound' : 'mute'} />
        </button>
      </div>
    </header>
  );

  if (phase === 'home') {
    return (
      <div className="app">
        {top}
        <main className="home">
          <h1>Marbles</h1>
          <p className="tag">The old schoolyard game. Pull back, aim, let go.</p>

          <section className="panel" aria-labelledby="pick-game">
            <h2 id="pick-game">Pick a game</h2>
            <div className="modes">
              {Object.entries(MODES).map(([id, m]) => (
                <button key={id} className={`mode mode-${id} ${mode === id ? 'on' : ''}`} aria-pressed={mode === id} onClick={() => setMode(id)}>
                  <span className="mode-art" aria-hidden="true" />
                  <b>{m.name}</b>
                  <small>{m.blurb}</small>
                </button>
              ))}
            </div>
            <h3>Against</h3>
            <div className="chips">
              {RIVALS.map((r) => (
                <button key={r.id} className={rival === r.id ? 'on' : ''} aria-pressed={rival === r.id} onClick={() => setRival(r.id)}>
                  {r.name}
                </button>
              ))}
            </div>
            <h3>Your shooter</h3>
            <div className="chips">
              {SHOOTERS.map((s) => (
                <button key={s.id} className={shooter === s.id ? 'on' : ''} aria-pressed={shooter === s.id} onClick={() => setShooter(s.id)} title={s.blurb}>
                  {s.name} <small>{s.blurb}</small>
                </button>
              ))}
            </div>
            <button className="btn" onClick={startGame}>
              Play
              <small>
                {MODES[mode].name} · first to {MODES[mode].toWin}
              </small>
            </button>
          </section>

          <section className="panel" aria-labelledby="challenges">
            <h2 id="challenges">Challenges</h2>
            <p className="sub">Alone, with only a few shots. Three stars for the fewest.</p>
            <div className="levels">
              {CHALLENGES.map((c, i) => {
                const isOpen = i === 0 || (stars[CHALLENGES[i - 1].id] ?? 0) > 0;
                return (
                  <button key={c.id} disabled={!isOpen} onClick={() => startChallenge(c)}>
                    <b>{i + 1}</b>
                    <span>{c.name}</span>
                    {isOpen ? <Stars count={stars[c.id] ?? 0} /> : <small>Locked</small>}
                  </button>
                );
              })}
            </div>
          </section>
          <p className="foot">Version {__APP_VERSION__} · Rinny’s Games</p>
        </main>
      </div>
    );
  }

  const { game, challenge } = match;
  const isCpu = match.rival && match.rival !== 'two';
  const toWin = challenge ? challenge.need : MODES[game.mode].toWin;
  const Bag = ({ side }) => (
    <div className={`bag ${side} ${game.turn === side && !game.winner ? 'turn' : ''}`}>
      <b>{names[side]}</b>
      <span className="pips" aria-label={`${game.bag[side]} of ${toWin}`}>
        {Array.from({ length: toWin }, (_, i) => (
          <i key={i} className={i < game.bag[side] ? 'on' : ''} />
        ))}
      </span>
    </div>
  );
  const challengeIndex = challenge ? CHALLENGES.indexOf(challenge) : -1;
  const nextChallenge = challenge && game.winner === 'you' ? CHALLENGES[challengeIndex + 1] : null;
  return (
    <div className="app is-play">
      {top}
      <div className="score">
        <Bag side="you" />
        {challenge ? (
          <div className="shots">
            <b>{challenge.shots - game.shots}</b>
            <small>shots left</small>
          </div>
        ) : (
          <Bag side="foe" />
        )}
      </div>
      <div className="stage">
        <Yard key={`${challenge?.id ?? game.mode}-${match.id ?? ''}`} game={game} cpuLevel={isCpu ? match.rival : null} onChange={onShot} />
        {game.shots === 0 && !note && <p className="coach">{challenge ? challenge.tip : `${MODES[game.mode].blurb}. Pull back anywhere and let go.`}</p>}
        {note && !game.winner && (
          <p className="coach note" key={note.id} role="status">
            {note.text}
          </p>
        )}
        {game.winner && (
          <div className="result" role="alertdialog" aria-labelledby="result-title">
            <h2 id="result-title">{challenge ? (game.winner === 'you' ? 'Done!' : 'Out of shots') : `${names[game.winner]} win${game.winner === 'you' && isCpu ? '' : 's'}!`}</h2>
            {challenge && game.winner === 'you' && <Stars count={starsFor(challenge, game.shots)} />}
            {!challenge && (
              <p className="sub">
                {game.bag.you} : {game.bag.foe}
              </p>
            )}
            {nextChallenge && (
              <button className="btn" onClick={() => startChallenge(nextChallenge)}>
                Next challenge
              </button>
            )}
            <button className={nextChallenge ? 'btn ghost' : 'btn'} onClick={() => (challenge ? startChallenge(challenge) : startGame())}>
              {challenge ? 'Try again' : 'Play again'}
            </button>
            <button className="btn ghost" onClick={goHome}>
              Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
