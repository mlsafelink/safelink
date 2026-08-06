import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { googleDriveService } from '@/services/googleDriveService';
import type { BackupDestino } from '@/types/backup';

import { BackupCreator } from './backup/BackupCreator';
import { BackupHistoryList } from './backup/BackupHistoryList';
import { GoogleDrivePanel } from './backup/GoogleDrivePanel';

import {
  ArrowLeft, Plus, Cloud, FolderOpen, ShieldCheck, History, Settings2
} from 'lucide-react';
import styles from './BackupScreen.module.css';

type Tab = 'historial' | 'drive' | 'config';

export function BackupScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('historial');
  const [showCreator, setShowCreator] = useState(false);
  const [driveKey, setDriveKey] = useState(0); // para forzar re-render del panel de Drive

  // Destinos activos (por ahora siempre ambos si Drive está conectado)
  const getDestinos = (): BackupDestino[] => {
    const destinos: BackupDestino[] = ['supabase'];
    if (googleDriveService.isConnected()) destinos.push('drive');
    return destinos;
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['backup-history'] });
    toast.success('✅ Backup completado y guardado correctamente.');
    setShowCreator(false);
    setActiveTab('historial');
  };

  const handleError = (msg: string) => {
    if (msg.toLowerCase().includes('parcial') || msg.toLowerCase().includes('drive')) {
      toast.warning(`⚠️ Backup completado parcialmente. ${msg}`);
    } else {
      toast.error(`❌ Error durante el backup: ${msg}`);
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'drive', label: 'Google Drive', icon: FolderOpen },
    { id: 'config', label: 'Configuración', icon: Settings2 },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>
        <div className={styles.headerRow}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Cloud size={24} />
            </div>
            <div>
              <h1>Centro de Backup</h1>
              <p>Protegé tu información con respaldos hacia Supabase y Google Drive</p>
            </div>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreator(true)}
          >
            Crear Backup
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <Card variant="glass" className={styles.statusBar}>
        <div className={styles.statusItem}>
          <ShieldCheck size={16} className={styles.statusIcon} />
          <span>Supabase Storage</span>
          <span className={styles.statusBadge}>✅ Activo</span>
        </div>
        <div className={styles.statusDivider} />
        <div className={styles.statusItem}>
          <FolderOpen size={16} className={styles.statusIcon} />
          <span>Google Drive</span>
          <span className={`${styles.statusBadge} ${googleDriveService.isConnected() ? styles.active : styles.inactive}`}>
            {googleDriveService.isConnected() ? '✅ Conectado' : '⚠️ Sin conectar'}
          </span>
        </div>
        {googleDriveService.getEmail() && (
          <>
            <div className={styles.statusDivider} />
            <div className={styles.statusItem}>
              <span className={styles.statusEmail}>{googleDriveService.getEmail()}</span>
            </div>
          </>
        )}
      </Card>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'historial' && <BackupHistoryList />}

        {activeTab === 'drive' && (
          <GoogleDrivePanel
            key={driveKey}
            onStatusChange={() => setDriveKey(k => k + 1)}
          />
        )}

        {activeTab === 'config' && (
          <Card variant="glass" className={styles.configCard}>
            <div className={styles.configHeader}>
              <Settings2 size={18} className={styles.configIcon} />
              <h2>Destinos de Respaldo</h2>
            </div>
            <p className={styles.configDesc}>
              Los destinos activos se usarán automáticamente al crear un backup.
              Google Drive solo está disponible cuando está conectado.
            </p>
            <div className={styles.destinosList}>
              <div className={styles.destinoRow}>
                <div className={styles.destinoInfo}>
                  <h3>☁️ Supabase Storage</h3>
                  <p>Almacenamiento en la nube del propio proyecto SafeLink. Siempre activo.</p>
                </div>
                <span className={`${styles.destinoBadge} ${styles.active}`}>Activo</span>
              </div>
              <div className={styles.destinoRow}>
                <div className={styles.destinoInfo}>
                  <h3>📁 Google Drive</h3>
                  <p>
                    Copia de respaldo en tu cuenta de Google Drive personal.
                    {!googleDriveService.isConnected() && (
                      <> <button className={styles.inlineLink} onClick={() => setActiveTab('drive')}>Conectar ahora →</button></>
                    )}
                  </p>
                </div>
                <span className={`${styles.destinoBadge} ${googleDriveService.isConnected() ? styles.active : styles.inactive}`}>
                  {googleDriveService.isConnected() ? 'Activo' : 'Sin conectar'}
                </span>
              </div>
            </div>
            <div className={styles.configNote}>
              <ShieldCheck size={14} />
              <p>El formato de archivo es <strong>.sbk</strong> (ZIP comprimido). Contiene los datos de la base de datos y archivos de Supabase Storage.</p>
            </div>
          </Card>
        )}
      </div>

      {/* Wizard de creación */}
      <AnimatePresence>
        {showCreator && (
          <BackupCreator
            defaultDestinos={getDestinos()}
            onClose={() => setShowCreator(false)}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
