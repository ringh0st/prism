/*
 * Three art directions for the whole puzzle board (concept renders, not shipped). Same little puzzle in each:
 * a lamp at the left shines right, a mirror turns it up, a second mirror turns it right into a lit gem; a wall,
 * an unlit gem and a spare mirror fill the board.
 */
import { useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';

const N = 5;
const at = (x, y, h = 0) => [x - N / 2 + 0.5, h, y - N / 2 + 0.5];
const LAMP = [0, 3];
const M1 = [2, 3];
const M2 = [2, 1];
const GEM = [4, 1];
const GEM2 = [0, 0];
const WALL = [3, 4];
const SPARE = [4, 3];
const PATH = [[LAMP, M1], [M1, M2], [M2, GEM]];
const lit = new Set([0, 1, 2, 3, 4].flatMap((x) => [0, 1, 2, 3, 4].map((y) => [x, y])).filter(([x, y]) => (y === 3 && x <= 2) || (x === 2 && y >= 1 && y <= 3) || (y === 1 && x >= 2)).map(([x, y]) => `${x},${y}`));
const glow = (c, k) => new THREE.Color(c).multiplyScalar(k);

function Env({ intensity = 0.4 }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = intensity;
  }, [gl, scene, intensity]);
  return null;
}

function Beam({ color = '#ffd84a', core = '#fffbea', width = 0.07, y = 0.42 }) {
  return PATH.map(([a, b], i) => {
    const A = new THREE.Vector3(...at(a[0], a[1], y)), B = new THREE.Vector3(...at(b[0], b[1], y));
    const mid = A.clone().lerp(B, 0.5), len = A.distanceTo(B) + 0.04, ang = -Math.atan2(B.z - A.z, B.x - A.x);
    return (
      <group key={i} position={mid} rotation={[0, ang, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[width * 1.9, width * 1.9, len, 16, 1, true]} /><meshBasicMaterial color={glow(color, 2)} toneMapped={false} transparent opacity={0.45} depthWrite={false} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[width * 0.6, width * 0.6, len, 12]} /><meshBasicMaterial color={glow(core, 4)} toneMapped={false} /></mesh>
      </group>
    );
  });
}

/* ---------------- 1 · Toy Island (toon-shaded diorama, outlined like a cartoon) ---------------- */
const toonRamp = (() => {
  const data = new Uint8Array([90, 160, 255]);
  const t = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const INK = '#3a2a2a';
function Toon({ geometry, color, position, rotation, scale = 1, outline = 0.035, emissive, children }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} castShadow receiveShadow><meshToonMaterial color={color} gradientMap={toonRamp} emissive={emissive ?? '#000'} emissiveIntensity={emissive ? 0.6 : 0} /></mesh>
      <mesh geometry={geometry} scale={1 + outline * 2}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      {children}
    </group>
  );
}
function ToyIsland() {
  const cube = useMemo(() => new RoundedBoxGeometry(0.94, 0.5, 0.94, 3, 0.08), []);
  const rock = useMemo(() => { const g = new THREE.CylinderGeometry(3.2, 1.2, 2.2, 9, 3); g.translate(0, -1.4, 0); return g; }, []);
  const tree = useMemo(() => new THREE.IcosahedronGeometry(0.32, 0), []);
  return (
    <>
      <color attach="background" args={['#ffe9c7']} />
      <hemisphereLight args={['#fff4dd', '#d9a77a', 1.1]} />
      <directionalLight position={[-4, 8, 5]} intensity={1.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <Toon geometry={rock} color="#c98b5e" position={[0, -0.25, 0]} outline={0.01} />
      {Array.from({ length: N * N }, (_, i) => {
        const x = i % N, y = Math.floor(i / N), h = ((x * 7 + y * 3) % 3) * 0.04;
        return <Toon key={i} geometry={cube} color={lit.has(`${x},${y}`) ? '#ffd76a' : (x + y) % 2 ? '#8fd18a' : '#a5dc96'} position={at(x, y, h)} outline={0.02} />;
      })}
      {[[-3.0, -1.6], [2.9, 2.2], [-2.6, 2.6]].map(([x, z], n) => (
        <group key={n} position={[x, 0.2, z]}>
          <Toon geometry={new THREE.CylinderGeometry(0.06, 0.08, 0.4, 6)} color="#9a6a45" position={[0, 0.2, 0]} />
          <Toon geometry={tree} color="#5fae6e" position={[0, 0.6, 0]} />
        </group>
      ))}
      {/* Lamp: a chubby lighthouse with a glowing window */}
      <group position={at(...LAMP, 0.25)}>
        <Toon geometry={new THREE.CylinderGeometry(0.22, 0.3, 0.6, 12)} color="#fff3e6" position={[0, 0.3, 0]} />
        <Toon geometry={new THREE.CylinderGeometry(0.235, 0.27, 0.14, 12)} color="#ef7f7a" position={[0, 0.32, 0]} outline={0.01} />
        <Toon geometry={new THREE.CylinderGeometry(0.18, 0.2, 0.18, 12)} color="#ffe27a" emissive="#ffcf3a" position={[0, 0.69, 0]} />
        <Toon geometry={new THREE.ConeGeometry(0.26, 0.24, 12)} color="#ef7f7a" position={[0, 0.9, 0]} />
        <mesh position={[0.26, 0.17, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.1, 20]} /><meshBasicMaterial color={glow('#fff2b0', 4)} toneMapped={false} /></mesh>
      </group>
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => (
        <group key={n} position={at(...c, 0.25)} rotation={[0, r, 0]}>
          <Toon geometry={new THREE.CylinderGeometry(0.3, 0.34, 0.08, 16)} color="#ffcf6e" position={[0, 0.04, 0]} />
          <Toon geometry={new RoundedBoxGeometry(0.66, 0.5, 0.08, 2, 0.04)} color="#ef8fb1" position={[0, 0.38, 0]} />
          <mesh position={[0, 0.38, 0.045]}><planeGeometry args={[0.54, 0.38]} /><meshStandardMaterial color="#cdeeff" metalness={0.6} roughness={0.08} emissive="#bfe8fb" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, 0.38, -0.045]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.54, 0.38]} /><meshStandardMaterial color="#cdeeff" metalness={0.6} roughness={0.08} emissive="#bfe8fb" emissiveIntensity={0.5} /></mesh>
          <mesh position={[-0.1, 0.4, 0.05]} rotation={[0, 0, 0.7]}><planeGeometry args={[0.05, 0.42]} /><meshBasicMaterial color="#fff" transparent opacity={0.85} /></mesh>
        </group>
      ))}
      {[[GEM, true], [GEM2, false]].map(([c, on], n) => (
        <group key={n} position={at(...c, 0.25)}>
          <Toon geometry={new THREE.OctahedronGeometry(0.28, 0)} color={on ? '#ffbd2e' : '#e9eef7'} emissive={on ? '#ff9d00' : undefined} position={[0, 0.42, 0]} scale={[1, 1.35, 1]} />
          {on && <pointLight position={[0, 0.5, 0]} color="#ffb340" intensity={2} distance={1.6} />}
        </group>
      ))}
      <Toon geometry={new RoundedBoxGeometry(0.86, 0.6, 0.86, 2, 0.08)} color="#b9a48e" position={at(...WALL, 0.55)} />
      <Beam y={0.68} />
    </>
  );
}

/* ---------------- 2 · Paper Craft (layered cardstock, folded paper, like a pop-up book) ---------------- */
function PaperCraft() {
  const card = (w, d, h = 0.04) => new RoundedBoxGeometry(w, h, d, 2, 0.012);
  const paper = (c) => <meshStandardMaterial color={c} roughness={0.95} />;
  const lantern = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.18, 0.04], [0.26, 0.2], [0.27, 0.32], [0.22, 0.48], [0.1, 0.55], [0.001, 0.56]].map(([x, y]) => new THREE.Vector2(x, y)), 14), []);
  return (
    <>
      <color attach="background" args={['#f6efe2']} />
      <hemisphereLight args={['#fffaf0', '#cdbb9c', 1.2]} />
      <directionalLight position={[-3, 7, 4]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={6} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <mesh geometry={card(6.2, 6.2, 0.06)} position={[0, -0.12, 0]} receiveShadow castShadow>{paper('#e8dcc4')}</mesh>
      <mesh geometry={card(5.7, 5.7, 0.06)} position={[0, -0.05, 0]} receiveShadow castShadow>{paper('#9cc9a3')}</mesh>
      {Array.from({ length: N * N }, (_, i) => {
        const x = i % N, y = Math.floor(i / N);
        return <mesh key={i} geometry={card(0.9, 0.9)} position={at(x, y, 0.02)} rotation={[0, ((x * 13 + y * 7) % 5 - 2) * 0.012, 0]} receiveShadow castShadow>{paper(lit.has(`${x},${y}`) ? '#ffe39a' : (x + y) % 2 ? '#fbf6ea' : '#f1ead9')}</mesh>;
      })}
      {/* Lamp: a glowing paper lantern with ribs and a tassel */}
      <group position={at(...LAMP, 0.05)}>
        <mesh geometry={lantern} position={[0, 0.12, 0]} castShadow><meshStandardMaterial color="#ffb37a" roughness={0.9} emissive="#ff9a4a" emissiveIntensity={0.9} side={THREE.DoubleSide} flatShading /></mesh>
        <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.13, 16, 12]} /><meshBasicMaterial color={glow('#ffe7a0', 3)} toneMapped={false} /></mesh>
        <mesh position={[0, 0.71, 0]} castShadow><cylinderGeometry args={[0.11, 0.11, 0.05, 14]} />{paper('#d9534f')}</mesh>
        <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.11, 0.11, 0.05, 14]} />{paper('#d9534f')}</mesh>
        <pointLight position={[0, 0.4, 0]} color="#ffb060" intensity={2.5} distance={2} />
      </group>
      {/* Mirrors: a folded card stand with a silver-foil face */}
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => (
        <group key={n} position={at(...c, 0.05)} rotation={[0, r + Math.PI / 2, 0]}>
          <mesh position={[0, 0.3, -0.1]} rotation={[0.35, 0, 0]} castShadow>{<boxGeometry args={[0.6, 0.55, 0.012]} />}{paper('#f19bb4')}</mesh>
          <mesh position={[0, 0.3, -0.083]} rotation={[0.35, 0, 0]}><planeGeometry args={[0.5, 0.45]} /><meshStandardMaterial color="#d8eef8" metalness={0.5} roughness={0.1} emissive="#cbe8f5" emissiveIntensity={0.6} /></mesh>
          <mesh position={[0, 0.3, -0.117]} rotation={[0.35, Math.PI, 0]}><planeGeometry args={[0.5, 0.45]} /><meshStandardMaterial color="#d8eef8" metalness={0.5} roughness={0.1} emissive="#cbe8f5" emissiveIntensity={0.6} /></mesh>
          <mesh position={[0, 0.2, 0.08]} rotation={[-0.6, 0, 0]} castShadow><boxGeometry args={[0.2, 0.4, 0.012]} />{paper('#f19bb4')}</mesh>
        </group>
      ))}
      {/* Gems: origami crystals */}
      {[[GEM, true], [GEM2, false]].map(([c, on], n) => (
        <group key={n} position={at(...c, 0.05)}>
          <mesh position={[0, 0.38, 0]} scale={[1, 1.4, 1]} castShadow><octahedronGeometry args={[0.24, 0]} /><meshStandardMaterial color={on ? '#ffc23d' : '#fdfbf6'} roughness={0.85} flatShading emissive={on ? '#ffaa1a' : '#000'} emissiveIntensity={on ? 0.7 : 0} /></mesh>
          {on && <pointLight position={[0, 0.4, 0]} color="#ffbf55" intensity={1.6} distance={1.4} />}
        </group>
      ))}
      {/* Wall: a stack of three cards */}
      {[0, 1, 2].map((k) => <mesh key={k} geometry={card(0.82 - k * 0.06, 0.82 - k * 0.06, 0.16)} position={at(...WALL, 0.13 + k * 0.17)} rotation={[0, k * 0.08, 0]} castShadow receiveShadow>{paper(['#c9b79d', '#d6c6ad', '#e3d6c0'][k])}</mesh>)}
      <Beam y={0.4} width={0.05} />
    </>
  );
}

