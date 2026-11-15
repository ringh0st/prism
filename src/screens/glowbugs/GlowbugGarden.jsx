import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUGS, GLOWBUG_KINDS, rescuedGlowbugs } from '../../game/glowbugs.js';
import GlowbugRowPrize from './GlowbugRowPrize.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { glowbugBio, glowbugName, glowbugTitle } from '../../i18n/groveText.js';
import styles from './GlowbugGarden.module.css';

/**
 * The Glowbug Garden: every Glowbug you've rescued (by three-starring the level it napped on), with the
 * ones still out there as gentle silhouettes (★ for rare ones). Tap a rescued one to meet it; "?" says how.
 * One row per kind (its 5 colors): a full row earns a diamond, collected at the row's end.
 */
export default function GlowbugGarden() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const [meeting, setMeeting] = useState(null);
  const [message, setMessage] = useState('');
  const rescued = rescuedGlowbugs(progress.levels);
  const found = GLOWBUGS.filter((bug) => rescued.has(bug.id)).length;
  const meetingName = meeting && glowbugName(lang, meeting);

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('garden.title')} backHref="#/pals/team" />
      <main className={styles.main}>
        <section className={styles.intro} aria-label={t('garden.found', { found, total: GLOWBUGS.length })}>
          <GlowbugArt id={GLOWBUGS[0].id} size={44} isAwake={found > 0} />
          <div
            className={styles.meter}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={GLOWBUGS.length}
            aria-valuenow={found}
            aria-label={t('garden.meter')}
          >
            <span className={styles.fill} style={{ width: `${(found / GLOWBUGS.length) * 100}%` }} />
            <span className={`game-title ${styles.count}`} aria-hidden="true">
              {found}/{GLOWBUGS.length}
            </span>
          </div>
          <HelpTip title={t('garden.title')}>
            <p>{t('garden.how')}</p>
          </HelpTip>
        </section>
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
        <ul className={styles.rows}>
          {GLOWBUG_KINDS.map((kind) => {
            const bugs = GLOWBUGS.filter((bug) => bug.kind === kind.id);
            return (
              <li key={kind.id} className={styles.row}>
                <ul className={styles.grid}>
                  {bugs.map((bug) => {
                    const times = rescued.get(bug.id) ?? 0;
                    const name = glowbugName(lang, bug);
                    const title = glowbugTitle(lang, bug);
                    return (
                      <li key={bug.id}>
                        {times ? (
                          <button
                            type="button"
                            className={styles.bug}
                            onClick={() => setMeeting(bug)}
                            aria-label={t(times > 1 ? 'garden.bugLabelTimes' : 'garden.bugLabel', { name, title, times })}
                          >
                            <GlowbugArt id={bug.id} size={46} />
                            <span className={styles.name}>{name}</span>
                            {times > 1 && <span className={styles.times}>×{times}</span>}
                          </button>
                        ) : (
                          <span
                            className={`${styles.bug} ${styles.missing}`}
                            role="img"
                            aria-label={bug.rare ? t('garden.missingRare') : t('garden.missing')}
                          >
                            <GlowbugArt id={bug.id} size={46} isSilhouette />
                            <span className={styles.name} aria-hidden="true">
                              {bug.rare ? '★' : '?'}
                            </span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <GlowbugRowPrize kind={kind.id} found={bugs.filter((bug) => rescued.has(bug.id)).length} total={bugs.length} onMessage={setMessage} />
              </li>
            );
          })}
        </ul>
      </main>
      <BottomNav active="pals" />
      {meeting && (
        <Dialog title={meetingName} tone="celebrate" onClose={() => setMeeting(null)}>
          <div className={styles.meet}>
            <GlowbugArt id={meeting.id} size={140} />
          </div>
          <p className={styles.title}>
            {glowbugTitle(lang, meeting)}
            {meeting.rare && <span className={styles.rare}> · {t('garden.rare')}</span>}
          </p>
          <p className={styles.bio}>{glowbugBio(lang, meeting)}</p>
          <Button onClick={() => setMeeting(null)} data-autofocus>
            {t('garden.hi', { name: meetingName })}
          </Button>
        </Dialog>
      )}
    </div>
  );
}
