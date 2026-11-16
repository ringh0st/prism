/*
 * Rewards flying into the wallet, like in other games after a purchase: a burst of little icons pops out
 * (diamonds or sparks), hangs a moment, then each flies in an arc into its counter at the top of the screen
 * (`[data-counter="diamond"]`), which bumps as each one lands. Reduced motion: the counter just bumps.
 */
import { sfx } from '../audio/sfx.js';

const prefersCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const ICONS = {
  diamond: { color: '#4FBFAD', path: 'M12 3 20 9.5 12 21 4 9.5z', shine: 'M12 3 8 9.5h8z' },
  spark: { color: '#F2A67E', path: 'M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z', shine: 'M12 2l1.4 6.6H10.6z' },
};

function iconElement(kind) {
  const look = ICONS[kind] ?? ICONS.diamond;
  const element = document.createElement('span');
  element.innerHTML = `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="${look.path}" fill="${look.color}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><path d="${look.shine}" fill="#fff" opacity=".55"/></svg>`;
  Object.assign(element.style, {
    position: 'fixed',
    width: '30px',
    height: '30px',
    marginLeft: '-15px',
    marginTop: '-15px',
    pointerEvents: 'none',
    zIndex: 70,
    filter: `drop-shadow(0 0 6px ${look.color})`,
  });
  return element;
}

const bump = (element) =>
  element.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
    duration: 320,
    easing: 'cubic-bezier(0.3, 1.6, 0.5, 1)',
  });

/**
 * Fly `amount` rewards of a kind from a point on screen into their counter.
 * @param from { x, y } in the viewport (defaults to the middle of the screen)
 * @returns how long it takes (ms), so a count-up can finish with it
 */
export function flyRewardsToCounter(kind, amount, from = null) {
  const target = document.querySelector(`[data-counter="${kind}"]`);
  if (!target || amount <= 0) return 0;
  if (prefersCalm()) {
    bump(target);
    sfx.coin();
    return 0;
  }
  const start = from ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.45 };
  const box = target.getBoundingClientRect();
  const end = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const count = Math.min(amount, 12);
  const pop = 420;
  const stagger = 70;
  const flight = 620;
  sfx.coin();
  for (let n = 0; n < count; n++) {
    const icon = iconElement(kind);
    icon.style.left = `${start.x}px`;
    icon.style.top = `${start.y}px`;
    document.body.append(icon);
    // Pop out in a ring, then curve up into the counter, shrinking as it lands.
    const angle = (n / count) * Math.PI * 2 + 0.3;
    const spread = 60 + (n % 3) * 18;
    const out = { x: Math.cos(angle) * spread, y: Math.sin(angle) * spread * 0.8 };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lift = -80 - (n % 4) * 20;
    const wait = pop + n * stagger;
    const total = wait + flight;
    icon.animate(
      [
        { transform: 'translate(0, 0) scale(0.2)', opacity: 0, offset: 0 },
        { transform: `translate(${out.x}px, ${out.y}px) scale(1.15)`, opacity: 1, offset: (pop * 0.6) / total },
        { transform: `translate(${out.x}px, ${out.y}px) scale(1)`, opacity: 1, offset: wait / total },
        {
          transform: `translate(${out.x + (dx - out.x) * 0.5}px, ${out.y + (dy - out.y) * 0.5 + lift}px) scale(0.9)`,
          opacity: 1,
          offset: (wait + flight * 0.5) / total,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(0.45)`, opacity: 0.9, offset: 1 },
      ],
      { duration: total, easing: 'ease-in-out', fill: 'forwards' },
    ).onfinish = () => {
      icon.remove();
      bump(target);
      sfx.countTick(n);
    };
  }
  return pop + (count - 1) * stagger + flight;
}
