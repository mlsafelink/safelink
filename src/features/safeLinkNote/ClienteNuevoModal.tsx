import React, { useState } from 'react';
import { X, User, Building2, Save, AlertCircle } from 'lucide-react';
import { particularService } from '@/services/particularService';
import { adminService } from '@/services/adminService';
import type { ClienteItem } from './ClienteSelectorModal';
import styles from './NuevoRelevamiento.module.css';

interface ClienteNuevoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (cliente: ClienteItem) => void;
}

export const ClienteNuevoModal: React.FC<ClienteNuevoModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [tipo, setTipo] = useState<'particular' | 'administracion'>('particular');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre o razón social es obligatorio.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (tipo === 'particular') {
        const created = await particularService.create({
          nombre: nombre.trim(),
          direccion: direccion.trim() || null,
          localidad: null,
          telefono_encargado: telefono.trim() || null,
          administrador_responsable: contacto.trim() || null,
          observaciones: 'Creado desde SafeLink Note',
        });

        const nuevo: ClienteItem = {
          id: created.id,
          nombre: created.nombre,
          direccion: [created.direccion, created.localidad].filter(Boolean).join(', '),
          contacto: created.telefono_encargado || created.administrador_responsable || '',
          tipo: 'particular',
          tipoLabel: 'Cliente Privado',
        };

        onCreated(nuevo);
        onClose();
      } else {
        const created = await adminService.create({
          nombre: nombre.trim(),
          direccion: direccion.trim() || null,
          contacto: contacto.trim() || null,
          telefono: telefono.trim() || null,
          cuit: null,
          email: null,
          observaciones: 'Creado desde SafeLink Note',
        });

        const nuevo: ClienteItem = {
          id: created.id,
          nombre: created.nombre,
          direccion: created.direccion || '',
          contacto: created.telefono || created.contacto || '',
          tipo: 'administracion',
          tipoLabel: 'Administración',
        };

        onCreated(nuevo);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[ClienteNuevoModal] Error creando cliente:', err);
      setErrorMsg(`No se pudo crear el cliente: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.createModalCard}>
        {/* Cabecera */}
        <div className={styles.selectorHeader}>
          <div className={styles.selectorTitleBlock}>
            <span className={styles.selectorPreTitle}>NUEVO CLIENTE</span>
            <h3 className={styles.selectorTitle}>Registrar cliente en el sistema</h3>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleGuardar} className={styles.createModalBody}>
          {/* Tipo de cliente */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Tipo de cliente</label>
            <div className={styles.tipoClienteToggle}>
              <button
                type="button"
                className={`${styles.tipoClienteBtn} ${tipo === 'particular' ? styles.tipoClienteBtnActive : ''}`}
                onClick={() => setTipo('particular')}
              >
                <User size={15} />
                <span>Cliente Privado</span>
              </button>
              <button
                type="button"
                className={`${styles.tipoClienteBtn} ${tipo === 'administracion' ? styles.tipoClienteBtnActive : ''}`}
                onClick={() => setTipo('administracion')}
              >
                <Building2 size={15} />
                <span>Administración / Consorcio</span>
              </button>
            </div>
          </div>

          {/* Nombre / Razón Social */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {tipo === 'particular' ? 'Nombre y Apellido *' : 'Razón Social / Nombre del Consorcio *'}
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder={tipo === 'particular' ? 'Ej: Juan Pérez' : 'Ej: Consorcio Av. Santa Fe 1420'}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Dirección */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Dirección</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Calle, número, localidad"
              value={direccion}
              onChange={e => setDireccion(e.target.value)}
            />
          </div>

          {/* Contacto */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {tipo === 'particular' ? 'Persona o referencia de contacto' : 'Encargado / Administrador responsable'}
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Nombre del contacto"
              value={contacto}
              onChange={e => setContacto(e.target.value)}
            />
          </div>

          {/* Teléfono */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Teléfono de contacto</label>
            <input
              type="tel"
              className={styles.input}
              placeholder="Ej: 11-4567-8900"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className={styles.errorAlert}>
              <AlertCircle size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className={styles.createModalActions}>
            <button
              type="button"
              className={styles.matCancelBtn}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnFinalizar}
              style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
              disabled={isSaving || !nombre.trim()}
            >
              <Save size={16} />
              {isSaving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
