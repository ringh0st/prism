import PictureGuide, { GuideIcon, GuideLabel, Then } from '../../components/guide/PictureGuide.jsx';
import GlowbugArt from '../../components/glowbugs/GlowbugArt.jsx';
import { GLOWBUGS, GLOWBUG_KINDS } from '../../game/glowbugs.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** One kind's five colors, for the "full row" step. */
const ROW = GLOWBUGS.filter((bug) => bug.kind === GLOWBUG_KINDS[0].id);
const [BUG] = ROW;

/**
 * How Glowbugs work, as one picture loop: they nap in some levels and light wakes them; ★★★ brings one home to the
 * Garden; all five colors of a kind earn a diamond; a sleeping bug on the map marks where one waits.
 */
export default function GlowbugGuide({ onClose }) {
  const { t } = useI18n();
  const steps = [
    {
      key: 'nap',
      picture: (
        <>
          <GlowbugArt id={BUG.id} size={34} isAwake={false} />
          <GuideIcon name="spark" size={20} />
          <Then />
          <GlowbugArt id={BUG.id} size={34} />
        </>
      ),
    },
    {
      key: 'rescue',
      picture: (
        <>
          <GuideLabel>★★★</GuideLabel>
          <Then />
          <GuideIcon name="home" size={26} />
        </>
      ),
    },
    {
      key: 'row',
      picture: (
        <>
          {ROW.map((bug) => (
            <GlowbugArt key={bug.id} id={bug.id} size={18} />
          ))}
          <Then />
          <GuideIcon name="diamond" size={24} />
        </>
      ),
    },
    {
      key: 'map',
      picture: (
        <>
          <GuideIcon name="map" size={24} />
          <Then />
          <GlowbugArt id={BUG.id} size={30} isAwake={false} />
        </>
      ),
    },
  ];
  return (
    <PictureGuide title={t('glowbugGuide.title')} steps={steps.map((step) => ({ ...step, text: t(`glowbugGuide.${step.key}`) }))} onClose={onClose} />
  );
}