/* ---------------- 3 · Golden Hour Garden (a floating mossy island at sunset, fireflies) ---------------- */
function Fireflies() {
  const ref = useRef([]);
  const seeds = useMemo(() => Array.from({ length: 26 }, (_, n) => [Math.sin(n * 12.9) * 3, 0.5 + (n % 5) * 0.25, Math.cos(n * 7.7) * 3]), []);
  useFrame(({ clock }) => ref.current.forEach((m, n) => m && (m.position.y = seeds[n][1] + Math.sin(clock.elapsedTime + n) * 0.1)));
  return seeds.map((p, n) => <mesh key={n} ref={(m) => (ref.current[n] = m)} position={p}><sphereGeometry args={[0.03, 8, 6]} /><meshBasicMaterial color={glow('#ffe58a', 4)} toneMapped={false} /></mesh>);
}
function GoldenGarden() {
  const stone = useMemo(() => new RoundedBoxGeometry(0.92, 0.22, 0.92, 3, 0.07), []);
  const earth = useMemo(() => { const g = new THREE.CylinderGeometry(3.4, 0.6, 2.6, 10, 4); g.translate(0, -1.45, 0); return g; }, []);
  return (
    <>
      <color attach="background" args={['#f2a98a']} />
      <fog attach="fog" args={['#f2a98a', 16, 30]} />
      <hemisphereLight args={['#ffd9b0', '#4e6b45', 0.75]} />
      <directionalLight position={[-7, 4, 3]} intensity={2.2} color="#ffb877" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <mesh geometry={earth} position={[0, -0.05, 0]}><meshStandardMaterial color="#8a6146" roughness={1} flatShading /></mesh>
      <mesh position={[0, -0.06, 0]} receiveShadow><cylinderGeometry args={[3.45, 3.4, 0.14, 40]} /><meshStandardMaterial color="#7eb26b" roughness={1} /></mesh>
      {Array.from({ length: N * N }, (_, i) => {
        const x = i % N, y = Math.floor(i / N);
        return <mesh key={i} geometry={stone} position={at(x, y, 0.08)} receiveShadow castShadow><meshStandardMaterial color={lit.has(`${x},${y}`) ? '#ffe2a2' : (x + y) % 2 ? '#d9cbb5' : '#cbbba3'} roughness={0.9} emissive={lit.has(`${x},${y}`) ? '#ffb64a' : '#000'} emissiveIntensity={lit.has(`${x},${y}`) ? 0.25 : 0} /></mesh>;
      })}
      {/* little mushrooms and flowers around the edge */}
      {[[-3, 1], [3.1, -0.6], [-2.4, -2.6], [2.5, 2.7], [0.6, 3.2]].map(([x, z], n) => (
        <group key={n} position={[x, 0.02, z]}>
          <mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.04, 0.05, 0.24, 8]} /><meshStandardMaterial color="#fff3e2" /></mesh>
          <mesh position={[0, 0.26, 0]}><sphereGeometry args={[0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={n % 2 ? '#ef8f7a' : '#f3c25b'} /></mesh>
        </group>
      ))}
      {/* Lamp: a lantern of glowing glass hanging from a curled iron post */}
      <group position={at(...LAMP, 0.2)}>
        <mesh position={[-0.2, 0.45, 0]}><cylinderGeometry args={[0.025, 0.035, 0.9, 8]} /><meshStandardMaterial color="#3c3530" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[-0.06, 0.88, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.14, 0.02, 8, 20, Math.PI]} /><meshStandardMaterial color="#3c3530" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0.08, 0.6, 0]}><boxGeometry args={[0.26, 0.32, 0.26]} /><meshPhysicalMaterial color="#fff1cf" transmission={0.4} roughness={0.1} emissive="#ffc35c" emissiveIntensity={1.4} /></mesh>
        <mesh position={[0.08, 0.6, 0]}><sphereGeometry args={[0.08, 12, 10]} /><meshBasicMaterial color={glow('#fff4c0', 4)} toneMapped={false} /></mesh>
        <mesh position={[0.08, 0.79, 0]}><coneGeometry args={[0.2, 0.12, 4]} /><meshStandardMaterial color="#3c3530" metalness={0.6} roughness={0.4} /></mesh>
        <pointLight position={[0.08, 0.6, 0]} color="#ffb860" intensity={3} distance={2.4} />
      </group>
      {/* Mirrors: polished silver mirrors in twig frames */}
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => (
        <group key={n} position={at(...c, 0.2)} rotation={[0, r, 0]}>
          <mesh position={[0, 0.34, 0]}><circleGeometry args={[0.27, 40]} /><meshStandardMaterial color="#eaf3f6" metalness={1} roughness={0.05} side={THREE.DoubleSide} /></mesh>
          <mesh position={[0, 0.34, 0]}><torusGeometry args={[0.28, 0.035, 8, 36]} /><meshStandardMaterial color="#7a5232" roughness={0.9} /></mesh>
          {[-0.12, 0.12].map((x) => <mesh key={x} position={[x, 0.05, 0]} rotation={[0, 0, x * 2]}><cylinderGeometry args={[0.02, 0.025, 0.2, 6]} /><meshStandardMaterial color="#7a5232" /></mesh>)}
          <mesh position={[0.08, 0.6, 0.02]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#79b665" /></mesh>
        </group>
      ))}
      {/* Gems: crystal flowers */}
      {[[GEM, true], [GEM2, false]].map(([c, on], n) => (
        <group key={n} position={at(...c, 0.2)}>
          {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[0, 0.06, 0]} rotation={[0.9, (k / 5) * Math.PI * 2, 0]}><coneGeometry args={[0.07, 0.36, 5]} /><meshStandardMaterial color="#6fae62" /></mesh>)}
          <mesh position={[0, 0.36, 0]} scale={[1, 1.5, 1]}><octahedronGeometry args={[0.2, 0]} /><meshPhysicalMaterial color={on ? '#ffc23d' : '#eef3ff'} roughness={0.05} clearcoat={1} flatShading transmission={on ? 0.1 : 0.4} emissive={on ? '#ff9d1a' : '#000'} emissiveIntensity={on ? 0.9 : 0} /></mesh>
          {on && <pointLight position={[0, 0.4, 0]} color="#ffb340" intensity={2.5} distance={1.6} />}
        </group>
      ))}
      {/* Wall: a mossy boulder */}
      <mesh position={at(...WALL, 0.45)} scale={[1, 0.8, 1]} castShadow><dodecahedronGeometry args={[0.42, 0]} /><meshStandardMaterial color="#a19483" roughness={1} flatShading /></mesh>
      <mesh position={at(...WALL, 0.72)} scale={[1, 0.35, 1]}><sphereGeometry args={[0.3, 12, 8]} /><meshStandardMaterial color="#7cb06a" roughness={1} /></mesh>
      <Fireflies />
      <Beam y={0.56} color="#ffcf5a" />
    </>
  );
}


/* ---------------- shared detail helpers ---------------- */
const lath = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
const brassM = (c = '#d6a347') => <meshPhysicalMaterial color={c} metalness={0.8} roughness={0.28} clearcoat={0.6} />;
const mirrorM = <meshPhysicalMaterial color="#e8f4f8" metalness={0.9} roughness={0.04} clearcoat={1} emissive="#d9eef6" emissiveIntensity={0.35} side={THREE.DoubleSide} />;
function Streaks({ w = 0.5, h = 0.4, z = 0.012 }) {
  return [z, -z].flatMap((zz) => [[-w * 0.18, w * 0.12], [w * 0.05, w * 0.05]].map(([x, ww]) => (
    <mesh key={`${zz}${x}`} position={[x, 0, zz]} rotation={[0, zz < 0 ? Math.PI : 0, 0.7]}><planeGeometry args={[ww, h * 1.1]} /><meshBasicMaterial color="#fff" transparent opacity={0.6} depthWrite={false} /></mesh>
  )));
}
function Sparkles({ n = 20, r = 3, y = 0.6, color = '#ffe8a0' }) {
  const ref = useRef([]);
  const seeds = useMemo(() => Array.from({ length: n }, (_, k) => [Math.sin(k * 12.9) * r, y + (k % 5) * 0.22, Math.cos(k * 7.7) * r]), [n, r, y]);
  useFrame(({ clock }) => ref.current.forEach((m, k) => m && (m.position.y = seeds[k][1] + Math.sin(clock.elapsedTime + k) * 0.08)));
  return seeds.map((p, k) => <mesh key={k} ref={(m) => (ref.current[k] = m)} position={p}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color={glow(color, 4)} toneMapped={false} /></mesh>);
}

/* ---------------- 4 · Amber Grotto (a warm crystal cave lit by lanterns) ---------------- */
function AmberLantern() {
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.24, 0], [0.25, 0.04], [0.18, 0.08], [0.001, 0.08]])} castShadow>{brassM('#b9853b')}</mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 0.15, 0.3, Math.sin(a) * 0.15]}><boxGeometry args={[0.025, 0.42, 0.025]} />{brassM('#b9853b')}</mesh>; })}
      <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.15, 0.15, 0.42, 6, 1, true]} /><meshPhysicalMaterial color="#ffd38a" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} emissive="#ffae3d" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0, 0.3, 0]} scale={[1, 1.5, 1]}><sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color={glow('#ffd06a', 4)} toneMapped={false} /></mesh>
      <mesh position={[0, 0.56, 0]}><coneGeometry args={[0.2, 0.16, 6]} />{brassM('#b9853b')}</mesh>
      <mesh position={[0, 0.67, 0]}><torusGeometry args={[0.05, 0.012, 8, 20]} />{brassM('#b9853b')}</mesh>
      <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[0.07, 0.05, 0.1, 16]} />{brassM('#b9853b')}</mesh>
      <mesh position={[0.252, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.065, 20]} /><meshBasicMaterial color={glow('#fff0b0', 4)} toneMapped={false} /></mesh>
      <pointLight position={[0, 0.35, 0]} color="#ffb24a" intensity={3} distance={2.6} />
    </group>
  );
}
function BrassMirror() {
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.26, 0], [0.27, 0.03], [0.2, 0.06], [0.001, 0.06]], 8)} castShadow>{brassM('#a9773a')}</mesh>
      {[-0.27, 0.27].map((x) => <group key={x}><mesh position={[x, 0.3, 0]}><cylinderGeometry args={[0.018, 0.022, 0.5, 8]} />{brassM('#a9773a')}</mesh><mesh position={[x, 0.56, 0]}><octahedronGeometry args={[0.03, 0]} /><meshBasicMaterial color={glow('#ffb84a', 2)} toneMapped={false} /></mesh></group>)}
      <group position={[0, 0.34, 0]}>
        <mesh><boxGeometry args={[0.5, 0.42, 0.02]} />{mirrorM}</mesh>
        {[[0, 0.215, 0.52, 0.025], [0, -0.215, 0.52, 0.025], [0.255, 0, 0.025, 0.45], [-0.255, 0, 0.025, 0.45]].map(([x, y, w, h], k) => <mesh key={k} position={[x, y, 0]}><boxGeometry args={[w, h, 0.035]} />{brassM('#a9773a')}</mesh>)}
        <Streaks />
      </group>
    </group>
  );
}
function AmberGem({ on }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} scale={[1, 0.4, 1]}><dodecahedronGeometry args={[0.24, 0]} /><meshStandardMaterial color="#6b5446" roughness={1} flatShading /></mesh>
      {[[0, 0, 0, 0.1, 0.42], [0.1, 0.03, -0.4, 0.06, 0.24], [-0.09, -0.04, 0.5, 0.06, 0.2], [0.02, 0.1, 0.2, 0.05, 0.16]].map(([x, z, t, r, h], k) => (
        <mesh key={k} position={[x, 0.08 + h / 2, z]} rotation={[0, k, t]}><cylinderGeometry args={[r * 0.4, r, h, 6]} /><meshPhysicalMaterial color={on ? '#ffb02e' : '#f3e9dc'} roughness={0.06} clearcoat={1} flatShading transmission={0.3} emissive={on ? '#ff8f1a' : '#000'} emissiveIntensity={on ? 0.9 : 0} /></mesh>
      ))}
      {on && <pointLight position={[0, 0.4, 0]} color="#ffa43a" intensity={3} distance={1.8} />}
    </group>
  );
}
function AmberGrotto() {
  const slab = useMemo(() => new RoundedBoxGeometry(0.92, 0.2, 0.92, 2, 0.05), []);
  return (
    <>
      <color attach="background" args={['#2d211c']} />
      <fog attach="fog" args={['#2d211c', 10, 20]} />
      <hemisphereLight args={['#ffcf9a', '#3a2a22', 0.45]} />
      <directionalLight position={[-4, 7, 3]} intensity={0.8} color="#ffd8a8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <mesh position={[0, -0.25, 0]} receiveShadow><cylinderGeometry args={[3.7, 3.9, 0.4, 14]} /><meshStandardMaterial color="#5a4436" roughness={1} flatShading /></mesh>
      {Array.from({ length: N * N }, (_, i) => { const x = i % N, y = Math.floor(i / N); return <mesh key={i} geometry={slab} position={at(x, y, 0.02)} rotation={[0, ((x * 5 + y * 3) % 3 - 1) * 0.04, 0]} receiveShadow castShadow><meshStandardMaterial color={lit.has(`${x},${y}`) ? '#f1c27a' : (x + y) % 2 ? '#9a8070' : '#8d7464'} roughness={0.95} emissive={lit.has(`${x},${y}`) ? '#d98a2a' : '#000'} emissiveIntensity={lit.has(`${x},${y}`) ? 0.35 : 0} /></mesh>; })}
      {/* crystal clusters and stalagmites around the cave floor */}
      {[[-3.2, -1.2], [3.1, 1.6], [-2.6, 2.7], [2.4, -2.9], [0.4, -3.4], [-3.4, 0.8]].map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]}><coneGeometry args={[0.28, 1.2 + (k % 3) * 0.4, 7]} /><meshStandardMaterial color="#6e5444" roughness={1} flatShading /></mesh>
          {[0, 1, 2].map((m) => <mesh key={m} position={[0.25 * Math.cos(m * 2), 0.2, 0.25 * Math.sin(m * 2)]} rotation={[0.3 * Math.sin(m), m, 0.4 * Math.cos(m)]}><cylinderGeometry args={[0.02, 0.07, 0.4, 6]} /><meshBasicMaterial color={glow(k % 2 ? '#ffb347' : '#ffd27a', 1.6)} toneMapped={false} /></mesh>)}
        </group>
      ))}
      <group position={at(...LAMP, 0.12)}><AmberLantern /></group>
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => <group key={n} position={at(...c, 0.12)} rotation={[0, r, 0]}><BrassMirror /></group>)}
      <group position={at(...GEM, 0.12)}><AmberGem on /></group>
      <group position={at(...GEM2, 0.12)}><AmberGem /></group>
      <mesh position={at(...WALL, 0.5)} castShadow><dodecahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color="#7a5f4c" roughness={1} flatShading /></mesh>
      <Sparkles color="#ffcf7a" />
      <Beam y={0.42} color="#ffbf4a" />
    </>
  );
}

