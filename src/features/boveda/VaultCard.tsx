import { type VaultEntry } from '@/services/vaultService';
import { Building2, MapPin, Hash, Calendar, Eye, Pencil, Trash2 } from 'lucide-react';
import styles from './VaultCard.module.css';

interface VaultCardProps {
  entry: VaultEntry;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function VaultCard({ entry, onOpen, onEdit, onDelete }: VaultCardProps) {
  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.iconWrap}>
          <Building2 size={20} />
        </div>
        <div className={styles.titleBlock}>
          <h3 className={styles.name}>{entry.nombre_consorcio}</h3>
          {entry.direccion && (
            <p className={styles.address}>
              <MapPin size={12} />
              {entry.direccion}
            </p>
          )}
        </div>
      </div>

      {/* Info chips */}
      <div className={styles.chips}>
        {entry.serial_number && (
          <span className={styles.chip}>
            <Hash size={11} />
            S/N: {entry.serial_number}
          </span>
        )}
        {entry.cantidad_canales != null && (
          <span className={styles.chip}>
            {entry.cantidad_canales} canales
          </span>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.date}>
          <Calendar size={11} />
          Act. {formatDate(entry.updated_at)}
        </span>
        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.primary}`}
            onClick={() => onOpen(entry.id)}
            title="Ver ficha"
          >
            <Eye size={14} />
            Abrir
          </button>
          <button
            className={`${styles.btn} ${styles.secondary}`}
            onClick={() => onEdit(entry.id)}
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.btn} ${styles.danger}`}
            onClick={() => onDelete(entry.id)}
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
