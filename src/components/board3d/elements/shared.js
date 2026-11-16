/*
 * Shared pieces of the 3D board's elements: the beam colors and height, pair looks, the palette, materials,
 * stickers drawn from the flat board's own SVG paths, and the soft glow sprite.
 */
import * as THREE from 'three';

export const BEAM_HEX = { sun: '#ffc61a', coral: '#ff5a4e', lime: '#7ccf3c', sky: '#45b4ea' };

export const BEAM_HEIGHT = 0.28;

/** Portal, twin-mirror, gate and switch pairs: their own color and symbol, as on the flat board. */
export const PAIR_LOOKS = {
  a: { color: '#F0C14E', ink: '#8a6410', symbol: 'M0-7l2 5 5 .5-4 3.5 1.3 5L0 8.3-4.3 11l1.3-5-4-3.5 5-.5z' },
  b: { color: '#F2A67E', ink: '#9c4f2c', symbol: 'M0 7C-8 2-8-5-4-6-2-6.5 0-5 0-3c0-2 2-3.5 4-3 4 1 4 8-4 13z' },
};

export const pairLook = (pair) => PAIR_LOOKS[pair] ?? PAIR_LOOKS.a;

export const COLORS = {
  lamp: '#ef9c5a',
  lampDeep: '#d9773f',
  lampCap: '#f6c08a',
  stone: '#cdb9a0',
  wall: '#b98d68',
  wallDeep: '#9c7350',
  shade: '#4a3a32',
  cream: '#fffaf2',
  gemDark: '#8c8378',
};

export const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

export const mat = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...options });

export function addShadowed(group, mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/** A round sticker (a pair's symbol, or a color's shape) drawn with the flat board's own SVG paths. */
const stickerCache = new Map();

export function sticker({ background, ring, path, ink, scale = 4.6, offsetY = -1 }) {
  const key = [background, ring, path, ink, scale].join('|');
  if (!stickerCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    draw.beginPath();
    draw.arc(64, 64, 60, 0, Math.PI * 2);
    draw.fillStyle = background;
    draw.fill();
    if (ring) {
      draw.lineWidth = 10;
      draw.strokeStyle = ring;
      draw.stroke();
    }
    draw.translate(64, 64 + offsetY);
    draw.scale(scale, scale);
    draw.fillStyle = ink;
    draw.fill(new Path2D(path));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    stickerCache.set(key, texture);
  }
  return stickerCache.get(key);
}

/** A flat round sticker lying on top of a piece at height y. */
export function addSticker(group, texture, radius, y) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, transparent: true }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = y;
  group.add(disc);
  return disc;
}

/**
 * A soft round glow (light without a full-screen bloom pass, so it stays cheap on phones): a sprite with a
 * radial fade, added on top of what's behind it.
 */
let glowTexture = null;

export function glowSprite(color, size, opacity = 1) {
  if (!glowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const gradient = draw.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    draw.fillStyle = gradient;
    draw.fillRect(0, 0, 128, 128);
    glowTexture = new THREE.CanvasTexture(canvas);
  }
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  sprite.scale.setScalar(size);
  return sprite;
}

export const darkenedColor = new THREE.Color(COLORS.gemDark);
