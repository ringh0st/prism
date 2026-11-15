import { Children, cloneElement, isValidElement } from 'react';

/*
 * Soft 3D for the Pals without redrawing them: every flat-colored shape gets its own round light (a radial gradient
 * sized to that shape), lighter toward the top left and a little darker at the far edge, so each ear, cheek, belly
 * and paw reads as a soft clay ball. White highlights and see-through shapes stay as drawn.
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const SHADED = new Set(['circle', 'ellipse', 'path', 'rect', 'polygon', 'g']);
const LIGHT = [255, 255, 255];
const SHADE = [59, 26, 8];

const toRgb = (hex) => {
  const full = hex.length === 4 ? `#${hex.slice(1).replace(/./g, (c) => c + c)}` : hex;
  return [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const mix = (a, b, amount) => `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * amount)).join(' ')})`;
const isWhite = (hex) => toRgb(hex).every((value) => value > 245);
const keyOf = (hex) => hex.slice(1).toLowerCase();

/**
 * The Pal's drawing with clay light on every shape. `uid` keeps gradient ids unique per picture.
 * @returns { content, colors } where colors are the hex colors that need a gradient (see ClayGradients)
 */
export function withClayShading(node, uid) {
  const colors = new Set();
  const walk = (element) => {
    if (Array.isArray(element)) return element.map(walk);
    if (!isValidElement(element)) return element;
    // The drawing's own little parts (Face, Ears, Accessory…) are pure functions: draw them out to shade them too.
    if (typeof element.type === 'function') return walk(element.type(element.props));
    const { fill, opacity, children } = element.props;
    const props = {};
    if (SHADED.has(element.type) && typeof fill === 'string' && HEX.test(fill) && opacity === undefined && !isWhite(fill)) {
      colors.add(fill);
      props.fill = `url(#${uid}-c${keyOf(fill)})`;
    }
    if (children !== undefined) props.children = Children.map(children, walk);
    return Object.keys(props).length ? cloneElement(element, props) : element;
  };
  return { content: walk(node), colors: [...colors] };
}

/** The gradients for `colors`: a light top-left, the true color across the middle, a soft shade at the far edge. */
export function ClayGradients({ uid, colors }) {
  return colors.map((hex) => {
    const rgb = toRgb(hex);
    return (
      <radialGradient key={hex} id={`${uid}-c${keyOf(hex)}`} cx=".42" cy=".34" r=".72" fx=".34" fy=".24">
        <stop offset="0" stopColor={mix(rgb, LIGHT, 0.55)} />
        <stop offset=".22" stopColor={mix(rgb, LIGHT, 0.22)} />
        <stop offset=".6" stopColor={hex} />
        <stop offset="1" stopColor={mix(rgb, SHADE, 0.38)} />
      </radialGradient>
    );
  });
}
