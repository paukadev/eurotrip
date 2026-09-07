import styles from "./MapLinkButton.module.css";

/**
 * Opens the raw `mapa` link in a new tab. Renders nothing when the stay/item
 * has no map link, so callers can drop it in unconditionally.
 */
export function MapLinkButton({ url, label }: { url?: string; label?: string }) {
  if (!url) return null;

  return (
    <a
      className={styles.button}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ? `Ver ${label} no mapa` : undefined}
    >
      <span aria-hidden="true">📍</span>
      <span>Ver no mapa</span>
    </a>
  );
}
