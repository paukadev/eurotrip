import styles from "./EmptyState.module.css";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.empty} role="status">
      <p>{message}</p>
    </div>
  );
}
