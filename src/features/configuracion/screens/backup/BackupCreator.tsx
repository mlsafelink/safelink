import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button/Button';
import {
  SELECCION_COMPLETA,
  SELECCION_VACIA,
  SELECCION_LABELS,
  type BackupSeleccion,
  type BackupTipo,
  type BackupProgress,
  type BackupDestino,
} from '@/types/backup';
import { backupService } from '@/services/backupService';
import { X, Database, Sliders, CheckSquare, Square, Loader2 } from 'lucide-react';
import styles from './BackupCreator.module.css';

interface BackupCreatorProps {
  defaultDestinos: BackupDestino[];
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

type Step = 'tipo' | 'seleccion' | 'creando';

export function BackupCreator({ defaultDestinos, onClose, onSuccess, onError }: BackupCreatorProps) {
  const [step, setStep] = useState<Step>('tipo');
  const [tipo, setTipo] = useState<BackupTipo>('completo');
  const [seleccion, setSeleccion] = useState<BackupSeleccion>({ ...SELECCION_COMPLETA });
  const [progress, setProgress] = useState<BackupProgress>({ fase: 'Iniciando', progreso: 0 });
  const [isBusy, setIsBusy] = useState(false);

  const destinos = defaultDestinos;

  const toggleItem = (key: keyof BackupSeleccion) => {
    setSeleccion(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allSelected = (Object.values(seleccion) as boolean[]).every(Boolean);

  const toggleAll = () => {
    setSeleccion(allSelected ? { ...SELECCION_VACIA } : { ...SELECCION_COMPLETA });
  };

  const handleStart = async () => {
    setStep('creando');
    setIsBusy(true);

    try {
      await backupService.create(
        tipo,
        tipo === 'personalizado' ? seleccion : undefined,
        destinos,
        (p) => setProgress(p),
      );
      onSuccess();
    } catch (e) {
      onError((e as Error).message);
      onClose();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !isBusy && onClose()}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{step === 'creando' ? 'Creando Backup…' : 'Nuevo Backup'}</h2>
          {!isBusy && (
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Elegir tipo */}
          {step === 'tipo' && (
            <motion.div
              key="tipo"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.stepContent}
            >
              <p className={styles.stepDesc}>¿Qué tipo de backup querés crear?</p>

              <div className={styles.tipoGrid}>
                <div
                  className={`${styles.tipoBox} ${tipo === 'completo' ? styles.selected : ''}`}
                  onClick={() => setTipo('completo')}
                >
                  <Database size={28} className={styles.tipoIcon} />
                  <h3>Backup Completo</h3>
                  <p>Exporta todas las tablas y archivos de SafeLink en un solo archivo.</p>
                </div>
                <div
                  className={`${styles.tipoBox} ${tipo === 'personalizado' ? styles.selected : ''}`}
                  onClick={() => setTipo('personalizado')}
                >
                  <Sliders size={28} className={styles.tipoIcon} />
                  <h3>Backup Personalizado</h3>
                  <p>Seleccioná exactamente qué módulos y datos incluir en el respaldo.</p>
                </div>
              </div>

              <div className={styles.destinosInfo}>
                <span className={styles.destinosLabel}>Destinos:</span>
                {destinos.map(d => (
                  <span key={d} className={styles.destinoBadge}>
                    {d === 'supabase' ? '☁️ Supabase Storage' : '📁 Google Drive'}
                  </span>
                ))}
              </div>

              <div className={styles.stepActions}>
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button
                  variant="primary"
                  onClick={() => tipo === 'personalizado' ? setStep('seleccion') : handleStart()}
                >
                  {tipo === 'personalizado' ? 'Seleccionar contenido →' : 'Crear Backup'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Selección personalizada */}
          {step === 'seleccion' && (
            <motion.div
              key="seleccion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.stepContent}
            >
              <div className={styles.seleccionHeader}>
                <p className={styles.stepDesc}>Elegí qué incluir en el backup:</p>
                <button className={styles.toggleAllBtn} onClick={toggleAll}>
                  {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                  {allSelected ? 'Desmarcar todo' : 'Marcar todo'}
                </button>
              </div>

              <div className={styles.checkboxList}>
                {(Object.keys(SELECCION_LABELS) as Array<keyof BackupSeleccion>).map(key => (
                  <label key={key} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={seleccion[key]}
                      onChange={() => toggleItem(key)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkLabel}>{SELECCION_LABELS[key]}</span>
                  </label>
                ))}
              </div>

              <div className={styles.stepActions}>
                <Button variant="secondary" onClick={() => setStep('tipo')}>← Volver</Button>
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={(Object.values(seleccion) as boolean[]).every(v => !v)}
                >
                  Crear Backup
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Progreso */}
          {step === 'creando' && (
            <motion.div
              key="creando"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.progressContent}
            >
              <div className={styles.progressIcon}>
                <Loader2 size={36} className={styles.spinner} />
              </div>
              <p className={styles.progressFase}>{progress.fase}</p>
              {progress.detalle && (
                <p className={styles.progressDetalle}>{progress.detalle}</p>
              )}
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  animate={{ width: `${progress.progreso}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <p className={styles.progressPct}>{progress.progreso}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
