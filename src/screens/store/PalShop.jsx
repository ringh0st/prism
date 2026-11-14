import { useState } from 'react';
import ChipTabs from '../../components/game/ChipTabs.jsx';
import AdoptShelf from './AdoptShelf.jsx';
import ClothesShelf from './ClothesShelf.jsx';
import GroveShelf from './GroveShelf.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, PAL_ACCESSORIES } from '../../game/pals.js';
import { GROVE_ITEMS } from '../../game/grove.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Stall.module.css';

/** The Pal shop's sections, each with how many of its things you already own. */
const SECTIONS = [
  { id: 'adopt', label: 'Adopt', icon: 'paw', owned: (progress) => [Object.keys(progress.pal.owned).length, PALS.length] },
  { id: 'head', label: 'Hats', icon: 'crown', owned: (progress) => clothesCount(progress, 'head') },
  { id: 'neck', label: 'Capes', icon: 'shirt', owned: (progress) => clothesCount(progress, 'neck') },
  { id: 'hand', label: 'Gear', icon: 'wand', owned: (progress) => clothesCount(progress, 'hand') },
  { id: 'grove', label: 'Grove', icon: 'home', owned: (progress) => [progress.grove.items.length, GROVE_ITEMS.length] },
];

function clothesCount(progress, slot) {
  const items = PAL_ACCESSORIES.filter((item) => item.slot === slot);
  return [items.filter((item) => progress.pal.accessories.includes(item.id)).length, items.length];
}

/**
 * Everything for your Pals, split into small tabs (adopt, hats, capes, gear, Grove decor) so nobody has to
 * scroll through it all. The tabs stay pinned at the top while you browse.
 */
export default function PalShop({ onLumi }) {
  const { progress } = usePlayer();
  const [section, setSection] = useState('adopt');
  const onError = (message) => onLumi({ mood: 'worried', line: message });
  const onClothes = (item) => {
    sfx.coin();
    onLumi({ mood: 'dance', line: `Ooh, the ${item.name.toLowerCase()}! Try it on in Pals.` });
  };

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
        {section === 'adopt' && (
          <AdoptShelf
            onAdopted={(pal) => {
              sfx.newPal();
              rewardShower();
              onLumi({ mood: 'dance', line: `Welcome home, ${pal.name}! Find them in Pals.` });
            }}
            onError={onError}
          />
        )}
        {(section === 'head' || section === 'neck' || section === 'hand') && (
          <ClothesShelf key={section} slotId={section} onBought={onClothes} onError={onError} />
        )}
        {section === 'grove' && (
          <GroveShelf
            onBought={(item) => {
              sfx.coin();
              onLumi({ mood: 'dance', line: `The ${item.name.toLowerCase()} will look lovely in the Grove!` });
            }}
            onError={onError}
          />
        )}
      </div>
    </>
  );
}
