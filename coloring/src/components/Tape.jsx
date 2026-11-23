/** Two pieces of washi tape holding a sheet to the desk or a picture to the wall. */
export default function Tape({ color = '#f2a67e', single = false }) {
  return (
    <>
      <span className="tape left" style={{ '--tape': color }} aria-hidden="true" />
      {!single && <span className="tape right" style={{ '--tape': color }} aria-hidden="true" />}
    </>
  );
}
