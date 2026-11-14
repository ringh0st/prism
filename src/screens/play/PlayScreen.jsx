import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Board from '../../components/board/Board.jsx';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import ScreenTitle from '../../components/game/ScreenTitle.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import SpeechBox from '../../components/game/SpeechBox.jsx';
import { celebrate } from '../../lib/effects.js';
import GemShape from '../../components/GemShape.jsx';
import HelperBar from '../../components/HelperBar.jsx';
import QuickBuyDialog from '../../components/QuickBuyDialog.jsx';
import StarMeter from './StarMeter.jsx';
import LevelIntro from './LevelIntro.jsx';
import ChallengeResultDialog from './ChallengeResultDialog.jsx';
import FriendFoundDialog from '../pals/FriendFoundDialog.jsx';
import { isFriendDue } from '../../game/firstFriend.js';
import RushClearedDialog from '../rush/RushClearedDialog.jsx';
import RushOverDialog from '../rush/RushOverDialog.jsx';
import { RUSH_LENGTH, rushMoveLimit } from '../../game/rush.js';
import Spotlight from '../../components/tour/Spotlight.jsx';
import TileArt from '../../components/board/TileArt.jsx';
import { unseenTips } from '../../game/levelTips.js';
import WorldBackdrop from './WorldBackdrop.jsx';
import { WORLDS } from '../../game/worlds.js';
import OutOfMovesDialog from './OutOfMovesDialog.jsx';
import WinDialog from './WinDialog.jsx';
import { usePuzzle } from '../../hooks/usePuzzle.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useLevels } from '../../state/LevelsContext.jsx';
import { navigate } from '../../hooks/useHashRoute.js';
import { music } from '../../audio/music.js';
import { sfx } from '../../audio/sfx.js';
import { playLightFinale } from '../../lib/lightFinale.js';
import { moveLimitFor, starsForMoves } from '../../game/scoring.js';
import { HELPERS, HELPER_IDS, LENS_DURATION_MS, helpersAllowedFor } from '../../game/catalog.js';
import { isWorldComplete } from '../../game/progress.js';
import { dailyShareText } from '../../game/share.js';
import { PUBLIC_GAME_URL } from '../../lib/config.js';
import { levelModifierFor } from '../../game/surprises.js';
import { quipLines } from '../../game/quips.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { flavorText, levelTitle, pieceText, worldName } from '../../i18n/gameText.js';
import { DIFFICULTY, TILE } from '../../game/constants.js';
import { firstTileOf, newPiecesIn, piecesMetIn } from '../../game/pieces.js';
import { findHint, tapsLeft } from '../../game/solver.js';
import { isRotatable } from '../../game/beam.js';
import { readJson, writeJson } from '../../lib/storage.js';
import { EVENT_LEVELS, parseEventLevelId } from '../../game/events.js';
import ComboBurst from './ComboBurst.jsx';
import Callout from './Callout.jsx';
import { treatFoundBy } from '../../game/treats.js';
import { newStickersFor } from '../../game/stickers.js';
import { climbFor } from '../../game/titles.js';
import { usePlayStats } from '../../hooks/usePlayStats.js';
import { useAvailableHeight } from '../../hooks/useAvailableHeight.js';
import { glowbugCellOf, glowbugForLevel, rescuedGlowbugs } from '../../game/glowbugs.js';
import { cellsOnBeams } from '../../game/beam.js';
import PalBuddy from './PalBuddy.jsx';
import { comboFor } from '../../game/combos.js';
import styles from './PlayScreen.module.css';

const WIN_DIALOG_DELAY_MS = 1300;
/** Lumi's quips that are just cheers: shown as a pop-up word over the board, not in her speech box. */
const CALLOUT_EVENTS = new Set(['start', 'gem', 'combo', 'lastMove', 'win1', 'win2', 'win3', 'streak']);
const IDLE_AFTER_MS = 30000;
/** Taps in a row that light no new gem before Lumi suggests a Hint. */
const STUCK_AFTER_MOVES = 6;
/** In 1-2 and 1-3 the pointing hand only comes back if the player hasn't tapped for a moment. */
const COACH_AFTER_MS = 3500;
/** Worlds where running out of moves offers "Keep going" (for 1 star) instead of a fail. */
const KEEP_GOING_WORLDS = 2;
const KEEP_GOING_MOVES = 5;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SEEN_PIECES_KEY = 'prism.seenPieces.v1';
const SEEN_TIPS_KEY = 'prism.seenTips.v1';

/** Pieces already introduced on this device, or (first time) the ones met in levels already solved. */
function seenPieces(progress) {
  return readJson(SEEN_PIECES_KEY, null) ?? piecesMetIn(progress.levels);
}

/** The first three levels teach on the board itself (a pointing hand, Lamp/Gem tags) and hide the extras. */
/** The 3×3 area around a tile (clipped to the board), as cell indexes: where to look, not which piece. */
function lookHereCells(tile, width, height) {
  const cells = new Set();
  for (let y = Math.max(0, tile.y - 1); y <= Math.min(height - 1, tile.y + 1); y++)
    for (let x = Math.max(0, tile.x - 1); x <= Math.min(width - 1, tile.x + 1); x++) cells.add(y * width + x);
  return cells;
}