/* ---------------- 5 · Lily Pond (floating lily pads on a calm sage pond at morning) ---------------- */
function FireflyJar() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.16, 0.18, 0.36, 24, 1, true]} /><meshPhysicalMaterial color="#f4fff6" transparent opacity={0.3} roughness={0.05} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.18, 0.18, 0.02, 24]} /><meshPhysicalMaterial color="#e9fff1" transparent opacity={0.5} /></mesh>
      <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.13, 0.15, 0.06, 24]} /><meshStandardMaterial color="#b7865a" roughness={0.8} /></mesh>
      <mesh position={[0, 0.5, 0]}><torusGeometry args={[0.07, 0.012, 8, 20]} /><meshStandardMaterial color="#d9c49a" /></mesh>
      {[[0.04, 0.2, 0.03], [-0.05, 0.28, -0.02], [0.02, 0.33, -0.05], [-0.03, 0.17, 0.05], [0.06, 0.3, 0.02]].map((p, k) => <mesh key={k} position={p}><sphereGeometry args={[0.025, 8, 6]} /><meshBasicMaterial color={glow('#fff1a0', 5)} toneMapped={false} /></mesh>)}
      <mesh position={[0.2, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[0.07, 20]} /><meshBasicMaterial color={glow('#fff1a0', 3.5)} toneMapped={false} /></mesh>
      <pointLight position={[0, 0.25, 0]} color="#ffe27a" intensity={2.5} distance={2.2} />
    </group>
  );
}
function ShellMirror() {
  const shell = useMemo(() => { const g = new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.scale(1, 0.35, 1); return g; }, []);
  return (
    <group>
      <mesh geometry={shell} castShadow><meshPhysicalMaterial color="#ffe1d6" roughness={0.3} clearcoat={1} iridescence={0.9} /></mesh>
      <mesh position={[0, 0.34, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.5, 8]} /><meshPhysicalMaterial color="#f1b6c4" roughness={0.3} clearcoat={1} /></mesh>
      <group position={[0, 0.38, 0]}>
        <mesh><circleGeometry args={[0.26, 48]} />{mirrorM}</mesh>
        <mesh><torusGeometry args={[0.265, 0.02, 10, 48]} /><meshPhysicalMaterial color="#f6c7d3" roughness={0.25} clearcoat={1} iridescence={1} /></mesh>
        <Streaks w={0.45} h={0.36} />
      </group>
    </group>
  );
}
function LotusGem({ on }) {
  return (
    <group>
      {Array.from({ length: 8 }, (_, k) => <group key={k} rotation={[0, (k / 8) * Math.PI * 2, 0]}><mesh position={[0, 0.1, 0.13]} rotation={[-0.6, 0, 0]} scale={[0.55, 0.25, 1.3]}><sphereGeometry args={[0.1, 14, 10]} /><meshPhysicalMaterial color={on ? '#ffd7e3' : '#fdf5f7'} roughness={0.4} sheen={1} sheenColor="#ffd0dc" /></mesh></group>)}
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.3, 0.3, 0.03, 24]} /><meshStandardMaterial color="#6fb565" /></mesh>
      <mesh position={[0, 0.28, 0]} scale={[1, 1.4, 1]}><octahedronGeometry args={[0.15, 0]} /><meshPhysicalMaterial color={on ? '#ffc23d' : '#f4f8f4'} roughness={0.05} clearcoat={1} flatShading emissive={on ? '#ffa21a' : '#000'} emissiveIntensity={on ? 1 : 0} /></mesh>
      {on && <pointLight position={[0, 0.3, 0]} color="#ffbd4a" intensity={2.5} distance={1.6} />}
    </group>
  );
}
function LilyPond() {
  const pad = useMemo(() => { const g = new THREE.CylinderGeometry(0.46, 0.46, 0.05, 32, 1, false, 0.25, Math.PI * 2 - 0.5); return g; }, []);
  return (
    <>
      <color attach="background" args={['#f5ead6']} />
      <hemisphereLight args={['#fffaf0', '#7aa88c', 1]} />
      <directionalLight position={[-5, 7, 4]} intensity={1.6} color="#fff2d8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <mesh position={[0, -0.05, 0]} receiveShadow><cylinderGeometry args={[3.9, 3.9, 0.1, 64]} /><meshPhysicalMaterial color="#8fc7b0" roughness={0.08} clearcoat={1} metalness={0.1} /></mesh>
      <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.95, 0.22, 12, 64]} /><meshStandardMaterial color="#c9b18c" roughness={1} /></mesh>
      {Array.from({ length: N * N }, (_, i) => { const x = i % N, y = Math.floor(i / N); return <mesh key={i} geometry={pad} position={at(x, y, 0.02)} rotation={[0, (x * 7 + y * 11) % 6, 0]} receiveShadow castShadow><meshStandardMaterial color={lit.has(`${x},${y}`) ? '#e9d77a' : (x + y) % 2 ? '#7fbf6f' : '#6fb565'} roughness={0.6} emissive={lit.has(`${x},${y}`) ? '#d8b52a' : '#000'} emissiveIntensity={lit.has(`${x},${y}`) ? 0.3 : 0} /></mesh>; })}
      {/* reeds, pebbles and a little duck at the edge */}
      {[[-3.5, 1.4], [3.4, -1.2], [-2.8, -2.6], [2.7, 2.8]].map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>{[0, 1, 2, 3].map((m) => <mesh key={m} position={[m * 0.08 - 0.12, 0.4, (m % 2) * 0.06]} rotation={[0, 0, (m - 1.5) * 0.08]}><cylinderGeometry args={[0.012, 0.02, 0.8 + m * 0.1, 6]} /><meshStandardMaterial color="#6f9f5c" /></mesh>)}<mesh position={[0.02, 0.85, 0]}><capsuleGeometry args={[0.035, 0.14, 4, 8]} /><meshStandardMaterial color="#8a5a3a" /></mesh></group>
      ))}
      <group position={[2.9, 0.05, -2.3]}><mesh position={[0, 0.1, 0]} scale={[1.3, 0.8, 1]}><sphereGeometry args={[0.16, 16, 12]} /><meshStandardMaterial color="#fff7e6" /></mesh><mesh position={[0.15, 0.24, 0]}><sphereGeometry args={[0.09, 14, 10]} /><meshStandardMaterial color="#fff7e6" /></mesh><mesh position={[0.25, 0.23, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[0.035, 0.07, 8]} /><meshStandardMaterial color="#f2a65a" /></mesh></group>
      <group position={at(...LAMP, 0.05)}><FireflyJar /></group>
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => <group key={n} position={at(...c, 0.05)} rotation={[0, r, 0]}><ShellMirror /></group>)}
      <group position={at(...GEM, 0.05)}><LotusGem on /></group>
      <group position={at(...GEM2, 0.05)}><LotusGem /></group>
      <group position={at(...WALL, 0.05)}>{[[0, 0.15, 0, 0.3], [0.15, 0.4, 0.05, 0.2], [-0.1, 0.35, -0.08, 0.18]].map(([x, y, z, r], k) => <mesh key={k} position={[x, y, z]} scale={[1, 0.75, 1]} castShadow><dodecahedronGeometry args={[r, 1]} /><meshStandardMaterial color={['#b8ad9c', '#c9bfae', '#a99d8a'][k]} roughness={1} flatShading /></mesh>)}</group>
      <Sparkles color="#fff1a0" n={14} />
      <Beam y={0.3} color="#ffd860" />
    </>
  );
}

/* ---------------- 6 · Clockwork Workshop (an inventor's desk of brass and wood) ---------------- */
function Gear({ r = 0.4, teeth = 12, h = 0.06, color = '#c9973f' }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    for (let k = 0; k < teeth * 2; k++) { const a = (k / (teeth * 2)) * Math.PI * 2, rr = k % 2 ? r : r * 0.86; const p = [Math.cos(a) * rr, Math.sin(a) * rr]; k ? s.lineTo(...p) : s.moveTo(...p); }
    s.holes.push(new THREE.Path().absarc(0, 0, r * 0.25, 0, Math.PI * 2));
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g;
  }, [r, teeth, h]);
  return <mesh geometry={geo} castShadow receiveShadow><meshPhysicalMaterial color={color} metalness={0.75} roughness={0.32} /></mesh>;
}
function Spotlamp() {
  return (
    <group>
      <Gear r={0.28} teeth={10} h={0.05} color="#8a6a3a" />
      <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.03, 0.04, 0.3, 10]} />{brassM()}</mesh>
      <mesh position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.12, 0.018, 8, 24, Math.PI]} />{brassM()}</mesh>
      <group position={[0, 0.36, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh><cylinderGeometry args={[0.13, 0.09, 0.32, 24, 1, true]} /><meshPhysicalMaterial color="#2f5d55" metalness={0.5} roughness={0.35} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.16, 0]}><torusGeometry args={[0.13, 0.02, 8, 24]} />{brassM()}</mesh>
        <mesh position={[0, 0.162, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.12, 24]} /><meshBasicMaterial color={glow('#fff2c0', 4)} toneMapped={false} /></mesh>
      </group>
      <pointLight position={[0.2, 0.36, 0]} color="#ffd890" intensity={2} distance={2} />
    </group>
  );
}
function GimbalMirror() {
  return (
    <group>
      <Gear r={0.32} teeth={14} h={0.05} />
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.1, 0.13, 24]} /><meshBasicMaterial color="#5a3f22" /></mesh>
      <group position={[0, 0.38, 0]}>
        <mesh><torusGeometry args={[0.29, 0.02, 10, 40]} />{brassM()}</mesh>
        <mesh><circleGeometry args={[0.26, 40]} />{mirrorM}</mesh>
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, -0.16, 0]}><cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />{brassM()}</mesh>)}
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.03, 12, 10]} />{brassM('#e8c06a')}</mesh>)}
        <Streaks w={0.45} h={0.38} />
      </group>
    </group>
  );
}
function SetGem({ on }) {
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.18, 0], [0.2, 0.05], [0.12, 0.12], [0.06, 0.2], [0.001, 0.2]], 8)} castShadow>{brassM()}</mesh>
      {[0, 1, 2, 3].map((k) => <mesh key={k} position={[Math.cos(k * Math.PI / 2) * 0.12, 0.27, Math.sin(k * Math.PI / 2) * 0.12]} rotation={[Math.sin(k * Math.PI / 2) * 0.4, 0, -Math.cos(k * Math.PI / 2) * 0.4]}><cylinderGeometry args={[0.012, 0.015, 0.16, 6]} />{brassM()}</mesh>)}
      <mesh position={[0, 0.32, 0]} geometry={lath([[0.001, -0.17], [0.17, 0], [0.17, 0.03], [0.1, 0.1], [0.001, 0.1]], 8)}><meshPhysicalMaterial color={on ? '#ffbe33' : '#f3f1ec'} roughness={0.04} clearcoat={1} flatShading emissive={on ? '#ff9c18' : '#000'} emissiveIntensity={on ? 0.9 : 0} /></mesh>
      {on && <pointLight position={[0, 0.35, 0]} color="#ffb340" intensity={2.5} distance={1.6} />}
    </group>
  );
}
function Workshop() {
  const plank = useMemo(() => new RoundedBoxGeometry(0.94, 0.12, 0.94, 2, 0.03), []);
  return (
    <>
      <color attach="background" args={['#e9d8bf']} />
      <hemisphereLight args={['#fff4e2', '#7a5a3a', 0.9]} />
      <directionalLight position={[-4, 8, 4]} intensity={1.7} color="#fff0d6" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      <mesh position={[0, -0.2, 0]} receiveShadow><boxGeometry args={[8, 0.3, 7]} /><meshStandardMaterial color="#9c6b43" roughness={0.7} /></mesh>
      <mesh position={[0, -0.04, 0]} receiveShadow castShadow><boxGeometry args={[5.5, 0.06, 5.5]} /><meshPhysicalMaterial color="#3f6b5c" roughness={0.9} sheen={1} /></mesh>
      {Array.from({ length: N * N }, (_, i) => { const x = i % N, y = Math.floor(i / N); return <mesh key={i} geometry={plank} position={at(x, y, 0.03)} receiveShadow castShadow><meshStandardMaterial color={lit.has(`${x},${y}`) ? '#f0cf86' : (x + y) % 2 ? '#d9b98e' : '#cfac7f'} roughness={0.7} emissive={lit.has(`${x},${y}`) ? '#e09a2a' : '#000'} emissiveIntensity={lit.has(`${x},${y}`) ? 0.25 : 0} /></mesh>; })}
      {/* desk props: big gears, a pencil, an inkwell, a ruler */}
      <group position={[-3.4, -0.03, 2.6]}><Gear r={0.7} teeth={18} h={0.08} color="#b98a3c" /></group>
      <group position={[3.2, -0.03, -2.9]} rotation={[0, 0.3, 0]}><Gear r={0.5} teeth={14} h={0.08} color="#a87b36" /></group>
      <mesh position={[3.3, 0.02, 2.2]} rotation={[0, 0.5, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 1.6, 6]} /><meshStandardMaterial color="#f2c14e" /></mesh>
      <mesh position={[-3.3, 0.15, -2.4]}><cylinderGeometry args={[0.25, 0.3, 0.35, 16]} /><meshPhysicalMaterial color="#2c3a3a" roughness={0.1} clearcoat={1} /></mesh>
      <mesh position={[0, 0.0, 3.25]} rotation={[0, 0.02, 0]}><boxGeometry args={[4, 0.03, 0.4]} /><meshStandardMaterial color="#efe2c4" /></mesh>
      <group position={at(...LAMP, 0.1)}><Spotlamp /></group>
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4], [SPARE, Math.PI / 4]].map(([c, r], n) => <group key={n} position={at(...c, 0.1)} rotation={[0, r, 0]}><GimbalMirror /></group>)}
      <group position={at(...GEM, 0.1)}><SetGem on /></group>
      <group position={at(...GEM2, 0.1)}><SetGem /></group>
      <group position={at(...WALL, 0.1)}>{[['#a3483a', 0], ['#3f6b5c', 0.12], ['#c9973f', 0.24]].map(([c, y], k) => <mesh key={k} position={[0, y + 0.06, 0]} rotation={[0, k * 0.15, 0]} castShadow><boxGeometry args={[0.7, 0.11, 0.55]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>)}</group>
      <Beam y={0.46} color="#ffd66a" />
    </>
  );
}

