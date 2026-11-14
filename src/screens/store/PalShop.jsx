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
import styles from './Stall.module.css';

const ownedOf = (progress, items, list) => [items.filter((item) => list.includes(item.id)).length, items.length];
const clothesIn = (slot) => PAL_ACCESSORIES.filter((item) => item.slot === slot);

/** The Pal shop's sections, each with how many of its things you already own. */
const SECTIONS = [
  {
    id: 'week',
    label: 'This week',
    icon: 'gift',
    owned: (progress) => ownedOf(progress, themeOfWeek().items, [...progress.pal.accessories, ...progress.grove.items]),
  },
  { id: 'adopt', label: 'Adopt', icon: 'paw', owned: (progress) => [Object.keys(progress.pal.owned).length, PALS.length] },
  { id: 'head', label: 'Hats', icon: 'crown', owned: (progress) => ownedOf(progress, clothesIn('head'), progress.pal.accessories) },
  { id: 'neck', label: 'Capes', icon: 'shirt', owned: (progress) => ownedOf(progress, clothesIn('neck'), progress.pal.accessories) },
  { id: 'hand', label: 'Gear', icon: 'wand', owned: (progress) => ownedOf(progress, clothesIn('hand'), progress.pal.accessories) },
  { id: 'grove', label: 'Grove', icon: 'home', owned: (progress) => ownedOf(progress, GROVE_ITEMS, progress.grove.items) },
];

/**
 * Everything for your Pals, in small tabs pinned while you browse: this week's theme collection, adopting
 * Pals, hats, capes, gear and Grove decor. Tapping any outfit piece or decoration opens "Try it on".
 */
export default function PalShop({ onLumi, onGetDiamonds }) {
  const { progress } = usePlayer();
  const [section, setSection] = useState('week');
  const [trying, setTrying] = useState(null);

  return (
    <>
      <ChipTabs
        label="Pal shop"
        idPrefix="pal-shop"
        active={section}
        onChange={setSection}
        className={styles.palShopTabs}
        tabs={SECTIONS.map(({ owned, ...tab }) => {
          const [have, total] = owned(progress);
          return { ...tab, count: `${have}/${total}`, countLabel: `${have} of ${total} owned` };
        })}
      />
      <div id="pal-shop-panel" role="tabpanel" aria-labelledby={`pal-shop-${section}`} className={styles.palShopPanel}>
        {section === 'week' && <ThemeShelf onTry={setTrying} />}
        {section === 'adopt' && (
          <AdoptShelf
            onAdopted={(pal) => {
              sfx.newPal();
              rewardShower();
              onLumi({ mood: 'dance', line: `Welcome home, ${pal.name}! Find them in Pals.` });
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