const isFirstStepsLevel = (level, mode) => mode === 'level' && level.world === 1 && level.index <= 3;

/** New-piece cards to show; the basics are taught on the board in the first levels instead. */
function piecesToIntroduce(level, mode, progress) {
  if (mode === 'playtest') return [];
  return newPiecesIn(level, seenPieces(progress)).filter((piece) => !(piece.id === 'basics' && isFirstStepsLevel(level, mode)));
}

/**
 * mode: 'level' (records progress) | 'daily' (streak + sparks) | 'event' (weekend event puzzle) | 'playtest' (admin preview, free helpers, records nothing)
 * | 'challenge' (a friend's "beat my score" link: no helpers, records nothing; `challenge` is { levelId, moves, name })
 * | 'rush' (Light Rush: no helpers, the run's spare moves set the limit; `rush` is from RushRoute)
 */
export default function PlayScreen({ level, mode = 'level', title, backHref = '#/', nextLevel = null, dateKey, challenge = null, rush = null }) {
  const { progress, settings, finishLevel, finishDaily, finishEventLevel, consumeHelper } = usePlayer();
  const { levelRefsInWorld } = useLevels();
  const puzzle = usePuzzle(level);
  // Worlds 1–2: the first Hint in each level is free (beginners shouldn't run out of help).
  const hasFreeHint = mode === 'level' && level.world <= KEEP_GOING_WORLDS && !puzzle.usedHelpers.includes('hint');
  const { trace, moves } = puzzle;
  const [result, setResult] = useState(null);
  const [solvedStars, setSolvedStars] = useState(0);

  // A Glowbug naps on some levels until you rescue it with three stars (glowbugs.js).
  const glowbug = useMemo(
    () => (mode === 'level' && (progress.levels[level.id]?.stars ?? 0) < 3 ? glowbugForLevel(level.id) : null),
    [mode, level.id],
  ); // eslint-disable-line react-hooks/exhaustive-deps
  const [glowbugCell, setGlowbugCell] = useState(null);
  useEffect(() => {
    setGlowbugCell(null);
    if (!glowbug) return undefined;
    // Finding its cell runs the solver, so it happens just after the level appears.
    const timer = setTimeout(() => setGlowbugCell(glowbugCellOf(level)), 60);
    return () => clearTimeout(timer);
  }, [glowbug, level]);
  const litCells = useMemo(() => cellsOnBeams(trace.segments, level.width, level.height), [trace, level]);
  const isGlowbugAwake = glowbugCell !== null && litCells.has(glowbugCell);
  useEffect(() => {
    if (isGlowbugAwake) sfx.sparkle();
  }, [isGlowbugAwake]);
  const [isOutOfMoves, setIsOutOfMoves] = useState(false);
  // Early worlds forgive running out: "Keep going" adds moves, for 1 star at most.
  const [bonusMoves, setBonusMoves] = useState(0);
  const [isMeetingFriend, setIsMeetingFriend] = useState(false);
  const [rushOver, setRushOver] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  // Pieces this player meets for the first time get a "New piece!" card before the level starts.
  const [newPieces, setNewPieces] = useState(() => piecesToIntroduce(level, mode, progress));
  // The spotlight tour shown right after the intro: new pieces on the board, then one-time tips.
  const [tour, setTour] = useState({ steps: [], index: 0 });
  const [spotlightTile, setSpotlightTile] = useState(-1);
  const { t, line, lang } = useI18n();
  const [lumi, setLumi] = useState({ mood: 'happy', line: '' });
  const [buyingHelper, setBuyingHelper] = useState(null);
  const [isConfirmingSkip, setIsConfirmingSkip] = useState(false);
  const [isHintAfterRetry, setIsHintAfterRetry] = useState(false);
  const lastLitCount = useRef(0);
  const lastShadeCount = useRef(0);
  const hasRecordedWin = useRef(false);
  const boardAreaRef = useRef(null);
  // The board grows to fill the free height between the meter and Lumi (big cells, easy to tap).
  const boardRoom = useAvailableHeight(boardAreaRef);
  const [combo, setCombo] = useState(null);
  const [palReaction, setPalReaction] = useState(null);
  const react = useCallback((name) => setPalReaction({ name, key: Date.now() }), []);

  const modifier = useMemo(() => levelModifierFor(level), [level]);
  const isFirstSteps = isFirstStepsLevel(level, mode);
  const flavor = flavorText(lang, level);
  const moveLimit = (mode === 'rush' ? rushMoveLimit(rush.run, level.par) : moveLimitFor(level.par, level.difficulty)) + bonusMoves;
  const starCap = bonusMoves > 0 ? Math.min(1, puzzle.starCap) : puzzle.starCap;
  const canKeepGoing = mode === 'level' && level.world <= KEEP_GOING_WORLDS;
  const gems = level.tiles.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.type === TILE.GEM);
  const helpersAllowed = helpersAllowedFor(level.difficulty);
  // Daily and event puzzles can't be skipped.
  // World 1 offers just Hint (fewer buttons to take in); the others join from World 2.
  const offeredHelpers =
    mode === 'challenge' || mode === 'rush'
      ? []
      : mode === 'level' && level.world === 1
        ? ['hint']
        : mode === 'daily' || mode === 'event'
          ? HELPER_IDS.filter((id) => id !== 'skip')
          : HELPER_IDS;
  const levelName = mode === 'daily' ? t('play.daily') : mode === 'playtest' ? title : title || levelTitle(lang, level);
  const levelLabel = `${level.world}-${level.index}`;
  // Built-in worlds have their own look (board colors and landscape) and show their name.
  const world = ['level', 'challenge', 'rush'].includes(mode) ? WORLDS[level.world - 1] : null;
  const backName = t(mode === 'event' ? 'place.event' : mode === 'rush' ? 'place.rush' : 'place.map');
  const eventSpot = useMemo(() => (mode === 'event' ? parseEventLevelId(level.id) : null), [mode, level.id]);
  const subtitle = level.isDaily
    ? t('play.daily')
    : eventSpot
      ? t('play.eventSpot', { n: eventSpot.number, total: EVENT_LEVELS })
      : mode === 'playtest'
        ? 'Test play'
        : mode === 'challenge'
          ? challenge.name
            ? t('play.challengeFrom', { name: challenge.name })
            : t('play.challengeFromFriend')
          : mode === 'rush'
            ? t('play.rushSpot', { n: rush.number, total: RUSH_LENGTH })
            : world && lang !== 'en'
              ? worldName(lang, world) // the title already says "שלב 5-16"
              : `${world ? `${worldName(lang, world)} · ` : ''}${level.world}-${level.index}`;
  const introLine = useMemo(
    () =>
      challenge
        ? t('intro.challenge', { count: challenge.moves })
        : rush
          ? t('intro.rush', { n: rush.number, count: rush.run.spare })
          : line(`quips.${modifier === 'normal' ? 'start' : modifier}`, quipLines(modifier === 'normal' ? 'start' : modifier)),
    [modifier, challenge], // eslint-disable-line react-hooks/exhaustive-deps -- the rush line is set once per puzzle
  );
  const isOver = trace.isSolved || isOutOfMoves || Boolean(result);

  // Cheers pop over the board and fade (a game shout, nothing to read); Lumi's box keeps the useful lines.
  const [callout, setCallout] = useState(null);
  const say = useCallback(
    (mood, event) => {
      const text = event ? line(`quips.${event}`, quipLines(event)) : '';
      if (!CALLOUT_EVENTS.has(event)) return setLumi({ mood, line: text });
      setLumi({ mood, line: '' });
      // A combo already shows its own burst.
      if (event !== 'combo') setCallout({ text, key: Date.now(), isBig: event.startsWith('win') });
    },
    [line],
  );
  const playStats = usePlayStats(level.id, mode === 'level', moves);

  // Reset per level.
  useEffect(() => {
    setResult(null);
    setIsOutOfMoves(false);
    setBonusMoves(0);
    setShowIntro(true);
    setNewPieces(piecesToIntroduce(level, mode, progress));
    setSpotlightTile(-1);
    setLumi({ mood: 'happy', line: '' });
    hasRecordedWin.current = false;
  }, [level.id]);

  // Lens ghost path fades after a few seconds.
  useEffect(() => {
    if (!puzzle.ghostSegments) return undefined;
    const timer = setTimeout(puzzle.clearGhost, LENS_DURATION_MS);
    return () => clearTimeout(timer);
  }, [puzzle.ghostSegments, puzzle.clearGhost]);

  // Nothing happening for a while: Lumi suggests a Hint and the Hint button wiggles (where helpers are on).
  const [isNudgingHint, setIsNudgingHint] = useState(false);
  const isTouring = tour.steps.length > 0;
  const canSuggestHint = !isFirstSteps && offeredHelpers.includes('hint') && puzzle.usedHelpers.length < helpersAllowed;
  // The hint ladder's free first step: a soft glow on the area to look at (Hint then marks the mirror,
  // Auto-turn turns it), so the "aha" is still the player's.
  const [lookHere, setLookHere] = useState(null);
  const suggestHint = () => {
    const tileIndex = findHint(level, puzzle.orients);
    const tile = tileIndex === null ? null : level.tiles[tileIndex];
    setLookHere(tile ? lookHereCells(tile, level.width, level.height) : null);
    setLumi({ mood: 'happy', line: t(tile ? 'lumi.lookHere' : 'lumi.stuckHint') });
    sfx.lumiTalk();
    setIsNudgingHint(true);
  };
  // Many taps without lighting anything new also counts as stuck.
  const lastGemMove = useRef(0);
  // The most gems lit by one tap in this try (for the partner Pal's records).
  const bestCombo = useRef(0);
  useEffect(() => {
    if (trace.litGems.size > lastLitCount.current || moves === 0) {
      lastGemMove.current = moves;
      setIsNudgingHint(false);
      setLookHere(null);
    }
    if (!isOver && canSuggestHint && moves - lastGemMove.current >= STUCK_AFTER_MOVES && !isNudgingHint) suggestHint();
  }, [moves]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!canSuggestHint) setIsNudgingHint(false);
  }, [canSuggestHint]);
  useEffect(() => {
    if (isOver || showIntro || isTouring) return undefined;
    const timer = setTimeout(() => (canSuggestHint ? suggestHint() : say('sleepy', 'idle')), IDLE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [moves, isOver, showIntro, isTouring, say]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feedback as gems light up, shadow crystals are hit, or moves run low.
  useEffect(() => {
    const litCount = trace.litGems.size;
    const shadeCount = trace.litShades.size;
    if (moves === 0) {
      lastLitCount.current = litCount;
      lastShadeCount.current = shadeCount;
      return;
    }
    if (litCount > lastLitCount.current) {
      // Several gems from one tap: a combo!
      const combo = comboFor(litCount - lastLitCount.current);
      if (combo) {
        setCombo({ ...combo, key: Date.now() });
        bestCombo.current = Math.max(bestCombo.current, combo.size);
        sfx.combo(combo.size);
      } else {
        sfx.gemLit(litCount);
      }
      // Each gem's spark lands in the counter a moment later (see flyToCounter): one "ting" each, rising.
      for (let n = lastLitCount.current + 1; n <= litCount; n++) setTimeout(() => sfx.gemCollect(n), 600 + (n - lastLitCount.current - 1) * 90);
      say('excited', litCount < gems.length ? (combo ? 'combo' : 'gem') : null);
      react(combo ? 'spin' : 'hop');
    } else if (shadeCount > lastShadeCount.current) {
      sfx.shade();
      say('worried', 'shade');
      react('shake');
    } else if (!trace.isSolved && moves === moveLimit - 1) {
      say('worried', 'lastMove');
      react('shiver');
    } else {
      setLumi((current) => (current.mood === 'sleepy' ? { mood: 'happy', line: '' } : current));
    }
    lastLitCount.current = litCount;
    lastShadeCount.current = shadeCount;
  }, [trace, moves, gems.length, moveLimit, say, react]);

  // First levels: Lumi explains what just happened after the first tap.
  useEffect(() => {
    if (isFirstSteps && moves === 1 && !trace.isSolved) {
      setLumi({ mood: 'excited', line: t('coach.firstMove') });
      sfx.lumiTalk();
    }
  }, [moves]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Record the result (server-checked when signed in) and celebrate. */
  const completeLevel = useCallback(
    async ({ isSkipped = false } = {}) => {
      if (hasRecordedWin.current) return;
      hasRecordedWin.current = true;
      playStats.end(isSkipped ? 'quit' : 'win');

      const stars = isSkipped ? 1 : Math.min(starsForMoves(moves, level.par, level.difficulty), starCap);
      setSolvedStars(stars);
      const isBig = modifier === 'boss' || level.difficulty === DIFFICULTY.EXTRA;
      sfx.win({ stars, isBig });
      // Hard levels get the big celebration too: beating one should feel like it.
      if (!isSkipped) celebrate({ stars, isBig: isBig || level.difficulty === DIFFICULTY.HARD, from: boardAreaRef.current });
      // The light finale: each move left over bursts along the winning light path before the result shows.
      const movesLeft = isSkipped ? 0 : moveLimit - moves;
      const finaleMs = playLightFinale({ segments: trace.segments, width: level.width, movesLeft, onBurst: sfx.finaleBurst });
      if (finaleMs > 0) {
        setLumi({ mood: 'dance', line: '' });
        setCallout({ text: t('play.spare', { count: movesLeft }), key: Date.now(), isBig: true });
      } else say(stars === 3 ? 'dance' : 'excited', isSkipped ? null : `win${stars}`);
      react('dance');
      const worldRefs = mode === 'level' ? levelRefsInWorld(level.world) : [];
      const wasWorldComplete = isWorldComplete(progress, worldRefs);
      const usedHelpers = puzzle.usedHelpers.length > 0;

      let outcome;
      if (mode === 'level') {
        outcome = finishLevel(
          level,
          isSkipped ? { moves: null, forcedStars: 1, usedHelpers: true } : { moves, starCap, usedHelpers, combo: bestCombo.current },
        );
      } else if (mode === 'event') {
        outcome = finishEventLevel(level, { ...eventSpot, moves, starCap });
      } else if (mode === 'rush') {
        const spareBefore = rush.run.spare;
        outcome = rush.onSolved(moves).then((rushOutcome) => ({ stars, sparksEarned: rushOutcome.sparksWon, rush: { ...rushOutcome, spareBefore } }));
      } else if (mode === 'daily') {
        outcome = finishDaily(dateKey).then((daily) => ({ ...daily, stars, isNewBest: false }));
      } else {
        outcome = Promise.resolve({ stars, sparksEarned: 0, diamondsEarned: 0, isNewBest: false });
      }
      const [finished] = await Promise.all([outcome, wait(WIN_DIALOG_DELAY_MS + finaleMs)]);
      const solvedLevels = { ...progress.levels, [level.id]: { stars } };
      const completesWorld = mode === 'level' && !wasWorldComplete && isWorldComplete({ levels: solvedLevels }, worldRefs);
      const glowbugResult = glowbug && {
        id: glowbug.id,
        isRescued: stars === 3 && !isSkipped,
        isNew: !rescuedGlowbugs(progress.levels).has(glowbug.id),
      };
      // Treats and stickers come from the stars, before and after this solve.
      const levelsAfter = {
        ...progress.levels,
        [level.id]: { ...progress.levels[level.id], stars: Math.max(stars, progress.levels[level.id]?.stars ?? 0) },
      };
      const treat = mode === 'level' ? treatFoundBy(progress.levels, levelsAfter) : null;
      const newStickers = mode === 'level' ? newStickersFor(level.world, progress.levels, levelsAfter) : [];
      const climb = mode === 'level' ? climbFor(progress.levels, levelsAfter) : {};
      setResult({ ...finished, moves: isSkipped ? null : moves, isSkipped, completesWorld, glowbug: glowbugResult, treat, newStickers, ...climb });
    },
    [
      moves,
      level,
      modifier,
      starCap,
      puzzle.usedHelpers.length,
      mode,
      levelRefsInWorld,
      progress,
      finishLevel,
      finishDaily,
      finishEventLevel,
      eventSpot,
      dateKey,
      say,
      react,
      glowbug,
      playStats,
      moveLimit,
      trace.segments,
      t,
    ],
  );

  useEffect(() => {
    if (trace.isSolved) completeLevel();
  }, [trace.isSolved]); // eslint-disable-line react-hooks/exhaustive-deps

  // Out of moves.
  useEffect(() => {
    if (!trace.isSolved && moves >= moveLimit && !hasRecordedWin.current) {
      const timer = setTimeout(() => {
        sfx.outOfMoves();
        say('sad', null);
        react('droop');
        setIsOutOfMoves(true);
        playStats.end('out_of_moves');
      }, 450);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [moves, moveLimit, trace.isSolved, say, react, playStats]);

  // Tapping a piece that can't turn says why (a little shake, a soft "nope" and a word from Lumi).
  const [nudgedCell, setNudgedCell] = useState(null);
  const onBlocked = useCallback(
    (cell, tileIndex) => {
      if (isOver) return;
      const tile = level.tiles[tileIndex];
      sfx.locked();
      setNudgedCell(null);
      requestAnimationFrame(() => setNudgedCell(cell));
      setLumi({ mood: 'happy', line: t(`lumi.blocked.${['mirror', 'wall', 'emitter', 'gem'].includes(tile.type) ? tile.type : 'other'}`) });
    },
    [isOver, level.tiles, t],
  );

  const onActivate = useCallback(
    (_cell, tileIndex) => {
      if (isOver || tileIndex < 0 || moves >= moveLimit) return;
      sfx.rotate();
      // A cracking mirror's last turn: crack! (it stays put from now on)
      if (puzzle.turnsLeft[tileIndex] === 1) {
        sfx.crack();
        say('worried', 'crack');
      }
      puzzle.rotate(tileIndex);
    },
    [isOver, moves, moveLimit, puzzle, say],
  );

  const restart = useCallback(() => {
    sfx.restart();
    if (mode === 'rush' && moves > 0) rush.onRestart(moves);
    puzzle.restart();
    bestCombo.current = 0;
    playStats.start();
    setResult(null);
    setIsOutOfMoves(false);
    setBonusMoves(0);
    setSolvedStars(0);
    hasRecordedWin.current = false;
    say('happy', 'start');
    setPalReaction(null);
  }, [puzzle, say, playStats, mode, moves, rush]);

  /** Spend one helper from the inventory (free in playtest) and apply it. */
  const spendHelper = useCallback(
    async (helperId) => {
      try {
        if (mode !== 'playtest' && !(helperId === 'hint' && hasFreeHint)) await consumeHelper(helperId);
      } catch (error) {
        setLumi({ mood: 'worried', line: errorText(t, error.message) });
        return;
      }
      puzzle.applyHelper(helperId);
      sfx.helper();
      // Say plainly what a helper costs: the best result left for this try.
      if (helperId !== 'skip') {
        const best = Math.min(starCap, HELPERS[helperId].starCap);
        setLumi({ mood: 'excited', line: t(`lumi.helper.${helperId}`, { stars: '★'.repeat(best) }) });
      }
      if (helperId === 'skip') completeLevel({ isSkipped: true });
    },
    [mode, consumeHelper, puzzle, completeLevel, starCap],
  );

  const requestHelper = useCallback(
    (helperId) => {
      if (isOver) return;
      if (puzzle.usedHelpers.length >= helpersAllowed) {
        setLumi({ mood: 'worried', line: t('lumi.helperLimit', { count: helpersAllowed }) });
        return;
      }
      if (helperId === 'autoturn' && moves >= moveLimit) return;
      const owned = progress.helpers[helperId] ?? 0;
      if (mode !== 'playtest' && owned < 1 && !(helperId === 'hint' && hasFreeHint)) {
        setBuyingHelper(helperId);
        return;
      }
      if (helperId === 'skip') setIsConfirmingSkip(true);
      else spendHelper(helperId);
    },
    [isOver, puzzle.usedHelpers.length, helpersAllowed, moves, moveLimit, progress.helpers, mode, spendHelper],
  );

  // "Try again with a hint": once the board has reset, spend the hint.
  useEffect(() => {
    if (isHintAfterRetry && !isOver) {
      setIsHintAfterRetry(false);
      requestHelper('hint');
    }
  }, [isHintAfterRetry, isOver, requestHelper]);

  // Keyboard shortcuts: R restart, H hint.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.target.closest?.('[role="dialog"]') || event.metaKey || event.ctrlKey || event.altKey || showIntro) return;
      if (event.key === 'r' || event.key === 'R') restart();
      if (event.key === 'h' || event.key === 'H') requestHelper('hint');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restart, requestHelper, showIntro]);

  /** Spotlights for this level: each new piece where it sits on the board, then any first-time tips. */
  const buildTour = () => {
    const pieceSteps = newPieces.map((piece) => {
      const tile = level.tiles[firstTileOf(level, piece.id)];
      return {
        id: `piece-${piece.id}`,
        target: tile ? `[data-cell="${tile.y * level.width + tile.x}"]` : '[data-tour="board"]',
        ...pieceText(lang, piece),
        art: (
          <TileArt
            tile={piece.sample}
            turns={piece.sample.orient ?? 0}
            isLit={piece.sample.type === 'gem'}
            isRotatable={false}
            isFogged={Boolean(piece.sample.fog)}
          />
        ),
      };
    });
    const showsTips = ['level', 'daily', 'event'].includes(mode) && !isFirstSteps && pieceSteps.length === 0;
    const tipSteps = showsTips
      ? unseenTips(readJson(SEEN_TIPS_KEY, [])).map((tip) => ({ ...tip, title: t(`tip.${tip.id}.title`), text: t(`tip.${tip.id}.text`) }))
      : [];
    return [...pieceSteps, ...tipSteps];
  };

  const finishTour = () => {
    if (newPieces.length) {
      writeJson(SEEN_PIECES_KEY, [...seenPieces(progress), ...newPieces.map((piece) => piece.id)]);
      // Keep a soft glow on the newest piece until the first move.
      const tileIndex = firstTileOf(level, newPieces[newPieces.length - 1].id);
      if (tileIndex >= 0 && isRotatable(level.tiles[tileIndex])) setSpotlightTile(tileIndex);
      setNewPieces([]);
    }
    const tipIds = tour.steps.filter((step) => !step.id.startsWith('piece-')).map((step) => step.id);
    if (tipIds.length) writeJson(SEEN_TIPS_KEY, [...new Set([...readJson(SEEN_TIPS_KEY, []), ...tipIds])]);
    setTour({ steps: [], index: 0 });
  };

  const nextTourStep = () => {
    if (tour.index < tour.steps.length - 1) setTour({ ...tour, index: tour.index + 1 });
    else finishTour();
  };

  // In-level sounds speak in this world's voice (a desert pluck, lagoon drops…); back to normal after.
  useEffect(() => {
    sfx.setWorldVoice(world?.theme ?? null);
    return () => sfx.setWorldVoice(null);
  }, [world?.theme]);

  // Light Rush: every move is saved with the run (leaving mid-puzzle spends them), and running out ends the run.
  useEffect(() => {
    if (mode === 'rush' && !trace.isSolved) rush.onMove(moves);
  }, [moves]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode !== 'rush' || !isOutOfMoves) return;
    rush.onRunOver().then(setRushOver);
  }, [isOutOfMoves]); // eslint-disable-line react-hooks/exhaustive-deps

  // Soft background music in this world's voice while the level is being played; it fades out for the win.
  const isMusicPlaying = !showIntro && !isOver;
  useEffect(() => {
    if (!isMusicPlaying) return undefined;
    music.play(world?.theme ?? null);
    return () => music.stop();
  }, [isMusicPlaying, world?.theme]);

  const dismissIntro = useCallback(() => {
    sfx.unlock();
    sfx.levelStart();
    playStats.start();
    setShowIntro(false);
    setTour({ steps: buildTour(), index: 0 });
    if (isFirstSteps) {
      // The basics are taught right here on the board, so they count as met.
      writeJson(SEEN_PIECES_KEY, [...new Set([...seenPieces(progress), 'basics'])]);
      setLumi({ mood: 'excited', line: t('coach.start') });
      sfx.lumiTalk();
    } else if (flavor) {
      setLumi({ mood: 'happy', line: flavor.goal });
      sfx.lumiTalk();
    }
  }, [playStats, isFirstSteps, flavor, progress, newPieces, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // First levels: a hand points at the next mirror to turn.
  const [isCoachDue, setIsCoachDue] = useState(level.index === 1);
  useEffect(() => {
    if (!isFirstSteps || showIntro || isCoachDue) return undefined;
    const timer = setTimeout(() => setIsCoachDue(true), COACH_AFTER_MS);
    return () => clearTimeout(timer);
  }, [isFirstSteps, showIntro, isCoachDue, moves]);
  // How many taps the best finish still needs, so the meter can drop a star the moment it's out of reach.
  const minTapsLeft = useMemo(() => (trace.isSolved ? 0 : tapsLeft(level, puzzle.orients)), [level, puzzle.orients, trace.isSolved]);
  const coachTile = useMemo(
    () => (isFirstSteps && isCoachDue && !showIntro && !isOver ? findHint(level, puzzle.orients) : null),
    [isFirstSteps, isCoachDue, showIntro, isOver, level, puzzle.orients],
  );

  return (
    <main
      className={`${styles.screen} ${settings.calmBoard ? styles.calm : ''} ${styles[modifier] ?? ''} ${world ? `${styles.themed} ${styles[world.theme]}` : ''}`}
    >
      {world && <WorldBackdrop levelId={level.id} theme={world.theme} />}
      <header className={styles.header}>
        <Button as="a" href={backHref} variant="secondary" icon="back" label={t('play.backTo', { place: backName })} />
        <div className={styles.titleBlock}>
          <p className={styles.subtitle}>{subtitle}</p>
          <ScreenTitle as="h1" size="sm" tone={modifier === 'boss' ? 'boss' : 'calm'}>
            {levelName}
          </ScreenTitle>
        </div>
        {/* The partner Pal watches from the header, so the board can use all the room below. */}
        <span className={styles.headerSpacer}>{mode !== 'playtest' && <PalBuddy reaction={palReaction} />}</span>
      </header>

      <section className={styles.status} aria-label={t('play.status')} data-tour="meter">
        {!isFirstSteps && <StarMeter moves={moves} par={level.par} limit={moveLimit} starCap={starCap} tapsLeft={minTapsLeft} />}
        <ul className={styles.gems} aria-label={t('play.gemsLit', { n: trace.litGems.size, total: gems.length })}>
          {gems.map(({ tile, i }) => (
            <li key={i} className={trace.litGems.has(i) ? styles.gemOn : styles.gemOff} data-gem-slot={i}>
              <GemShape color={tile.color} size={24} />
            </li>
          ))}
          {gems.length > 1 && (
            <li className={`game-title ${styles.gemCount}`} aria-hidden="true">
              {trace.litGems.size}/{gems.length}
            </li>
          )}
        </ul>
      </section>

      <div
        className={styles.boardArea}
        ref={boardAreaRef}
        data-tour="board"
        style={boardRoom ? { '--board-max-height': `${boardRoom}px` } : undefined}
      >
        {combo && <ComboBurst combo={combo} />}
        {callout && <Callout callout={callout} />}
        <Board
          level={level}
          orients={puzzle.orients}
          turns={puzzle.turns}
          trace={trace}
          onActivate={onActivate}
          highlightTile={puzzle.hintTile}
          spotlightTile={moves === 0 && spotlightTile >= 0 ? spotlightTile : null}
          ghostSegments={puzzle.ghostSegments}
          coach={isFirstSteps ? { tile: coachTile, labels: true } : null}
          onBlocked={onBlocked}
          nudgedCell={nudgedCell}
          lookHere={isOver || puzzle.hintTile !== null ? null : lookHere}
          turnsLeft={puzzle.turnsLeft}
          revealedCells={puzzle.revealedCells}
          glowbug={
            glowbug && glowbugCell !== null ? { id: glowbug.id, cell: glowbugCell, isAwake: isGlowbugAwake, isFreed: solvedStars === 3 } : null
          }
          isLocked={isOver}
          mood={modifier}
          label={t('play.boardLabel', { name: levelName })}
        />
      </div>

      <SpeechBox line={lumi.line} tail="down" className={styles.speech} />
      <div className={styles.bottom}>
        <div className={styles.lumi}>
          <Lumi mood={lumi.mood} size={96} />
        </div>
        <div className={styles.controls}>
          <Button variant="secondary" icon="restart" label={t('play.restart')} onClick={restart} />
          {!isFirstSteps && (
            <div data-tour="helpers">
              <HelperBar
                helperIds={offeredHelpers}
                inventory={progress.helpers}
                usedCount={puzzle.usedHelpers.length}
                allowed={helpersAllowed}
                disabled={isOver}
                onUse={requestHelper}
                nudgeId={isNudgingHint ? 'hint' : null}
                freeIds={hasFreeHint ? ['hint'] : []}
              />
            </div>
          )}
        </div>
      </div>

      {tour.steps.length > 0 && (
        <Spotlight key={tour.steps[tour.index].id} {...tour.steps[tour.index]} step={tour.index} total={tour.steps.length} onNext={nextTourStep} />
      )}
      {showIntro && (
        <LevelIntro
          level={level}
          title={levelName}
          subtitle={subtitle}
          modifier={modifier}
          lumiLine={introLine}
          moveLimit={moveLimit}
          showsStarTarget={mode !== 'rush'}
          flavor={flavor}
          waitsForTap={isFirstSteps}
          glowbugId={glowbug?.id}
          onDone={dismissIntro}
        />
      )}
      {buyingHelper && (
        <QuickBuyDialog
          helperId={buyingHelper}
          onClose={() => setBuyingHelper(null)}
          onBought={() => {
            const helperId = buyingHelper;
            setBuyingHelper(null);
            if (helperId === 'skip') setIsConfirmingSkip(true);
            else spendHelper(helperId);
          }}
        />
      )}
      {isConfirmingSkip && (
        <Dialog title={t('skip.title')} onClose={() => setIsConfirmingSkip(false)}>
          <p className={styles.dialogText}>{t('skip.text')}</p>
          <div className={styles.dialogActions}>
            <Button variant="secondary" onClick={() => setIsConfirmingSkip(false)} data-autofocus>
              {t('skip.keepTrying')}
            </Button>
            <Button
              icon="skip"
              onClick={() => {
                setIsConfirmingSkip(false);
                spendHelper('skip');
              }}
            >
              {t('helper.skip.name', {}, 'Skip')}
            </Button>
          </div>
        </Dialog>
      )}
      {isOutOfMoves && !result && mode === 'rush' && rushOver && (
        <RushOverDialog {...rushOver} onNewRun={rush.onNewRun} onBack={() => navigate(backHref)} />
      )}
      {result && mode === 'rush' && (
        <RushClearedDialog
          number={rush.number}
          par={level.par}
          moves={result.moves}
          spareBefore={result.rush.spareBefore}
          outcome={result.rush}
          onNext={rush.onNext}
          onBack={() => navigate(backHref)}
        />
      )}
      {isOutOfMoves && !result && mode !== 'rush' && (
        <OutOfMovesDialog
          backName={backName}
          gemsLeft={gems.length - trace.litGems.size}
          gemsLit={trace.litGems.size}
          lumiLine={line('quips.outOfMoves', quipLines('outOfMoves'))}
          hintsOwned={progress.helpers.hint ?? 0}
          onRetry={restart}
          onKeepGoing={
            canKeepGoing
              ? () => {
                  setBonusMoves((extra) => extra + KEEP_GOING_MOVES);
                  setIsOutOfMoves(false);
                  setLumi({ mood: 'happy', line: t('lumi.keepGoing') });
                }
              : null
          }
          onRetryWithHint={
            offeredHelpers.includes('hint') && helpersAllowed > 0
              ? () => {
                  restart();
                  setIsHintAfterRetry(true);
                }
              : null
          }
          onMap={() => navigate(backHref)}
        />
      )}
      {result && mode === 'challenge' && (
        <ChallengeResultDialog
          challenge={challenge}
          levelLabel={levelLabel}
          stars={result.stars}
          moves={result.moves}
          onRetry={restart}
          onHome={() => navigate('#/')}
        />
      )}
      {isMeetingFriend && <FriendFoundDialog onDone={() => (nextLevel ? navigate(nextLevel) : navigate(backHref))} />}
      {result && mode !== 'challenge' && mode !== 'rush' && !isMeetingFriend && (
        <WinDialog
          showWinGifts={mode === 'level' && !isFirstSteps}
          challenge={mode === 'level' && !result.isSkipped && !isFirstSteps ? { levelId: level.id, levelLabel, moves: result.moves } : null}
          backName={backName}
          replay={mode === 'playtest' || isFirstSteps ? null : { level, history: puzzle.history, title: levelName, subtitle }}
          result={result}
          par={level.par}
          difficulty={level.difficulty}
          hotStreak={progress.hotStreak}
          hasNext={Boolean(nextLevel)}
          shareMessage={
            mode === 'daily' && !result.isSkipped
              ? dailyShareText({
                  t,
                  dateKey,
                  stars: result.stars,
                  moves: result.moves,
                  par: level.par,
                  streak: result.streak ?? progress.daily.streak,
                  url: PUBLIC_GAME_URL,
                })
              : null
          }
          // A few wins in, a first Pal turns up as a surprise before the next level.
          onNext={() => (mode === 'level' && isFriendDue(progress) ? setIsMeetingFriend(true) : nextLevel && navigate(nextLevel))}
          onReplay={restart}
          onMap={() => navigate(backHref)}
        />
      )}
    </main>
  );
}
