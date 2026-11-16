/*
 * Light for the 3D board, cheap enough for phones (no full-screen bloom): a glow shader that is brightest where
 * a tube faces the camera and fades softly to its edges, with light flowing along it; and a four-point star
 * glint for flashes and sparkles.
 */
import * as THREE from 'three';

/**
 * A soft glow for a tube or cone along its length (uv.y runs along it). `flow` makes bands of light run along it;
 * `additive` adds the light (brighter, whiter) rather than tinting.
 * The returned material's `uniforms.time` is advanced by the scene.
 */
export function glowMaterial(color, { opacity = 1, sharpness = 1.6, flow = 0, length = 1, additive = true } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      sharpness: { value: sharpness },
      flow: { value: flow },
      length: { value: length },
      time: { value: 0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 world = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-world.xyz);
        gl_Position = projectionMatrix * world;
      }`,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      uniform float sharpness;
      uniform float flow;
      uniform float length;
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec2 vUv;
      void main() {
        float facing = pow(abs(dot(normalize(vNormal), normalize(vView))), sharpness);
        float bands = 1.0 - flow + flow * (0.6 + 0.4 * sin(vUv.y * length * 9.0 - time * 7.0));
        gl_FragColor = vec4(color, facing * bands * opacity);
      }`,
    transparent: true,
    depthWrite: false,
    // Added light brightens; on the pale tiles plain blending keeps a glow its own color instead of white.
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
}

let starTexture = null;
/** A four-point star glint (with a soft round heart), as an always-facing sprite. */
export function starSprite(color, size, opacity = 1) {
  if (!starTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const draw = canvas.getContext('2d');
    const heart = draw.createRadialGradient(64, 64, 0, 64, 64, 30);
    heart.addColorStop(0, 'rgba(255,255,255,1)');
    heart.addColorStop(1, 'rgba(255,255,255,0)');
    draw.fillStyle = heart;
    draw.fillRect(0, 0, 128, 128);
    draw.translate(64, 64);
    for (let ray = 0; ray < 4; ray++) {
      draw.rotate(Math.PI / 2);
      const beam = draw.createLinearGradient(0, 0, 62, 0);
      beam.addColorStop(0, 'rgba(255,255,255,0.95)');
      beam.addColorStop(1, 'rgba(255,255,255,0)');
      draw.fillStyle = beam;
      draw.beginPath();
      draw.moveTo(0, -5);
      draw.lineTo(62, 0);
      draw.lineTo(0, 5);
      draw.fill();
    }
    starTexture = new THREE.CanvasTexture(canvas);
  }
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: starTexture, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  sprite.scale.setScalar(size);
  return sprite;
}
