/*
 * Lumi's family, the ones each level saves (they replace the gems as targets). Smudge has trapped them in smoky
 * shadow bubbles; light bursts the bubble and they wake glowing in their color. Each wears the color of the light it
 * needs and its antenna tips carry that color's shape (gold ◆, coral ●, green ▲, blue ■), so color is never the only
 * clue. Faces carry the feeling: sleepy → worried (Smudge near) → surprised → joy → happy.
 */
import * as THREE from 'three';
import { Flare, Glint, POOL, brassM } from './shared.jsx';

/** Each light color's shape (the antenna tips) and tones. */
const SHAPES_BY_COLOR = {
  sun: { rich: '#ffb81f', pale: '#f3d98a', glow: '#ff9f10', shape: 'diamond' },
  coral: { rich: '#ff6f61', pale: '#f2b2a8', glow: '#ff4f3f', shape: 'round' },
  lime: { rich: '#5fcf5a', pale: '#b6dfab', glow: '#3fb83a', shape: 'triangle' },
  sky: { rich: '#3fb2ec', pale: '#a9d6ef', glow: '#1f9be0', shape: 'square' },
};

export const FAMILY_TINT = {
  sun: { body: '#f9c46b', glow: '#ffc21a' },
  coral: { body: '#f6a08f', glow: '#ff6a55' },
  lime: { body: '#a8d98c', glow: '#58c94a' },
  sky: { body: '#9fd0ee', glow: '#3aaeea' },
};

const OUTLINE = '#3b1a08';

const grey = (hex, k = 0.65) => new THREE.Color(hex).lerp(new THREE.Color('#8a8580'), k);

function AntennaTip({ shape, color, on }) {
  const m = (
    <meshPhysicalMaterial
      color={on ? color : grey(color, 0.5)}
      roughness={0.2}
      clearcoat={1}
      emissive={color}
      emissiveIntensity={on ? 0.8 : 0}
      flatShading={shape !== 'round'}
    />
  );
  if (shape === 'round')
    return (
      <mesh>
        <sphereGeometry args={[0.03, 16, 12]} />
        {m}
      </mesh>
    );
  if (shape === 'triangle')
    return (
      <mesh rotation={[0, Math.PI / 6, 0]}>
        <coneGeometry args={[0.034, 0.06, 3]} />
        {m}
      </mesh>
    );
  if (shape === 'square')
    return (
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.045, 0.045, 0.045]} />
        {m}
      </mesh>
    );
  return (
    <mesh scale={[1, 1.3, 1]}>
      <octahedronGeometry args={[0.032, 0]} />
      {m}
    </mesh>
  );
}

/**
 * One of Lumi's family. age: baby | kid | girl | mom | dad | grandma; color: the light it needs (shown by its glowing
 * tail and the shape on its antennae); coat: its own pastel body color (`lumiCoatFor`; defaults to the light's color).
 */
