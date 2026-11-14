import stageStyles from './PalStage.module.css';

/** A growth stage's name ("Buddy") as a tag in that stage's own color. */
export default function StageBadge({ stage, className = '' }) {
  return <span className={`${stageStyles.badge} ${stageStyles[stage.id]} ${className}`}>{stage.name}</span>;
}
