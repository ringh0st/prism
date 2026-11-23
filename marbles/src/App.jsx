/* global __APP_VERSION__ */
import { useEffect, useMemo, useRef, useState } from 'react';
import Yard from './components/Yard.jsx';
import HowTo from './components/HowTo.jsx';
import { MODES, newGame } from './game/rules.js';
import { GROUNDS } from './game/physics.js';
import { LEVELS } from './game/ai.js';
import { CHALLENGES, newChallenge, starsFor } from './game/challenges.js';
import { sfx } from './game/audio.js';
import { store } from './storage.js';
import { TURN_SECONDS, joinLive, newCode, tidyCode } from './live.js';

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
  { id: 'live', name: 'A friend · live with a code' },
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
  const [phase, setPhase] = useState('splash'); // splash | home | live | play
  const [mode, setMode] = useState(() => store.get('marbles.mode', 'ring'));
  const [rival, setRival] = useState(() => store.get('marbles.rival', 'easy'));
  const [shooter, setShooter] = useState(() => store.get('marbles.shooter', 'shooter'));
  const [ground, setGround] = useState(() => store.get('marbles.ground', 'earth'));
  const [soundOn, setSoundOn] = useState(() => store.get('marbles.sound', true));
  const [stars, setStars] = useState(() => store.get('marbles.stars', {}));
  // The match being played: { game, rival, challenge } and a counter that goes up after every shot.
  const [match, setMatch] = useState(null);
  const [, setShot] = useState(0);
  const [note, setNote] = useState(null);
  const noteTimer = useRef(0);
  // A live game with a friend: { code, role: 'host' | 'guest', status: 'connecting' | 'waiting' | 'failed' | 'left' }.
  const [live, setLive] = useState(null);
  const [typedCode, setTypedCode] = useState('');
  const linkRef = useRef(null);
  const liveRef = useRef(null);
  liveRef.current = live;
  const listeners = useRef(new Set());
  const setupRef = useRef({});
  setupRef.current = { mode, ground, shooter };
  // How to play: by itself on a first visit, and from the "?" at the top.
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const closeHelp = () => {
    sfx.click();
    store.set('marbles.sawHelp', true);
    setIsHelpOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setPhase((p) => (p === 'splash' ? 'home' : p)), SPLASH_MS);
    if (!store.get('marbles.sawHelp', false)) setIsHelpOpen(true);
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

  /** The host lays out a new yard and tells the friend's phone which one. */
  const dealLive = (friendShooter) => {
    const setup = { mode: setupRef.current.mode, ground: setupRef.current.ground, seed: Math.floor(Math.random() * 1e9), shooters: { you: setupRef.current.shooter, foe: friendShooter } };
    linkRef.current?.send({ t: 'start', ...setup });
    beginLive(setup, 'you');
  };
  const beginLive = (setup, side) => {
    setMatch({ game: newGame(setup.mode, setup), rival: 'live', challenge: null, side, id: setup.seed, friendShooter: setup.shooters.foe });
    setNote(null);
    setPhase('play');
  };
  const leaveLive = () => {
    linkRef.current?.send({ t: 'bye' });
    linkRef.current?.leave();
    linkRef.current = null;
    setLive(null);
  };
  const openLive = (role, code) => {
    sfx.unlock();
    sfx.click();
    linkRef.current?.leave();
    setLive({ code, role, status: 'connecting' });
    linkRef.current = joinLive(
      code,
      (message) => {
        const now = liveRef.current;
        if (message.t === 'hello' && now?.role === 'host') dealLive(message.shooter);
        else if (message.t === 'again' && now?.role === 'host') dealLive(message.shooter);
        else if (message.t === 'start' && now?.role === 'guest') beginLive(message, 'foe');
        else if (message.t === 'bye') setLive((l) => l && { ...l, status: 'left' });
        else for (const listener of listeners.current) listener(message);
      },
      (status) => {
        if (status === 'failed') return setLive((l) => l && { ...l, status: 'failed' });
        setLive((l) => l && { ...l, status: 'waiting' });
        // The one who joins says hello; the host answers with the yard.
        if (role === 'guest') linkRef.current?.send({ t: 'hello', shooter: setupRef.current.shooter });
      },
    );
  };
  useEffect(() => () => linkRef.current?.leave(), []);

  const startGame = () => {
    if (rival === 'live') {
      sfx.unlock();
      sfx.click();
      store.set('marbles.rival', rival);
      setTypedCode('');
      return setPhase('live');
    }
    sfx.unlock();
    sfx.click();
    store.set('marbles.mode', mode);
    store.set('marbles.rival', rival);
    store.set('marbles.shooter', shooter);
    store.set('marbles.ground', ground);
    const game = newGame(mode, { seed: Math.floor(Math.random() * 1e9), shooters: { you: shooter, foe: 'shooter' }, ground });
    setMatch({ game, rival, challenge: null, id: Date.now() });
    setNote(null);
    setPhase('play');
  };
  const startChallenge = (challenge) => {
    sfx.unlock();
    sfx.click();
    setMatch({ game: newChallenge(challenge, shooter), rival: null, challenge, id: Date.now() });
    setNote(null);
    setPhase('play');
  };
  const goHome = () => {
    sfx.click();
    if (liveRef.current) leaveLive();
    setMatch(null);
    setPhase('home');
  };

  const mySide = match?.side ?? 'you';
  const names =
    match?.rival === 'two' ? { you: 'Player 1', foe: 'Player 2' } : match?.rival === 'live' ? { [mySide]: 'You', [mySide === 'you' ? 'foe' : 'you']: 'Friend' } : { you: 'You', foe: 'Computer' };
  const turnLine = (side) => (names[side] === 'You' ? 'Your turn.' : `${names[side]}’s turn.`);
  // The yard's line to the friend's phone, the same one for the whole game.
  const net = useMemo(
    () =>
      match?.rival === 'live'
        ? {
            side: match.side,
            send: (message) => linkRef.current?.send(message),
            listen: (handler) => {
              listeners.current.add(handler);
              return () => listeners.current.delete(handler);
            },
          }
        : null,
    [match?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const playAgain = () => {
    if (match.rival !== 'live') return match.challenge ? startChallenge(match.challenge) : startGame();
    sfx.click();
    if (live.role === 'host') dealLive(match.friendShooter);
    else linkRef.current?.send({ t: 'again', shooter });
    return undefined;
  };
  const onShot = (result) => {
    setShot((n) => n + 1);
    const { game, challenge } = match;
    if (!result) return say('Sweep! The pebbles are cleared off.');
    if (result.synced) return;
    if (result.passed) return say(`Time’s up! ${turnLine(match.game.turn)}`);
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
    if (result.knocked) say(`${who} knocked the other shooter out of the ring!`);
    else if (result.foul) say(`${who}: into the Mor! One marble back.`);
    else if (result.won > 1) say(`${who}: ${result.won} marbles! Shoot again.`);
    else if (result.won === 1) say(challenge ? 'Got one!' : `${who}: got one! Shoot again.`);
    else say(challenge ? 'Missed.' : `Missed. ${turnLine(game.turn)}`);
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
        <p className="splash-tag">The old schoolyard game</p>
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
        <button className="icon-btn" onClick={() => setIsHelpOpen(true)} aria-label="How to play">
          <b className="q">?</b>
        </button>
        <button className="icon-btn" onClick={() => setSoundOn((on) => !on)} aria-label={soundOn ? 'Sound off' : 'Sound on'}>
          <Glyph name={soundOn ? 'sound' : 'mute'} />
        </button>
      </div>
    </header>
  );

  if (phase === 'live') {
    const code = tidyCode(typedCode);
    return (
      <div className="app">
        {top}
        <main className="home">
          <section className="panel live" aria-labelledby="live-title">
            <h2 id="live-title">Play a friend, live</h2>
            <p className="sub">
              One yard, two phones. You take turns, with {TURN_SECONDS} seconds for each shot. {MODES[mode].name} on {GROUNDS[ground].name.toLowerCase()}: the one who starts the game picks.
            </p>
            {live?.role === 'host' ? (
              <>
                <p className="code" aria-label={`Your code is ${live.code.split('').join(' ')}`}>
                  {live.code}
                </p>
                <p className="sub" role="status">
                  {live.status === 'failed' ? 'Couldn’t connect. Check your internet and try again.' : live.status === 'connecting' ? 'Connecting…' : 'Tell your friend this code. Waiting for them…'}
                </p>
              </>
            ) : (
              <>
                <button className="btn" onClick={() => openLive('host', newCode())}>
                  Start a game
                  <small>and get a code to share</small>
                </button>
                <form
                  className="join"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (code) openLive('guest', code);
                  }}
                >
                  <input value={typedCode} onChange={(event) => setTypedCode(event.target.value)} inputMode="numeric" maxLength={6} placeholder="Have a code? 12345" aria-label="Your friend’s code" />
                  <button className="btn" disabled={!code}>
                    Join
                  </button>
                </form>
                {live?.role === 'guest' && (
                  <p className="sub" role="status">
                    {live.status === 'failed' ? 'Couldn’t connect. Check the code and your internet.' : 'Looking for your friend’s game…'}
                  </p>
                )}
              </>
            )}
            <button className="btn ghost" onClick={goHome}>
              Back
            </button>
          </section>
        </main>
        {isHelpOpen && <HowTo onClose={closeHelp} />}
      </div>
    );
  }

  if (phase === 'home') {
    return (
      <div className="app">
        {top}
        <main className="home">
          <h1>Marbles</h1>
          <p className="tag">The old schoolyard game. Pull back, aim, let go.</p>
          <button className="chip-link" onClick={() => setIsHelpOpen(true)}>
            <b className="q">?</b> How to play
          </button>

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
            <h3>Ground</h3>
            <div className="chips">
              {Object.values(GROUNDS).map((g) => (
                <button key={g.id} className={ground === g.id ? 'on' : ''} aria-pressed={ground === g.id} onClick={() => setGround(g.id)}>
                  <i className={`swatch ground-${g.id}`} aria-hidden="true" />
                  {g.name} <small>{g.blurb}</small>
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
                {MODES[mode].name} on {GROUNDS[ground].name.toLowerCase()} · first to {MODES[mode].toWin}
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
        {isHelpOpen && <HowTo onClose={closeHelp} />}
      </div>
    );
  }

  const { game, challenge } = match;
  const isCpu = match.rival && match.rival !== 'two' && match.rival !== 'live';
  const hasFriendLeft = match.rival === 'live' && live?.status === 'left';
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
        <Bag side={mySide} />
        {challenge ? (
          <div className="shots">
            <b>{challenge.shots - game.shots}</b>
            <small>shots left</small>
          </div>
        ) : (
          <Bag side={mySide === 'you' ? 'foe' : 'you'} />
        )}
      </div>
      <div className="stage">
        <Yard key={match.id} game={game} cpuLevel={isCpu ? match.rival : null} net={net} onChange={onShot} />
        {game.shots === 0 && !note && <p className="coach">{challenge ? challenge.tip : `${MODES[game.mode].blurb}. Pull back anywhere and let go.`}</p>}
        {note && !game.winner && (
          <p className="coach note" key={note.id} role="status">
            {note.text}
          </p>
        )}
        {hasFriendLeft && !game.winner && (
          <div className="result" role="alertdialog" aria-labelledby="left-title">
            <h2 id="left-title">Your friend left</h2>
            <button className="btn" onClick={goHome}>
              Home
            </button>
          </div>
        )}
        {game.winner && (
          <div className="result" role="alertdialog" aria-labelledby="result-title">
            <h2 id="result-title">{challenge ? (game.winner === 'you' ? 'Done!' : 'Out of shots') : `${names[game.winner]} win${names[game.winner] === 'You' ? '' : 's'}!`}</h2>
            {challenge && game.winner === 'you' && <Stars count={starsFor(challenge, game.shots)} />}
            {!challenge && (
              <p className="sub">
                {game.bag[mySide]} : {game.bag[mySide === 'you' ? 'foe' : 'you']}
              </p>
            )}
            {nextChallenge && (
              <button className="btn" onClick={() => startChallenge(nextChallenge)}>
                Next challenge
              </button>
            )}
            {!hasFriendLeft && (
              <button className={nextChallenge ? 'btn ghost' : 'btn'} onClick={playAgain}>
                {challenge ? 'Try again' : 'Play again'}
              </button>
            )}
            <button className="btn ghost" onClick={goHome}>
              Home
            </button>
          </div>
        )}
      </div>
      {isHelpOpen && <HowTo onClose={closeHelp} />}
    </div>
  );
}
