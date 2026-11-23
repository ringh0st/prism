// The yard in 3D (three.js): real glass marbles that roll, a chalk ring, the hole, pebbles and soft shadows, seen
// from above at a slight tilt. It only draws: the physics (physics.js) says where everything is.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { isLive, ringCorners } from './physics.js';

const TARGET_COLORS = ['#e2574c', '#3fa7d6', '#59cd90', '#f6ae2d', '#b565d8', '#ee6c9c', '#2ec4b6', '#ff8c42', '#7d8cf8'];
// In the ring game each side's marbles wear its own colors: warm for the near side, cool for the far side.
const TEAM_COLORS = { you: ['#f08a24', '#e8b422', '#e2574c'], foe: ['#1fa898', '#3f8fd6', '#3fb46a'] };
const SIDE_COLORS = { you: '#f0a030', foe: '#2bb3a3' };
const AIR_TIME = 0.38;

/** A small picture drawn in code, as a texture. */
function paint(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Glass with ribbons of color inside, like a cat's-eye marble. */
const swirl = (color, seed) =>
  paint(256, 128, (c, w, h) => {
    // Tinted glass with ribbons of deeper color and one white thread.
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255, 255, 255, 0.16)';
    c.fillRect(0, 0, w, h);
    const tints = [color, '#ffffff', '#2b2118'];
    for (let band = 0; band < 3; band++) {
      c.strokeStyle = tints[band];
      c.globalAlpha = band === 2 ? 0.35 : 0.95;
      c.lineWidth = band === 0 ? 30 : band === 1 ? 8 : 5;
      c.beginPath();
      for (let x = -10; x <= w + 10; x += 6) {
        const y = h / 2 + Math.sin((x / w) * Math.PI * 2 + seed + band * 1.3) * (h * 0.26) + (band - 1) * 20;
        if (x === -10) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
  });

/** What each ground looks like from above. */
const GROUND_LOOKS = {
  earth: { base: '#bd935c', light: [255, 240, 210], dark: [110, 78, 46], beyond: '#9db572' },
  sand: { base: '#e8d3a2', light: [255, 250, 232], dark: [176, 148, 96], beyond: '#7cc6d6' },
  asphalt: { base: '#6f7178', light: [200, 204, 212], dark: [40, 42, 48], beyond: '#8a8d94' },
  grass: { base: '#6fae4c', light: [176, 226, 120], dark: [44, 104, 40], beyond: '#5c9a40' },
  hill: { base: '#b98a55', light: [250, 232, 200], dark: [104, 70, 40], beyond: '#9db572' },
};

const groundPicture = (id) =>
  paint(512, 800, (c, w, h) => {
    const look = GROUND_LOOKS[id] ?? GROUND_LOOKS.earth;
    c.fillStyle = look.base;
    c.fillRect(0, 0, w, h);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const ink = (rgb, alpha) => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    // Soft patches, then grain.
    for (let i = 0; i < 26; i++) {
      c.fillStyle = ink(look.dark, 0.04 + rnd() * 0.05);
      c.beginPath();
      c.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 80, 20 + rnd() * 50, rnd() * 3, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 5200; i++) {
      c.fillStyle = rnd() < 0.5 ? ink(look.light, rnd() * 0.35) : ink(look.dark, rnd() * 0.3);
      c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    if (id === 'sand') {
      // Wind ripples.
      c.strokeStyle = ink(look.dark, 0.16);
      c.lineWidth = 2;
      for (let y = 10; y < h; y += 22) {
        c.beginPath();
        for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x * 0.03 + y) * 4);
        c.stroke();
      }
    } else if (id === 'grass') {
      // Blades, and darker dips where the ground is uneven.
      for (let i = 0; i < 2600; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        c.strokeStyle = rnd() < 0.5 ? ink(look.light, 0.5) : ink(look.dark, 0.45);
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + (rnd() - 0.5) * 6, y - 5 - rnd() * 7);
        c.stroke();
      }
    } else if (id === 'asphalt') {
      // Cracks and an old painted line.
      c.strokeStyle = ink(look.dark, 0.6);
      c.lineWidth = 1.6;
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        let x = rnd() * w;
        let y = rnd() * h;
        c.moveTo(x, y);
        for (let k = 0; k < 6; k++) c.lineTo((x += (rnd() - 0.5) * 70), (y += 20 + rnd() * 40));
        c.stroke();
      }
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.fillRect(0, h * 0.5 - 3, w, 6);
    } else if (id === 'hill') {
      // Lighter at the top, with faint arrows pointing downhill.
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255, 244, 214, 0.3)');
      g.addColorStop(1, 'rgba(60, 36, 14, 0.22)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255, 250, 235, 0.3)';
      c.lineWidth = 5;
      c.lineCap = 'round';
      for (let y = 90; y < h; y += 170) {
        for (let x = 80; x < w; x += 170) {
          c.beginPath();
          c.moveTo(x - 16, y - 10);
          c.lineTo(x, y + 8);
          c.lineTo(x + 16, y - 10);
          c.stroke();
        }
      }
    }
  });

