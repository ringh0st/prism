/**
 * A tapping finger: the picture for "moves" (one tap is one move), used instead of the word.
 * Drawn in currentColor, decorative (the number next to it carries the meaning for screen readers).
 */
export default function TapIcon({ size = 20, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path d="M5.5 6.5a4.5 4.5 0 0 1 7.6-3.2M4 9.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <path
        d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1a1.5 1.5 0 0 1 3 0v2m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4.6 15.6a1.6 1.6 0 0 1 2.4-2.1L9 15.5z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
