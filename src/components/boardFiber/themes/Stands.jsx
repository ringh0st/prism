/*
 * How a piece stands in a themed board: `Turning` swings its children a quarter turn with a springy ease whenever
 * the piece is tapped (its wheel swings with it); `Standing` just faces the piece the right way.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { mirrorAngle } from '../library/LibraryPieces.jsx';
import Bake from './Bake.jsx';

export function Turning({ turn, children }) {
  const rotor = useRef();
  const angle = mirrorAngle(turn);
  useEffect(() => {
    gsap.to(rotor.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.7)' });
  }, [angle]);
  return (
    <group ref={rotor} rotation={[0, angle, 0]}>
      <Bake>{children}</Bake>
    </group>
  );
}

export const Standing = ({ turn, children }) => (
  <group rotation={[0, mirrorAngle(turn), 0]}>
    <Bake>{children}</Bake>
  </group>
);

const DIRECTION_ANGLE = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 };

/** A lamp faces the way its light leaves (local +x); a turning lamp swings a quarter turn when tapped. */
export function Facing({ tile, turn, children }) {
  const head = useRef();
  const angle = (DIRECTION_ANGLE[tile.dir] ?? 0) - (tile.turnable ? (turn % 2) * (Math.PI / 2) : 0);
  useEffect(() => {
    gsap.to(head.current.rotation, { y: angle, duration: 0.5, ease: 'back.out(1.6)' });
  }, [angle]);
  return (
    <group ref={head} rotation={[0, angle, 0]}>
      <Bake>{children}</Bake>
    </group>
  );
}
