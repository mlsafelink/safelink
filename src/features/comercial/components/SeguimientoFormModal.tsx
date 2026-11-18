import { useState, useEffect } from 'react';
import { X, CheckSquare, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialTask,
  type CommercialTaskInsert,
  type CommercialCompany,
  type CommercialContact,
  type CommercialOpportunity,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface SeguimientoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (task: CommercialTask) => void;
  taskToEdit?: CommercialTask | null;
  defaultCompanyId?: string;
  companies: CommercialCompany[];
  contacts: CommercialContact[];
  opportunities: CommercialOpportunity[];
}

const TIPOS_TAREA = [
  'Llamada telefónica',
  'Correo electrónico',
  'Mensaje WhatsApp',
  'Visita presencial',
  'Reunión virtual',
  'Envío de presupuesto',
  'Seguimiento de propuesta',
  'Tarea interna'
] as const;

const PRIORIDADES = ['Urgente', 'Alta', 'Normal', 'Baja'] as const;
const ESTADOS = ['Pendiente', 'En curso', 'Realizada', 'Vencida', 'Cancelada'] as const;

export function SeguimientoFormModal({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
  defaultCompanyId,
  companies,
  contacts,
  opportunities
}: SeguimientoFormModalProps) {
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<CommercialTaskInsert>({
    company_id: defaultCompanyId || (companies[0]?.id || ''),
    contact_id: null,
    opportunity_id: null,
    titulo: '',
    descripcion: '',
    tipo: 'Llamada telefónica',
    fecha_programada: todayStr,
    hora_programada: '10:00',
    prioridad: 'Normal',
    estado: 'Pendiente',
    resultado: ''
  });

  const companyContacts = contacts.filter(c => c.company_id === formData.company_id);
  const companyOpps = opportunities.filter(o => o.company_id === formData.company_id);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        company_id: taskToEdit.company_id,
        contact_id: taskToEdit.contact_id || null,
        opportunity_id: taskToEdit.opportunity_id || null,
        titulo: taskToEdit.titulo || '',
        descripcion: taskToEdit.descripcion || '',
        tipo: taskToEdit.tipo || 'Llamada telefónica',
        fecha_programada: taskToEdit.fecha_programada || todayStr,
        hora_programada: taskToEdit.hora_programada || '10:00',
        prioridad: taskToEdit.prioridad || 'Normal',
        estado: taskToEdit.estado || 'Pendiente',
        resultado: taskToEdit.resultado || ''
      });
    } else {
      setFormData({
        company_id: defaultCompanyId || (companies[0]?.id || ''),
        contact_id: null,
        opportunity_id: null,
        titulo: '',
        descripcion: '',
        tipo: 'Llamada telefónica',
        fecha_programada: todayStr,
        hora_programada: '10:00',
        prioridad: 'Normal',
        estado: 'Pendiente',
        resultado: ''
      });
    }
  }, [taskToEdit, defaultCompanyId, companies, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert('Debes seleccionar una empresa');
      return;
    }
    if (!formData.titulo.trim()) {
      alert('El título del seguimiento es obligatorio');
      return;
    }

    setLoading(true);
    try {
      if (taskToEdit) {
        const updated = await commercialService.updateTask(taskToEdit.id, formData);
        onSuccess(updated);
      } else {
        const created = await commercialService.createTask(formData);
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando seguimiento:', err);
      alert('Error al guardar el seguimiento: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={20} color="var(--primary-color)" />
            <h2>{taskToEdit ? 'Editar Seguimiento' : 'Nuevo Seguimiento / Tarea'}</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Empresa */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Empresa Vinculada *
              </label>
              <select
                required
                value={formData.company_id}
                onChange={e => setFormData({ ...formData, company_id: e.target.value, contact_id: null, opportunity_id: null })}
                style={inputStyle}
              >
                <option value="" disabled>Seleccione empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                ))}
              </select>
            </div>

            {/* Contacto y Oportunidad opcionales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Contacto (Opcional)
                </label>
                <select
                  value={formData.contact_id || ''}
                  onChange={e => setFormData({ ...formData, contact_id: e.target.value || null })}
                  style={inputStyle}
                >
                  <option value="">Ninguno / General</option>
                  {companyContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ''} {c.cargo ? `(${c.cargo})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Oportunidad (Opcional)
                </label>
                <select
                  value={formData.opportunity_id || ''}
                  onChange={e => setFormData({ ...formData, opportunity_id: e.target.value || null })}
                  style={inputStyle}
                >
                  <option value="">Ninguna / Seguimiento general</option>
                  {companyOpps.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Título de la tarea */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Título de la Acción *
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Llamar para coordinar fecha de visita técnica"
                style={inputStyle}
              />
            </div>

            {/* Tipo, Fecha, Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Tipo de Acción
                </label>
                <select
                  value={formData.tipo}
                  onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                  style={inputStyle}
                >
                  {TIPOS_TAREA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fecha Programada *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha_programada}
                  onChange={e => setFormData({ ...formData, fecha_programada: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.hora_programada || ''}
                  onChange={e => setFormData({ ...formData, hora_programada: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Prioridad y Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Prioridad
                </label>
                <select
                  value={formData.prioridad}
                  onChange={e => setFormData({ ...formData, prioridad: e.target.value as any })}
                  style={inputStyle}
                >
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                  style={inputStyle}
                >
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Descripción o Instrucciones
              </label>
              <textarea
                rows={2}
                value={formData.descripcion || ''}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalle o puntos a tratar en el contacto..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Resultado si está realizada */}
            {formData.estado === 'Realizada' && (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Resultado de la Acción
                </label>
                <textarea
                  rows={2}
                  value={formData.resultado || ''}
                  onChange={e => setFormData({ ...formData, resultado: e.target.value })}
                  placeholder="Qué se acordó o concluyó con el cliente..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<Save size={16} />}>
              {loading ? 'Guardando...' : taskToEdit ? 'Guardar Cambios' : 'Crear Seguimiento'}
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
