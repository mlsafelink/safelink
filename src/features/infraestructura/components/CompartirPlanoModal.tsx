import React, { useState } from 'react';
import { copyToClipboard } from '@/utils/clipboard';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { Button } from '@/components/ui/Button/Button';
import {
  Share2, Copy, Check, ExternalLink, MessageCircle, X, ShieldCheck,
} from 'lucide-react';
import type { PlanoInfraestructura } from '@/types/infraestructura';
import styles from './CompartirPlanoModal.module.css';

interface CompartirPlanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanoInfraestructura | null;
}

export function CompartirPlanoModal({
  isOpen,
  onClose,
  plan,
}: CompartirPlanoModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !plan) return null;

  const publicId = plan.public_id || plan.id;
  const publicUrl = `${window.location.origin}/p/plano/${publicId}`;

  const handleCopy = async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      setCopied(true);
      showToast({
        title: 'Enlace Copiado',
        message: 'El enlace de cliente ha sido copiado al portapapeles.',
        type: 'success',
      });
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast({
        title: 'Atención',
        message: 'No se pudo copiar automáticamente. Por favor selecciónalo manualmente.',
        type: 'warning',
      });
    }
  };

  const handleWhatsApp = () => {
    const clientName = plan.consorcio?.nombre || plan.particular?.nombre || 'Instalación';
    const message = encodeURIComponent(
      `Hola! Te comparto el plano técnico interactivo de ${plan.nombre} (${clientName}):\n${publicUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleOpenViewer = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <Share2 size={20} />
            </div>
            <div>
              <h3>Compartir Plano de Infraestructura</h3>
              <p className={styles.subTitle}>{plan.nombre}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.infoBanner}>
            <ShieldCheck size={18} className={styles.infoIcon} />
            <span>
              Este enlace es <strong>privado y de solo lectura</strong>. Permite al cliente explorar el plano con Zoom, Pan y ver las especificaciones de puertos y cámaras sin acceso de edición.
            </span>
          </div>

          <div className={styles.urlSection}>
            <label className={styles.label}>Enlace público de visualización</label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                readOnly
                value={publicUrl}
                className={styles.urlInput}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant={copied ? 'primary' : 'secondary'}
                onClick={handleCopy}
                leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                className={copied ? styles.copiedBtn : styles.copyBtn}
              >
                {copied ? '¡Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          <div className={styles.actionsGrid}>
            <button className={styles.actionCard} onClick={handleOpenViewer}>
              <div className={styles.actionCardIcon}>
                <ExternalLink size={20} />
              </div>
              <div className={styles.actionCardText}>
                <strong>Abrir Visor</strong>
                <span>Ver la página exactamente como la ve el cliente</span>
              </div>
            </button>

            <button className={`${styles.actionCard} ${styles.whatsappCard}`} onClick={handleWhatsApp}>
              <div className={`${styles.actionCardIcon} ${styles.whatsappIcon}`}>
                <MessageCircle size={20} />
              </div>
              <div className={styles.actionCardText}>
                <strong>Enviar por WhatsApp</strong>
                <span>Compartir el link directamente por mensaje</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
