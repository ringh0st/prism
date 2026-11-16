/** Can this device draw the 3D board? (Checked once: a WebGL context that the browser will actually give.) */
let supported = null;
export function supportsWebGL() {
  if (supported === null) {
    try {
      const canvas = document.createElement('canvas');
      supported = Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      supported = false;
    }
  }
  return supported;
}
