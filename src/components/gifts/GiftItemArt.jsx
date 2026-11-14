import ShopItemArt from '../../screens/store/ShopItemArt.jsx';
import GroveItemArt from '../grove/GroveItemArt.jsx';
import PalArt from '../pals/PalArt.jsx';

/** The picture of one thing out of a gift: sparks, a helper, a diamond, an outfit (on your Pal) or Grove decor. */
export default function GiftItemArt({ art, partner, size = 64 }) {
  if (art.kind === 'decor') return <GroveItemArt id={art.id} size={size} />;
  if (art.kind === 'outfit') return <PalArt palId={partner?.id ?? 'ember'} wearing={[art.id]} size={size} />;
  return <ShopItemArt art={art.id} size={size} />;
}
