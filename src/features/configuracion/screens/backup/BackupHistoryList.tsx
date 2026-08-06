import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { backupService } from '@/services/backupService';
import { type BackupHistoryEntry } from '@/types/backup';
import {
  Download, Trash2, RotateCcw, Info, CheckCircle2,
  AlertTriangle, Clock, Database, CloudOff,
  HardDrive, Cloud
} from 'lucide-react';
import styles from './BackupHistoryList.module.css';

interface BackupDetailModalProps {
  entry: BackupHistoryEntry;
  onClose: () => void;
}

function BackupDetailModal({ entry, onClose }: BackupDetailModalProps) {
  const meta = entry.metadata;
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.detailModal}
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className={styles.detailTitle}>Detalle del Backup</h3>
        <p className={styles.detailFilename}>{entry.nombre_archivo}</p>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Fecha</span>
            <span className={styles.detailValue}>{new Date(entry.fecha).toLocaleString('es-AR')}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Tipo</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>{entry.tipo}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Tamaño</span>
            <span className={styles.detailValue}>{entry.tamano_bytes ? formatSize(entry.tamano_bytes) : '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Registros</span>
            <span className={styles.detailValue}>{entry.cantidad_registros ?? '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Archivos</span>
            <span className={styles.detailValue}>{entry.cantidad_archivos ?? '—'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Estado</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>{entry.estado}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Supabase</span>
            <span className={styles.detailValue}>{entry.storage_path ?? 'No subido'}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Drive ID</span>
            <span className={styles.detailValue}>{entry.drive_file_id ?? 'No subido'}</span>
          </div>
        </div>

        {meta?.tablas_incluidas && meta.tablas_incluidas.length > 0 && (
          <div className={styles.tablasBox}>
            <span className={styles.detailLabel}>Tablas incluidas</span>
            <div className={styles.tablasList}>
              {meta.tablas_incluidas.map(t => (
                <span key={t} className={styles.tablaTag}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {meta?.safelink_version && (
          <p className={styles.versionNote}>SafeLink v{meta.safelink_version}</p>
        )}

        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </motion.div>
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function BackupHistoryList() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [detailEntry, setDetailEntry] = useState<BackupHistoryEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BackupHistoryEntry | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<BackupHistoryEntry | null>(null);
  const [restoringProgress, setRestoringProgress] = useState<string | null>(null);

  const { data: history = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['backup-history'],
    queryFn: backupService.getHistory,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (entry: BackupHistoryEntry) => backupService.delete(entry, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-history'] });
      toast.success('Backup eliminado correctamente.');
      setConfirmDelete(null);
    },
    onError: (e: Error) => {
      toast.error(`Error al eliminar: ${e.message}`);
      setConfirmDelete(null);
    },
  });

  const handleDownload = async (entry: BackupHistoryEntry) => {
    if (!entry.storage_path) {
      toast.error('Este backup no está disponible en Supabase Storage.');
      return;
    }
    try {
      await backupService.downloadFromStorage(entry.storage_path, entry.nombre_archivo);
      toast.success('Descarga iniciada.');
    } catch (e) {
      toast.error(`Error al descargar: ${(e as Error).message}`);
    }
  };

  const handleRestore = async (entry: BackupHistoryEntry) => {
    if (!entry.storage_path) {
      toast.error('No hay archivo en Supabase Storage para restaurar.');
      return;
    }
    setConfirmRestore(null);
    setRestoringProgress('Iniciando restauración…');
    try {
      const meta = await backupService.restore(entry.storage_path, (p) => {
        setRestoringProgress(`${p.fase}${p.detalle ? ` — ${p.detalle}` : ''} (${p.progreso}%)`);
      });
      setRestoringProgress(null);
      toast.success(`Restauración completada. ${meta.cantidad_registros} registros restaurados.`);
    } catch (e) {
      setRestoringProgress(null);
      toast.error(`Error al restaurar: ${(e as Error).message}`);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingGrid}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card variant="glass" className={styles.errorCard}>
        <CloudOff size={20} />
        <p>Error al cargar el historial de backups.</p>
        <Button variant="secondary" onClick={() => refetch()}>Reintentar</Button>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card variant="neumorphic" className={styles.emptyCard}>
        <Database size={36} className={styles.emptyIcon} />
        <h3>Sin backups todavía</h3>
        <p>Aún no se han creado respaldos. Usá el botón "Crear Backup" para empezar.</p>
      </Card>
    );
  }

  return (
    <>
      {/* Banner de restauración en progreso */}
      {restoringProgress && (
        <Card variant="glass" className={styles.restoringBanner}>
          <Clock size={16} className={styles.restoringIcon} />
          <span>{restoringProgress}</span>
        </Card>
      )}

      <div className={styles.historyList}>
        {history.map(entry => (
          <Card key={entry.id} variant="glass" className={styles.historyItem}>
            <div className={styles.itemMain}>
              <div className={styles.itemIcon}>
                {entry.estado === 'completado' ? (
                  <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                )}
              </div>

              <div className={styles.itemInfo}>
                <p className={styles.itemFilename}>{entry.nombre_archivo}</p>
                <div className={styles.itemMeta}>
                  <span><Clock size={11} /> {formatDate(entry.fecha)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{entry.tipo}</span>
                  {entry.tamano_bytes && <span><HardDrive size={11} /> {formatSize(entry.tamano_bytes)}</span>}
                  <span>{entry.cantidad_registros ?? 0} registros</span>
                </div>
              </div>

              <div className={styles.itemDestinos}>
                {entry.destinos?.includes('supabase') && (
                  <span className={styles.destinoTag} title="Supabase Storage"><Cloud size={13} /></span>
                )}
                {entry.destinos?.includes('drive') && (
                  <span className={styles.destinoTag} title="Google Drive">📁</span>
                )}
              </div>
            </div>

            <div className={styles.itemActions}>
              <button
                className={styles.actionBtn}
                onClick={() => setDetailEntry(entry)}
                title="Ver detalle"
              >
                <Info size={15} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => handleDownload(entry)}
                title="Descargar"
                disabled={!entry.storage_path}
              >
                <Download size={15} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.restoreBtn}`}
                onClick={() => setConfirmRestore(entry)}
                title="Restaurar"
                disabled={!entry.storage_path}
              >
                <RotateCcw size={15} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => setConfirmDelete(entry)}
                title="Eliminar"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal: Ver detalle */}
      <AnimatePresence>
        {detailEntry && (
          <BackupDetailModal entry={detailEntry} onClose={() => setDetailEntry(null)} />
        )}
      </AnimatePresence>

      {/* Modal: Confirmar restauración */}
      <AnimatePresence>
        {confirmRestore && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmRestore(null)}
          >
            <motion.div
              className={styles.confirmModal}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <AlertTriangle size={32} style={{ color: '#f59e0b' }} />
              <h3>¿Restaurar este backup?</h3>
              <p>
                Esta acción reemplazará los datos actuales con el backup del{' '}
                <strong>{formatDate(confirmRestore.fecha)}</strong>.
                <br />Los datos actuales no se respaldarán automáticamente.
              </p>
              <p className={styles.confirmFilename}>{confirmRestore.nombre_archivo}</p>
              <div className={styles.confirmActions}>
                <Button variant="primary" onClick={() => handleRestore(confirmRestore)}>
                  Sí, restaurar
                </Button>
                <Button variant="secondary" onClick={() => setConfirmRestore(null)}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Confirmar eliminación */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              className={styles.confirmModal}
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <Trash2 size={28} style={{ color: '#ef4444' }} />
              <h3>¿Eliminar este backup?</h3>
              <p>Se eliminará el archivo de Supabase Storage y de Google Drive (si aplica). Esta acción es irreversible.</p>
              <p className={styles.confirmFilename}>{confirmDelete.nombre_archivo}</p>
              <div className={styles.confirmActions}>
                <Button
                  variant="primary"
                  isLoading={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate(confirmDelete)}
                >
                  Sí, eliminar
                </Button>
                <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
