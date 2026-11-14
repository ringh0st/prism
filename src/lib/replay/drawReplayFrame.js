import { DIRECTIONS, FRAGILE_TURNS, TILE } from '../../game/constants.js';
import { traceBeams } from '../../game/beam.js';
import { shapePathFor } from '../../components/GemShape.jsx';

/*
 * Draws one frame of the solve replay on a 720×1280 canvas, in the game's own style (light theme, so every
 * video looks the same): a title, the board with its beams, the move count, and an ending card.
 */
export const VIDEO_SIZE = { width: 720, height: 1280 };

const INK = '#2b2118';
const SOFT = '#6f5f52';
const BEAMS = { sun: '#ffd23f', coral: '#ff5a4e', lime: '#7ccf3c', sky: '#45b4ea' };
const PAIRS = { a: '#f0c14e', b: '#f2a67e' };
const FONT = (weight, size) => `${weight} ${size}px Fredoka, ui-rounded, system-ui, sans-serif`;
const BOARD = { x: 60, y: 300, size: 600 };

const ease = (t) => 1 - (1 - t) ** 3;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws in a 100×100 cell box (like the SVG tile art). */
function inCell(ctx, cell, x, y, draw) {
  ctx.save();
  ctx.translate(x * cell, y * cell);
  ctx.scale(cell / 100, cell / 100);
  draw();
  ctx.restore();
}

