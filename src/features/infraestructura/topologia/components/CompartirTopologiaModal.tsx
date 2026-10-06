import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, ShieldCheck, X, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import type { TopologiaRed } from '@/types/topologia';
import styles from './CompartirTopologiaModal.module.css';

interface Props {
  topologia: TopologiaRed;
  onClose: () => void;
}

export function CompartirTopologiaModal({ topologia, onClose }: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const publicUrl = `${window.location.origin}/p/topologia/${topologia.public_id || topologia.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showToast('Enlace de solo lectura copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const handleWhatsApp = () => {
    const clientName =
      topologia.consorcio?.nombre ||
      topologia.particular?.nombre ||
      'Instalación Técnica';
    const message = encodeURIComponent(
      `Hola! Te comparto la topología de red técnica de ${topologia.nombre} (${clientName}):\n${publicUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleOpenNewTab = () => {
    window.open(publicUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <Share2 size={20} />
            </div>
            <div>
              <h3 className={styles.title}>Compartir Topología de Red</h3>
              <p className={styles.subtitle}>{topologia.nombre}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoBanner}>
            <ShieldCheck size={20} className={styles.infoIcon} />
            <span>
              Este enlace genera una <strong>vista técnica de solo lectura</strong> para el cliente.
              No se muestran credenciales ni herramientas de edición.
            </span>
          </div>

          {isLocalhost && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.78rem',
              color: '#fcd34d',
              lineHeight: 1.4,
            }}>
              <Smartphone size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>¿Probando en el celular?</strong> Al abrir desde tu teléfono, asegurate de usar la IP de tu PC en la red WiFi (ej. <code>http://192.168.X.X:5174/...</code>) en lugar de <code>localhost</code>.
              </div>
            </div>
          )}

          <div className={styles.urlBox}>
            <label className={styles.urlLabel}>Enlace público seguro</label>
            <div className={styles.urlInputRow}>
              <input
                type="text"
                readOnly
                value={publicUrl}
                className={styles.urlInput}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                onClick={handleCopy}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="secondary"
            leftIcon={<MessageSquare size={16} />}
            onClick={handleWhatsApp}
            style={{ color: '#25D366' }}
          >
            WhatsApp
          </Button>
          <Button variant="primary" leftIcon={<ExternalLink size={16} />} onClick={handleOpenNewTab}>
            Abrir vista
          </Button>
        </div>
      </div>
    </div>
  );
}
