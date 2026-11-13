import Dialog from '../../components/Dialog.jsx';
import Icon from '../../components/Icon.jsx';
import ShopItemArt from './ShopItemArt.jsx';
import styles from './Stall.module.css';

/** Tap an item to read what it does, then buy it right there. */
export default function ItemInfoDialog({ info, onClose, children }) {
  return (
    <Dialog title={info.title} onClose={onClose}>
      <ShopItemArt art={info.art} size={120} className={styles.infoArt} />
      <p className={styles.infoText}>{info.description}</p>
      {info.facts?.length > 0 && (
        <ul className={styles.facts}>
          {info.facts.map((fact) => (
            <li key={fact.text}>
              <Icon name={fact.icon} size={16} /> {fact.text}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.infoBuy}>{children}</div>
    </Dialog>
  );
}
