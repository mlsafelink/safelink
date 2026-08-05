import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastItem = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

export function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className={styles.portal}>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <motion.div
            key={t.id}
            className={`${styles.toast} ${styles[t.type]}`}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            layout
          >
            <span className={styles.icon}>{icons[t.type]}</span>
            <span className={styles.message}>{t.message}</span>
            <button className={styles.dismiss} onClick={() => onDismiss(t.id)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
