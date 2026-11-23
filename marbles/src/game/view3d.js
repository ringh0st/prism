// The yard in 3D (three.js): real glass marbles that roll, a chalk ring, the hole, pebbles and soft shadows, seen
// from above at a slight tilt. It only draws: the physics (physics.js) says where everything is.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { isLive } from './physics.js';

const TARGET_COLORS = ['#e2574c', '#3fa7d6', '#59cd90', '#f6ae2d', '#b565d8', '#ee6c9c', '#2ec4b6', '#ff8c42', '#7d8cf8'];
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

const earth = () =>
  paint(512, 800, (c, w, h) => {
    c.fillStyle = '#bd935c';
    c.fillRect(0, 0, w, h);
    // Packed earth: grains, a few darker damp patches and scuff marks.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      c.fillStyle = `rgba(150, 110, 70, ${0.04 + rnd() * 0.05})`;
      c.beginPath();
      c.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 80, 20 + rnd() * 50, rnd() * 3, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 5200; i++) {
      c.fillStyle = rnd() < 0.5 ? `rgba(255, 240, 210, ${rnd() * 0.35})` : `rgba(110, 78, 46, ${rnd() * 0.3})`;
      c.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  });

export function createView(canvas, yard) {
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(yard.w, yard.h), new THREE.MeshStandardMaterial({ map: earth(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.copy(center);
  ground.receiveShadow = true;
  const beyond = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: '#9db572', roughness: 1 }));
  beyond.rotation.x = -Math.PI / 2;
  beyond.position.set(center.x, -0.5, center.z);
  beyond.receiveShadow = true;
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
    const key = JSON.stringify([world.ring, world.hole, world.sand, world.stones]);
    if (key === fixtureKey) return;
    fixtureKey = key;
    fixtures.clear();
    for (const s of world.sand) flat(new THREE.CircleGeometry(s.r, 40), new THREE.MeshStandardMaterial({ color: '#f1dfb6', roughness: 1 }), s.x, s.y, 0.3);
    if (world.ring) flat(new THREE.RingGeometry(world.ring.r - 2.6, world.ring.r + 2.6, 96), new THREE.MeshStandardMaterial({ color: '#fffdf6', roughness: 1, transparent: true, opacity: 0.9 }), world.ring.x, world.ring.y, 0.4);
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
    const color = m.owner ? SIDE_COLORS[m.owner] : TARGET_COLORS[index % TARGET_COLORS.length];
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
      camera.position.set(center.x, Math.cos(TILT) * distance, center.z + Math.sin(TILT) * distance);
      camera.lookAt(center.x, 0, center.z + 6);
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
      renderer.render(scene, camera);
    },

    dispose() {
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
