import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalFormsStrip from '../../components/pals/PalFormsStrip.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, adoptPriceOf, dailyPalPick, rarityOf, stageOf } from '../../game/pals.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName, palSpecies } from '../../i18n/palText.js';
import { errorText } from '../../i18n/meText.js';
import HelpTip from '../../components/game/HelpTip.jsx';
import SignInNote from './SignInNote.jsx';
import AskParent from './AskParent.jsx';
import styles from './Stall.module.css';

/** A Pal's name and species, for the {name} and {species} placeholders. */
const palLabel = (lang, pal) => ({ name: palName(lang, pal), species: palSpecies(lang, pal) });

/** Today's Legendary and Mythic picks for this player: chosen at random, but shown before buying. */
function DailyPicks({ onChoose }) {
  const { progress, shopSeed } = usePlayer();
  const { t, lang } = useI18n();
  const picks = ['legendary', 'mythic'].map((rarity) => ({ rarity, pal: dailyPalPick(progress, rarity, shopSeed) }));
  return (
    <>
      <div className={styles.titleRow}>
        <h2 className="game-title">{t('shop.picks.title')}</h2>
        <HelpTip title={t('shop.picks.title')}>
          <p>{t('shop.picks.help')}</p>
        </HelpTip>
      </div>
      <ul className={styles.dailyPicks}>
        {picks.map(({ rarity, pal }) => (
          <li key={rarity}>
            {pal ? (
              <button
                type="button"
                className={`${styles.dailyPick} ${styles[rarity]}`}
                onClick={() => onChoose(pal)}
                aria-label={t('shop.picks.aria', { ...palLabel(lang, pal), count: adoptPriceOf(pal) })}
              >
                <RarityBadge pal={pal} />
                <PalArt palId={pal.id} size={96} />
                <span className="game-title">{palLabel(lang, pal).name}</span>
                <span className={styles.adoptPrice}>
                  <Icon name="diamond" size={13} /> {adoptPriceOf(pal)}
                </span>
              </button>
            ) : (
              <div className={`${styles.dailyPick} ${styles.adoptOwned}`}>
                <span className="game-title">{t(rarity === 'mythic' ? 'shop.picks.allMythic' : 'shop.picks.allLegendary')}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Adopt Pals for diamonds: any Basic Pal you choose, plus today's Legendary and Mythic picks. Never a surprise. */
export default function AdoptShelf({ onAdopted, onError }) {
  const { progress, isSignedIn, adoptPal } = usePlayer();
  const { t, lang } = useI18n();
  const [choice, setChoice] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const regulars = PALS.filter((pal) => rarityOf(pal) === 'common');
  // Pals you don't have come first; yours stay visible, marked Owned, and can't be bought again.
  const shelf = [...regulars.filter((pal) => !progress.pal.owned[pal.id]), ...regulars.filter((pal) => progress.pal.owned[pal.id])];
  const price = choice ? adoptPriceOf(choice) : 0;

  const confirm = async () => {
    setIsBusy(true);
    try {
      await adoptPal(choice.id);
      onAdopted(choice);
      setChoice(null);
    } catch (error) {
      onError(errorText(t, error.message));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <DailyPicks onChoose={setChoice} />
      <div className={styles.titleRow}>
        <h2 className="game-title">{t('shop.adopt.title')}</h2>
        <HelpTip title={t('shop.adopt.title')}>
          <p>{t('shop.adopt.help', { count: adoptPriceOf(regulars[0]) })}</p>
        </HelpTip>
      </div>
      {!isSignedIn && <SignInNote />}
      <ul className={styles.adoptGrid}>
        {shelf.map((pal) => {
          const label = palLabel(lang, pal);
          return (
            <li key={pal.id}>
              {progress.pal.owned[pal.id] ? (
                <div className={`${styles.adoptPal} ${styles.adoptOwned}`} aria-label={t('shop.adopt.ownedAria', label)}>
                  <PalArt palId={pal.id} stage={stageOf(progress.pal.owned[pal.id])} size={64} />
                  <span className="game-title">{label.name}</span>
                  <span className={styles.ownedChip}>
                    <Icon name="check" size={13} /> {t('shop.owned')}
                  </span>
                </div>
              ) : (
                <button type="button" className={styles.adoptPal} onClick={() => setChoice(pal)} aria-label={t('shop.adopt.aria', label)}>
                  <PalArt palId={pal.id} size={64} />
                  <span className="game-title">{label.name}</span>
                  <span className={styles.adoptPrice}>
                    <Icon name="diamond" size={13} /> {adoptPriceOf(pal)}
                  </span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {choice && (
        <Dialog title={t('shop.adopt.confirmTitle', palLabel(lang, choice))} onClose={() => setChoice(null)}>
          <PalArt palId={choice.id} size={120} className={styles.infoArt} />
          <p className={styles.infoText}>
            {t('shop.adopt.confirmName', palLabel(lang, choice))} <RarityBadge pal={choice} />
          </p>
          <PalFormsStrip palId={choice.id} />
          <AskParent />
          <div className={styles.adoptActions}>
            <Button size="lg" disabled={!isSignedIn || isBusy || progress.diamonds < price} onClick={confirm} data-autofocus>
              <Icon name="diamond" size={18} />
              <span>{isBusy ? t('shop.adopt.busy') : t('shop.adopt.for', { price })}</span>
            </Button>
            {isSignedIn && progress.diamonds < price && (
              <p className={styles.shortBy}>
                <Icon name="diamond" size={16} /> {t('shop.adopt.youHave', { count: progress.diamonds })}
              </p>
            )}
            {!isSignedIn && <SignInNote />}
            <Button variant="ghost" onClick={() => setChoice(null)}>
              {t('shop.adopt.notNow')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
