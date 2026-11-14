import { useState } from 'react';
import ChipTabs from '../../components/game/ChipTabs.jsx';
import AdoptShelf from './AdoptShelf.jsx';
import ClothesShelf from './ClothesShelf.jsx';
import GroveShelf from './GroveShelf.jsx';
import ThemeShelf from './ThemeShelf.jsx';
import TryOnDialog from './TryOnDialog.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, PAL_ACCESSORIES } from '../../game/pals.js';
import { GROVE_ITEMS } from '../../game/grove.js';
import { themeOfWeek } from '../../game/themes.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palName } from '../../i18n/palText.js';
import styles from './Stall.module.css';

const ownedOf = (progress, items, list) => [items.filter((item) => list.includes(item.id)).length, items.length];
const clothesIn = (slot) => PAL_ACCESSORIES.filter((item) => item.slot === slot);

/** The Pal shop's sections, each with how many of its things you already own. */
const SECTIONS = [
  {
    id: 'week',
    icon: 'gift',
    owned: (progress) => ownedOf(progress, themeOfWeek().items, [...progress.pal.accessories, ...progress.grove.items]),
  },
  { id: 'adopt', icon: 'paw', owned: (progress) => [Object.keys(progress.pal.owned).length, PALS.length] },
  { id: 'head', icon: 'crown', owned: (progress) => ownedOf(progress, clothesIn('head'), progress.pal.accessories) },
  { id: 'neck', icon: 'shirt', owned: (progress) => ownedOf(progress, clothesIn('neck'), progress.pal.accessories) },
  { id: 'hand', icon: 'wand', owned: (progress) => ownedOf(progress, clothesIn('hand'), progress.pal.accessories) },
  { id: 'grove', icon: 'home', owned: (progress) => ownedOf(progress, GROVE_ITEMS, progress.grove.items) },
];

/**
 * Everything for your Pals, in small tabs pinned while you browse: this week's theme collection, adopting
 * Pals, hats, capes, gear and Grove decor. Tapping any outfit piece or decoration opens "Try it on".
 */
export default function PalShop({ onLumi, onGetDiamonds }) {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const [section, setSection] = useState('week');
  const [trying, setTrying] = useState(null);

  return (
    <>
      <ChipTabs
        label={t('shop.pal.label')}
        idPrefix="pal-shop"
        active={section}
        onChange={setSection}
        className={styles.palShopTabs}
        tabs={SECTIONS.map(({ owned, ...tab }) => {
          const [have, total] = owned(progress);
          return { ...tab, label: t(`shop.pal.${tab.id}`), count: `${have}/${total}`, countLabel: t('shop.pal.ownedCount', { have, total }) };
        })}
      />
      <div id="pal-shop-panel" role="tabpanel" aria-labelledby={`pal-shop-${section}`} className={styles.palShopPanel}>
        {section === 'week' && <ThemeShelf onTry={setTrying} />}
        {section === 'adopt' && (
          <AdoptShelf
            onAdopted={(pal) => {
              sfx.newPal();
              rewardShower();
              onLumi({ mood: 'dance', line: t('shop.lumi.adopted', { name: palName(lang, pal) }) });
            }}
            onError={(message) => onLumi({ mood: 'worried', line: message })}
          />
        )}
        {(section === 'head' || section === 'neck' || section === 'hand') && (
          <ClothesShelf key={section} items={clothesIn(section)} onTry={setTrying} />
        )}
        {section === 'grove' && <GroveShelf onTry={setTrying} />}
      </div>
      {trying && (
        <TryOnDialog
          item={trying}
          onClose={() => setTrying(null)}
          onGetDiamonds={() => {
            setTrying(null);
            onGetDiamonds();
          }}
        />
      )}
    </>
  );
}
