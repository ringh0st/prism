import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/Button.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { useWeeklyBoard } from '../../hooks/useWeeklyBoard.js';
import Podium from './Podium.jsx';
import { stageOf } from '../../game/pals.js';
import PalArt from '../../components/pals/PalArt.jsx';
import { palById } from '../../game/pals.js';
import RankRow from './RankRow.jsx';
import BoardSkeleton from './BoardSkeleton.jsx';
import PlayerCardDialog from './PlayerCardDialog.jsx';
import WeekRules from './WeekRules.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './LeaderboardScreen.module.css';
import { errorText } from '../../i18n/meText.js';

const BUNTING = ['var(--color-sage)', 'var(--color-honey)', 'var(--color-peach)', 'var(--color-mint)'];
const FLAGS = 12;

function Bunting() {
  const width = 100 / FLAGS;
  return (
    <svg className={styles.bunting} viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 2Q50 8 100 2" className={styles.string} />
      {Array.from({ length: FLAGS }, (_, i) => {
        const x = i * width;
        const sag = 2 + Math.sin((i / (FLAGS - 1)) * Math.PI) * 3;
        return <path key={i} d={`M${x + 0.6} ${sag}h${width - 1.2}l${-(width - 1.2) / 2} 9z`} style={{ fill: BUNTING[i % BUNTING.length] }} />;
      })}
    </svg>
  );
}

/** This week's top players worldwide: a winners' podium, then the rest of the board. */
export default function LeaderboardScreen() {
  const { isSignedIn, progress } = usePlayer();
  const { t } = useI18n();
  const { user } = useAuth();
  // Reload when the player's progress changes, so their own score is fresh; the last board shows meanwhile.
  const solvedCount = Object.keys(progress.levels).length;
  const { board, error: loadError } = useWeeklyBoard({ owner: user?.id ?? 'guest', refreshKey: `${isSignedIn}:${solvedCount}:${progress.pal.id}` });
  const error = loadError ? errorText(t, loadError.message) : '';

  // Your own rows always show the Pal you're playing with right now, even before the board reloads.
  const withMyPal = (row) =>
    row.isMe && progress.pal.id
      ? {
          ...row,
          pal: progress.pal.id,
          palStage: stageOf(progress.pal.owned[progress.pal.id]),
          wearing: progress.pal.wearing,
          nickname: progress.nickname ?? row.nickname,
        }
      : row.isMe && progress.nickname
        ? { ...row, nickname: progress.nickname }
        : row;
  const top = board?.top.map(withMyPal) ?? [];
  const [openRow, setOpenRow] = useState(null);
  const rest = top.filter((row) => row.rank > 3);
  const partner = palById(progress.pal.id);
  const isMeListed = top.some((row) => row.isMe);

  return (
    <div className={styles.page}>
      <ScreenHeader
        title={
          <span className={styles.title}>
            <Icon name="trophy" size={22} className={styles.titleIcon} />
            {t('top.title')}
          </span>
        }
      />
      <main className={styles.arena}>
        <Bunting />
        <div className={styles.host}>
          <Lumi mood="excited" size={72} />
          {partner && (
            <a
              href="#/pals"
              className={styles.playingWith}
              aria-label={`${t('top.playingWith', { name: t(`palName.${partner.id}`, {}, partner.name) })}. ${t('top.change')}`}
            >
              <PalArt
                palId={partner.id}
                stage={stageOf(progress.pal.owned[partner.id])}
                wearing={progress.pal.wearing}
                size={40}
                portrait
                className={styles.playingArt}
              />
              <span className={`game-title ${styles.playingName}`} aria-hidden="true">
                {t(`palName.${partner.id}`, {}, partner.name)}
              </span>
              <span className={styles.swap} aria-hidden="true">
                <Icon name="restart" size={14} strokeWidth={2.6} />
              </span>
            </a>
          )}
        </div>
        {error && <p className={styles.empty}>{error}</p>}
        {!board && !error && <BoardSkeleton label={t('top.loading')} />}
        {board && <Podium top={top} onOpen={setOpenRow} />}

        <div className={styles.below}>
          {rest.length > 0 && (
            <ol className={styles.list} aria-label={t('top.restLabel')}>
              {rest.map((row) => (
                <RankRow key={row.rank} row={row} onOpen={setOpenRow} />
              ))}
            </ol>
          )}
          {board?.me && !isMeListed && (
            <ol className={styles.list} aria-label={t('top.myPlaceLabel')}>
              <RankRow row={withMyPal({ ...board.me, isMe: true })} onOpen={setOpenRow} />
            </ol>
          )}
          {isSignedIn && board?.myNickname && !board.me && (
            <p className={styles.empty}>{withParts(t('top.youAre'), { name: <strong>{board.myNickname}</strong> })}</p>
          )}

          {!isSignedIn && (
            <Button as="a" href="#/settings" icon="user" className={styles.join}>
              {t('top.signInJoin')}
            </Button>
          )}

          <WeekRules endsAt={board?.endsAt} />
        </div>
      </main>
      <BottomNav active="top" />
      {openRow && <PlayerCardDialog row={openRow} myScore={board?.me?.score ?? 0} onClose={() => setOpenRow(null)} />}
    </div>
  );
}