export function LumiKin({ color = 'sun', age = 'kid', coat = null, on, mood }) {
  // mood: sleepy | worried | surprised | joy | happy (defaults from on)
  const face = mood ?? (on ? 'happy' : 'sleepy');
  // A coat colors the whole Lumi: its body, and a deeper shade of it for the glowing tail and its light.
  const tint = coat ? { body: coat, glow: `#${new THREE.Color(coat).offsetHSL(0, 0.25, -0.12).getHexString()}` } : FAMILY_TINT[color];
  const shape = SHAPES_BY_COLOR[color].shape;
  const size = 1.3 * { baby: 0.62, kid: 0.8, girl: 0.8, mom: 1, dad: 1.05, grandma: 0.95 }[age];
  // Asleep it keeps its color (only a touch dusky), so the family reads as colorful before the rescue too.
  const body = on ? tint.body : grey(tint.body, 0.12);
  const belly = new THREE.Color(body).lerp(new THREE.Color('#fff6e8'), 0.55);
  const R = 0.18;
  const lashes = age === 'girl' || age === 'mom' || age === 'grandma';
  const lift = face === 'joy' ? 0.12 : on ? 0.07 : 0; // a happy hop when saved
  const ink = <meshStandardMaterial color={OUTLINE} />;
  const eye = (x) => {
    const at = [x, 0.035, R * 0.9];
    if (face === 'sleepy')
      return (
        <mesh key={x} position={[x, 0.025, R * 0.94]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.022, 0.006, 6, 14, Math.PI]} />
          {ink}
        </mesh>
      );
    if (face === 'joy')
      return (
        <mesh key={x} position={[x, 0.03, R * 0.94]}>
          <torusGeometry args={[0.024, 0.007, 6, 14, Math.PI]} />
          {ink}
        </mesh>
      );
    const big = face === 'surprised' ? 1.25 : face === 'worried' ? 0.85 : 1;
    return (
      <group key={x} position={at}>
        <mesh scale={[big, 1.25 * big, 0.6]}>
          <sphereGeometry args={[0.032, 16, 12]} />
          <meshStandardMaterial color={OUTLINE} roughness={0.25} />
        </mesh>
        <mesh position={[0.01, 0.014, 0.02]}>
          <sphereGeometry args={[0.011 * big, 8, 6]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[-0.008, -0.012, 0.02]}>
          <sphereGeometry args={[0.005, 6, 4]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        {lashes && (
          <mesh position={[x > 0 ? 0.03 : -0.03, 0.03, 0]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
            <boxGeometry args={[0.022, 0.006, 0.006]} />
            {ink}
          </mesh>
        )}
        {face === 'worried' && (
          <mesh position={[0, 0.058, 0.004]} rotation={[0, 0, x > 0 ? 0.45 : -0.45]}>
            <boxGeometry args={[0.04, 0.008, 0.008]} />
            {ink}
          </mesh>
        )}
        {face === 'surprised' && (
          <mesh position={[0, 0.07, 0.004]} rotation={[0, 0, x > 0 ? -0.2 : 0.2]}>
            <boxGeometry args={[0.035, 0.007, 0.007]} />
            {ink}
          </mesh>
        )}
      </group>
    );
  };
  const mouth = {
    sleepy: (
      <mesh position={[0, -0.06, R * 0.95]}>
        <torusGeometry args={[0.018, 0.006, 6, 12, Math.PI]} />
        {ink}
      </mesh>
    ),
    worried: (
      <group position={[0, -0.06, R * 0.95]}>
        {[-0.02, 0, 0.02].map((x, k) => (
          <mesh key={k} position={[x, k % 2 ? 0.006 : -0.004, 0]} rotation={[0, 0, k % 2 ? 0.5 : -0.5]}>
            <boxGeometry args={[0.022, 0.006, 0.006]} />
            {ink}
          </mesh>
        ))}
      </group>
    ),
    surprised: (
      <mesh position={[0, -0.055, R * 0.95]} scale={[0.85, 1.15, 1]}>
        <circleGeometry args={[0.02, 18]} />
        <meshStandardMaterial color="#7a2a22" />
      </mesh>
    ),
    joy: (
      <group position={[0, -0.035, R * 0.95]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.04, 20, 0, Math.PI]} />
          <meshStandardMaterial color="#7a2a22" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.022, 0.001]} scale={[1, 0.5, 1]}>
          <circleGeometry args={[0.02, 14]} />
          <meshStandardMaterial color="#ff8f8f" />
        </mesh>
      </group>
    ),
    happy: (
      <group position={[0, -0.04, R * 0.95]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.032, 20, 0, Math.PI]} />
          <meshStandardMaterial color="#7a2a22" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.018, 0.001]} scale={[1, 0.5, 1]}>
          <circleGeometry args={[0.016, 14]} />
          <meshStandardMaterial color="#ff8f8f" />
        </mesh>
      </group>
    ),
  }[face];
  const limb = <meshPhysicalMaterial color={body} roughness={0.45} clearcoat={0.5} />;
  return (
    <group scale={size}>
      <group position={[0, 0.32 + lift, 0]}>
        {/* wings */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.15, 0.07, -0.09]} rotation={[0.2, sx * 0.5, sx * (on ? 0.7 : 0.3)]} scale={[1, 0.6, 0.18]}>
            <sphereGeometry args={[0.13, 18, 12]} />
            <meshPhysicalMaterial color="#e4f5ef" transparent opacity={on ? 0.8 : 0.4} roughness={0.15} iridescence={0.6} />
          </mesh>
        ))}
        {/* striped firefly tail that glows */}
        <group position={[0, -0.19, -0.03]}>
          <mesh scale={[1, 0.9, 1]}>
            <sphereGeometry args={[0.1, 24, 16]} />
            <meshPhysicalMaterial
              color={on ? tint.glow : grey(tint.glow, 0.7)}
              roughness={0.2}
              clearcoat={1}
              emissive={tint.glow}
              emissiveIntensity={on ? 1.4 : 0}
            />
          </mesh>
          {[0.03, -0.02].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[Math.sqrt(0.01 - y * y) * 1.0, 0.007, 6, 28]} />
              <meshStandardMaterial color={on ? '#fff6dc' : '#9a948c'} />
            </mesh>
          ))}
        </group>
        {/* feet */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.07, -0.17, 0.08]} scale={[1, 0.6, 1.3]}>
            <sphereGeometry args={[0.035, 12, 8]} />
            {limb}
          </mesh>
        ))}
        {/* round head-body with a lighter belly */}
        <mesh castShadow>
          <sphereGeometry args={[R, 40, 28]} />
          <meshPhysicalMaterial color={body} roughness={0.4} clearcoat={0.7} clearcoatRoughness={0.3} sheen={0.6} sheenColor="#ffffff" />
        </mesh>
        <mesh position={[0, -0.07, 0.11]} scale={[1, 0.75, 0.5]}>
          <sphereGeometry args={[0.1, 20, 14]} />
          <meshPhysicalMaterial color={belly} roughness={0.5} />
        </mesh>
        <mesh position={[-0.06, 0.09, 0.13]}>
          <sphereGeometry args={[0.032, 10, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
        {eye(-0.062)}
        {eye(0.062)}
        {[-0.105, 0.105].map((x) => (
          <mesh key={x} position={[x, -0.015, R * 0.83]} rotation={[0, x * 4.5, 0]}>
            <circleGeometry args={[0.03, 20]} />
            <meshBasicMaterial color="#ff8a8a" transparent opacity={on ? 0.75 : 0.3} />
          </mesh>
        ))}
        {mouth}
        {face === 'worried' && (
          <mesh position={[0.14, 0.1, 0.11]} scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <meshPhysicalMaterial color="#bfe6ff" transparent opacity={0.85} />
          </mesh>
        )}
        {/* antennae with the color's shape on the tips */}
        {(age === 'baby' ? [0] : [-1, 1]).map((sx) => (
          <group key={sx} position={[sx * 0.07, R * 0.85, 0]} rotation={[0, 0, -sx * 0.35]}>
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.008, 0.009, 0.12, 6]} />
              <meshStandardMaterial color={OUTLINE} />
            </mesh>
            <group position={[0, 0.13, 0]}>
              <AntennaTip shape={shape} color={tint.glow} on={on} />
            </group>
          </group>
        ))}
        {/* who they are */}
        {age === 'baby' && (
          <>
            <mesh position={[0, -0.05, R * 0.98]}>
              <torusGeometry args={[0.02, 0.008, 8, 16]} />
              <meshStandardMaterial color="#9fd8cf" />
            </mesh>
            <mesh position={[0, -0.05, R * 0.94]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshStandardMaterial color="#f6d8e4" />
            </mesh>
            <mesh position={[0.02, R * 0.97, 0.03]} rotation={[0, 0, -0.6]}>
              <torusGeometry args={[0.025, 0.007, 6, 14, Math.PI * 1.4]} />
              <meshPhysicalMaterial color={body} />
            </mesh>
          </>
        )}
        {(age === 'girl' || age === 'mom') && (
          <group position={[0.11, 0.13, 0.05]} rotation={[0, 0, -0.5]}>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.035, 0, 0]} rotation={[0, 0, (sx * Math.PI) / 2]}>
                <coneGeometry args={[0.03, 0.06, 12]} />
                <meshStandardMaterial color="#ee6f9a" />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.018, 10, 8]} />
              <meshStandardMaterial color="#d9547e" />
            </mesh>
          </group>
        )}
        {age === 'mom' &&
          [-0.06, -0.03, 0, 0.03, 0.06].map((x, k) => (
            <mesh key={k} position={[x, -0.128 + Math.abs(x) * 0.25, 0.12 - Math.abs(x) * 0.3]}>
              <sphereGeometry args={[0.012, 8, 6]} />
              <meshStandardMaterial color="#fff7ec" roughness={0.2} />
            </mesh>
          ))}
        {age === 'dad' && (
          <group position={[0, -0.15, 0.12]}>
            {[-1, 1].map((sx) => (
              <mesh key={sx} position={[sx * 0.03, 0, 0]} rotation={[0, 0, (sx * Math.PI) / 2]}>
                <coneGeometry args={[0.025, 0.05, 4]} />
                <meshStandardMaterial color="#3f6b8c" />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshStandardMaterial color="#2f5470" />
            </mesh>
          </group>
        )}
        {age === 'dad' && (
          <mesh position={[0, -0.022, R * 0.97]} scale={[1.8, 0.5, 0.6]}>
            <sphereGeometry args={[0.02, 10, 8]} />
            <meshStandardMaterial color="#7a5232" />
          </mesh>
        )}
        {age === 'kid' && (
          <group position={[0, R * 0.78, 0.02]} rotation={[-0.25, 0, 0]}>
            <mesh scale={[1, 0.55, 1]}>
              <sphereGeometry args={[0.14, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#e86f5a" />
            </mesh>
            <mesh position={[0, 0, 0.12]} rotation={[-0.15, 0, 0]} scale={[1, 0.15, 0.7]}>
              <cylinderGeometry args={[0.1, 0.1, 0.05, 20, 1, false, -Math.PI / 2, Math.PI]} />
              <meshStandardMaterial color="#e86f5a" />
            </mesh>
          </group>
        )}
        {age === 'grandma' && (
          <>
            <mesh position={[0, R * 0.95, -0.04]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial color="#e9e4dc" />
            </mesh>
            {[-0.062, 0.062].map((x) => (
              <mesh key={x} position={[x, 0.035, R * 0.99]}>
                <torusGeometry args={[0.038, 0.006, 6, 20]} />
                {brassM()}
              </mesh>
            ))}
            <mesh position={[0, 0.035, R * 0.99]}>
              <boxGeometry args={[0.04, 0.008, 0.008]} />
              {brassM()}
            </mesh>
          </>
        )}
      </group>
      {/* trapped: a soft swirling shadow bubble */}
      {!on && (
        <mesh position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.38, 40, 28]} />
          <meshPhysicalMaterial color="#4a4458" roughness={0.25} clearcoat={1} iridescence={0.4} transparent opacity={0.26} depthWrite={false} />
        </mesh>
      )}
      {!on &&
        [0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.31, 0]} rotation={[k * 0.8, k * 1.4, k * 0.3]}>
            <torusGeometry args={[0.35 - k * 0.02, 0.01, 6, 48, Math.PI * (0.5 + k * 0.15)]} />
            <meshBasicMaterial color="#5a4d5e" transparent opacity={0.55} />
          </mesh>
        ))}
      {!on && (
        <mesh position={[0.2, 0.62, 0.1]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial color="#5a4d5e" transparent opacity={0.5} />
        </mesh>
      )}
      {on && (
        <>
          <Flare position={[0, 0.2, -0.02]} size={0.75} />
          <Glint position={[0.26, 0.6, 0.1]} size={0.18} />
          <Glint position={[-0.24, 0.48, 0.12]} size={0.12} />
          <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.5, 32]} />
            <meshBasicMaterial map={POOL} color={tint.glow} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  );
}
