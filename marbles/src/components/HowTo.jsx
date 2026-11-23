import { MODES } from "../game/rules.js";

/**
 * How to play, for newcomers: how to shoot, the three games, whose turn it is, the two calls and the shooters.
 * Opens by itself on a first visit, and from the "?" at the top.
 */
export default function HowTo({ onClose }) {
  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="howto-title"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
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
            <p>
              Put a finger anywhere on the yard, pull back and let go. Your
              shooter flies the other way. A longer pull is a harder shot.
            </p>
          </div>
        </section>

        <h3 className="part">The three games</h3>
        {Object.entries(MODES).map(([id, mode]) => (
          <section key={id}>
            <span className={`mode-${id}`} aria-hidden="true">
              <span className="mode-art" />
            </span>
            <div>
              <h3>{mode.name}</h3>
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
            <p>
              Who starts is drawn. Win a marble and you get one bonus shot, then
              the turn passes. Both players always get the same number of turns:
              if the one who started reaches the target first, the other still
              gets a turn to answer. Level after that? You play on until one
              leads. The line under the scores always says whose turn it is, and
              a “+1” jumps up from whoever got a marble.
            </p>
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
            <p>
              A high shot: tap it, then shoot. The shooter flies over pebbles
              and marbles and lands farther on.
            </p>
          </div>
        </section>

        <h3 className="part">With a friend, live</h3>
        <section>
          <span className="badge" aria-hidden="true">
            ⏱
          </span>
          <div>
            <h3>One yard, two phones</h3>
            <p>
              Pick “A friend · live with a code” and press Play. One of you
              starts a game and tells the other the code. You take turns, with
              10 seconds for each shot: the bar at the top shows the time left.
            </p>
          </div>
        </section>

        <h3 className="part">Good to know</h3>
        <ul>
          <li>A slow marble drops into the Mor. A fast one skips over it.</li>
          <li>
            A hard flick is less accurate: the fan round your aim shows how far
            it may stray.
          </li>
          <li>
            Every ground rolls differently: sand stops marbles fast, asphalt is
            quick and bouncy, grass bends shots, and on the slope everything
            rolls back down.
          </li>
          <li>
            Pale patches are soft sand. Pebbles and the kerb bounce marbles
            back.
          </li>
          <li>
            Every yard has its own shape. A mound (the light bump) rolls marbles
            off to the side, a dip (the dark hollow) pulls them in, a puddle
            stops them dead, and gate posts leave a narrow way through.
          </li>
          <li>
            The ring isn’t always a circle: sometimes it is a triangle or a
            square. A marble is out when it crosses the chalk line.
          </li>
          <li>
            The Steelie is heavy and plows through. The Jumbo is big and easy to
            hit with.
          </li>
          <li>
            New here? Start with the Challenges: they teach one thing at a time.
          </li>
        </ul>

        <button className="btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}

const RULES = {
  ring: `Both players' marbles lie mixed in the chalk ring: yours are the warm colors (orange, yellow, red), theirs the cool ones (teal, blue, green). Knock theirs out of the ring to win them. Knock out one of your own and it goes to them. Your shooter stays where it stops and you shoot from there next time. If it stops inside the ring, the other player can knock it out for a marble. First to ${MODES.ring.toWin} wins.`,
  hole: `The Mor is the little hole in the middle of the yard. Push marbles into it. If your own shooter falls in, your turn ends and you give one marble back. First to ${MODES.hole.toWin} wins.`,
  chase: `Hit the other player's shooter with yours to win one of their marbles; the shooter that was hit goes back to its line. Careful with wild shots: if your shooter crashes into the kerb without a hit, it is out and they take a marble. First to ${MODES.chase.toWin} wins.`,
};
