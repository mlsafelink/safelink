import { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialCompany,
  type CommercialCompanyInsert,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface EmpresaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (company: CommercialCompany) => void;
  companyToEdit?: CommercialCompany | null;
}

const RUBROS = [
  'Seguridad e Higiene',
  'Logística y Depósitos',
  'Industria y Manufactura',
  'Edificios y Consorcios',
  'Retail y Locales Comerciales',
  'Salud y Clínicas',
  'Educación y Colegios',
  'Oficinas Corporativas',
  'Construcción y Desarrollos',
  'Automotor y Concesionarios',
  'Gastronomía y Hotelería',
  'Tecnología y Servicios',
  'Otro'
];

const TIPOS_ESTABLECIMIENTO = [
  'Planta industrial',
  'Depósito logístico',
  'Local comercial',
  'Oficinas corporativas',
  'Edificio residencial',
  'Barrio cerrado',
  'Obra en construcción',
  'Establecimiento educativo',
  'Centro de salud',
  'Otro'
];

const FUENTES = [
  'Búsqueda web',
  'Google Maps',
  'Referido',
  'Prospección en frío',
  'Redes sociales',
  'Cartelera / Vía pública',
  'Evento / Exposición',
  'Base de datos',
  'Otro'
];

const ESTADOS_INVESTIGACION = [
  'Identificada',
  'En investigación',
  'Con contacto identificado',
  'Visita pendiente',
  'Visita realizada',
  'Oportunidad detectada',
  'Propuesta enviada',
  'Negociación',
  'En pausa',
  'Descartada'
];

