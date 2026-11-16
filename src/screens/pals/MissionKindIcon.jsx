import Icon from '../../components/Icon.jsx';
import GemShape from '../../components/GemShape.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';

const ICONS = { solved: 'play', perfect: 'star', hard: 'flame', daily: 'calendar', present: 'gift' };

/** A daily mission's picture: a shape per kind (two gems for a combo, a Glowbug for a rescue). Decorative. */
export default function MissionKindIcon({ kind, size = 24 }) {
  if (kind === 'glowbug') return <GlowbugArt id="firefly-honey" size={size + 6} />;
  if (kind === 'combo') {
    return (
      <span aria-hidden="true" style={{ display: 'inline-flex', gap: 1 }}>
        <GemShape color="sun" size={size * 0.62} />
        <GemShape color="coral" size={size * 0.62} />
      </span>
    );
  }
  return <Icon name={ICONS[kind]} size={size} strokeWidth={2.4} />;
}
