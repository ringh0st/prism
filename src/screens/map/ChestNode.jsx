import Icon from '../../components/Icon.jsx';
import styles from './Map.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** A reward chest on the map: locked, ready to open (glowing), or already opened. */
export default function ChestNode({ stop, state, onOpen }) {
  const { t } = useI18n();
  const style = { left: `${stop.x}%`, top: `${stop.y}px` };
  const label = {
    locked: t('map.chest.locked', { count: stop.levelsNeeded }),
    ready: t('map.chest.ready'),
    opened: t('map.chest.opened'),
  }[state];
  return (
    <button
      type="button"
      className={`${styles.chest} ${styles[`chest_${state}`]}`}
      style={style}
      onClick={state === 'ready' ? onOpen : undefined}
      aria-disabled={state !== 'ready'}
      aria-label={label}
    >
      <Icon name="chest" size={36} />
      {state === 'ready' && <span className={`game-title ${styles.chestTag}`}>{t('map.chest.open')}</span>}
    </button>
  );
}