function drawMirror(ctx, tile, angle, turnsLeft) {
  if (tile.locked) {
    ctx.fillStyle = '#e4d6c3';
    roundRect(ctx, 14, 14, 72, 72, 14);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(88, 172, 130, 0.18)';
    ctx.beginPath();
    ctx.arc(50, 50, 36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.save();
  ctx.translate(50, 50);
  ctx.rotate((angle * Math.PI) / 180);
  const isSplitter = tile.type === TILE.SPLITTER;
  ctx.fillStyle = isSplitter ? '#7fd8cc' : '#5e5047';
  roundRect(ctx, -41, -8, 82, 16, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  roundRect(ctx, -34, -5, 68, 3.5, 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = tile.link ? PAIRS[tile.link] : tile.locked ? '#9c8873' : '#58ac82';
  ctx.beginPath();
  ctx.arc(50, 50, tile.link ? 10 : 6.5, 0, Math.PI * 2);
  ctx.fill();
  if (tile.fragile) {
    for (let i = 0; i < FRAGILE_TURNS; i++) {
      ctx.fillStyle = i < turnsLeft ? '#f2a67e' : 'rgba(94, 80, 71, 0.25)';
      ctx.beginPath();
      ctx.arc(38 + i * 12, 88, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGem(ctx, tile, isLit) {
  const path = new Path2D(shapePathFor(tile.color));
  ctx.save();
  ctx.translate(50, 50);
  ctx.scale(0.78, 0.78);
  ctx.translate(-50, -50);
  if (isLit) {
    ctx.shadowColor = BEAMS[tile.color];
    ctx.shadowBlur = 30;
  }
  ctx.fillStyle = isLit ? BEAMS[tile.color] : `${BEAMS[tile.color]}99`;
  ctx.fill(path);
  ctx.shadowBlur = 0;
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.stroke(path);
  ctx.restore();
}

function drawTile(ctx, tile, { angle, isLit, turnsLeft }) {
  switch (tile.type) {
    case TILE.MIRROR:
    case TILE.SPLITTER:
      drawMirror(ctx, tile, angle, turnsLeft);
      break;
    case TILE.EMITTER: {
      ctx.fillStyle = '#ec9a55';
      roundRect(ctx, 14, 14, 72, 72, 20);
      ctx.fill();
      const [dx, dy] = DIRECTIONS[tile.dir];
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(50 + dx * 40, 50 + dy * 40);
      ctx.lineTo(50 + dx * 22 - dy * 14, 50 + dy * 22 + dx * 14);
      ctx.lineTo(50 + dx * 22 + dy * 14, 50 + dy * 22 - dx * 14);
      ctx.fill();
      ctx.fillStyle = BEAMS[tile.color ?? 'sun'];
      ctx.beginPath();
      ctx.arc(50, 50, 16, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case TILE.WALL:
      ctx.fillStyle = '#b48b66';
      roundRect(ctx, 10, 10, 80, 80, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 90, 61, 0.45)';
      ctx.lineWidth = 3;
      ctx.stroke(new Path2D('M10 50 H90 M50 10 V50 M30 50 V90 M70 50 V90'));
      break;
    case TILE.GEM:
      drawGem(ctx, tile, isLit);
      break;
    case TILE.FILTER:
      ctx.strokeStyle = BEAMS[tile.color];
      ctx.lineWidth = 6;
      ctx.fillStyle = `${BEAMS[tile.color]}55`;
      ctx.beginPath();
      ctx.arc(50, 50, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case TILE.SHADE:
      ctx.fillStyle = '#3d312b';
      ctx.beginPath();
      ctx.arc(50, 50, 32, 0, Math.PI * 2);
      ctx.fill();
      break;
    case TILE.PORTAL:
      ctx.strokeStyle = PAIRS[tile.pair];
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(50, 50, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fffaf2';
      ctx.beginPath();
      ctx.arc(50, 50, 14, 0, Math.PI * 2);
      ctx.fill();
      break;
    case TILE.PRISM:
      ctx.fillStyle = '#f6e3c6';
      ctx.strokeStyle = '#d9a066';
      ctx.lineWidth = 4;
      ctx.fill(new Path2D('M50 12L86 76H14z'));
      ctx.stroke(new Path2D('M50 12L86 76H14z'));
      break;
    default:
  }
}

function drawBeams(ctx, cell, segments, glow) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const pass of [
    { width: cell * 0.28, alpha: 0.25 * glow, blur: 24 },
    { width: cell * 0.12, alpha: 1, blur: 10 },
  ]) {
    for (const { x1, y1, x2, y2, color } of segments) {
      ctx.globalAlpha = pass.alpha;
      ctx.strokeStyle = BEAMS[color] ?? BEAMS.sun;
      ctx.shadowColor = BEAMS[color] ?? BEAMS.sun;
      ctx.shadowBlur = pass.blur;
      ctx.lineWidth = pass.width;
      ctx.beginPath();
      ctx.moveTo((x1 + 0.5) * cell, (y1 + 0.5) * cell);
      ctx.lineTo((x2 + 0.5) * cell, (y2 + 0.5) * cell);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawBoard(ctx, level, state, turnsUsed) {
  const { width, height, tiles } = level;
  const cell = BOARD.size / Math.max(width, height);
  const offsetX = BOARD.x + (BOARD.size - cell * width) / 2;
  const offsetY = BOARD.y + (BOARD.size - cell * height) / 2;
  ctx.save();
  ctx.fillStyle = '#e8d3bf';
  roundRect(ctx, offsetX - 18, offsetY - 18, cell * width + 36, cell * height + 36, 36);
  ctx.fill();
  ctx.translate(offsetX, offsetY);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      ctx.fillStyle = '#fff6ec';
      roundRect(ctx, x * cell + 4, y * cell + 4, cell - 8, cell - 8, cell * 0.2);
      ctx.fill();
    }
  }
  const trace = traceBeams(level, state.orients);
  drawBeams(ctx, cell, trace.segments, state.phase === 'outro' ? 1.6 : 1);
  tiles.forEach((tile, i) => {
    const turning = state.turning.includes(i);
    const base = -45 + (state.orients[i] ?? 0) * 90;
    const angle = turning ? base + 90 * ease(state.progress) : base;
    const turnsLeft = FRAGILE_TURNS - (turnsUsed[i] ?? 0);
    inCell(ctx, cell, tile.x, tile.y, () => drawTile(ctx, tile, { angle, isLit: trace.litGems.has(i), turnsLeft }));
    if (turning) {
      // A tap ripple where the player touched.
      ctx.strokeStyle = `rgba(88, 172, 130, ${0.8 * (1 - state.progress)})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc((tile.x + 0.5) * cell, (tile.y + 0.5) * cell, cell * (0.3 + 0.4 * state.progress), 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawStar(ctx, x, y, r, isOn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
  }
  ctx.closePath();
  ctx.fillStyle = isOn ? '#f0c14e' : '#e2d5c4';
  ctx.fill();
  ctx.restore();
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  // Hebrew texts read right to left (the canvas isn't on the page, so it can't inherit the direction).
  ctx.direction = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
  ctx.fillText(text, VIDEO_SIZE.width / 2, y);
}

/**
 * @param info { title, subtitle, stars, icon (an Image, optional), words: the texts in the player's language
 *   { intro, moves(n), solved, playFree } }
 * @param turnsUsed taps per tile so far (for cracking mirrors)
 */
export function drawReplayFrame(ctx, level, state, info, turnsUsed) {
  const { width, height } = VIDEO_SIZE;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#fbe9d6');
  sky.addColorStop(0.55, '#faf6ee');
  sky.addColorStop(1, '#e6f0de');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  if (info.icon) ctx.drawImage(info.icon, width / 2 - 44, 56, 88, 88);
  centerText(ctx, 'Lumipals', 196, FONT(700, 54), INK);
  centerText(ctx, info.subtitle, 246, FONT(600, 28), SOFT);

  drawBoard(ctx, level, state, turnsUsed);

  if (state.phase === 'intro') {
    centerText(ctx, info.title, 1010, FONT(700, 44), INK);
    centerText(ctx, info.words.intro, 1066, FONT(600, 32), SOFT);
  } else if (state.phase === 'play') {
    centerText(ctx, info.words.moves(state.movesDone), 1030, FONT(700, 48), INK);
  } else {
    const t = Math.min(1, state.outroT / 600);
    ctx.globalAlpha = t;
    centerText(ctx, info.words.solved, 1010, FONT(700, 48), '#2f7a55');
    for (let i = 0; i < 3; i++)
      drawStar(ctx, width / 2 + (i - 1) * 76, 1080, 30 * (0.6 + 0.4 * ease(Math.min(1, (state.outroT - i * 150) / 400))), i < info.stars);
    centerText(ctx, info.words.playFree, 1190, FONT(600, 32), INK);
    ctx.globalAlpha = 1;
  }
}
