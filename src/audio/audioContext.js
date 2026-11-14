// One Web Audio context for the whole game (sound effects and music), made on first use.
let context = null;
let output = null;

/** The shared audio context (resumed if the browser paused it), or null where Web Audio isn't available. */
export function sharedAudio() {
  try {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      // Warm everything a little and keep stacked sounds from getting loud.
      const warmth = context.createBiquadFilter();
      warmth.type = 'lowpass';
      warmth.frequency.value = 5200;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -14;
      limiter.ratio.value = 6;
      warmth.connect(limiter).connect(context.destination);
      output = warmth;
    }
    if (context.state === 'suspended') context.resume();
    return context;
  } catch {
    return null;
  }
}

/** Where every sound goes: the warm filter and limiter in front of the speakers. */
export const mainOutput = () => output;
