import PictureGuide, { GuideIcon, GuideLabel, Then } from '../../components/guide/PictureGuide.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/**
 * How Pals work, as one picture loop (playtesters loved the Pals but didn't know what they were for): win levels →
 * your Pal grows; the bigger it grows, the stronger its help; every 10 ★ a present; more Pals join as you play and
 * you pick who plays with you. Drawn with your own partner.
 */
export default function PalGuide({ pal, onClose }) {
  const { t } = useI18n();
  const steps = [
    {
      key: 'grow',
      picture: (
        <>
          <GuideIcon name="play" size={22} />
          <Then />
          {[0, 2, 4].map((stage) => (
            <PalArt key={stage} palId={pal.id} stage={stage} size={26 + stage * 3} portrait />
          ))}
        </>
      ),
    },
    {
      key: 'power',
      picture: (
        <>
          <PalPowerBadge power={palPower(pal, 0)} size="sm" />
          <Then />
          <PalPowerBadge power={palPower(pal, 4)} />
        </>
      ),
    },
    {
      key: 'gift',
      picture: (
        <>
          <GuideLabel>10 ★</GuideLabel>
          <Then />
          <GuideIcon name="gift" size={30} />
        </>
      ),
    },
    {
      key: 'more',
      picture: (
        <>
          <GuideIcon name="lock" size={20} />
          <Then />
          <GuideIcon name="paw" size={26} />
        </>
      ),
    },
  ];
  return <PictureGuide title={t('palGuide.title')} steps={steps.map((step) => ({ ...step, text: t(`palGuide.${step.key}`) }))} onClose={onClose} />;
}
