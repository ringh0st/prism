import { useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './HelpTip.module.css';

/**
 * A small round "?" that opens the full explanation on tap, so screens can show pictures and numbers
 * first and keep the sentences one tap away. `title` names the button (for screen readers) and the sheet.
 */
export default function HelpTip({ title, children, className = '' }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const open = () => {
    sfx.tap();
    setIsOpen(true);
  };
  return (
    <>
      <button type="button" className={`${styles.help} ${className}`} onClick={open} aria-label={title} aria-haspopup="dialog">
        <span aria-hidden="true">?</span>
      </button>
      {isOpen && (
        <Dialog title={title} onClose={() => setIsOpen(false)}>
          <div className={styles.body}>{children}</div>
          <Button onClick={() => setIsOpen(false)} data-autofocus>
            {t('common.gotIt')}
          </Button>
        </Dialog>
      )}
    </>
  );
}
