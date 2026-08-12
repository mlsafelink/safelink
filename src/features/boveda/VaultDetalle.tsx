import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultService } from '@/services/vaultService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, Pencil, Trash2, Eye, EyeOff, Copy, Check,
  Shield, MapPin, Hash, Cpu, StickyNote, QrCode, Building2, Grid, Calendar
} from 'lucide-react';
import styles from './VaultDetalle.module.css';

interface VaultDetalleProps {
  entryId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDeleted: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatFechaInstalacion(dateStr: string | null): string {
  if (!dateStr) return 'No registrada';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return 'No registrada';
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function CopyBtn({ text }: { text: string | null }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!text) return null;

  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button className={styles.copyBtn} onClick={handle} title="Copiar">
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function SecretField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ElementType;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.secretField}>
      <span className={styles.secretLabel}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
      <div className={styles.secretValue}>
        <span className={styles.secretText}>
          {value ? (show ? value : '••••••••') : <span className={styles.empty}>—</span>}
        </span>
        <div className={styles.secretActions}>
          {value && (
            <button
              className={styles.eyeBtn}
              onClick={() => setShow(s => !s)}
              title={show ? 'Ocultar' : 'Mostrar'}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          <CopyBtn text={value} />
        </div>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon: Icon,
  copyable = false,
}: {
  label: string;
  value: string | null;
  icon?: React.ElementType;
  copyable?: boolean;
}) {
  return (
    <div className={styles.infoField}>
      <span className={styles.infoLabel}>
        {Icon && <Icon size={12} />}
        {label}
      </span>
      <div className={styles.infoValueRow}>
        <span className={styles.infoValue}>
          {value ?? <span className={styles.empty}>—</span>}
        </span>
        {copyable && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

export function VaultDetalle({ entryId, onBack, onEdit, onDeleted }: VaultDetalleProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: entry, isLoading } = useQuery({
    queryKey: ['vault', entryId],
    queryFn: () => vaultService.getById(entryId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => vaultService.delete(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success('Ficha eliminada de la Bóveda.');
      onDeleted();
    },
    onError: () => {
      toast.error('Error al eliminar la ficha.');
    },
  });

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>Cargando ficha…</div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>No se encontró la ficha.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerIcon}>
            <Building2 size={22} />
          </div>
          <div>
            <h1>{entry.nombre_consorcio}</h1>
            {entry.direccion && <p>{entry.direccion}</p>}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            leftIcon={<Pencil size={15} />}
            onClick={() => onEdit(entryId)}
          >
            Editar
          </Button>
          {!showDeleteConfirm && (
            <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={15} />
              Eliminar
            </button>
          )}
          {showDeleteConfirm && (
            <div className={styles.confirmInline}>
              <span>¿Eliminar?</span>
              <Button
                variant="primary"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                Sí
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                No
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Info General */}
        <Card variant="glass" className={styles.section}>
          <div className={styles.sectionTitle}>
            <MapPin size={16} className={styles.sectionIcon} />
            Información General
          </div>
          <div className={styles.fields}>
            <InfoField label="Dirección" value={entry.direccion} icon={MapPin} copyable />
            <InfoField label="Canales DVR/XVR" value={entry.cantidad_canales != null ? String(entry.cantidad_canales) : null} icon={Cpu} />
            <InfoField label="Número de Serie" value={entry.serial_number} icon={Hash} copyable />
            <InfoField label="Fecha de Instalación" value={formatFechaInstalacion(entry.fecha_instalacion)} icon={Calendar} />
          </div>
          <div className={styles.dateRow}>
            <span>Creado: {formatDate(entry.created_at)}</span>
            <span>Actualizado: {formatDate(entry.updated_at)}</span>
          </div>
        </Card>

        {/* Accesos */}
        <Card variant="glass" className={styles.section}>
          <div className={styles.sectionTitle}>
            <Shield size={16} className={styles.sectionIcon} />
            Accesos
          </div>

          <div className={styles.accessBlock}>
            <h4 className={styles.accessTitle}>👑 Administrador</h4>
            <div className={styles.fields}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Usuario</span>
                <div className={styles.infoValueRow}>
                  <span className={styles.infoValue}>{entry.admin_user ?? <span className={styles.empty}>—</span>}</span>
                  <CopyBtn text={entry.admin_user} />
                </div>
              </div>
              <SecretField label="Contraseña" value={entry.admin_password} />
            </div>
          </div>

          <div className={styles.accessBlock}>
            <h4 className={styles.accessTitle}>👤 Usuario Regular 1</h4>
            <div className={styles.fields}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Usuario</span>
                <div className={styles.infoValueRow}>
                  <span className={styles.infoValue}>{entry.user1 ?? <span className={styles.empty}>—</span>}</span>
                  <CopyBtn text={entry.user1} />
                </div>
              </div>
              <SecretField label="Contraseña" value={entry.password1} />
            </div>
          </div>

          <div className={styles.accessBlock}>
            <h4 className={styles.accessTitle}>👤 Usuario Regular 2</h4>
            <div className={styles.fields}>
              <div className={styles.infoField}>
                <span className={styles.infoLabel}>Usuario</span>
                <div className={styles.infoValueRow}>
                  <span className={styles.infoValue}>{entry.user2 ?? <span className={styles.empty}>—</span>}</span>
                  <CopyBtn text={entry.user2} />
                </div>
              </div>
              <SecretField label="Contraseña" value={entry.password2} />
            </div>
          </div>
        </Card>

        {/* Observaciones */}
        {entry.observaciones && (
          <Card variant="glass" className={styles.section}>
            <div className={styles.sectionTitle}>
              <StickyNote size={16} className={styles.sectionIcon} />
              Observaciones
            </div>
            <p className={styles.observaciones}>{entry.observaciones}</p>
          </Card>
        )}

        {/* QR */}
        {entry.qr_image && (
          <Card variant="neumorphic" className={`${styles.section} ${styles.qrSection}`}>
            <div className={styles.sectionTitle}>
              <QrCode size={16} className={styles.sectionIcon} />
              Código QR
            </div>
            <div className={styles.qrWrapper}>
              <img src={entry.qr_image} alt="QR del equipo" className={styles.qrImage} />
            </div>
          </Card>
        )}

        {/* Patrón de desbloqueo */}
        {entry.pattern_image && (
          <Card variant="neumorphic" className={`${styles.section} ${styles.qrSection}`}>
            <div className={styles.sectionTitle}>
              <Grid size={16} className={styles.sectionIcon} />
              Patrón de Desbloqueo
            </div>
            <div className={styles.qrWrapper}>
              <img src={entry.pattern_image} alt="Patrón de desbloqueo" className={styles.qrImage} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