/* ---------------- Natural light: a soft shaft with gentle edges, dust in it, and a soft pool on the floor ---------------- */
function softStrip(stops) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128;
  const d = c.getContext('2d'); const g = d.createLinearGradient(0, 0, 0, 128);
  stops.forEach(([at, col]) => g.addColorStop(at, col)); d.fillStyle = g; d.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SHAFT = softStrip([[0, 'rgba(255,214,140,0)'], [0.32, 'rgba(255,214,140,0.25)'], [0.47, 'rgba(255,240,205,0.85)'], [0.5, 'rgba(255,252,240,1)'], [0.53, 'rgba(255,240,205,0.85)'], [0.68, 'rgba(255,214,140,0.25)'], [1, 'rgba(255,214,140,0)']]);
const POOL = softStrip([[0, 'rgba(255,200,120,0)'], [0.3, 'rgba(255,205,130,0.35)'], [0.5, 'rgba(255,225,170,0.6)'], [0.7, 'rgba(255,205,130,0.35)'], [1, 'rgba(255,200,120,0)']]);
function Motes({ A, B, n }) {
  const ref = useRef([]);
  const seeds = useMemo(() => Array.from({ length: n }, (_, k) => [k / n, Math.sin(k * 9.1) * 0.06, Math.cos(k * 5.3) * 0.06]), [n]);
  useFrame(({ clock }) => ref.current.forEach((m, k) => {
    if (!m) return; const t = (seeds[k][0] + clock.elapsedTime * 0.04) % 1;
    m.position.lerpVectors(A, B, t); m.position.y += seeds[k][1] + Math.sin(clock.elapsedTime * 0.8 + k) * 0.02; m.position.z += seeds[k][2];
  }));
  return seeds.map((_, k) => <mesh key={k} ref={(m) => (ref.current[k] = m)}><sphereGeometry args={[0.008, 6, 4]} /><meshBasicMaterial color={glow('#fff3d6', 2.2)} toneMapped={false} transparent opacity={0.8} /></mesh>);
}
function NaturalBeam({ y = 0.42, floorY = 0.07, width = 0.34 }) {
  return PATH.map(([a, b], i) => {
    const A = new THREE.Vector3(...at(a[0], a[1], y)), B = new THREE.Vector3(...at(b[0], b[1], y));
    const mid = A.clone().lerp(B, 0.5), len = A.distanceTo(B), ang = -Math.atan2(B.z - A.z, B.x - A.x);
    const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide };
    return (
      <group key={i}>
        <group position={mid} rotation={[0, ang, 0]}>
          {/* two crossed soft planes make a round-looking shaft with feathered edges */}
          {[0, Math.PI / 2].map((roll) => <mesh key={roll} rotation={[roll, 0, 0]}><planeGeometry args={[len, width]} /><meshBasicMaterial map={SHAFT} color={glow('#ffe2a8', 1.25)} opacity={0.9} {...add} /></mesh>)}
          <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, len, 8]} /><meshBasicMaterial color={glow('#fff8e8', 2.2)} toneMapped={false} /></mesh>
        </group>
        {/* the warm pool it casts on the floor beneath */}
        <mesh position={[mid.x, floorY, mid.z]} rotation={[-Math.PI / 2, 0, -ang]}><planeGeometry args={[len + 0.4, 0.95]} /><meshBasicMaterial map={POOL} {...add} opacity={0.85} /></mesh>
        <Motes A={A} B={B} n={Math.round(len * 10)} />
      </group>
    );
  });
}
/* a soft glow where light meets a mirror or the gem */
let flareTex = null;
function Flare({ position, size = 0.6 }) {
  if (!flareTex) { const c = document.createElement('canvas'); c.width = c.height = 128; const d = c.getContext('2d'); const g = d.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(0.2, 'rgba(255,225,160,0.6)'); g.addColorStop(1, 'rgba(255,200,120,0)'); d.fillStyle = g; d.fillRect(0, 0, 128, 128); flareTex = new THREE.CanvasTexture(c); }
  return <sprite position={position} scale={[size, size, 1]}><spriteMaterial map={flareTex} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></sprite>;
}


/** A fixed mirror: the same brass round mirror, bolted on a heavy carved wooden plinth with brass corners (no gear: it can't turn). */
function FixedStandMirror() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow><boxGeometry args={[0.56, 0.12, 0.42]} /><meshStandardMaterial color="#5e3a26" roughness={0.6} /></mesh>
      <mesh position={[0, 0.135, 0]} castShadow receiveShadow><boxGeometry args={[0.48, 0.03, 0.34]} /><meshStandardMaterial color="#6f4630" roughness={0.55} /></mesh>
      {[[-0.25, -0.18], [0.25, -0.18], [-0.25, 0.18], [0.25, 0.18]].map(([x, z]) => <mesh key={`${x}${z}`} position={[x, 0.06, z]}><boxGeometry args={[0.07, 0.13, 0.07]} />{brassM()}</mesh>)}
      {[-0.17, 0.17].map((x) => <mesh key={x} position={[x, 0.155, 0.13]}><cylinderGeometry args={[0.02, 0.02, 0.015, 12]} />{brassM('#e8c06a')}</mesh>)}
      <group position={[0, 0.42, 0]}>
        <mesh><torusGeometry args={[0.29, 0.022, 10, 40]} />{brassM()}</mesh>
        <mesh><circleGeometry args={[0.26, 40]} />{mirrorM}</mesh>
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, -0.14, 0]}><boxGeometry args={[0.04, 0.32, 0.05]} />{brassM()}</mesh>)}
        <mesh position={[0, 0.31, 0]}><sphereGeometry args={[0.03, 12, 10]} />{brassM('#e8c06a')}</mesh>
        <Streaks w={0.45} h={0.38} />
      </group>
    </group>
  );
}

/* ---------------- 7 · The Library (a cosy reading room: books, brass and warm lamplight) ---------------- */
function Book({ w = 0.55, d = 0.4, h = 0.09, color, rot = 0, y = 0 }) {
  return (
    <group position={[0, y + h / 2, 0]} rotation={[0, rot, 0]}>
      <mesh castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} roughness={0.75} /></mesh>
      <mesh position={[0.012, 0, 0]}><boxGeometry args={[w - 0.03, h - 0.025, d + 0.004]} /><meshStandardMaterial color="#f6ecd6" roughness={0.9} /></mesh>
      <mesh position={[-w / 2 - 0.001, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[d * 0.7, h * 0.18]} /><meshStandardMaterial color="#e5c06a" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  );
}
function BankerLamp() {
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.2, 0], [0.21, 0.03], [0.16, 0.06], [0.001, 0.06]], 40)} castShadow>{brassM()}</mesh>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.022, 0.03, 0.34, 12]} />{brassM()}</mesh>
      <mesh position={[0.04, 0.4, 0]} rotation={[0, 0, -0.5]}><cylinderGeometry args={[0.018, 0.018, 0.14, 10]} />{brassM()}</mesh>
      <group position={[0.12, 0.44, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh geometry={lath([[0.06, -0.12], [0.16, -0.07], [0.19, 0.08], [0.17, 0.12], [0.05, 0.12]], 40)} castShadow><meshPhysicalMaterial color="#2f6e57" roughness={0.15} clearcoat={1} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.115, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.165, 32]} /><meshBasicMaterial color={glow('#fff0c8', 3)} toneMapped={false} /></mesh>
      </group>
      <mesh position={[0.02, 0.18, 0.05]}><cylinderGeometry args={[0.006, 0.006, 0.14, 6]} />{brassM()}</mesh>
      <mesh position={[0.02, 0.1, 0.05]}><sphereGeometry args={[0.018, 10, 8]} />{brassM('#e8c06a')}</mesh>
      <pointLight position={[0.3, 0.44, 0]} color="#ffcf8a" intensity={2.4} distance={2.4} />
    </group>
  );
}
function PaperweightGem({ on }) {
  return (
    <group>
      <Book w={0.6} d={0.44} h={0.08} color="#7a3b33" rot={0.2} />
      <Book w={0.52} d={0.4} h={0.07} color="#2f5f73" rot={-0.15} y={0.08} />
      <group position={[0, 0.15, 0]}>
        <mesh geometry={lath([[0.001, 0], [0.13, 0], [0.14, 0.03], [0.1, 0.05], [0.001, 0.05]], 8)}>{brassM()}</mesh>
        <mesh position={[0, 0.23, 0]} geometry={lath([[0.001, -0.18], [0.16, 0.0], [0.16, 0.03], [0.1, 0.09], [0.001, 0.09]], 8)}><meshPhysicalMaterial color={on ? '#ffc04a' : '#f1f4f8'} roughness={0.03} clearcoat={1} flatShading transmission={on ? 0.15 : 0.5} thickness={0.3} emissive={on ? '#ff9e2a' : '#000'} emissiveIntensity={on ? 0.8 : 0} /></mesh>
      </group>
      {on && <><pointLight position={[0, 0.4, 0]} color="#ffb850" intensity={2} distance={1.6} /><Flare position={[0, 0.38, 0]} size={0.9} /></>}
    </group>
  );
}
function Shelf({ position, rotation, books = 9, seed = 0 }) {
  const colors = ['#7a3b33', '#2f5f73', '#3f6b4c', '#a36b2a', '#5a3b5c', '#c49a4a', '#8a4a3a', '#2e4a3a'];
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.9, -0.05]} castShadow receiveShadow><boxGeometry args={[2.4, 1.9, 0.08]} /><meshStandardMaterial color="#6b4430" roughness={0.8} /></mesh>
      {[0.05, 0.65, 1.25, 1.85].map((y) => <mesh key={y} position={[0, y, 0.12]} castShadow receiveShadow><boxGeometry args={[2.4, 0.06, 0.38]} /><meshStandardMaterial color="#7d5136" roughness={0.75} /></mesh>)}
      {[0.08, 0.68, 1.28].flatMap((y, row) => {
        let x = -1.12; const out = [];
        for (let k = 0; k < books; k++) { const w = 0.07 + ((k * 7 + row * 3 + seed) % 4) * 0.025, h = 0.38 + ((k * 5 + row + seed) % 3) * 0.08; out.push(<mesh key={`${row}-${k}`} position={[x + w / 2, y + h / 2, 0.12]} rotation={[0, 0, ((k + seed) % 9 === 0) ? -0.15 : 0]} castShadow><boxGeometry args={[w, h, 0.3]} /><meshStandardMaterial color={colors[(k * 3 + row * 5 + seed) % colors.length]} roughness={0.7} /></mesh>); x += w + 0.012; if (x > 1.05) break; }
        return out;
      })}
    </group>
  );
}
function Library() {
  const plank = useMemo(() => new RoundedBoxGeometry(0.95, 0.08, 0.95, 2, 0.02), []);
  return (
    <>
      <color attach="background" args={['#3b2a22']} />
      <fog attach="fog" args={['#3b2a22', 12, 24]} />
      <hemisphereLight args={['#ffe6c4', '#3a2418', 0.55]} />
      <directionalLight position={[-3, 7, 5]} intensity={0.9} color="#ffe4bd" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} />
      {/* parquet floor and a rug the puzzle sits on */}
      <mesh position={[0, -0.12, 0]} receiveShadow><boxGeometry args={[11, 0.2, 9]} /><meshStandardMaterial color="#8a5a3a" roughness={0.6} /></mesh>
      {Array.from({ length: 22 }, (_, k) => <mesh key={k} position={[-5.25 + k * 0.5, -0.015, 0]} receiveShadow><boxGeometry args={[0.48, 0.01, 9]} /><meshStandardMaterial color={k % 2 ? '#94633f' : '#87583a'} roughness={0.55} /></mesh>)}
      <mesh position={[0, 0.0, 0]} receiveShadow><boxGeometry args={[5.6, 0.03, 5.6]} /><meshStandardMaterial color="#7d2f2a" roughness={1} /></mesh>
      <mesh position={[0, 0.005, 0]} receiveShadow><boxGeometry args={[5.2, 0.03, 5.2]} /><meshStandardMaterial color="#c99a5a" roughness={1} /></mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow><boxGeometry args={[5.05, 0.03, 5.05]} /><meshStandardMaterial color="#8a3530" roughness={1} /></mesh>
      {Array.from({ length: N * N }, (_, i) => { const x = i % N, y = Math.floor(i / N); return <mesh key={i} geometry={plank} position={at(x, y, 0.05)} receiveShadow castShadow><meshStandardMaterial color={(x + y) % 2 ? '#c99868' : '#bd8b5c'} roughness={0.55} /></mesh>; })}
      <Shelf position={[-0.3, 0, -3.9]} seed={1} />
      <Shelf position={[-3.9, 0, -0.4]} rotation={[0, Math.PI / 2, 0]} seed={4} />
      {/* an armchair-side table with a globe and a candle */}
      <group position={[3.6, 0, -2.6]}>
        <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.35, 0.35, 0.04, 24]} /><meshStandardMaterial color="#6b4430" /></mesh>
        <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.04, 0.06, 0.3, 10]} /><meshStandardMaterial color="#6b4430" /></mesh>
        <mesh position={[0, 0.55, 0]} castShadow><sphereGeometry args={[0.18, 24, 16]} /><meshStandardMaterial color="#d9c49a" roughness={0.6} /></mesh>
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, 0.4]}><torusGeometry args={[0.21, 0.01, 6, 32, Math.PI]} />{brassM()}</mesh>
      </group>
      <group position={at(...LAMP, 0.09)}><BankerLamp /></group>
      {[[M1, Math.PI / 4], [M2, -Math.PI / 4]].map(([c, r], n) => <group key={n} position={at(...c, 0.09)} rotation={[0, r, 0]}><GimbalMirror /></group>)}
      <group position={at(...SPARE, 0.09)} rotation={[0, Math.PI / 4, 0]}><FixedStandMirror /></group>
      {[M1, M2].map((c, n) => <Flare key={n} position={at(...c, 0.47)} size={0.55} />)}
      <group position={at(...GEM, 0.09)}><PaperweightGem on /></group>
      <group position={at(...GEM2, 0.09)}><PaperweightGem /></group>
      {/* the wall: a tall stack of old books */}
      <group position={at(...WALL, 0.09)}>{['#7a3b33', '#3f6b4c', '#a36b2a', '#2f5f73', '#5a3b5c'].map((c, k) => <Book key={k} w={0.7 - k * 0.04} d={0.52 - k * 0.02} h={0.1} color={c} rot={(k % 2 ? 1 : -1) * 0.12 * k} y={k * 0.1} />)}</group>
      <NaturalBeam y={0.47} floorY={0.1} />
    </>
  );
}


