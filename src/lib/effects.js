import confetti from 'canvas-confetti';

/*
 * Particle moments (canvas-confetti), all in the Calm Meadow palette. Every effect is skipped for
 * players who ask for reduced motion, and never draws on top of the page's controls for long.
 */
const PALETTE = ['#F0C14E', '#F2A67E', '#58AC82', '#4FBFAD', '#FFF6E0'];
const STAR = confetti.shapeFromPath({ path: 'M12 0l3 8.5 9 .5-7 5.5 2.5 9-7.5-5-7.5 5L7 14.5 0 9l9-.5z' });

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const fire = (options) => {
  if (prefersReducedMotion()) return;
  confetti({ disableForReducedMotion: true, zIndex: 60, colors: PALETTE, ...options });
};

/** Where an element's center is, as confetti's 0–1 screen origin. */
function originOf(element) {
  const rect = element.getBoundingClientRect();
  return { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight };
}

/** A burst of light where a gem just lit up, in that gem's light color, with a ring of light around it. */
export function gemBurst(element, color) {
  if (!element) return;
  fire({
    origin: originOf(element),
    particleCount: 34,
    spread: 360,
    startVelocity: 22,
    gravity: 0.5,
    decay: 0.88,
    scalar: 0.95,
    ticks: 80,
    shapes: [STAR, 'circle'],
    colors: color ? [color, '#FFF6E0', '#F0C14E'] : PALETTE,
  });
  lightRing(element, color);
}

const centerOf = (element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: Math.max(rect.width, rect.height) };
};

/** A glowing ring that swells out from a lit gem. */
function lightRing(element, color = '#F0C14E') {
  if (prefersReducedMotion()) return;
  const { x, y, size } = centerOf(element);
  const ring = document.createElement('span');
  Object.assign(ring.style, {
    position: 'fixed',
    left: `${x - size / 2}px`,
    top: `${y - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    border: `4px solid ${color}`,
    boxShadow: `0 0 18px ${color}`,
    pointerEvents: 'none',
    zIndex: 59,
  });
  document.body.append(ring);
  ring.animate(
    [
      { transform: 'scale(0.4)', opacity: 1 },
      { transform: 'scale(2.4)', opacity: 0 },
    ],
    { duration: 520, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  ).onfinish = () => ring.remove();
}

/**
 * A spark flies in an arc from a lit gem to its spot in the gem counter, which bounces when it lands,
 * so every gem visibly "counts" (also used the other way: a spare move flying out onto the board).
 * `onLand` runs when it arrives. Without motion, the target just bounces.
 */
export function flyToCounter(fromElement, toElement, color = '#F0C14E', onLand = null) {
  if (!fromElement || !toElement) return;
  const bump = () =>
    toElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], {
      duration: 380,
      easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
    });
  if (prefersReducedMotion()) {
    bump();
    onLand?.();
    return;
  }
  const from = centerOf(fromElement);
  const to = centerOf(toElement);
  const spark = document.createElement('span');
  Object.assign(spark.style, {
    position: 'fixed',
    left: `${from.x - 9}px`,
    top: `${from.y - 9}px`,
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: `radial-gradient(circle, #FFF6E0 0 30%, ${color} 60%, transparent 72%)`,
    boxShadow: `0 0 14px 4px ${color}`,
    pointerEvents: 'none',
    zIndex: 61,
  });
  document.body.append(spark);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  spark.animate(
    [
      { transform: 'translate(0, 0) scale(1.4)' },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 70}px) scale(1.1)`, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.6)` },
    ],
    { duration: 620, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
  ).onfinish = () => {
    spark.remove();
    bump();
    onLand?.();
  };
}

/**
 * A solved level: a burst from the board, plus side cannons for 3 stars and an extra star shower for
 * big moments (boss levels, finished worlds, a Pal growing).
 */
export function celebrate({ stars = 3, isBig = false, from = null } = {}) {
  const origin = from ? originOf(from) : { x: 0.5, y: 0.45 };
  fire({ origin, particleCount: 50 + stars * 25, spread: 80 + stars * 15, startVelocity: 38, scalar: 1, shapes: [STAR, 'square', 'circle'] });
  if (stars >= 3 || isBig) {
    setTimeout(() => {
      fire({ origin: { x: 0, y: 0.7 }, angle: 60, spread: 55, particleCount: 60, startVelocity: 55 });
      fire({ origin: { x: 1, y: 0.7 }, angle: 120, spread: 55, particleCount: 60, startVelocity: 55 });
    }, 220);
  }
  if (isBig) {
    setTimeout(
      () =>
        fire({ origin: { x: 0.5, y: 0 }, angle: 270, spread: 140, particleCount: 80, startVelocity: 20, gravity: 0.7, shapes: [STAR], scalar: 1.2 }),
      520,
    );
  }
}

/** A soft shower of stars for rewards (chests, gifts, prizes, new Pals). */
export function rewardShower(from = null) {
  fire({
    origin: from ? originOf(from) : { x: 0.5, y: 0.35 },
    particleCount: 70,
    spread: 100,
    startVelocity: 30,
    shapes: [STAR, 'circle'],
    scalar: 1.1,
  });
}
