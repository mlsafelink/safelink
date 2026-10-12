import { useState } from 'react';
import {
  ShieldCheck,
  ExternalLink,
  Lock,
} from 'lucide-react';
import styles from './InstagramPage.module.css';
import { InstagramIcon } from '../../components/InstagramIcon';
import { useToast } from '@/components/ui/Toast/ToastContext';

type InstagramConnectionState = 'not_connected' | 'connecting' | 'connected' | 'error';

export function InstagramPage() {
  const { showToast } = useToast();
  const [connectionState, setConnectionState] = useState<InstagramConnectionState>('not_connected');

  const handleConnect = () => {
    // Modo real y transparente: no engañar al usuario simulando OAuth ficticio
    setConnectionState('connecting');
    setTimeout(() => {
      setConnectionState('not_connected');
      showToast(
        'La integración oficial requiere configurar META_CLIENT_ID en el servidor backend (Fase 2).',
        'info'
      );
    }, 800);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Integración Oficial con Instagram</h1>
        <p className={styles.subtitle}>
          Conectá tu cuenta comercial de Instagram mediante Meta Graph API para sincronizar contenido y programar publicaciones.
        </p>
      </div>

      {/* Estado actual de la conexión */}
      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.accountInfo}>
            <div className={styles.avatarBox}>
              <InstagramIcon size={28} />
            </div>
            <div className={styles.accountTexts}>
              <h2 className={styles.accountName}>Cuenta de Instagram SafeLink</h2>
              <span className={`${styles.statusBadge} ${styles.statusBadgeNotConnected}`}>
                ● No conectada
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.connectBtn}
            onClick={handleConnect}
            disabled={connectionState === 'connecting'}
          >
            <InstagramIcon size={16} />
            <span>{connectionState === 'connecting' ? 'Iniciando autenticación...' : 'Conectar con Meta / Instagram'}</span>
          </button>
        </div>
      </div>

      {/* Requisitos y directrices de Meta */}
      <div className={styles.requirementsSection}>
        <h2 className={styles.sectionTitle}>Requisitos Oficiales de Meta Graph API</h2>
        <div className={styles.reqList}>
          <div className={styles.reqItem}>
            <ShieldCheck size={18} className={styles.reqIcon} />
            <div>
              <strong>Cuenta Profesional o de Creador:</strong> La API de Meta requiere que la cuenta de Instagram esté vinculada a una Página de Facebook comercial administrada por SafeLink.
            </div>
          </div>

          <div className={styles.reqItem}>
            <Lock size={18} className={styles.reqIcon} />
            <div>
              <strong>Seguridad y Privacidad:</strong> SafeLink nunca solicita ni almacena contraseñas de Instagram. La autenticación se realiza mediante tokens OAuth 2.0 de corta y larga duración renovados automáticamente en el backend.
            </div>
          </div>

          <div className={styles.reqItem}>
            <ExternalLink size={18} className={styles.reqIcon} />
            <div>
              <strong>Proceso de Aprobación de la App (Meta App Review):</strong> Para habilitar la publicación automática directa sin advertencias, la aplicación debe contar con verificación de empresa en Meta Business Suite.
            </div>
          </div>
        </div>

        <div className={styles.permissionsBox}>
          <div className={styles.permTitle}>Permisos requeridos para publicación y lectura:</div>
          <div>
            <span className={styles.permCode}>instagram_basic</span>
            <span className={styles.permCode}>instagram_content_publish</span>
            <span className={styles.permCode}>pages_show_list</span>
            <span className={styles.permCode}>pages_read_engagement</span>
          </div>
        </div>
      </div>
    </div>
  );
}
