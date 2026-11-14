import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './HelpTip.module.css';

/** A small round "?" that opens a short explanation on tap, so the shelves stay pictures, not paragraphs. */
export default function HelpTip({ title, children, className = '' }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`${styles.tip} ${className}`}
        onClick={() => {
          sfx.tap();
          setIsOpen(true);
        }}
        aria-label={t('shop.help.aria', { topic: title })}
        data-shop-help
      >
        <span aria-hidden="true">?</span>
      </button>
      {isOpen && (
        <Dialog title={title} onClose={() => setIsOpen(false)}>
          <div className={styles.body}>{children}</div>
          <Button onClick={() => setIsOpen(false)} data-autofocus>
            {t('shop.help.ok')}
          </Button>
        </Dialog>
      )}
    </>
  );
}
