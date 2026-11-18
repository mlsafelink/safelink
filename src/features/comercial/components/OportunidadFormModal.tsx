import { useState, useEffect } from 'react';
import { X, TrendingUp, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialOpportunity,
  type CommercialOpportunityInsert,
  type CommercialCompany,
  type CommercialContact,
  OPPORTUNITY_STAGES,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface OportunidadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (opp: CommercialOpportunity) => void;
  oppToEdit?: CommercialOpportunity | null;
  defaultCompanyId?: string;
  companies: CommercialCompany[];
  contacts: CommercialContact[];
}

const SERVICIOS_LIST = [
  'Sistema de CCTV',
  'Control de acceso',
  'Alarmas y detección de intrusión',
  'Detección de incendio',
  'Cableado estructurado y redes',
  'Portería digital e intercomunicadores',
  'Automatización de accesos',
  'Mantenimiento preventivo / correctivo',
  'Totem de seguridad'
];

export function OportunidadFormModal({
  isOpen,
  onClose,
  onSuccess,
  oppToEdit,
  defaultCompanyId,
  companies,
  contacts
}: OportunidadFormModalProps) {
  const [loading, setLoading] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<CommercialOpportunityInsert>({
    company_id: defaultCompanyId || (companies[0]?.id || ''),
    contact_id: null,
    visit_id: null,
    nombre: '',
    necesidad: '',
    alcance: '',
    servicios: ['Sistema de CCTV'],
    prioridad: 'Media',
    importe_estimado: 0,
    fecha_deteccion: todayStr,
    proxima_accion: '',
    fecha_proxima_accion: null,
    estado: '1. Detectada',
    motivo_cierre: null,
    presupuesto_id: null,
    reporte_id: null,
    observaciones: ''
  });

  const companyContacts = contacts.filter(c => c.company_id === formData.company_id);

  useEffect(() => {
    if (oppToEdit) {
      setFormData({
        company_id: oppToEdit.company_id,
        contact_id: oppToEdit.contact_id || null,
        visit_id: oppToEdit.visit_id || null,
        nombre: oppToEdit.nombre || '',
        necesidad: oppToEdit.necesidad || '',
        alcance: oppToEdit.alcance || '',
        servicios: oppToEdit.servicios || ['Sistema de CCTV'],
        prioridad: oppToEdit.prioridad || 'Media',
        importe_estimado: oppToEdit.importe_estimado || 0,
        fecha_deteccion: oppToEdit.fecha_deteccion || todayStr,
        proxima_accion: oppToEdit.proxima_accion || '',
        fecha_proxima_accion: oppToEdit.fecha_proxima_accion || null,
        estado: oppToEdit.estado || '1. Detectada',
        motivo_cierre: oppToEdit.motivo_cierre || null,
        presupuesto_id: oppToEdit.presupuesto_id || null,
        reporte_id: oppToEdit.reporte_id || null,
        observaciones: oppToEdit.observaciones || ''
      });
    } else {
      setFormData({
        company_id: defaultCompanyId || (companies[0]?.id || ''),
        contact_id: null,
        visit_id: null,
        nombre: '',
        necesidad: '',
        alcance: '',
        servicios: ['Sistema de CCTV'],
        prioridad: 'Media',
        importe_estimado: 0,
        fecha_deteccion: todayStr,
        proxima_accion: '',
        fecha_proxima_accion: null,
        estado: '1. Detectada',
        motivo_cierre: null,
        presupuesto_id: null,
        reporte_id: null,
        observaciones: ''
      });
    }
  }, [oppToEdit, defaultCompanyId, companies, isOpen]);

  if (!isOpen) return null;

  const handleServiceToggle = (srv: string) => {
    const current = formData.servicios || [];
    if (current.includes(srv)) {
      setFormData({ ...formData, servicios: current.filter(s => s !== srv) });
    } else {
      setFormData({ ...formData, servicios: [...current, srv] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert('Debes seleccionar una empresa');
      return;
    }
    if (!formData.nombre.trim()) {
      alert('El nombre o título de la oportunidad es obligatorio');
      return;
    }

    setLoading(true);
    try {
      if (oppToEdit) {
        const updated = await commercialService.updateOpportunity(oppToEdit.id, formData);
        onSuccess(updated);
      } else {
        const created = await commercialService.createOpportunity(formData);
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando oportunidad:', err);
      alert('Error al guardar la oportunidad: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TrendingUp size={20} color="var(--primary-color)" />
            <h2>{oppToEdit ? 'Editar Oportunidad Comercial' : 'Nueva Oportunidad Comercial'}</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Empresa y Contacto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Empresa *
                </label>
                <select
                  required
                  value={formData.company_id}
                  onChange={e => setFormData({ ...formData, company_id: e.target.value, contact_id: null })}
                  style={inputStyle}
                >
                  <option value="" disabled>Seleccione empresa...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre_comercial}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Contacto Principal
                </label>
                <select
                  value={formData.contact_id || ''}
                  onChange={e => setFormData({ ...formData, contact_id: e.target.value || null })}
                  style={inputStyle}
                >
                  <option value="">Sin contacto específico</option>
                  {companyContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ''} {c.cargo ? `(${c.cargo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Título de la oportunidad */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Título de la Oportunidad *
              </label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Migración a CCTV IP en Depósito Central (16 cámaras)"
                style={inputStyle}
              />
            </div>

            {/* Importe Estimado, Prioridad y Etapa */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Importe Estimado ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.importe_estimado || 0}
                  onChange={e => setFormData({ ...formData, importe_estimado: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Prioridad
                </label>
                <select
                  value={formData.prioridad}
                  onChange={e => setFormData({ ...formData, prioridad: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Etapa del Pipeline
                </label>
                <select
                  value={formData.estado}
                  onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                  style={inputStyle}
                >
                  {OPPORTUNITY_STAGES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            {/* Necesidad y Alcance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Necesidad / Requerimiento del Cliente
                </label>
                <textarea
                  rows={3}
                  value={formData.necesidad || ''}
                  onChange={e => setFormData({ ...formData, necesidad: e.target.value })}
                  placeholder="Qué problema busca resolver la empresa..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Alcance Técnico Preliminar
                </label>
                <textarea
                  rows={3}
                  value={formData.alcance || ''}
                  onChange={e => setFormData({ ...formData, alcance: e.target.value })}
                  placeholder="Detalles sobre equipos, mano de obra, cableado..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Servicios requeridos */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                Servicios Involucrados
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {SERVICIOS_LIST.map(srv => {
                  const checked = (formData.servicios || []).includes(srv);
                  return (
                    <label
                      key={srv}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        padding: '0.35rem 0.55rem',
                        borderRadius: '6px',
                        background: checked ? 'rgba(139, 92, 246, 0.12)' : 'rgba(0, 0, 0, 0.03)',
                        border: checked ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleServiceToggle(srv)}
                      />
                      <span>{srv}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Próxima acción y fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Próxima Acción Comercial
                </label>
                <input
                  type="text"
                  value={formData.proxima_accion || ''}
                  onChange={e => setFormData({ ...formData, proxima_accion: e.target.value })}
                  placeholder="Ej: Enviar propuesta formal y cotización"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fecha Próxima Acción
                </label>
                <input
                  type="date"
                  value={formData.fecha_proxima_accion || ''}
                  onChange={e => setFormData({ ...formData, fecha_proxima_accion: e.target.value || null })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Observaciones Generales
              </label>
              <textarea
                rows={2}
                value={formData.observaciones || ''}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Anotaciones internas sobre tiempos, competidores o toma de decisiones..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<Save size={16} />}>
              {loading ? 'Guardando...' : oppToEdit ? 'Guardar Cambios' : 'Crear Oportunidad'}
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