const SERVICIOS_DISPONIBLES = [
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

export function EmpresaFormModal({ isOpen, onClose, onSuccess, companyToEdit }: EmpresaFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CommercialCompanyInsert>({
    nombre_comercial: '',
    razon_social: '',
    cuit: '',
    rubro: 'Logística y Depósitos',
    tipo_establecimiento: 'Depósito logístico',
    descripcion: '',
    direccion: '',
    localidad: '',
    provincia: 'Buenos Aires',
    pais: 'Argentina',
    coordenadas: null,
    sitio_web: '',
    telefono: '',
    email: '',
    fuente: 'Google Maps',
    prioridad: 'Media',
    estado_investigacion: 'Identificada',
    servicios_potenciales: [],
    observaciones: '',
    consorcio_id: null,
    activo: true
  });

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        nombre_comercial: companyToEdit.nombre_comercial || '',
        razon_social: companyToEdit.razon_social || '',
        cuit: companyToEdit.cuit || '',
        rubro: companyToEdit.rubro || 'Logística y Depósitos',
        tipo_establecimiento: companyToEdit.tipo_establecimiento || 'Depósito logístico',
        descripcion: companyToEdit.descripcion || '',
        direccion: companyToEdit.direccion || '',
        localidad: companyToEdit.localidad || '',
        provincia: companyToEdit.provincia || 'Buenos Aires',
        pais: companyToEdit.pais || 'Argentina',
        coordenadas: companyToEdit.coordenadas || null,
        sitio_web: companyToEdit.sitio_web || '',
        telefono: companyToEdit.telefono || '',
        email: companyToEdit.email || '',
        fuente: companyToEdit.fuente || 'Google Maps',
        prioridad: companyToEdit.prioridad || 'Media',
        estado_investigacion: companyToEdit.estado_investigacion || 'Identificada',
        servicios_potenciales: companyToEdit.servicios_potenciales || [],
        observaciones: companyToEdit.observaciones || '',
        consorcio_id: companyToEdit.consorcio_id || null,
        activo: companyToEdit.activo ?? true
      });
    } else {
      setFormData({
        nombre_comercial: '',
        razon_social: '',
        cuit: '',
        rubro: 'Logística y Depósitos',
        tipo_establecimiento: 'Depósito logístico',
        descripcion: '',
        direccion: '',
        localidad: '',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        coordenadas: null,
        sitio_web: '',
        telefono: '',
        email: '',
        fuente: 'Google Maps',
        prioridad: 'Media',
        estado_investigacion: 'Identificada',
        servicios_potenciales: [],
        observaciones: '',
        consorcio_id: null,
        activo: true
      });
    }
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleServiceToggle = (service: string) => {
    const current = formData.servicios_potenciales || [];
    if (current.includes(service)) {
      setFormData({ ...formData, servicios_potenciales: current.filter(s => s !== service) });
    } else {
      setFormData({ ...formData, servicios_potenciales: [...current, service] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre_comercial.trim()) {
      alert('El nombre comercial es obligatorio');
      return;
    }

    setLoading(true);
    try {
      if (companyToEdit) {
        const updated = await commercialService.updateCompany(companyToEdit.id, formData);
        onSuccess(updated);
      } else {
        const created = await commercialService.createCompany(formData);
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      console.error('Error guardando empresa:', err);
      alert('Error al guardar la empresa: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 size={20} color="var(--primary-color)" />
            <h2>{companyToEdit ? 'Editar Empresa' : 'Nueva Empresa Prospectada'}</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Fila 1: Nombre comercial y Razón social */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_comercial}
                  onChange={e => setFormData({ ...formData, nombre_comercial: e.target.value })}
                  placeholder="Ej: Distribuidora Central S.A."
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Razón Social
                </label>
                <input
                  type="text"
                  value={formData.razon_social || ''}
                  onChange={e => setFormData({ ...formData, razon_social: e.target.value })}
                  placeholder="Ej: Logística Central de Cargas S.A."
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Fila 2: CUIT, Rubro y Tipo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  CUIT
                </label>
                <input
                  type="text"
                  value={formData.cuit || ''}
                  onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                  placeholder="30-71234567-8"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Actividad o Rubro
                </label>
                <select
                  value={formData.rubro || ''}
                  onChange={e => setFormData({ ...formData, rubro: e.target.value })}
                  style={inputStyle}
                >
                  {RUBROS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Tipo Establecimiento
                </label>
                <select
                  value={formData.tipo_establecimiento || ''}
                  onChange={e => setFormData({ ...formData, tipo_establecimiento: e.target.value })}
                  style={inputStyle}
                >
                  {TIPOS_ESTABLECIMIENTO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Fila 3: Dirección, Localidad, Provincia */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion || ''}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. del Libertador 4500"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Localidad
                </label>
                <input
                  type="text"
                  value={formData.localidad || ''}
                  onChange={e => setFormData({ ...formData, localidad: e.target.value })}
                  placeholder="Vicente López"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Provincia
                </label>
                <input
                  type="text"
                  value={formData.provincia || ''}
                  onChange={e => setFormData({ ...formData, provincia: e.target.value })}
                  placeholder="Buenos Aires"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Fila 4: Teléfono, Email, Sitio Web */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Teléfono General
                </label>
                <input
                  type="text"
                  value={formData.telefono || ''}
                  onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="011 4567-8900"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Correo General
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@empresa.com"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Sitio Web
                </label>
                <input
                  type="text"
                  value={formData.sitio_web || ''}
                  onChange={e => setFormData({ ...formData, sitio_web: e.target.value })}
                  placeholder="www.empresa.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Fila 5: Prioridad, Estado de Investigación, Fuente */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Nivel de Prioridad
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
                  Estado de Avance
                </label>
                <select
                  value={formData.estado_investigacion}
                  onChange={e => setFormData({ ...formData, estado_investigacion: e.target.value })}
                  style={inputStyle}
                >
                  {ESTADOS_INVESTIGACION.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fuente de Prospección
                </label>
                <select
                  value={formData.fuente || ''}
                  onChange={e => setFormData({ ...formData, fuente: e.target.value })}
                  style={inputStyle}
                >
                  {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            {/* Servicios Potenciales */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                Servicios Potenciales Aplicables
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem' }}>
                {SERVICIOS_DISPONIBLES.map(srv => {
                  const checked = (formData.servicios_potenciales || []).includes(srv);
                  return (
                    <label
                      key={srv}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        padding: '0.4rem 0.6rem',
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

            {/* Observaciones */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Observaciones y Notas Comerciales
              </label>
              <textarea
                rows={3}
                value={formData.observaciones || ''}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Detalles sobre seguridad existente, necesidades detectadas o particularidades..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<Save size={16} />}>
              {loading ? 'Guardando...' : companyToEdit ? 'Guardar Cambios' : 'Crear Empresa'}
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
