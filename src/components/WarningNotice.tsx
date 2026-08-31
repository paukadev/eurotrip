import styles from "./WarningNotice.module.css";

export function WarningNotice({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className={styles.list} role="alert">
      {warnings.map((warning, index) => (
        <li key={`${index}-${warning}`}>{warning}</li>
      ))}
    </ul>
  );
}