/* ---------------- Wood: a painted plank texture (grain, knots, color shifts between boards, thin seams) ---------------- */
const woodCache = new Map();
function woodTexture({ base = [148, 98, 62], planksAcross = 6, length = 4, seed = 1, varied = 18 } = {}) {
  const key = JSON.stringify([base, planksAcross, length, seed, varied]);
  if (woodCache.has(key)) return woodCache.get(key);
  const W = 1024, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H;
  const d = c.getContext('2d');
  let r = seed * 9301 + 49297; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const rowH = H / planksAcross;
  for (let row = 0; row < planksAcross; row++) {
    let x = -rnd() * (W / length);
    while (x < W) {
      const len = (W / length) * (0.7 + rnd() * 0.6);
      const shade = (rnd() - 0.5) * varied;
      const [cr, cg, cb] = base.map((v) => Math.max(0, Math.min(255, v + shade)));
      const y0 = row * rowH;
      d.fillStyle = `rgb(${cr},${cg},${cb})`; d.fillRect(x, y0, len, rowH);
      // grain: long wavy lines, slightly darker and lighter
      for (let g = 0; g < 14; g++) {
        const gy = y0 + rnd() * rowH, amp = 1 + rnd() * 3, freq = 0.004 + rnd() * 0.01, ph = rnd() * 6;
        d.strokeStyle = `rgba(${g % 3 ? 60 : 255},${g % 3 ? 35 : 230},${g % 3 ? 20 : 200},${0.06 + rnd() * 0.08})`;
        d.lineWidth = 0.6 + rnd() * 1.4; d.beginPath();
        for (let gx = x; gx <= x + len; gx += 8) { const yy = gy + Math.sin(gx * freq + ph) * amp; gx === x ? d.moveTo(gx, yy) : d.lineTo(gx, yy); }
        d.stroke();
      }
      if (rnd() < 0.07) { // a small knot
        const kx = x + rnd() * len, ky = y0 + rowH * (0.3 + rnd() * 0.4);
        const kg = d.createRadialGradient(kx, ky, 0, kx, ky, rowH * 0.18);
        kg.addColorStop(0, 'rgba(70,40,22,0.28)'); kg.addColorStop(1, 'rgba(60,32,18,0)');
        d.fillStyle = kg; d.beginPath(); d.ellipse(kx, ky, rowH * 0.3, rowH * 0.14, 0, 0, Math.PI * 2); d.fill();
      }
      d.fillStyle = 'rgba(40,22,12,0.55)'; d.fillRect(x, y0, 2, rowH); // end seam
      x += len;
    }
    d.fillStyle = 'rgba(40,22,12,0.6)'; d.fillRect(0, row * rowH, W, 2.5); // side seam
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  woodCache.set(key, t); return t;
}
function WoodFloor({ size = [13, 11] }) {
  const tex = useMemo(() => { const t = woodTexture({ base: [124, 78, 48], planksAcross: 8, length: 3, seed: 3 }).clone(); t.needsUpdate = true; t.repeat.set(size[0] / 4, size[1] / 4); return t; }, [size]);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow><planeGeometry args={size} /><meshPhysicalMaterial map={tex} roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.35} /></mesh>;
}
function ParquetTile({ position, x, y }) {
  const tex = useMemo(() => {
    const t = woodTexture({ base: [201, 152, 104], planksAcross: 4, length: 1.4, seed: 7 + ((x * 3 + y * 5) % 6), varied: 22 }).clone();
    t.needsUpdate = true; t.rotation = (x + y) % 2 ? Math.PI / 2 : 0; t.center.set(0.5, 0.5); return t;
  }, [x, y]);
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={[0.95, 0.08, 0.95]} />
      <meshPhysicalMaterial map={tex} roughness={0.35} clearcoat={0.8} clearcoatRoughness={0.2} />
    </mesh>
  );
}

