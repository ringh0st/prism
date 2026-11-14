/*
 * Each kind of world has its own musical voice: a scale, an instrument and a little start-up motif with
 * a nature sound (a bird in the meadow, an owl in the autumn forest, a drop at the lagoon…). Used for the
 * level-start jingle, the gem chimes and the win fanfare. Pure data; sfx.js plays it.
 */
const hz = (...notes) => notes;

export const WORLD_VOICES = {
  // Meadow: bright C major pentatonic bells, with a bird.
  sunshine: {
    notes: hz(523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093),
    timbre: 'bell',
    motif: [0, 2, 4, 7],
    accent: 'chirp',
  },
  // Autumn forest: warm A minor pentatonic on wood, with an owl.
  tangerine: {
    notes: hz(440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760),
    timbre: 'wood',
    motif: [5, 3, 1, 3],
    accent: 'hoot',
  },
  // Desert: E phrygian dominant, plucked, a little mysterious.
  coral: {
    notes: hz(659.25, 698.46, 830.61, 880, 987.77, 1046.5, 1174.66, 1318.51, 1396.91, 1661.22, 1760),
    timbre: 'pluck',
    motif: [0, 1, 2, 1, 0],
    accent: null,
  },
  // Lagoon: G major pentatonic water drops.
  mint: {
    notes: hz(392, 440, 493.88, 587.33, 659.25, 783.99, 880, 987.77, 1174.66, 1318.51, 1567.98),
    timbre: 'drop',
    motif: [2, 4, 7],
    accent: 'splash',
  },
  // Lantern village: cozy F major pentatonic on wood.
  ember: {
    notes: hz(349.23, 392, 440, 523.25, 587.33, 698.46, 783.99, 880, 1046.5, 1174.66, 1396.91),
    timbre: 'wood',
    motif: [0, 3, 5, 7],
    accent: null,
  },
  // Jungle: lively D pentatonic marimba, with a bird.
  lime: {
    notes: hz(587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32),
    timbre: 'marimba',
    motif: [0, 2, 0, 4],
    accent: 'chirp',
  },
  // Blossom: the Japanese "in" scale on a koto-like pluck.
  peach: {
    notes: hz(587.33, 622.25, 783.99, 880, 932.33, 1174.66, 1244.51, 1567.98, 1760, 1864.66, 2349.32),
    timbre: 'pluck',
    motif: [5, 4, 2, 0],
    accent: null,
  },
  // Mountains: high crystal bells that echo off the peaks.
  gold: {
    notes: hz(1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02, 3135.96, 3520, 4186.01),
    timbre: 'crystal',
    motif: [0, 4, 7, 9],
    accent: null,
  },
};

/** The voice outside worlds (daily puzzles, events, menus). */
export const DEFAULT_VOICE = WORLD_VOICES.sunshine;

export const voiceFor = (theme) => WORLD_VOICES[theme] ?? DEFAULT_VOICE;
