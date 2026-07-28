import { Bot, Sparkles, Wand2 } from 'lucide-react';
import styles from './SafeLinkIAPage.module.css';

export function SafeLinkIAPage() {
  return (
    <div className={styles.container}>
      <div className={styles.glow} />

      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Bot size={44} />
          <Sparkles size={18} className={styles.sparkle1} />
          <Wand2 size={14} className={styles.sparkle2} />
        </div>

        <div className={styles.textBlock}>
          <h1>SafeLink <span className={styles.gradient}>IA</span></h1>
          <p>El asistente inteligente de SafeLink está en desarrollo.</p>
          <p className={styles.sub}>
            Pronto podrás generar documentación profesional, presupuestos y
            reportes de forma automática con inteligencia artificial.
          </p>
        </div>

        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Próximamente
        </div>
      </div>
    </div>
  );
}
