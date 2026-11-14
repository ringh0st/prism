import { useState } from 'react';
import Button from '../Button.jsx';
import Dialog from '../Dialog.jsx';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './HowTip.module.css';

/** A small round "?" that opens a short "how it works" on tap, so the screen itself stays pictures. */
export default function HowTip({ title, children, className = '' }) {
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
        aria-label={t('pals.how.aria', { topic: title })}
      >
        <span aria-hidden="true">?</span>
      </button>
      {isOpen && (
        <Dialog title={title} onClose={() => setIsOpen(false)}>
          <div className={styles.body}>{children}</div>
          <Button onClick={() => setIsOpen(false)} data-autofocus>
            {t('pals.how.ok')}
          </Button>
        </Dialog>
      )}
    </>
  );
}