/* ---------------- 8 · The Library, every piece ---------------- */
const L = 6;
const at6 = (x, y, h = 0) => [x - L / 2 + 0.5, h, y - L / 2 + 0.5];
const BEAM_TINT = { sun: '#ffe2a8', coral: '#ff9a86' };
function LibBeam({ a, b, color = 'sun', y = 0.47 }) {
  const A = new THREE.Vector3(...at6(a[0], a[1], y)), B = new THREE.Vector3(...at6(b[0], b[1], y));
  const mid = A.clone().lerp(B, 0.5), len = A.distanceTo(B), ang = -Math.atan2(B.z - A.z, B.x - A.x);
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide };
  return (
    <group>
      <group position={mid} rotation={[0, ang, 0]}>
        {[0, Math.PI / 2].map((roll) => <mesh key={roll} rotation={[roll, 0, 0]}><planeGeometry args={[len, 0.34]} /><meshBasicMaterial map={SHAFT} color={glow(BEAM_TINT[color], 1.25)} opacity={0.9} {...add} /></mesh>)}
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, len, 8]} /><meshBasicMaterial color={glow(color === 'coral' ? '#ffd4cc' : '#fff8e8', 2.2)} toneMapped={false} /></mesh>
      </group>
      <mesh position={[mid.x, 0.1, mid.z]} rotation={[-Math.PI / 2, 0, -ang]}><planeGeometry args={[len + 0.4, 0.95]} /><meshBasicMaterial map={POOL} color={color === 'coral' ? '#ffb4a4' : '#ffffff'} {...add} opacity={0.85} /></mesh>
      <Motes A={A} B={B} n={Math.round(len * 10)} />
    </group>
  );
}
const PAIR = { a: '#e8b84a', b: '#e98a9e' };
function Emblem({ pair = 'a', y = 0.72 }) {
  return <group position={[0, y, 0]}><mesh><cylinderGeometry args={[0.06, 0.06, 0.02, 20]} />{brassM()}</mesh><mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.045, 5]} /><meshStandardMaterial color={PAIR[pair]} /></mesh></group>;
}
function GearMirrorVariant({ kind = 'plain', pair }) {
  return (
    <group>
      <Gear r={0.32} teeth={14} h={0.05} />
      <group position={[0, 0.38, 0]}>
        <mesh><torusGeometry args={[0.29, 0.02, 10, 40]} />{brassM()}</mesh>
        <mesh>
          <circleGeometry args={[0.26, 40]} />
          {kind === 'splitter' ? <meshPhysicalMaterial color="#e9fbff" transmission={0.75} roughness={0.03} thickness={0.02} iridescence={1} transparent opacity={0.55} side={THREE.DoubleSide} /> : mirrorM}
        </mesh>
        {kind === 'oneSided' && <mesh position={[0, 0, -0.012]}><circleGeometry args={[0.27, 40]} /><meshStandardMaterial color="#3b2418" roughness={0.6} side={THREE.BackSide} /></mesh>}
        {kind === 'splitter' && [-0.15, -0.05, 0.05, 0.15].map((x) => <mesh key={x} position={[x, 0, 0.004]}><planeGeometry args={[0.05, 0.012]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
        {kind === 'cracked' && [[-0.08, 0.06, 0.6, 0.22], [0.06, -0.04, -0.7, 0.2], [0.02, 0.12, 0.2, 0.12]].map(([x, y, r, l], k) => <mesh key={k} position={[x, y, 0.004]} rotation={[0, 0, r]}><planeGeometry args={[0.012, l]} /><meshBasicMaterial color="#5b4a40" /></mesh>)}
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, -0.16, 0]}><cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />{brassM()}</mesh>)}
        {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0, 0]}><sphereGeometry args={[0.03, 12, 10]} />{brassM('#e8c06a')}</mesh>)}
        {kind !== 'splitter' && <Streaks w={0.45} h={0.38} />}
      </group>
      {pair && <Emblem pair={pair} />}
      {kind === 'cracked' && [0, 1, 2].map((k) => <mesh key={k} position={[-0.1 + k * 0.1, 0.07, 0.34]}><sphereGeometry args={[0.03, 10, 8]} /><meshStandardMaterial color={k < 2 ? '#f2a67e' : '#bfb4a8'} /></mesh>)}
    </group>
  );
}
function TurningBankerLamp() {
  return <group><Gear r={0.34} teeth={16} h={0.05} color="#b98a3c" /><group position={[0, 0.05, 0]}><BankerLamp /></group></group>;
}
function ColorGlass({ color = '#ff8f7a' }) {
  return (
    <group>
      <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.5, 0.06, 0.2]} /><meshStandardMaterial color="#6b4430" /></mesh>
      <group position={[0, 0.36, 0]}>
        <mesh><circleGeometry args={[0.24, 32]} /><meshPhysicalMaterial color={color} transmission={0.6} roughness={0.08} transparent opacity={0.7} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.35} /></mesh>
        <mesh><torusGeometry args={[0.245, 0.02, 8, 36]} />{brassM()}</mesh>
        {[0, Math.PI / 3, -Math.PI / 3].map((r) => <mesh key={r} rotation={[0, 0, r]}><planeGeometry args={[0.48, 0.01]} /><meshBasicMaterial color="#5a3a22" side={THREE.DoubleSide} /></mesh>)}
        <mesh position={[0, -0.27, 0]}><boxGeometry args={[0.04, 0.1, 0.04]} />{brassM()}</mesh>
      </group>
    </group>
  );
}
function LibPrism() {
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.22, 0], [0.23, 0.04], [0.15, 0.08], [0.001, 0.08]], 6)} castShadow>{brassM()}</mesh>
      <mesh position={[0, 0.34, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.5, 3]} /><meshPhysicalMaterial color="#fff6ea" transmission={0.6} roughness={0.03} thickness={0.4} iridescence={1} clearcoat={1} flatShading transparent opacity={0.85} /></mesh>
      {['#ff9a86', '#ffd36a', '#8fd18a'].map((c, k) => <mesh key={c} position={[0.12, 0.25 + k * 0.08, 0.08]} rotation={[0, 0.6, 0]}><planeGeometry args={[0.12, 0.03]} /><meshBasicMaterial color={glow(c, 1.4)} toneMapped={false} transparent opacity={0.8} /></mesh>)}
    </group>
  );
}
function MagicBook({ pair = 'a' }) {
  const ring = useRef();
  useFrame((_, dt) => ring.current && (ring.current.rotation.z += dt * 1.2));
  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow><boxGeometry args={[0.66, 0.06, 0.46]} /><meshStandardMaterial color="#4a2a3a" /></mesh>
      {[-0.16, 0.16].map((x) => <mesh key={x} position={[x, 0.09, 0]} rotation={[0, 0, x > 0 ? -0.12 : 0.12]}><boxGeometry args={[0.3, 0.04, 0.42]} /><meshStandardMaterial color="#f6ecd6" /></mesh>)}
      <group position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={ring}><torusGeometry args={[0.2, 0.035, 10, 40, Math.PI * 1.6]} /><meshBasicMaterial color={glow(PAIR[pair], 1.8)} toneMapped={false} /></mesh>
        <mesh><circleGeometry args={[0.17, 32]} /><meshBasicMaterial color={glow(PAIR[pair], 0.9)} toneMapped={false} transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>
      </group>
      <Emblem pair={pair} y={0.13} />
    </group>
  );
}
function BookcaseGate({ pair = 'a' }) {
  return (
    <group>
      <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[0.8, 0.64, 0.24]} /><meshStandardMaterial color="#6b4430" /></mesh>
      {[0.14, 0.42].map((y) => <mesh key={y} position={[0, y, 0.1]}><boxGeometry args={[0.72, 0.03, 0.06]} /><meshStandardMaterial color="#7d5136" /></mesh>)}
      {Array.from({ length: 9 }, (_, k) => <mesh key={k} position={[-0.32 + k * 0.08, 0.26, 0.06]}><boxGeometry args={[0.06, 0.2, 0.14]} /><meshStandardMaterial color={['#7a3b33', '#2f5f73', '#3f6b4c', '#a36b2a'][k % 4]} /></mesh>)}
      <Emblem pair={pair} y={0.66} />
    </group>
  );
}
function BellSwitch({ pair = 'a' }) {
  return (
    <group>
      <Book w={0.5} d={0.36} h={0.08} color="#3f6b4c" />
      <mesh position={[0, 0.13, 0]}><cylinderGeometry args={[0.11, 0.12, 0.03, 24]} />{brassM()}</mesh>
      <mesh position={[0, 0.2, 0]} scale={[1, 0.7, 1]}><sphereGeometry args={[0.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />{brassM('#e2b453')}</mesh>
      <mesh position={[0, 0.3, 0]}><sphereGeometry args={[0.025, 10, 8]} />{brassM()}</mesh>
      <Emblem pair={pair} y={0.35} />
    </group>
  );
}
function InkPot() {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.14, 0.17, 0.22, 8]} /><meshPhysicalMaterial color="#1f1a24" roughness={0.08} clearcoat={1} /></mesh>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.07, 0.08, 0.05, 16]} />{brassM()}</mesh>
      <mesh position={[0.06, 0.45, 0]} rotation={[0, 0, -0.35]}><cylinderGeometry args={[0.006, 0.01, 0.42, 6]} /><meshStandardMaterial color="#f4ede0" /></mesh>
      <mesh position={[0.12, 0.6, 0]} rotation={[0, 0, -0.35]} scale={[0.35, 1, 0.08]}><sphereGeometry args={[0.12, 12, 8]} /><meshStandardMaterial color="#fffaf2" /></mesh>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 24]} /><meshBasicMaterial color="#1f1a24" transparent opacity={0.35} /></mesh>
    </group>
  );
}
function DustSheet() {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.22, 0]} scale={[1, 0.6, 1]} castShadow><sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#efe6d6" roughness={1} /></mesh>
      {[0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2; return <mesh key={k} position={[Math.cos(a) * 0.36, 0.08, Math.sin(a) * 0.36]} rotation={[0, -a, 0.3]} scale={[0.3, 1, 1]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#e6dccb" roughness={1} /></mesh>; })}
      <mesh position={[0, 0.48, 0]}><sphereGeometry args={[0.06, 12, 8]} /><meshStandardMaterial color="#e6dccb" /></mesh>
    </group>
  );
}
function TintGem({ on, tint = '#ffc04a', glowC = '#ff9e2a' }) {
  return (
    <group>
      <Book w={0.6} d={0.44} h={0.08} color="#7a3b33" rot={0.2} />
      <Book w={0.52} d={0.4} h={0.07} color="#2f5f73" rot={-0.15} y={0.08} />
      <group position={[0, 0.15, 0]}>
        <mesh geometry={lath([[0.001, 0], [0.13, 0], [0.14, 0.03], [0.1, 0.05], [0.001, 0.05]], 8)}>{brassM()}</mesh>
        <mesh position={[0, 0.23, 0]} geometry={lath([[0.001, -0.18], [0.16, 0.0], [0.16, 0.03], [0.1, 0.09], [0.001, 0.09]], 8)}><meshPhysicalMaterial color={on ? tint : '#f1f4f8'} roughness={0.03} clearcoat={1} flatShading emissive={on ? glowC : '#000'} emissiveIntensity={on ? 0.8 : 0} /></mesh>
      </group>
      {on && <><pointLight position={[0, 0.4, 0]} color={tint} intensity={2} distance={1.6} /><Flare position={[0, 0.38, 0]} size={0.9} /></>}
    </group>
  );
}
function BookStack() {
  return <group>{['#7a3b33', '#3f6b4c', '#a36b2a', '#2f5f73', '#5a3b5c'].map((c, k) => <Book key={k} w={0.7 - k * 0.04} d={0.52 - k * 0.02} h={0.1} color={c} rot={(k % 2 ? 1 : -1) * 0.12 * k} y={k * 0.1} />)}</group>;
}
/** Every library piece, by name: [label, element]. */
const LIB_PIECES = [
  ['Lamp', <BankerLamp key="lamp" />],
  ['Turning lamp', <TurningBankerLamp key="tl" />],
  ['Mirror (turns)', <GimbalMirror key="m" />],
  ['Mirror (fixed)', <FixedStandMirror key="fm" />],
  ['Half mirror (splitter)', <GearMirrorVariant key="s" kind="splitter" />],
  ['Twin mirrors (turn together)', <GearMirrorVariant key="t" pair="a" />],
  ['Cracking mirror (3 turns)', <GearMirrorVariant key="c" kind="cracked" />],
  ['One-sided mirror', <GearMirrorVariant key="o" kind="oneSided" />],
  ['Color glass', <ColorGlass key="g" />],
  ['Prism', <LibPrism key="p" />],
  ['Portal book (pairs)', <MagicBook key="b" />],
  ['Gate (bookcase door)', <BookcaseGate key="gt" />],
  ['Switch (opens the gate)', <BellSwitch key="sw" />],
  ['Shadow (keep dark): ink pot', <InkPot key="ink" />],
  ['Fog: dust sheet', <DustSheet key="fog" />],
  ['Wall: book stack', <BookStack key="w" />],
  ['Gem, waiting', <TintGem key="g0" />],
  ['Gem, lit', <TintGem key="g1" on />],
];
function LibraryAll() {
  const P = (cell, node, rot = 0) => <group position={at6(...cell, 0.09)} rotation={[0, rot, 0]}>{node}</group>;
  return (
    <>
      <color attach="background" args={['#3b2a22']} />
      <fog attach="fog" args={['#3b2a22', 14, 26]} />
      <hemisphereLight args={['#ffe6c4', '#3a2418', 0.6]} />
      <directionalLight position={[-3, 8, 5]} intensity={1} color="#ffe4bd" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <WoodFloor />
      <mesh position={[0, 0.0, 0]} receiveShadow><boxGeometry args={[6.7, 0.03, 6.7]} /><meshStandardMaterial color="#7d2f2a" roughness={1} /></mesh>
      <mesh position={[0, 0.005, 0]} receiveShadow><boxGeometry args={[6.3, 0.03, 6.3]} /><meshStandardMaterial color="#c99a5a" roughness={1} /></mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow><boxGeometry args={[6.15, 0.03, 6.15]} /><meshStandardMaterial color="#8a3530" roughness={1} /></mesh>
      {Array.from({ length: L * L }, (_, i) => { const x = i % L, y = Math.floor(i / L); return <ParquetTile key={i} position={at6(x, y, 0.05)} x={x} y={y} />; })}
      <Shelf position={[-0.3, 0, -4.4]} seed={2} />
      <Shelf position={[-4.4, 0, -0.4]} rotation={[0, Math.PI / 2, 0]} seed={5} />
      {/* the puzzle: lamp → splitter; straight on to a gold gem, down to a mirror, left through coral glass to a coral gem */}
      {P([0, 1], <BankerLamp />)}
      {P([3, 1], <GearMirrorVariant kind="splitter" />, -Math.PI / 4)}
      {P([5, 1], <LumiKin age="kid" color="sun" on />, -Math.PI / 2)}
      {P([3, 4], <GimbalMirror />, Math.PI / 4)}
      {P([2, 4], <ColorGlass />, Math.PI / 2)}
      {P([0, 4], <LumiKin age="grandma" color="coral" on />, Math.PI / 2)}
      {/* the rest of the pieces, waiting */}
      {P([5, 5], <TurningBankerLamp />, Math.PI / 2)}
      {P([5, 3], <BookcaseGate />, 0)}
      {P([0, 0], <BellSwitch />)}
      {P([1, 3], <MagicBook pair="b" />)}
      {P([4, 0], <MagicBook pair="b" />)}
      {P([2, 2], <LibPrism />)}
      {P([1, 5], <GearMirrorVariant pair="a" />, Math.PI / 4)}
      {P([2, 5], <GearMirrorVariant pair="a" />, Math.PI / 4)}
      {P([4, 2], <GearMirrorVariant kind="cracked" />, -Math.PI / 4)}
      {P([4, 5], <GearMirrorVariant kind="oneSided" />, Math.PI / 4)}
      {P([0, 2], <FixedStandMirror />, Math.PI / 4)}
      {P([2, 0], <InkPot />)}
      {P([5, 0], <DustSheet />)}
      {P([4, 4], <BookStack />)}
      {P([1, 0], <LumiKin age="baby" color="sky" />, Math.PI)}
      {[[3, 1], [3, 4]].map((c, n) => <Flare key={n} position={at6(...c, 0.47)} size={0.55} />)}
      <LibBeam a={[0, 1]} b={[3, 1]} />
      <LibBeam a={[3, 1]} b={[5, 1]} />
      <LibBeam a={[3, 1]} b={[3, 4]} />
      <LibBeam a={[3, 4]} b={[2, 4]} />
      <LibBeam a={[2, 4]} b={[0, 4]} color="coral" />
      <LibBeam a={[5, 5]} b={[5, 3]} />
    </>
  );
}
/** One library piece alone on a tile, for the labeled sheet. */
function LibPiece({ index }) {
  const [, node] = LIB_PIECES[index];
  return (
    <>
      <color attach="background" args={['#3b2a22']} />
      <hemisphereLight args={['#ffe6c4', '#3a2418', 0.8]} />
      <directionalLight position={[-3, 6, 4]} intensity={1.4} color="#ffe4bd" castShadow />
      <mesh position={[0, -0.04, 0]} receiveShadow><boxGeometry args={[1.3, 0.08, 1.3]} /><meshStandardMaterial color="#8a3530" roughness={1} /></mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow><boxGeometry args={[0.95, 0.08, 0.95]} /><meshStandardMaterial color="#c99868" roughness={0.55} /></mesh>
      <group position={[0, 0.09, 0]} rotation={[0, Math.PI / 6, 0]}>{node}</group>
    </>
  );
}

/* ---------------- Gem designs (the stones we light up) ---------------- */
const GEM_COLORS = {
  sun: { rich: '#ffb81f', pale: '#f3d98a', glow: '#ff9f10', shape: 'diamond' },
  coral: { rich: '#ff6f61', pale: '#f2b2a8', glow: '#ff4f3f', shape: 'round' },
  lime: { rich: '#5fcf5a', pale: '#b6dfab', glow: '#3fb83a', shape: 'triangle' },
  sky: { rich: '#3fb2ec', pale: '#a9d6ef', glow: '#1f9be0', shape: 'square' },
};
/** A cut jewel whose outline from above is its color's shape: brilliant (8), round (16), trillion (3), princess (4). */
function cutGeometry(shape, r = 0.2) {
  // Each color has its own silhouette from every side, not just from above.
  if (shape === 'round') { const g = new THREE.IcosahedronGeometry(r * 1.05, 1); g.scale(1, 0.92, 1); return g; }
  if (shape === 'triangle') { const g = new THREE.ConeGeometry(r * 1.05, r * 2.3, 3); g.translate(0, r * 0.15, 0); g.rotateY(Math.PI / 6); return g; }
  if (shape === 'square') { const g = new RoundedBoxGeometry(r * 1.55, r * 1.55, r * 1.55, 1, r * 0.22); g.rotateY(Math.PI / 4); return g; }
  return lath([[0.001, -r * 1.05], [r, 0], [r, r * 0.1], [r * 0.62, r * 0.55], [0.001, r * 0.55]], 8);
}
function GemMaterial({ c, on }) {
  return <meshPhysicalMaterial color={on ? c.rich : c.pale} roughness={on ? 0.03 : 0.25} clearcoat={1} clearcoatRoughness={0.05} flatShading iridescence={on ? 0.35 : 0.3} transmission={on ? 0.15 : 0.1} thickness={0.4} ior={2} emissive={c.glow} emissiveIntensity={on ? 0.75 : 0} />;
}
function LitGlow({ c, y, size = 1 }) {
  return <><pointLight position={[0, y, 0]} color={c.rich} intensity={2.4} distance={1.7} /><Flare position={[0, y, 0]} size={0.95 * size} /><mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.6, 32]} /><meshBasicMaterial map={POOL} color={c.rich} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh></>;
}
/** A · Crown setting: the jewel held in four brass claws on a small turned-wood pedestal. */
function GemCrown({ c, on }) {
  const geo = useMemo(() => cutGeometry(c.shape, 0.2), [c.shape]);
  return (
    <group>
      <mesh geometry={lath([[0.001, 0], [0.24, 0], [0.25, 0.04], [0.17, 0.07], [0.12, 0.16], [0.14, 0.2], [0.001, 0.2]], 32)} castShadow><meshPhysicalMaterial color="#6b4430" roughness={0.4} clearcoat={0.8} /></mesh>
      <mesh position={[0, 0.215, 0]}><cylinderGeometry args={[0.11, 0.13, 0.03, 24]} />{brassM()}</mesh>
      {[0, 1, 2, 3].map((k) => { const a = k * Math.PI / 2 + Math.PI / 4; return <mesh key={k} position={[Math.cos(a) * 0.12, 0.31, Math.sin(a) * 0.12]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}><cylinderGeometry args={[0.012, 0.016, 0.18, 6]} />{brassM()}</mesh>; })}
      <mesh geometry={geo} position={[0, 0.44, 0]} castShadow><GemMaterial c={c} on={on} /></mesh>
      {on && <LitGlow c={c} y={0.44} />}
    </group>
  );
}
/** B · Geode: a split-open stone with tiny crystals lining it and the jewel resting inside. */
function GemGeode({ c, on }) {
  const geo = useMemo(() => cutGeometry(c.shape, 0.17), [c.shape]);
  const shell = useMemo(() => { const g = new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); g.scale(1, 0.75, 1); return g; }, []);
  return (
    <group position={[0, 0.24, 0]}>
      <mesh geometry={shell} castShadow><meshStandardMaterial color="#8d8478" roughness={1} flatShading side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.24, 0.3, 24]} /><meshStandardMaterial color="#c9bfb0" roughness={0.9} /></mesh>
      {Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2, rr = 0.2; return <mesh key={k} position={[Math.cos(a) * rr, -0.06, Math.sin(a) * rr]} rotation={[Math.sin(a) * -0.8, 0, Math.cos(a) * 0.8]}><coneGeometry args={[0.03, 0.12, 5]} /><meshPhysicalMaterial color={on ? c.rich : c.pale} roughness={0.1} flatShading emissive={c.glow} emissiveIntensity={on ? 0.25 : 0} /></mesh>; })}
      <mesh geometry={geo} position={[0, 0.1, 0]} castShadow><GemMaterial c={c} on={on} /></mesh>
      {on && <LitGlow c={c} y={0.12} />}
    </group>
  );
}
/** C · Bell jar: the jewel on a velvet cushion under a glass dome, on a stack of books. */
function GemBellJar({ c, on }) {
  const geo = useMemo(() => cutGeometry(c.shape, 0.14), [c.shape]);
  const dome = useMemo(() => lath([[0.2, 0], [0.2, 0.3], [0.18, 0.38], [0.12, 0.44], [0.001, 0.46]], 40), []);
  return (
    <group>
      <Book w={0.6} d={0.44} h={0.07} color="#7a3b33" rot={0.15} />
      <group position={[0, 0.07, 0]}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.24, 0.25, 0.04, 32]} /><meshPhysicalMaterial color="#6b4430" roughness={0.35} clearcoat={0.8} /></mesh>
        <mesh position={[0, 0.07, 0]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.13, 20, 12]} /><meshStandardMaterial color="#5a2a3a" roughness={0.9} /></mesh>
        <mesh geometry={geo} position={[0, 0.26, 0]}><GemMaterial c={c} on={on} /></mesh>
        <mesh geometry={dome} position={[0, 0.04, 0]}><meshPhysicalMaterial color="#ffffff" roughness={0.02} transmission={0.95} thickness={0.02} transparent opacity={0.25} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} /></mesh>
        <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.025, 12, 8]} />{brassM()}</mesh>
        {on && <LitGlow c={c} y={0.26} size={1.1} />}
      </group>
    </group>
  );
}
/** A crystal point: a six-sided prism with a faceted tip, standing on its base. */
function crystalPoint(r, h) {
  return lath([[0.001, 0], [r * 0.85, 0], [r, h * 0.12], [r * 0.92, h], [0.001, h + r * 1.6]], 6);
}
/** A cut jewel for the bloom, faceted, with its color's silhouette from every side. */
function bloomCut(shape, r) {
  if (shape === 'square') {
    // an Asscher cut: a square with clipped corners and stepped bevels
    const s = new THREE.Shape(); const h = r * 0.72, c = r * 0.22;
    s.moveTo(-h + c, -h); s.lineTo(h - c, -h); s.lineTo(h, -h + c); s.lineTo(h, h - c); s.lineTo(h - c, h); s.lineTo(-h + c, h); s.lineTo(-h, h - c); s.lineTo(-h, -h + c); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: r * 0.9, bevelEnabled: true, bevelThickness: r * 0.28, bevelSize: r * 0.22, bevelSegments: 2 });
    g.center(); g.rotateY(Math.PI / 4); return g;
  }
  if (shape === 'triangle') {
    const g = lath([[0.001, -r * 0.5], [r * 0.9, -r * 0.35], [r * 1.05, -r * 0.1], [r * 0.95, r * 0.7], [0.001, r * 1.7]], 3);
    g.rotateY(Math.PI / 6); return g;
  }
  if (shape === 'round') return lath([[0.001, -r * 0.95], [r * 0.6, -r * 0.62], [r, -r * 0.1], [r, r * 0.08], [r * 0.82, r * 0.45], [r * 0.45, r * 0.66], [0.001, r * 0.7]], 16);
  return lath([[0.001, -r * 1.05], [r * 0.5, -r * 0.55], [r, 0], [r, r * 0.1], [r * 0.82, r * 0.38], [r * 0.6, r * 0.55], [0.001, r * 0.57]], 8);
}
let glintTex = null;
function Glint({ position, size = 0.22 }) {
  if (!glintTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const d = c.getContext('2d'); d.translate(64, 64);
    for (let k = 0; k < 4; k++) { d.rotate(Math.PI / 2); const g = d.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); d.fillStyle = g; d.beginPath(); d.moveTo(0, -4); d.lineTo(60, 0); d.lineTo(0, 4); d.fill(); }
    const r = d.createRadialGradient(0, 0, 0, 0, 0, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); d.fillStyle = r; d.fillRect(-16, -16, 32, 32);
    glintTex = new THREE.CanvasTexture(c);
  }
  return <sprite position={position} scale={[size, size, 1]}><spriteMaterial map={glintTex} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></sprite>;
}
/** D · Crystal bloom: the jewel rising out of two rings of crystal points that grow from a mossy stone. */
function GemBloom({ c, on }) {
  const gem = useMemo(() => bloomCut(c.shape, 0.16), [c.shape]);
  const tall = useMemo(() => crystalPoint(0.035, 0.2), []);
  const short = useMemo(() => crystalPoint(0.026, 0.11), []);
  const petal = (k, ring) => (
    <meshPhysicalMaterial color={on ? c.rich : c.pale} roughness={on ? 0.05 : 0.2} flatShading clearcoat={1} transmission={0.2} thickness={0.2} emissive={c.glow} emissiveIntensity={on ? (ring ? 0.35 : 0.55) : 0} />
  );
  return (
    <group>
      {/* the stone: a broad rough base, a smaller cap, pebbles and tufts of moss */}
      <mesh position={[0, 0.05, 0]} scale={[1.15, 0.38, 1.1]} castShadow receiveShadow><dodecahedronGeometry args={[0.25, 1]} /><meshStandardMaterial color="#b3a796" roughness={1} flatShading /></mesh>
      <mesh position={[0.02, 0.12, -0.01]} scale={[0.85, 0.3, 0.8]} castShadow><dodecahedronGeometry args={[0.2, 0]} /><meshStandardMaterial color="#c4b8a6" roughness={1} flatShading /></mesh>
      {[[0.25, 0.03, 0.1, 0.045], [-0.22, 0.03, 0.14, 0.035], [0.1, 0.03, -0.25, 0.04]].map(([x, y, z, r], k) => <mesh key={k} position={[x, y, z]} castShadow><dodecahedronGeometry args={[r, 0]} /><meshStandardMaterial color="#a69a88" roughness={1} flatShading /></mesh>)}
      {[[-0.18, 0.1, -0.12], [0.2, 0.09, -0.06], [-0.05, 0.11, 0.2]].map(([x, y, z], k) => <mesh key={k} position={[x, y, z]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.05, 10, 8]} /><meshStandardMaterial color="#7fa86a" roughness={1} /></mesh>)}
      {/* two rings of crystal points, tipped outwards */}
      {Array.from({ length: 7 }, (_, k) => <group key={`a${k}`} rotation={[0, (k / 7) * Math.PI * 2, 0]}><mesh geometry={tall} position={[0, 0.14, 0.09]} rotation={[0.55, 0, 0]} castShadow>{petal(k, 0)}</mesh></group>)}
      {Array.from({ length: 7 }, (_, k) => <group key={`b${k}`} rotation={[0, ((k + 0.5) / 7) * Math.PI * 2, 0]}><mesh geometry={short} position={[0, 0.12, 0.16]} rotation={[0.9, 0, 0]} castShadow>{petal(k, 1)}</mesh></group>)}
      <mesh geometry={gem} position={[0, 0.4, 0]} castShadow><GemMaterial c={c} on={on} /></mesh>
      {on && (
        <>
          <LitGlow c={c} y={0.4} />
          <Glint position={[0.07, 0.5, 0.12]} size={0.26} />
          <Glint position={[-0.12, 0.32, 0.1]} size={0.16} />
        </>
      )}
    </group>
  );
}
const GEM_DESIGNS = [GemCrown, GemGeode, GemBellJar, GemBloom];
function GemStudio({ design, color, on }) {
  const Design = GEM_DESIGNS[design];
  const ref = useRef();
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.0));
  return (
    <>
      <color attach="background" args={['#3b2a22']} />
      <hemisphereLight args={['#ffe6c4', '#3a2418', on ? 0.6 : 0.8]} />
      <directionalLight position={[-3, 6, 4]} intensity={on ? 1.0 : 1.4} color="#ffe4bd" castShadow />
      <mesh position={[0, -0.04, 0]} receiveShadow><boxGeometry args={[1.3, 0.08, 1.3]} /><meshStandardMaterial color="#8a3530" roughness={1} /></mesh>
      <ParquetTile position={[0, 0.05, 0]} x={0} y={0} />
      <group ref={ref} position={[0, 0.09, 0]} rotation={[0, 0.3, 0]}><Design c={GEM_COLORS[color]} on={on} /></group>
    </>
  );
}

