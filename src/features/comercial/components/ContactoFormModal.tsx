import { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialContact,
  type CommercialContactInsert,
  type CommercialCompany,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface ContactoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (contact: CommercialContact) => void;
  contactToEdit?: CommercialContact | null;
  defaultCompanyId?: string;
  companies: CommercialCompany[];
}

const MEDIOS = ['WhatsApp', 'Llamada telefónica', 'Correo electrónico', 'Presencial'];
const ESTADOS_VERIFICACION = ['Confirmado', 'A confirmar', 'Desactualizado', 'Desvinculado'] as const;

export function ContactoFormModal({
  isOpen,
  onClose,
  onSuccess,
  contactToEdit,
  defaultCompanyId,
  companies
}: ContactoFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CommercialContactInsert>({
    company_id: defaultCompanyId || (companies[0]?.id || ''),
    nombre: '',
    apellido: '',
    cargo: '',
    area: 'Seguridad / Operaciones',
    telefono: '',
    telefono_interno: '',
    email: '',
    horario_contacto: 'Lunes a Viernes 9:00 a 17:00 hs',
    medio_preferido: 'WhatsApp',
    estado_verificacion: 'A confirmar',
    fuente: 'Relevamiento directo',
    observaciones: ''
  });

  useEffect(() => {
    if (contactToEdit) {
      setFormData({
        company_id: contactToEdit.company_id,
        nombre: contactToEdit.nombre || '',
        apellido: contactToEdit.apellido || '',
        cargo: contactToEdit.cargo || '',
        area: contactToEdit.area || 'Seguridad / Operaciones',
        telefono: contactToEdit.telefono || '',
        telefono_interno: contactToEdit.telefono_interno || '',
        email: contactToEdit.email || '',
        horario_contacto: contactToEdit.horario_contacto || '',
        medio_preferido: contactToEdit.medio_preferido || 'WhatsApp',
        estado_verificacion: contactToEdit.estado_verificacion || 'A confirmar',
        fuente: contactToEdit.fuente || '',
        observaciones: contactToEdit.observaciones || ''
      });
    } else {
      setFormData({
        company_id: defaultCompanyId || (companies[0]?.id || ''),
        nombre: '',
        apellido: '',
        cargo: '',
        area: 'Seguridad / Operaciones',
        telefono: '',
        telefono_interno: '',
        email: '',
        horario_contacto: 'Lunes a Viernes 9:00 a 17:00 hs',
        medio_preferido: 'WhatsApp',
        estado_verificacion: 'A confirmar',
        fuente: 'Relevamiento directo',
        observaciones: ''
      });
    }
  }, [contactToEdit, defaultCompanyId, companies, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (!formData.company_id) {
      alert('Debes seleccionar una empresa');
      return;
    }

    setLoading(true);
    try {
      if (contactToEdit) {
        const updated = await commercialService.updateContact(contactToEdit.id, formData);
        onSuccess(updated);
      } else {
        const created = await commercialService.createContact(formData);
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando contacto:', err);
      alert('Error al guardar el contacto: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserPlus size={20} color="var(--primary-color)" />
            <h2>{contactToEdit ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Empresa asociada */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Empresa Asociada *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={e => setFormData({ ...formData, company_id: e.target.value })}
                style={inputStyle}
              >
                <option value="" disabled>Seleccione una empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                ))}
              </select>
            </div>

            {/* Nombre y Apellido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Martín"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.apellido || ''}
                  onChange={e => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Ej: González"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Cargo y Área */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Cargo o Función
                </label>
                <input
                  type="text"
                  value={formData.cargo || ''}
                  onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ej: Gerente de Operaciones"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Área o Departamento
                </label>
                <input
                  type="text"
                  value={formData.area || ''}
                  onChange={e => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Ej: Seguridad / Mantenimiento"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Teléfono y Teléfono interno */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Celular / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.telefono || ''}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: +54 9 11 2345-6789"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Teléfono Directo / Interno
                </label>
                <input
                  type="text"
                  value={formData.telefono_interno || ''}
                  onChange={e => setFormData({ ...formData, telefono_interno: e.target.value })}
                  placeholder="Ej: Int. 204"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email y Horario preferido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="mgonzalez@empresa.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Horario Preferido
                </label>
                <input
                  type="text"
                  value={formData.horario_contacto || ''}
                  onChange={e => setFormData({ ...formData, horario_contacto: e.target.value })}
                  placeholder="Lunes a Viernes 9:00 a 17:00 hs"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Canal preferido y Estado de verificación */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Canal Preferido
                </label>
                <select
                  value={formData.medio_preferido || 'WhatsApp'}
                  onChange={e => setFormData({ ...formData, medio_preferido: e.target.value })}
                  style={inputStyle}
                >
                  {MEDIOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Estado de Verificación
                </label>
                <select
                  value={formData.estado_verificacion}
                  onChange={e => setFormData({ ...formData, estado_verificacion: e.target.value as any })}
                  style={inputStyle}
                >
                  {ESTADOS_VERIFICACION.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Observaciones del Contacto
              </label>
              <textarea
                rows={2}
                value={formData.observaciones || ''}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Disponibilidad, trato personal, toma de decisiones..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<Save size={16} />}>
              {loading ? 'Guardando...' : contactToEdit ? 'Guardar Cambios' : 'Crear Contacto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.88rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box'
};
