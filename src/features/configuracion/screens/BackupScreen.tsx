import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Cloud, Download, RefreshCw, Plus, CheckCircle2,
  HardDrive, Clock, AlertTriangle, ShieldCheck
} from 'lucide-react';
import styles from './BackupScreen.module.css';

type ModalType = 'crear' | 'descargar' | 'restaurar' | null;

interface BackupStatus {
  fecha: string;
  hora: string;
  tamano: string;
  estado: 'completado' | 'procesando' | 'error';
  tablas: number;
}

export function BackupScreen() {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [status, setStatus] = useState<BackupStatus>({
    fecha: '05/08/2026',
    hora: '18:30 hs',
    tamano: '14.2 MB',
    estado: 'completado',
    tablas: 9,
  });

  const handleAction = async (type: ModalType) => {
    setIsProcessing(true);

    // Simular delay de operación
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);
    setActiveModal(null);

    const now = new Date();
    const fechaStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';

    if (type === 'crear') {
      setStatus({
        fecha: fechaStr,
        hora: horaStr,
        tamano: '14.8 MB',
        estado: 'completado',
        tablas: 9,
      });
      toast.success('Backup creado exitosamente.');
    } else if (type === 'descargar') {
      toast.success('Descarga de backup iniciada (safelink_backup.json).');
    } else if (type === 'restaurar') {
      setStatus(prev => ({ ...prev, fecha: fechaStr, hora: horaStr }));
      toast.success('Base de datos restaurada correctamente desde el backup.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <Cloud size={24} />
          </div>
          <div>
            <h1>Respaldo y Backup</h1>
            <p>Generá copias de seguridad de tus datos y gestioná la restauración</p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        {/* Status Card */}
        <Card variant="glass" className={styles.statusCard}>
          <div className={styles.cardHeader}>
            <ShieldCheck size={22} className={styles.statusIcon} />
            <h2 className={styles.cardTitle}>Estado del Último Backup</h2>
            <span className={styles.statusBadge}>
              <CheckCircle2 size={13} />
              {status.estado}
            </span>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <Clock size={16} className={styles.metricIcon} />
              <div>
                <span className={styles.metricLabel}>Fecha y Hora</span>
                <span className={styles.metricValue}>{status.fecha} — {status.hora}</span>
              </div>
            </div>

            <div className={styles.metricItem}>
              <HardDrive size={16} className={styles.metricIcon} />
              <div>
                <span className={styles.metricLabel}>Tamaño del Archivo</span>
                <span className={styles.metricValue}>{status.tamano}</span>
              </div>
            </div>

            <div className={styles.metricItem}>
              <Cloud size={16} className={styles.metricIcon} />
              <div>
                <span className={styles.metricLabel}>Tablas Respaldadas</span>
                <span className={styles.metricValue}>{status.tablas} tablas</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Acciones Card */}
        <Card variant="glass" className={styles.actionsCard}>
          <h2 className={styles.cardTitle}>Acciones de Backup</h2>
          <p className={styles.cardDesc}>
            Elegí una acción para gestionar el respaldo completo de administraciones, consorcios, clientes y documentos.
          </p>

          <div className={styles.buttonsGrid}>
            <div className={styles.actionBox}>
              <div className={styles.actionInfo}>
                <h3>Crear Backup Manual</h3>
                <p>Generá una copia de seguridad actualizada de todos los datos en este momento.</p>
              </div>
              <Button
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={() => setActiveModal('crear')}
              >
                Crear Backup
              </Button>
            </div>

            <div className={styles.actionBox}>
              <div className={styles.actionInfo}>
                <h3>Descargar Backup</h3>
                <p>Exportá el último respaldo generado a tu dispositivo en formato de archivo comprimido.</p>
              </div>
              <Button
                variant="secondary"
                leftIcon={<Download size={16} />}
                onClick={() => setActiveModal('descargar')}
              >
                Descargar Backup
              </Button>
            </div>

            <div className={styles.actionBox}>
              <div className={styles.actionInfo}>
                <h3>Restaurar Backup</h3>
                <p>Reemplazá la información actual por los datos del último punto de restauración guardado.</p>
              </div>
              <Button
                variant="secondary"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => setActiveModal('restaurar')}
              >
                Restaurar Backup
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modales de Confirmación */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && setActiveModal(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalIcon}>
                {activeModal === 'restaurar' ? (
                  <AlertTriangle size={28} style={{ color: '#f59e0b' }} />
                ) : (
                  <Cloud size={28} style={{ color: '#6366f1' }} />
                )}
              </div>

              <h3>
                {activeModal === 'crear' && '¿Crear nuevo backup ahora?'}
                {activeModal === 'descargar' && '¿Descargar respaldo de datos?'}
                {activeModal === 'restaurar' && '¿Restaurar copia de seguridad?'}
              </h3>

              <p>
                {activeModal === 'crear' && 'Se generará una instantánea de la base de datos con toda la información guardada hasta el momento.'}
                {activeModal === 'descargar' && 'Se descargará un archivo estructurado con todos los datos registrados en SafeLink.'}
                {activeModal === 'restaurar' && 'Esta acción sobrescribirá los datos del sistema con el último backup guardado.'}
              </p>

              <div className={styles.modalActions}>
                <Button
                  variant="primary"
                  isLoading={isProcessing}
                  onClick={() => handleAction(activeModal)}
                >
                  {activeModal === 'crear' && 'Sí, crear backup'}
                  {activeModal === 'descargar' && 'Sí, descargar'}
                  {activeModal === 'restaurar' && 'Sí, restaurar'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={isProcessing}
                  onClick={() => setActiveModal(null)}
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
