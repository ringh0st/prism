import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import TileArt from '../../components/board/TileArt.jsx';
import { PIECES, piecesIn } from '../../game/pieces.js';
import { pieceText } from '../../i18n/gameText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { rescueWording } from '../../i18n/rescueWording.js';
import styles from './PiecesGuide.module.css';

/**
 * "What's on this board?": every piece in this level with its picture, name and its few words, for a player who
 * tapped a piece's first explanation away and forgot it (owner's question). Opened by the ? beside Restart.
 */
export default function PiecesGuide({ level, onClose }) {
  const { t, lang } = useI18n();
  const present = new Set(piecesIn(level));
  return (
    <Dialog title={t('play.pieces.title')} onClose={onClose} tone="gentle">
      <ul className={styles.list}>
        {PIECES.filter((piece) => present.has(piece.id)).map((piece) => {
          const { name, text } = pieceText(lang, piece);
          return (
            <li key={piece.id} className={styles.piece}>
              <span className={styles.art} aria-hidden="true">
                <TileArt
                  tile={piece.sample}
                  turns={piece.sample.orient ?? 0}
                  isLit={piece.sample.type === 'gem'}
                  isRotatable={!piece.sample.locked}
                  isFogged={Boolean(piece.sample.fog)}
                />
              </span>
              <span>
                <strong className="game-title">{rescueWording(name, lang)}</strong>
                <span className={styles.text}>{rescueWording(text, lang)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Button data-autofocus onClick={onClose}>
        {t('common.gotIt')}
      </Button>
    </Dialog>
  );
}
