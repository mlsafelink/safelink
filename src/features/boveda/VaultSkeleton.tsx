import styles from './VaultSkeleton.module.css';

export function VaultSkeleton() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={`${styles.pulse} ${styles.icon}`} />
        <div className={styles.titleBlock}>
          <div className={`${styles.pulse} ${styles.line} ${styles.lineLong}`} />
          <div className={`${styles.pulse} ${styles.line} ${styles.lineShort}`} />
        </div>
      </div>
      <div className={styles.chips}>
        <div className={`${styles.pulse} ${styles.chip}`} />
        <div className={`${styles.pulse} ${styles.chip} ${styles.chipSmall}`} />
      </div>
      <div className={styles.footer}>
        <div className={`${styles.pulse} ${styles.line} ${styles.lineMed}`} />
        <div className={styles.actions}>
          <div className={`${styles.pulse} ${styles.btn}`} />
          <div className={`${styles.pulse} ${styles.btnSm}`} />
          <div className={`${styles.pulse} ${styles.btnSm}`} />
        </div>
      </div>
    </div>
  );
}