/* ---------------- Lumi's family: the ones we save ---------------- */
const FAMILY_TINT = {
  sun: { body: '#f9c46b', glow: '#ffc21a' },
  coral: { body: '#f6a08f', glow: '#ff6a55' },
  lime: { body: '#a8d98c', glow: '#58c94a' },
  sky: { body: '#9fd0ee', glow: '#3aaeea' },
};
const OUTLINE = '#3b1a08';
const grey = (hex, k = 0.65) => new THREE.Color(hex).lerp(new THREE.Color('#8a8580'), k);
function AntennaTip({ shape, color, on }) {
  const m = <meshPhysicalMaterial color={on ? color : grey(color, 0.5)} roughness={0.2} clearcoat={1} emissive={color} emissiveIntensity={on ? 0.8 : 0} flatShading={shape !== 'round'} />;
  if (shape === 'round') return <mesh><sphereGeometry args={[0.03, 16, 12]} />{m}</mesh>;
  if (shape === 'triangle') return <mesh rotation={[0, Math.PI / 6, 0]}><coneGeometry args={[0.034, 0.06, 3]} />{m}</mesh>;
  if (shape === 'square') return <mesh rotation={[0, Math.PI / 4, 0]}><boxGeometry args={[0.045, 0.045, 0.045]} />{m}</mesh>;
  return <mesh scale={[1, 1.3, 1]}><octahedronGeometry args={[0.032, 0]} />{m}</mesh>;
}
/** One of Lumi's family. age: baby | kid | girl | mom | dad | grandma; color: the light it needs. */
function LumiKin({ color = 'sun', age = 'kid', on }) {
  const tint = FAMILY_TINT[color];
  const shape = GEM_COLORS[color].shape;
  const size = 1.3 * { baby: 0.62, kid: 0.8, girl: 0.8, mom: 1, dad: 1.05, grandma: 0.95 }[age];
  const body = on ? tint.body : grey(tint.body, 0.55);
  const belly = new THREE.Color(body).lerp(new THREE.Color('#fff6e8'), 0.55);
  const R = 0.18;
  const lashes = age === 'girl' || age === 'mom' || age === 'grandma';
  const lift = on ? 0.07 : 0; // a happy hop when saved
  const eye = (x) =>
    on ? (
      <group key={x} position={[x, 0.035, R * 0.9]}>
        <mesh scale={[1, 1.25, 0.6]}><sphereGeometry args={[0.032, 16, 12]} /><meshStandardMaterial color={OUTLINE} roughness={0.25} /></mesh>
        <mesh position={[0.01, 0.014, 0.02]}><sphereGeometry args={[0.011, 8, 6]} /><meshBasicMaterial color="#fff" /></mesh>
        <mesh position={[-0.008, -0.012, 0.02]}><sphereGeometry args={[0.005, 6, 4]} /><meshBasicMaterial color="#fff" /></mesh>
        {lashes && <mesh position={[x > 0 ? 0.03 : -0.03, 0.03, 0]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}><boxGeometry args={[0.022, 0.006, 0.006]} /><meshStandardMaterial color={OUTLINE} /></mesh>}
      </group>
    ) : (
      <mesh key={x} position={[x, 0.025, R * 0.94]} rotation={[0, 0, Math.PI]}><torusGeometry args={[0.022, 0.006, 6, 14, Math.PI]} /><meshStandardMaterial color={OUTLINE} /></mesh>
    );
  const limb = <meshPhysicalMaterial color={body} roughness={0.45} clearcoat={0.5} />;
  return (
    <group scale={size}>
      <group position={[0, 0.32 + lift, 0]}>
        {/* wings */}
        {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.15, 0.07, -0.09]} rotation={[0.2, sx * 0.5, sx * (on ? 0.7 : 0.3)]} scale={[1, 0.6, 0.18]}><sphereGeometry args={[0.13, 18, 12]} /><meshPhysicalMaterial color="#e4f5ef" transparent opacity={on ? 0.8 : 0.4} roughness={0.15} iridescence={0.6} /></mesh>)}
        {/* striped firefly tail that glows */}
        <group position={[0, -0.19, -0.03]}>
          <mesh scale={[1, 0.9, 1]}><sphereGeometry args={[0.1, 24, 16]} /><meshPhysicalMaterial color={on ? tint.glow : grey(tint.glow, 0.7)} roughness={0.2} clearcoat={1} emissive={tint.glow} emissiveIntensity={on ? 1.4 : 0} /></mesh>
          {[0.03, -0.02].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[Math.sqrt(0.01 - y * y) * 1.0, 0.007, 6, 28]} /><meshStandardMaterial color={on ? '#fff6dc' : '#9a948c'} /></mesh>)}
        </group>
        {/* feet */}
        {[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.07, -0.17, 0.08]} scale={[1, 0.6, 1.3]}><sphereGeometry args={[0.035, 12, 8]} />{limb}</mesh>)}
        {/* round head-body with a lighter belly */}
        <mesh castShadow><sphereGeometry args={[R, 40, 28]} /><meshPhysicalMaterial color={body} roughness={0.4} clearcoat={0.7} clearcoatRoughness={0.3} sheen={0.6} sheenColor="#ffffff" /></mesh>
        <mesh position={[0, -0.07, 0.11]} scale={[1, 0.75, 0.5]}><sphereGeometry args={[0.1, 20, 14]} /><meshPhysicalMaterial color={belly} roughness={0.5} /></mesh>
        <mesh position={[-0.06, 0.09, 0.13]}><sphereGeometry args={[0.032, 10, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.55} /></mesh>
        {eye(-0.062)}{eye(0.062)}
        {[-0.105, 0.105].map((x) => <mesh key={x} position={[x, -0.015, R * 0.83]} rotation={[0, x * 4.5, 0]}><circleGeometry args={[0.03, 20]} /><meshBasicMaterial color="#ff8a8a" transparent opacity={on ? 0.75 : 0.3} /></mesh>)}
        {on ? (
          <group position={[0, -0.04, R * 0.95]}>
            <mesh rotation={[0, 0, Math.PI]}><circleGeometry args={[0.032, 20, 0, Math.PI]} /><meshStandardMaterial color="#7a2a22" side={THREE.DoubleSide} /></mesh>
            <mesh position={[0, -0.018, 0.001]} scale={[1, 0.5, 1]}><circleGeometry args={[0.016, 14]} /><meshStandardMaterial color="#ff8f8f" /></mesh>
          </group>
        ) : (
          <mesh position={[0, -0.06, R * 0.95]}><torusGeometry args={[0.018, 0.006, 6, 12, Math.PI]} /><meshStandardMaterial color={OUTLINE} /></mesh>
        )}
        {/* antennae with the color's shape on the tips */}
        {(age === 'baby' ? [0] : [-1, 1]).map((sx) => (
          <group key={sx} position={[sx * 0.07, R * 0.85, 0]} rotation={[0, 0, -sx * 0.35]}>
            <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.008, 0.009, 0.12, 6]} /><meshStandardMaterial color={OUTLINE} /></mesh>
            <group position={[0, 0.13, 0]}><AntennaTip shape={shape} color={tint.glow} on={on} /></group>
          </group>
        ))}
        {/* who they are */}
        {age === 'baby' && <><mesh position={[0, -0.05, R * 0.98]}><torusGeometry args={[0.02, 0.008, 8, 16]} /><meshStandardMaterial color="#9fd8cf" /></mesh><mesh position={[0, -0.05, R * 0.94]}><sphereGeometry args={[0.022, 10, 8]} /><meshStandardMaterial color="#f6d8e4" /></mesh><mesh position={[0.02, R * 0.97, 0.03]} rotation={[0, 0, -0.6]}><torusGeometry args={[0.025, 0.007, 6, 14, Math.PI * 1.4]} /><meshPhysicalMaterial color={body} /></mesh></>}
        {(age === 'girl' || age === 'mom') && <group position={[0.11, 0.13, 0.05]} rotation={[0, 0, -0.5]}>{[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.035, 0, 0]} rotation={[0, 0, sx * Math.PI / 2]}><coneGeometry args={[0.03, 0.06, 12]} /><meshStandardMaterial color="#ee6f9a" /></mesh>)}<mesh><sphereGeometry args={[0.018, 10, 8]} /><meshStandardMaterial color="#d9547e" /></mesh></group>}
        {age === 'mom' && [-0.06, -0.03, 0, 0.03, 0.06].map((x, k) => <mesh key={k} position={[x, -0.128 + Math.abs(x) * 0.25, 0.12 - Math.abs(x) * 0.3]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color="#fff7ec" roughness={0.2} /></mesh>)}
        {age === 'dad' && <group position={[0, -0.15, 0.12]}>{[-1, 1].map((sx) => <mesh key={sx} position={[sx * 0.03, 0, 0]} rotation={[0, 0, sx * Math.PI / 2]}><coneGeometry args={[0.025, 0.05, 4]} /><meshStandardMaterial color="#3f6b8c" /></mesh>)}<mesh><sphereGeometry args={[0.014, 8, 6]} /><meshStandardMaterial color="#2f5470" /></mesh></group>}
        {age === 'dad' && <mesh position={[0, -0.022, R * 0.97]} scale={[1.8, 0.5, 0.6]}><sphereGeometry args={[0.02, 10, 8]} /><meshStandardMaterial color="#7a5232" /></mesh>}
        {age === 'kid' && <group position={[0, R * 0.78, 0.02]} rotation={[-0.25, 0, 0]}><mesh scale={[1, 0.55, 1]}><sphereGeometry args={[0.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#e86f5a" /></mesh><mesh position={[0, 0, 0.12]} rotation={[-0.15, 0, 0]} scale={[1, 0.15, 0.7]}><cylinderGeometry args={[0.1, 0.1, 0.05, 20, 1, false, -Math.PI / 2, Math.PI]} /><meshStandardMaterial color="#e86f5a" /></mesh></group>}
        {age === 'grandma' && <><mesh position={[0, R * 0.95, -0.04]}><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color="#e9e4dc" /></mesh>{[-0.062, 0.062].map((x) => <mesh key={x} position={[x, 0.035, R * 0.99]}><torusGeometry args={[0.038, 0.006, 6, 20]} />{brassM()}</mesh>)}<mesh position={[0, 0.035, R * 0.99]}><boxGeometry args={[0.04, 0.008, 0.008]} />{brassM()}</mesh></>}
      </group>
      {/* trapped: a soft swirling shadow bubble */}
      {!on && <mesh position={[0, 0.31, 0]}><sphereGeometry args={[0.38, 40, 28]} /><meshPhysicalMaterial color="#2e2833" roughness={0.25} clearcoat={1} iridescence={0.4} transparent opacity={0.42} depthWrite={false} /></mesh>}
      {!on && [0, 1, 2, 3].map((k) => <mesh key={k} position={[0, 0.31, 0]} rotation={[k * 0.8, k * 1.4, k * 0.3]}><torusGeometry args={[0.35 - k * 0.02, 0.01, 6, 48, Math.PI * (0.5 + k * 0.15)]} /><meshBasicMaterial color="#5a4d5e" transparent opacity={0.55} /></mesh>)}
      {!on && <mesh position={[0.2, 0.62, 0.1]}><sphereGeometry args={[0.035, 10, 8]} /><meshBasicMaterial color="#5a4d5e" transparent opacity={0.5} /></mesh>}
      {on && <><pointLight position={[0, 0.2, 0.1]} color={tint.glow} intensity={2.2} distance={1.6} /><Flare position={[0, 0.2, -0.02]} size={0.75} /><Glint position={[0.26, 0.6, 0.1]} size={0.18} /><Glint position={[-0.24, 0.48, 0.12]} size={0.12} /><mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.5, 32]} /><meshBasicMaterial map={POOL} color={tint.glow} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh></>}
    </group>
  );
}
function KinStudio({ color, age, on }) {
  return (
    <>
      <color attach="background" args={['#3b2a22']} />
      <hemisphereLight args={['#ffe6c4', '#3a2418', 0.9]} />
      <directionalLight position={[-2, 5, 5]} intensity={1.4} color="#ffe4bd" castShadow />
      <mesh position={[0, -0.04, 0]} receiveShadow><boxGeometry args={[1.3, 0.08, 1.3]} /><meshStandardMaterial color="#8a3530" roughness={1} /></mesh>
      <ParquetTile position={[0, 0.05, 0]} x={0} y={0} />
      <group position={[0, 0.09, 0]} rotation={[0, 0.3, 0]}><LumiKin color={color} age={age} on={on} /></group>
    </>
  );
}

