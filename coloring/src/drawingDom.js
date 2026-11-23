/**
 * Working with a page's drawing in the DOM: showing its colors, finding the part under a finger (a little
 * forgiving, so a small finger near a line or on an eye still colors the part around it) and the fill that
 * spreads out from the finger like wet paint, kept inside the part's lines.
 */
const NS = 'http://www.w3.org/2000/svg';
const UNPAINTED = '#ffffff';

const membersOf = (svg, part) => [...svg.querySelectorAll(`[data-r="${part}"]`)];
const paintColor = (el, color) => el.setAttribute(el.dataset.kind === 'stroke' ? 'stroke' : 'fill', color);

/** Shows the page's colors (white where nothing is painted yet). */
export function applyColors(svg, colors = {}) {
  for (const el of svg.querySelectorAll('[data-r]')) {
    if (el.dataset.busy) continue;
    paintColor(el, colors[el.dataset.r] ?? UNPAINTED);
  }
}

/** The part at a point on screen, or the nearest one within a fingertip; null when there is none. */
export function partAt(svg, x, y) {
  const at = (px, py) => {
    const el = document.elementFromPoint(px, py)?.closest?.('[data-r]');
    return el && svg.contains(el) ? Number(el.dataset.r) : null;
  };
  const direct = at(x, y);
  if (direct != null) return direct;
  const reach = Math.max(10, svg.getBoundingClientRect().width * 0.045);
  for (let ring = 1; ring <= 4; ring++) {
    const radius = (reach * ring) / 4;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + ring * 0.4;
      const found = at(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      if (found != null) return found;
    }
  }
  return null;
}

/** The middle of a part on screen (for keyboard painting and for the spread to start from). */
export function centerOf(svg, part) {
  const box = membersOf(svg, part).at(-1).getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

const matrixText = (m) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;

/** A mask the shape of the part (without its outline), in the coordinates of its last piece's group. */
function maskFor(svg, part) {
  const id = `${svg.dataset.page}-mask-${part}`;
  const old = svg.querySelector(`[id="${id}"]`);
  if (old) return id;
  const members = membersOf(svg, part);
  const base = members.at(-1).parentNode.getScreenCTM().inverse();
  const mask = document.createElementNS(NS, 'mask');
  mask.id = id;
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  for (const [key, value] of Object.entries({ x: -400, y: -400, width: 1000, height: 1000 })) mask.setAttribute(key, value);
  for (const el of members) {
    const group = document.createElementNS(NS, 'g');
    group.setAttribute('transform', matrixText(base.multiply(el.parentNode.getScreenCTM())));
    const copy = el.cloneNode(false);
    copy.removeAttribute('id');
    copy.removeAttribute('data-r');
    for (const name of ['tabindex', 'role', 'aria-label', 'data-busy']) copy.removeAttribute(name);
    if (el.dataset.kind === 'stroke') {
      copy.setAttribute('stroke', '#fff');
      copy.setAttribute('fill', 'none');
    } else {
      copy.setAttribute('fill', '#fff');
      if (copy.getAttribute('stroke')) copy.setAttribute('stroke', '#000');
    }
    group.append(copy);
    mask.append(group);
  }
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(NS, 'defs');
    svg.prepend(defs);
  }
  defs.append(mask);
  return id;
}

/**
 * Spreads a color through a part from a point on screen, like paint soaking into paper, then sets it.
 * Resolves when the part is colored.
 */
export function spreadColor(svg, part, color, x, y, seconds = 0.5) {
  const members = membersOf(svg, part);
  const done = () => {
    for (const el of members) {
      delete el.dataset.busy;
      paintColor(el, color);
    }
  };
  if (!members.length) return Promise.resolve();
  const anchor = members.at(-1);
  const toLocal = anchor.parentNode.getScreenCTM()?.inverse();
  if (!toLocal || seconds <= 0) {
    done();
    return Promise.resolve();
  }
  for (const el of members) el.dataset.busy = '1';
  const start = new DOMPoint(x, y).matrixTransform(toLocal);
  // As far as the farthest corner of the part, so the paint always reaches every bit of it.
  let far = 0;
  for (const el of members) {
    const box = el.getBoundingClientRect();
    for (const [cx, cy] of [
      [box.left, box.top],
      [box.right, box.top],
      [box.left, box.bottom],
      [box.right, box.bottom],
    ]) {
      const p = new DOMPoint(cx, cy).matrixTransform(toLocal);
      far = Math.max(far, Math.hypot(p.x - start.x, p.y - start.y));
    }
  }
  const blot = document.createElementNS(NS, 'circle');
  blot.setAttribute('cx', start.x);
  blot.setAttribute('cy', start.y);
  blot.setAttribute('r', 0);
  blot.setAttribute('fill', color);
  blot.setAttribute('mask', `url(#${maskFor(svg, part)})`);
  blot.setAttribute('pointer-events', 'none');
  anchor.after(blot);
  return new Promise((resolve) => {
    const began = performance.now();
    const grow = (now) => {
      const t = Math.min(1, Math.max(0, (now - began) / (seconds * 1000)));
      // Fast at first, then slowly soaking into the corners.
      blot.setAttribute('r', far * 1.05 * (1 - (1 - t) ** 3));
      if (t < 1) return requestAnimationFrame(grow);
      done();
      blot.remove();
      resolve();
      return undefined;
    };
    requestAnimationFrame(grow);
  });
}

/** Lets keyboard and screen-reader users reach every part of the page. */
export function labelParts(svg, name, count) {
  for (const el of svg.querySelectorAll('[data-r]')) {
    const part = Number(el.dataset.r);
    // Only one piece of each part takes focus.
    if (membersOf(svg, part).at(-1) !== el) continue;
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${name}, part ${part + 1} of ${count}`);
  }
}
