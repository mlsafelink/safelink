import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { googleDriveService } from '@/services/googleDriveService';
import {
  CheckCircle2, AlertCircle, ExternalLink, RefreshCw, FolderOpen, Unlink
} from 'lucide-react';
import styles from './GoogleDrivePanel.module.css';

interface GoogleDrivePanelProps {
  onStatusChange?: () => void;
}

export function GoogleDrivePanel({ onStatusChange }: GoogleDrivePanelProps) {
  const toast = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const isConnected = googleDriveService.isConnected();
  const email = googleDriveService.getEmail();
  const folderUrl = googleDriveService.getFolderUrl();
  const folderId = googleDriveService.getFolderId();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await googleDriveService.signIn();
      // Crear/verificar carpeta automáticamente
      await googleDriveService.getOrCreateBackupFolder();
      toast.success('Google Drive conectado correctamente. Carpeta SafeLink Cloud/Backups creada.');
      onStatusChange?.();
    } catch (e) {
      toast.error(`Error al conectar con Google Drive: ${(e as Error).message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleReconnect = async () => {
    setIsConnecting(true);
    try {
      googleDriveService.signOut();
      await googleDriveService.signIn();
      await googleDriveService.getOrCreateBackupFolder();
      toast.success('Google Drive reconectado correctamente.');
      onStatusChange?.();
    } catch (e) {
      toast.error(`Error al reconectar: ${(e as Error).message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsDisconnecting(true);
    googleDriveService.signOut();
    toast.info('Google Drive desconectado.');
    onStatusChange?.();
    setIsDisconnecting(false);
  };

  return (
    <Card variant="glass" className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.driveIcon}>
          <svg viewBox="0 0 87.3 78" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28.4 48H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="M43.65 25L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.55 44.2c-.8 1.4-1.2 2.95-1.2 4.5H28.4z" fill="#00ac47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L85.1 57.5a9 9 0 0 0 1.2-4.5H58.9l5.75 11.2z" fill="#ea4335"/>
            <path d="M43.65 25L58.25 0H29.05L43.65 25z" fill="#00832d"/>
            <path d="M58.9 48H87.3a9 9 0 0 0-1.2-4.5L60.55 3.3c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25z" fill="#2684fc"/>
            <path d="M28.4 48L13.8 76.8c1.35.8 2.9 1.2 4.5 1.2h50.7c1.6 0 3.15-.45 4.5-1.2L58.9 48z" fill="#ffba00"/>
          </svg>
        </div>
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>Integración con Google Drive</h3>
          <p className={styles.subtitle}>
            Los backups se subirán automáticamente a la carpeta
            <strong> SafeLink Cloud / Backups</strong>
          </p>
        </div>
        <div className={`${styles.statusBadge} ${isConnected ? styles.connected : styles.disconnected}`}>
          {isConnected ? (
            <><CheckCircle2 size={13} />Conectado</>
          ) : (
            <><AlertCircle size={13} />Desconectado</>
          )}
        </div>
      </div>

      {isConnected ? (
        <div className={styles.connectedDetails}>
          {email && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cuenta:</span>
              <span className={styles.detailValue}>{email}</span>
            </div>
          )}
          {folderId && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Carpeta ID:</span>
              <span className={`${styles.detailValue} ${styles.mono}`}>{folderId.slice(0, 24)}…</span>
            </div>
          )}

          <div className={styles.connectedActions}>
            {folderUrl && (
              <a
                href={folderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openFolderBtn}
              >
                <FolderOpen size={15} />
                Abrir carpeta en Drive
                <ExternalLink size={13} />
              </a>
            )}
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={14} />}
              isLoading={isConnecting}
              onClick={handleReconnect}
            >
              Reconectar
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Unlink size={14} />}
              isLoading={isDisconnecting}
              onClick={handleDisconnect}
            >
              Desconectar
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.disconnectedState}>
          <p className={styles.disconnectedMsg}>
            Conectá tu cuenta de Google para subir los backups automáticamente a Drive.
            Se crearán las carpetas <strong>SafeLink Cloud / Backups</strong> automáticamente.
          </p>
          <Button
            variant="primary"
            isLoading={isConnecting}
            onClick={handleConnect}
          >
            Conectar Google Drive
          </Button>
        </div>
      )}
    </Card>
  );
}
