import styles from './placeholder-asset.module.css'

/** PLACEHOLDER_ASSET — neutral, searchable placeholder for imagery not yet supplied by the asset owner. */
export function PlaceholderAsset({ name, idealAsset, role, aspectRatio = '16 / 10' }: { name: string; idealAsset: string; role: string; aspectRatio?: string }) {
  return (
    <div
      className={styles.frame}
      style={{ aspectRatio }}
      role="img"
      aria-label={`${name} image placeholder. Ideal asset: ${idealAsset}. Role: ${role}.`}
    >
      <span className={styles.marker}>Preview pending</span>
      <strong>{name}</strong>
      <small>Ideal asset: {idealAsset}<br />Preferred ratio: {aspectRatio} · Role: {role}</small>
    </div>
  )
}
