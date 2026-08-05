import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultService, type VaultInsert, type VaultEntry } from '@/services/vaultService';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, Save, Trash2, Eye, EyeOff,
  Shield, MapPin, Hash, Cpu, StickyNote, AlertCircle
} from 'lucide-react';
import styles from './VaultForm.module.css';

interface VaultFormProps {
  editingId: string | null;
  onBack: () => void;
  onDeleted: () => void;
}

type FormData = {
  nombre_consorcio: string;
  direccion: string;
  cantidad_canales: string;
  serial_number: string;
  qr_image: string;
  admin_user: string;
  admin_password: string;
  user1: string;
  password1: string;
  user2: string;
  password2: string;
  observaciones: string;
};

const EMPTY: FormData = {
  nombre_consorcio: '',
  direccion: '',
  cantidad_canales: '',
  serial_number: '',
  qr_image: '',
  admin_user: '',
  admin_password: '',
  user1: '',
  password1: '',
  user2: '',
  password2: '',
  observaciones: '',
};

function toFormData(e: VaultEntry): FormData {
  return {
    nombre_consorcio: e.nombre_consorcio ?? '',
    direccion: e.direccion ?? '',
    cantidad_canales: e.cantidad_canales != null ? String(e.cantidad_canales) : '',
    serial_number: e.serial_number ?? '',
    qr_image: e.qr_image ?? '',
    admin_user: e.admin_user ?? '',
    admin_password: e.admin_password ?? '',
    user1: e.user1 ?? '',
    password1: e.password1 ?? '',
    user2: e.user2 ?? '',
    password2: e.password2 ?? '',
    observaciones: e.observaciones ?? '',
  };
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.label}>{label}</label>
      <div className={styles.passwordWrapper}>
        <input
          type={show ? 'text' : 'password'}
          className={`${styles.input} ${styles.passwordInput}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          autoComplete="new-password"
        />
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setShow(s => !s)}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export function VaultForm({ editingId, onBack, onDeleted }: VaultFormProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = !!editingId;

  const [form, setForm] = useState<FormData>(EMPTY);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Cargar datos si edición
  const { data: entry } = useQuery({
    queryKey: ['vault', editingId],
    queryFn: () => vaultService.getById(editingId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (entry) setForm(toFormData(entry));
  }, [entry]);

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nombre_consorcio.trim()) {
        throw new Error('El nombre del consorcio es obligatorio.');
      }
      const payload: VaultInsert = {
        nombre_consorcio: form.nombre_consorcio.trim(),
        direccion: form.direccion.trim() || null,
        cantidad_canales: form.cantidad_canales ? parseInt(form.cantidad_canales) : null,
        serial_number: form.serial_number.trim() || null,
        qr_image: form.qr_image || null,
        admin_user: form.admin_user.trim() || null,
        admin_password: form.admin_password || null,
        user1: form.user1.trim() || null,
        password1: form.password1 || null,
        user2: form.user2.trim() || null,
        password2: form.password2 || null,
        observaciones: form.observaciones.trim() || null,
      };
      if (isEditing) {
        return vaultService.update(editingId!, payload);
      } else {
        return vaultService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success(isEditing ? 'Ficha actualizada correctamente.' : 'Ficha creada en la Bóveda.');
      onBack();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error al guardar la ficha.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => vaultService.delete(editingId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success('Ficha eliminada de la Bóveda.');
      onDeleted();
    },
    onError: () => {
      toast.error('Error al eliminar la ficha.');
    },
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
        <div>
          <h1>{isEditing ? 'Editar Ficha' : 'Nueva Ficha'}</h1>
          <p>{isEditing ? `Editando: ${entry?.nombre_consorcio ?? ''}` : 'Registrá las credenciales del equipo'}</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.mainColumn}>

          {/* Información General */}
          <Card variant="glass" className={styles.section}>
            <div className={styles.sectionHeader}>
              <MapPin size={18} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Información General</h2>
            </div>
            <div className={styles.fieldsGrid}>
              <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
                <label className={styles.label}>Nombre del Consorcio *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Consorcio Avenida Rivadavia 1234"
                  value={form.nombre_consorcio}
                  onChange={e => set('nombre_consorcio', e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
                <label className={styles.label}>Dirección</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: Av. Rivadavia 1234, CABA"
                  value={form.direccion}
                  onChange={e => set('direccion', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <Cpu size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Canales DVR/XVR
                </label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={128}
                  placeholder="Ej: 8"
                  value={form.cantidad_canales}
                  onChange={e => set('cantidad_canales', e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <Hash size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Número de Serie (S/N)
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: 123456789ABC"
                  value={form.serial_number}
                  onChange={e => set('serial_number', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Accesos */}
          <Card variant="glass" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Shield size={18} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Accesos</h2>
            </div>

            {/* Admin */}
            <div className={styles.accessGroup}>
              <h3 className={styles.accessTitle}>👑 Administrador</h3>
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Usuario Admin</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="admin"
                    value={form.admin_user}
                    onChange={e => set('admin_user', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <PasswordField
                  label="Contraseña Admin"
                  value={form.admin_password}
                  onChange={v => set('admin_password', v)}
                  placeholder="Contraseña del admin"
                />
              </div>
            </div>

            {/* Usuario 1 */}
            <div className={styles.accessGroup}>
              <h3 className={styles.accessTitle}>👤 Usuario Regular 1</h3>
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Usuario</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="usuario1"
                    value={form.user1}
                    onChange={e => set('user1', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <PasswordField
                  label="Contraseña"
                  value={form.password1}
                  onChange={v => set('password1', v)}
                />
              </div>
            </div>

            {/* Usuario 2 */}
            <div className={styles.accessGroup}>
              <h3 className={styles.accessTitle}>👤 Usuario Regular 2</h3>
              <div className={styles.fieldsGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Usuario</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="usuario2"
                    value={form.user2}
                    onChange={e => set('user2', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <PasswordField
                  label="Contraseña"
                  value={form.password2}
                  onChange={v => set('password2', v)}
                />
              </div>
            </div>
          </Card>

          {/* Observaciones */}
          <Card variant="glass" className={styles.section}>
            <div className={styles.sectionHeader}>
              <StickyNote size={18} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Observaciones</h2>
            </div>
            <textarea
              className={styles.textarea}
              rows={5}
              placeholder={
                'Ejemplos:\n• Cambio de contraseña realizado el 12/08.\n• Cliente pidió no modificar usuario administrador.\n• Equipo reemplazado por falla de disco.'
              }
              value={form.observaciones}
              onChange={e => set('observaciones', e.target.value)}
            />
          </Card>
        </div>

        {/* Columna lateral */}
        <div className={styles.sideColumn}>
          {/* QR */}
          <Card variant="neumorphic" className={styles.section}>
            <h2 className={styles.sectionTitle}>Código QR</h2>
            <p className={styles.qrHint}>Opcional. Subí el código QR del equipo para acceso rápido.</p>
            <ImageUploader
              value={form.qr_image}
              onChange={url => set('qr_image', url)}
              label=""
            />
          </Card>

          {/* Actions */}
          <div className={styles.actionsCard}>
            {saveMutation.isError && (
              <div className={styles.errorAlert}>
                <AlertCircle size={14} />
                <span>{(saveMutation.error as Error).message}</span>
              </div>
            )}

            <Button
              variant="primary"
              leftIcon={<Save size={16} />}
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className={styles.saveBtn}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Ficha'}
            </Button>

            <Button variant="secondary" onClick={onBack}>
              Cancelar
            </Button>

            {isEditing && !showDeleteConfirm && (
              <button
                className={styles.deleteLink}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} />
                Eliminar esta ficha
              </button>
            )}

            {showDeleteConfirm && (
              <div className={styles.confirmBox}>
                <p>¿Eliminar la ficha permanentemente?</p>
                <div className={styles.confirmBtns}>
                  <Button
                    variant="primary"
                    isLoading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    Sí, eliminar
                  </Button>
                  <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
