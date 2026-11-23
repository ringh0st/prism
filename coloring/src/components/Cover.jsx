import { APP_VERSION } from '../appInfo.js';
import waffles from '../../../src/assets/pals/drawn/waffles-1.svg?raw';
import ribbit from '../../../src/assets/pals/drawn/ribbit-1.svg?raw';
import bamboo from '../../../src/assets/pals/drawn/bamboo-1.svg?raw';

/**
 * The hard cover: three Pals in full color, the title, crayon scribbles, and the studio with the version at the
 * bottom (it is also the opening screen). A tap swings it open around the spiral.
 */
export default function Cover({ isOpening, onOpen }) {
  return (
    <div className={`cover ${isOpening ? 'opening' : ''}`}>
      <button className="cover-face" onClick={onOpen} aria-label="My Pals Coloring Book. Tap to open.">
        <svg className="scribbles" viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
          <path d="M18 60c30-22 52 18 80-4s40-20 60 2" stroke="#f7cf3d" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M220 40c18 12 34-10 54 6" stroke="#5bb7ea" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M24 352c26 14 44-12 70 2s36 10 52-2" stroke="#f284b5" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M200 362c22-16 40 12 74-6" stroke="#a5d046" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="266" cy="96" r="7" fill="#fff6dc" />
          <circle cx="34" cy="118" r="5" fill="#fff6dc" />
        </svg>
        <span className="label">
          <span className="title">My Pals</span>
          <span className="subtitle">Coloring Book</span>
        </span>
        <span className="cover-pals" aria-hidden="true">
          <span className="pal left" dangerouslySetInnerHTML={{ __html: bamboo }} />
          <span className="pal middle" dangerouslySetInnerHTML={{ __html: waffles }} />
          <span className="pal right" dangerouslySetInnerHTML={{ __html: ribbit }} />
        </span>
        <span className="studio">
          Rinny’s Games <small>v{APP_VERSION}</small>
        </span>
      </button>
      <div className="cover-inside" aria-hidden="true" />
    </div>
  );
}