/** @param flip look at the yard from its far end (the player who joined a live game shoots from there) */
export function createView(canvas, yard, { flip = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 10, 4000);
  const center = new THREE.Vector3(yard.w / 2, 0, yard.h / 2);
  const TILT = 0.42; // radians from straight down

  scene.add(new THREE.HemisphereLight('#fff6e0', '#a07a4a', 0.55));
  const sun = new THREE.DirectionalLight('#fff1d0', 1.7);
  sun.position.set(yard.w / 2 - 260, 620, yard.h / 2 - 180);
  sun.target.position.copy(center);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -340, right: 340, top: 380, bottom: -380, near: 100, far: 1500 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.radius = 3;
  sun.shadow.bias = -0.0015;
  scene.add(sun, sun.target);

  // The yard, with a kerb round it and plain ground beyond.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(yard.w, yard.h), new THREE.MeshStandardMaterial({ map: groundPicture('earth'), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.copy(center);
  ground.receiveShadow = true;
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: '#9db572', roughness: 1 }));
  beyond.rotation.x = -Math.PI / 2;
  beyond.position.set(center.x, -0.5, center.z);
  beyond.receiveShadow = true;
  ground.userData.id = 'earth';
  scene.add(ground, beyond);
  const kerbMat = new THREE.MeshStandardMaterial({ color: '#c97b5a', roughness: 0.8 });
  for (const [x, z, w, d] of [[yard.w / 2, -7, yard.w + 28, 14], [yard.w / 2, yard.h + 7, yard.w + 28, 14], [-7, yard.h / 2, 14, yard.h], [yard.w + 7, yard.h / 2, 14, yard.h]]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(w, 12, d), kerbMat);
    kerb.position.set(x, 6, z);
    kerb.castShadow = true;
    kerb.receiveShadow = true;
    scene.add(kerb);
  }

  // What lies on the yard (rebuilt when the yard changes): ring, hole, sand, pebbles.
  const fixtures = new THREE.Group();
  scene.add(fixtures);
  const flat = (geometry, material, x, z, y) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    fixtures.add(mesh);
    return mesh;
  };
  let fixtureKey = '';
  function layFixtures(world) {
    const groundId = world.ground?.id ?? 'earth';
    const key = JSON.stringify([groundId, world.ring, world.hole, world.sand, world.stones, world.puddles, world.terrain]);
    if (key === fixtureKey) return;
    fixtureKey = key;
    if (ground.userData.id !== groundId) {
      ground.material.map?.dispose();
      ground.material.map = groundPicture(groundId);
      ground.material.needsUpdate = true;
      ground.userData.id = groundId;
      beyond.material.color.set((GROUND_LOOKS[groundId] ?? GROUND_LOOKS.earth).beyond);
    }
    fixtures.clear();
    for (const s of world.sand) flat(new THREE.CircleGeometry(s.r, 40), new THREE.MeshStandardMaterial({ color: '#f1dfb6', roughness: 1 }), s.x, s.y, 0.3);
    // Mounds and dips: shaded so the eye reads the height (light on the sunny side of a mound, dark in a dip).
    for (const t of world.terrain ?? []) {
      const isMound = t.push > 0;
      const shade = paint(128, 128, (c) => {
        const g = c.createRadialGradient(isMound ? 50 : 64, isMound ? 48 : 64, 4, 64, 64, 64);
        if (isMound) {
          g.addColorStop(0, 'rgba(255, 246, 220, 0.75)');
          g.addColorStop(0.6, 'rgba(255, 240, 205, 0.25)');
          g.addColorStop(0.85, 'rgba(70, 44, 20, 0.28)');
          g.addColorStop(1, 'rgba(70, 44, 20, 0)');
        } else {
          g.addColorStop(0, 'rgba(50, 30, 12, 0.6)');
          g.addColorStop(0.7, 'rgba(60, 38, 16, 0.3)');
          g.addColorStop(0.92, 'rgba(255, 244, 214, 0.35)');
          g.addColorStop(1, 'rgba(255, 244, 214, 0)');
        }
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
      });
      flat(new THREE.CircleGeometry(t.r * 1.08, 48), new THREE.MeshBasicMaterial({ map: shade, transparent: true }), t.x, t.y, 0.32).receiveShadow = false;
    }
    // Puddles: shiny water.
    for (const p of world.puddles ?? []) {
      flat(new THREE.CircleGeometry(p.r, 40), new THREE.MeshPhysicalMaterial({ color: '#5aa9d6', roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85, envMapIntensity: 1.2 }), p.x, p.y, 0.36);
      flat(new THREE.RingGeometry(p.r - 1.6, p.r + 1.4, 40), new THREE.MeshBasicMaterial({ color: '#3c7fa8', transparent: true, opacity: 0.55 }), p.x, p.y, 0.38).receiveShadow = false;
    }
    if (world.ring) {
      const chalk = new THREE.MeshStandardMaterial({ color: '#fffdf6', roughness: 1, transparent: true, opacity: 0.9 });
      const corners = ringCorners(world.ring);
      if (!corners) flat(new THREE.RingGeometry(world.ring.r - 2.6, world.ring.r + 2.6, 96), chalk, world.ring.x, world.ring.y, 0.4);
      else {
        // A triangle or a square, drawn in chalk: one thin bar per side, with a dot of chalk at every corner.
        corners.forEach((a, i) => {
          const b = corners[(i + 1) % corners.length];
          const side = flat(new THREE.PlaneGeometry(Math.hypot(b.x - a.x, b.y - a.y), 5.2), chalk, (a.x + b.x) / 2, (a.y + b.y) / 2, 0.4);
          side.rotation.z = -Math.atan2(b.y - a.y, b.x - a.x);
          flat(new THREE.CircleGeometry(2.6, 16), chalk, a.x, a.y, 0.4);
        });
      }
    }
    if (world.hole) {
      const pit = paint(128, 128, (c) => {
        const g = c.createRadialGradient(64, 64, 6, 64, 64, 64);
        g.addColorStop(0, '#1c120a');
        g.addColorStop(0.75, '#3a2616');
        g.addColorStop(1, '#8a6a44');
        c.fillStyle = g;
        c.beginPath();
        c.arc(64, 64, 64, 0, Math.PI * 2);
        c.fill();
      });
      flat(new THREE.CircleGeometry(world.hole.r, 40), new THREE.MeshBasicMaterial({ map: pit }), world.hole.x, world.hole.y, 0.5).receiveShadow = false;
    }
    world.stones.forEach((s, i) => {
      if (s.post) {
        // A gate post: a short wooden peg with a painted top.
        const post = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r * 1.08, 26, 20), new THREE.MeshStandardMaterial({ color: '#b07a48', roughness: 0.8 }));
        post.position.set(s.x, 13, s.y);
        post.castShadow = true;
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 1.02, s.r * 1.02, 5, 20), new THREE.MeshStandardMaterial({ color: '#e2574c', roughness: 0.6 }));
        cap.position.set(s.x, 28, s.y);
        cap.castShadow = true;
        fixtures.add(post, cap);
        return;
      }
      const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(s.r, 1), new THREE.MeshStandardMaterial({ color: i % 2 ? '#9a958c' : '#857f76', roughness: 0.9, flatShading: true }));
      stone.scale.y = 0.62;
      stone.rotation.y = i * 1.7;
      stone.position.set(s.x, s.r * 0.45, s.y);
      stone.castShadow = true;
      stone.receiveShadow = true;
      fixtures.add(stone);
    });
  }

  // Marbles: one glass ball each, kept between frames so it can roll.
  const balls = new Map();
  function ballFor(m, index) {
    let ball = balls.get(m.id);
    if (ball && ball.kind === m.kind) return ball;
    if (ball) scene.remove(ball.mesh);
    const color = m.owner ? SIDE_COLORS[m.owner] : m.team ? TEAM_COLORS[m.team][index % 3] : TARGET_COLORS[index % TARGET_COLORS.length];
    const material =
      m.kind === 'steelie'
        ? new THREE.MeshStandardMaterial({ color: '#d9dde3', metalness: 1, roughness: 0.12, envMapIntensity: 1.4 })
        : new THREE.MeshPhysicalMaterial({ map: swirl(color, index * 2.1), roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.4 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(m.r, 40, 28), material);
    mesh.castShadow = true;
    mesh.rotation.set(index, index * 0.7, 0);
    scene.add(mesh);
    ball = { mesh, kind: m.kind, x: m.x, y: m.y, gone: 0 };
    balls.set(m.id, ball);
    return ball;
  }

  // Whose turn: a soft ring of light under that shooter. Aiming: a row of dots that grows with the power.
  const glow = new THREE.Mesh(new THREE.RingGeometry(1, 1.35, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8 }));
  glow.rotation.x = -Math.PI / 2;
  scene.add(glow);
  const dots = Array.from({ length: 9 }, () => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(1, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true }));
    dot.rotation.x = -Math.PI / 2;
    scene.add(dot);
    return dot;
  });

  const fan = [0, 1].map(() => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.6), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true }));
    scene.add(line);
    return line;
  });

  const up = new THREE.Vector3(0, 1, 0);
  const axis = new THREE.Vector3();
  const spin = new THREE.Quaternion();

  return {
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Far enough to see the whole yard with its kerb, whichever of width and height is tighter.
      const half = Math.tan((camera.fov * Math.PI) / 360);
      const distance = Math.max((yard.h + 70) / (2 * half), (yard.w + 64) / (2 * half * camera.aspect));
      const end = flip ? -1 : 1;
      camera.position.set(center.x, Math.cos(TILT) * distance, center.z + end * Math.sin(TILT) * distance);
      camera.lookAt(center.x, 0, center.z + end * 6);
      camera.updateProjectionMatrix();
    },

    /** Where a touch on the screen lands on the yard. */
    toYard(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.ray.intersectPlane(new THREE.Plane(up, 0), new THREE.Vector3());
      return hit ? { x: hit.x, y: hit.z } : null;
    },

    /** Draws the yard. `aim` is { angle, power, high } while the player pulls back; `turn` whose shooter glows. */
    render(world, { aim = null, turn = null, now = 0, dt = 16 } = {}) {
      layFixtures(world);
      const seen = new Set();
      world.marbles.forEach((m, index) => {
        seen.add(m.id);
        const ball = ballFor(m, index);
        // A marble that was won or fell in the hole shrinks away.
        ball.gone = isLive(m) ? 0 : Math.min(1, ball.gone + dt / 260);
        const lift = m.air > 0 ? Math.sin(Math.PI * (1 - m.air / AIR_TIME)) * 46 : 0;
        const size = 1 - ball.gone;
        ball.mesh.visible = size > 0.02;
        ball.mesh.scale.setScalar(Math.max(0.02, size));
        ball.mesh.position.set(m.x, m.r * size + lift - (m.sunk ? ball.gone * m.r * 2 : 0), m.y);
        // Rolling: it turns about the line across its way, by how far it went.
        const dx = m.x - ball.x;
        const dz = m.y - ball.y;
        const far = Math.hypot(dx, dz);
        if (far > 0.01 && far < 60 && lift === 0) {
          axis.set(dz, 0, -dx).normalize();
          ball.mesh.quaternion.premultiply(spin.setFromAxisAngle(axis, far / m.r));
        }
        ball.x = m.x;
        ball.y = m.y;
      });
      for (const [id, ball] of balls) {
        if (!seen.has(id)) {
          scene.remove(ball.mesh);
          balls.delete(id);
        }
      }

      const shooter = turn && world.marbles.find((m) => m.id === turn);
      glow.visible = Boolean(shooter) && isLive(shooter);
      if (glow.visible) {
        const pulse = 1 + 0.08 * Math.sin(now * 0.006);
        glow.scale.setScalar((shooter.r + 5) * pulse);
        glow.position.set(shooter.x, 0.6, shooter.y);
        glow.material.color.set(SIDE_COLORS[turn]);
      }
      dots.forEach((dot, i) => {
        dot.visible = Boolean(aim && shooter);
        if (!dot.visible) return;
        const far = shooter.r + 12 + i * (10 + aim.power * 16);
        dot.position.set(shooter.x + Math.cos(aim.angle) * far, aim.high ? 0.7 + Math.sin((i / 8) * Math.PI) * 30 : 0.7, shooter.y + Math.sin(aim.angle) * far);
        dot.scale.setScalar(4.2 - i * 0.28);
        dot.material.opacity = (i / 9 < aim.power + 0.15 ? 0.95 : 0.25) * (1 - i * 0.05);
        dot.material.color.set(aim.high ? '#8fe3ff' : '#ffffff');
      });
      // How far a flick this hard may stray: two faint lines that open like a fan.
      fan.forEach((line, i) => {
        line.visible = Boolean(aim && shooter);
        if (!line.visible) return;
        const angle = aim.angle + (i ? 1 : -1) * aim.stray;
        const length = shooter.r + 12 + 8 * (10 + aim.power * 16);
        line.scale.set(length, 1, 1);
        line.position.set(shooter.x + (Math.cos(angle) * length) / 2, 0.65, shooter.y + (Math.sin(angle) * length) / 2);
        line.rotation.set(-Math.PI / 2, 0, -angle);
        line.material.opacity = 0.12 + 0.3 * aim.power;
      });
      renderer.render(scene, camera);
    },

    dispose() {
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
