import { MODES } from '../game/rules.js';

/**
 * How to play, for newcomers: how to shoot, the three games, whose turn it is, the two calls and the shooters.
 * Opens by itself on a first visit, and from the "?" at the top.
 */
export default function HowTo({ onClose }) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="howto-title" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="howto">
        <h2 id="howto-title">How to play</h2>

        <section>
          <div className="pull" aria-hidden="true">
            <span className="m m1 tiny" />
            <i />
            <b>☝</b>
          </div>
          <div>
            <h3>Shoot</h3>
            <p>Put a finger anywhere on the yard, pull back and let go. Your shooter flies the other way. A longer pull is a harder shot.</p>
          </div>
        </section>

        <h3 className="part">The three games</h3>
        {Object.entries(MODES).map(([id, mode]) => (
          <section key={id}>
            <span className={`mode-${id}`} aria-hidden="true">
              <span className="mode-art" />
            </span>
            <div>
              <h3>
                {mode.name}
              </h3>
              <p>{RULES[id]}</p>
            </div>
          </section>
        ))}

        <section>
          <span className="badge" aria-hidden="true">
            ↻
          </span>
          <div>
            <h3>Whose turn</h3>
            <p>Win a marble and you shoot again. Miss and the turn passes. Your shooter stays where it stopped, and you shoot from there.</p>
          </div>
        </section>

        <h3 className="part">The calls (once a game each)</h3>
        <section>
          <span className="badge" aria-hidden="true">
            🧹
          </span>
          <div>
            <h3>Sweep!</h3>
            <p>Sweeps every pebble off the yard.</p>
          </div>
        </section>
        <section>
          <span className="badge" aria-hidden="true">
            ⤴
          </span>
          <div>
            <h3>High shot!</h3>
            <p>A high shot: tap it, then shoot. The shooter flies over pebbles and marbles and lands farther on.</p>
          </div>
        </section>

        <h3 className="part">Good to know</h3>
        <ul>
          <li>A slow marble drops into the Mor. A fast one skips over it.</li>
          <li>Sand slows marbles down. Pebbles and the kerb bounce them back.</li>
          <li>The Steelie is heavy and plows through. The Jumbo is big and easy to hit with.</li>
          <li>New here? Start with the Challenges: they teach one thing at a time.</li>
        </ul>

        <button className="btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

const RULES = {
  ring: `Knock marbles out of the chalk ring. Each one that leaves it is yours. First to ${MODES.ring.toWin} wins.`,
  hole: `The Mor is the little hole in the middle of the yard. Push marbles into it. If your own shooter falls in, your turn ends and you give one marble back. First to ${MODES.hole.toWin} wins.`,
  chase: `Hit the other player's shooter with yours to win one of their marbles. First to ${MODES.chase.toWin} wins.`,
};
