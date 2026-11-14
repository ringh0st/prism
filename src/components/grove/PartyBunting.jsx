import styles from './GroveScene.module.css';

const FLAGS = ['#F0C14E', '#F2A67E', '#58AC82', '#4FBFAD', '#DF7458'];

/** Party flags strung across the treetops, for a world-finish party in the Grove. */
export default function PartyBunting() {
  const flags = Array.from({ length: 13 }, (_, i) => 12 + i * 31);
  return (
    <g className={styles.bunting} aria-hidden="true">
      <path d="M0 18Q200 62 400 18" fill="none" stroke="#5E5047" strokeWidth="1.4" />
      {flags.map((x, i) => {
        const y = 18 + 22 * (1 - ((x - 200) / 200) ** 2);
        return (
          <path
            key={x}
            className={styles.flag}
            d={`M${x - 8} ${y - 1}h16l-8 15z`}
            fill={FLAGS[i % FLAGS.length]}
            style={{ animationDelay: `${i * -0.15}s` }}
          />
        );
      })}
    </g>
  );
}
