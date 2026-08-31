import styles from "./MoneyAmount.module.css";

const formatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function MoneyAmount({ value, currency }: { value?: number; currency?: string }) {
  if (value === undefined) return null;
  return (
    <span className={styles.amount}>
      {formatter.format(value)}
      {currency ? ` ${currency}` : ""}
    </span>
  );
}