const which = Number(new URLSearchParams(location.search).get('c') || 1);
const pieceIndex = new URLSearchParams(location.search).get('piece');
const gemQ = new URLSearchParams(location.search).get('gem');
const kinQ = new URLSearchParams(location.search).get('kin');
const Scene = kinQ !== null ? () => { const [age, col, on] = kinQ.split(','); return <KinStudio age={age} color={col} on={on === '1'} />; } : gemQ !== null ? () => { const [d, col, on] = gemQ.split(','); return <GemStudio design={Number(d)} color={col} on={on === '1'} />; } : pieceIndex !== null ? () => <LibPiece index={Number(pieceIndex)} /> : [ToyIsland, PaperCraft, GoldenGarden, AmberGrotto, LilyPond, Workshop, Library, LibraryAll][which - 1];
const camMode = new URLSearchParams(location.search).get('cam');
const close = camMode === 'close';
const pair = camMode === 'mirrors';
createRoot(document.getElementById('root')).render(
  <div style={{ width: '100vw', height: '100vh' }}>
    <Canvas shadows dpr={2} frameloop={new URLSearchParams(location.search).get('still') ? 'demand' : 'always'} camera={{ fov: 30, position: kinQ !== null ? [0.55, 0.95, 1.95] : gemQ !== null ? [0.95, 0.95, 1.25] : pieceIndex !== null ? [1.3, 1.25, 1.6] : which === 8 && close ? [-1.2, 2.6, 4.6] : which === 8 ? [7.2, 9.8, 10.6] : pair ? [1.2, 1.5, 3.2] : close ? [0.6, 2.5, 3.9] : [6.2, 8.4, 9.2] }} onCreated={({ camera }) => (kinQ !== null ? camera.lookAt(0, 0.5, 0) : gemQ !== null ? camera.lookAt(0, 0.38, 0) : pieceIndex !== null ? camera.lookAt(0, 0.38, 0) : which === 8 && close ? camera.lookAt(-1.4, 0.2, 1.2) : pair ? camera.lookAt(1, 0.4, 0.5) : close ? camera.lookAt(-0.8, 0.35, 0.3) : camera.lookAt(0, -0.2, 0))}>
      <Env intensity={which === 2 ? 0.25 : 0.4} />
      <Scene />
      <EffectComposer multisampling={4}><Bloom mipmapBlur luminanceThreshold={1.2} intensity={0.8} radius={0.75} /><Vignette offset={0.3} darkness={0.35} /></EffectComposer>
    </Canvas>
  </div>,
);
setTimeout(() => (window.ready = true), 3500);
