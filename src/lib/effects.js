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

/** A little starburst where a gem just lit up, in that gem's light color. */
export function gemBurst(element, color) {
  if (!element) return;
  fire({
    origin: originOf(element),
    particleCount: 18,
    spread: 360,
    startVelocity: 14,
    gravity: 0.6,
    decay: 0.88,
    scalar: 0.7,
    ticks: 70,
    shapes: [STAR, 'circle'],
    colors: color ? [color, '#FFF6E0'] : PALETTE,
  });
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
