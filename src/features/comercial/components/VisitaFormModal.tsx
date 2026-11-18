import { useState, useEffect } from 'react';
import { X, Calendar, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialVisit,
  type CommercialVisitInsert,
  type CommercialCompany,
  type CommercialContact,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface VisitaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visit: CommercialVisit) => void;
  visitToEdit?: CommercialVisit | null;
  defaultCompanyId?: string;
  companies: CommercialCompany[];
  contacts: CommercialContact[];
}

const ESTADOS_VISITA = ['Planificada', 'Confirmada', 'Realizada', 'Reprogramada', 'Cancelada'] as const;

export function VisitaFormModal({
  isOpen,
  onClose,
  onSuccess,
  visitToEdit,
  defaultCompanyId,
  companies,
  contacts
}: VisitaFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [createOpportunityToo, setCreateOpportunityToo] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<CommercialVisitInsert>({
    company_id: defaultCompanyId || (companies[0]?.id || ''),
    contact_id: null,
    fecha: todayStr,
    hora: '10:00',
    direccion: '',
    modalidad: 'Presencial',
    objetivo: 'Relevamiento técnico inicial',
    estado: 'Planificada',
    resultado: '',
    necesidades_detectadas: '',
    sistemas_observados: '',
    proveedores_actuales: '',
    servicios_ofrecidos: '',
    proximo_paso: '',
    fecha_proximo_paso: null,
    fotografias: []
  });

  // Filtrar contactos de la empresa seleccionada
  const companyContacts = contacts.filter(c => c.company_id === formData.company_id);

  useEffect(() => {
    if (visitToEdit) {
      setFormData({
        company_id: visitToEdit.company_id,
        contact_id: visitToEdit.contact_id || null,
        fecha: visitToEdit.fecha || todayStr,
        hora: visitToEdit.hora || '10:00',
        direccion: visitToEdit.direccion || '',
        modalidad: visitToEdit.modalidad || 'Presencial',
        objetivo: visitToEdit.objetivo || '',
        estado: visitToEdit.estado || 'Planificada',
        resultado: visitToEdit.resultado || '',
        necesidades_detectadas: visitToEdit.necesidades_detectadas || '',
        sistemas_observados: visitToEdit.sistemas_observados || '',
        proveedores_actuales: visitToEdit.proveedores_actuales || '',
        servicios_ofrecidos: visitToEdit.servicios_ofrecidos || '',
        proximo_paso: visitToEdit.proximo_paso || '',
        fecha_proximo_paso: visitToEdit.fecha_proximo_paso || null,
        fotografias: visitToEdit.fotografias || []
      });
      setCreateOpportunityToo(false);
    } else {
      const selectedCompany = companies.find(c => c.id === (defaultCompanyId || companies[0]?.id));
      setFormData({
        company_id: defaultCompanyId || (companies[0]?.id || ''),
        contact_id: null,
        fecha: todayStr,
        hora: '10:00',
        direccion: selectedCompany?.direccion || '',
        modalidad: 'Presencial',
        objetivo: 'Relevamiento técnico inicial',
        estado: 'Planificada',
        resultado: '',
        necesidades_detectadas: '',
        sistemas_observados: '',
        proveedores_actuales: '',
        servicios_ofrecidos: '',
        proximo_paso: '',
        fecha_proximo_paso: null,
        fotografias: []
      });
      setCreateOpportunityToo(false);
    }
  }, [visitToEdit, defaultCompanyId, companies, isOpen]);

  // Si cambia la empresa seleccionada y no se ha especificado dirección, rellenar
  const handleCompanyChange = (newCompanyId: string) => {
    const comp = companies.find(c => c.id === newCompanyId);
    setFormData({
      ...formData,
      company_id: newCompanyId,
      contact_id: null,
      direccion: comp?.direccion || formData.direccion
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_id) {
      alert('Debes seleccionar una empresa');
      return;
    }
    if (!formData.fecha) {
      alert('La fecha es obligatoria');
      return;
    }

    setLoading(true);
    try {
      let savedVisit: CommercialVisit;
      if (visitToEdit) {
        savedVisit = await commercialService.updateVisit(visitToEdit.id, formData);
      } else {
        savedVisit = await commercialService.createVisit(formData);

        // Si se marcó crear oportunidad comercial automáticamente
        if (createOpportunityToo) {
          const comp = companies.find(c => c.id === formData.company_id);
          await commercialService.createOpportunity({
            company_id: formData.company_id,
            contact_id: formData.contact_id || null,
            visit_id: savedVisit.id,
            nombre: `Oportunidad generada de visita: ${formData.objetivo || 'Relevamiento'}`,
            necesidad: formData.necesidades_detectadas || 'Detectada durante la visita comercial',
            alcance: formData.servicios_ofrecidos || '',
            servicios: comp?.servicios_potenciales || ['Sistema de CCTV'],
            prioridad: 'Media',
            importe_estimado: 0,
            fecha_deteccion: formData.fecha,
            proxima_accion: formData.proximo_paso || 'Enviar propuesta técnica',
            fecha_proxima_accion: formData.fecha_proximo_paso || null,
            estado: '2. Relevamiento preliminar',
            motivo_cierre: null,
            presupuesto_id: null,
            reporte_id: null,
            observaciones: formData.resultado || null
          });
        }
      }
      onSuccess(savedVisit);
      onClose();
    } catch (err: any) {
      console.error('Error guardando visita:', err);
      alert('Error al guardar la visita: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={20} color="var(--primary-color)" />
            <h2>{visitToEdit ? 'Editar Visita Comercial' : 'Registrar Visita Comercial'}</h2>
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
                  onChange={e => handleCompanyChange(e.target.value)}
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
                  Contacto Presente
                </label>
                <select
                  value={formData.contact_id || ''}
                  onChange={e => setFormData({ ...formData, contact_id: e.target.value || null })}
                  style={inputStyle}
                >
                  <option value="">Sin contacto específico / Por determinar</option>
                  {companyContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido || ''} {c.cargo ? `(${c.cargo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fecha, Hora, Modalidad y Estado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Hora
                </label>
                <input
                  type="time"
                  value={formData.hora || ''}
                  onChange={e => setFormData({ ...formData, hora: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Modalidad
                </label>
                <select
                  value={formData.modalidad}
                  onChange={e => setFormData({ ...formData, modalidad: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual">Virtual / Videollamada</option>
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
                  {ESTADOS_VISITA.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                </select>
              </div>
            </div>

            {/* Dirección y Objetivo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Lugar / Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección del predio o sucursal..."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Objetivo de la Visita
                </label>
                <input
                  type="text"
                  value={formData.objetivo || ''}
                  onChange={e => setFormData({ ...formData, objetivo: e.target.value })}
                  placeholder="Ej: Relevar cámaras perimetrales y control de accesos"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Minuta o Resultado */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Resultado / Minuta de la Visita
              </label>
              <textarea
                rows={3}
                value={formData.resultado || ''}
                onChange={e => setFormData({ ...formData, resultado: e.target.value })}
                placeholder="Resumen de la reunión, interés demostrado, comentarios del cliente..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Necesidades detectadas y Sistemas observados */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Necesidades y Puntos de Dolor Detectados
                </label>
                <textarea
                  rows={2}
                  value={formData.necesidades_detectadas || ''}
                  onChange={e => setFormData({ ...formData, necesidades_detectadas: e.target.value })}
                  placeholder="Ej: Puntos ciegos en portón trasero, lector de huella fallando..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Sistemas Observados & Proveedores Actuales
                </label>
                <textarea
                  rows={2}
                  value={formData.sistemas_observados || ''}
                  onChange={e => setFormData({ ...formData, sistemas_observados: e.target.value })}
                  placeholder="Marcas instaladas, estado del cableado, empresa proveedora actual..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Próximo paso acordado y fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Próximo Paso Acordado
                </label>
                <input
                  type="text"
                  value={formData.proximo_paso || ''}
                  onChange={e => setFormData({ ...formData, proximo_paso: e.target.value })}
                  placeholder="Ej: Enviar cotización de 8 cámaras IP y NVR de 16 canales"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fecha Próximo Paso
                </label>
                <input
                  type="date"
                  value={formData.fecha_proximo_paso || ''}
                  onChange={e => setFormData({ ...formData, fecha_proximo_paso: e.target.value || null })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Crear Oportunidad Comercial automáticamente */}
            {!visitToEdit && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)'
                }}
              >
                <input
                  type="checkbox"
                  checked={createOpportunityToo}
                  onChange={e => setCreateOpportunityToo(e.target.checked)}
                />
                <Sparkles size={16} color="var(--primary-color)" />
                <span>Crear automáticamente una Oportunidad Comercial vinculada a esta visita</span>
              </label>
            )}
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<Save size={16} />}>
              {loading ? 'Guardando...' : visitToEdit ? 'Guardar Cambios' : 'Registrar Visita'}
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
