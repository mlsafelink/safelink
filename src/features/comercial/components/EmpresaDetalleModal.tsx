import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Building2, MapPin, Phone, Mail, Globe, Tag,
  Users, Calendar, TrendingUp, CheckSquare, Clock,
  FileText, Plus, CheckCircle2, Edit, Trash2, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialCompany,
  type CommercialContact,
  type CommercialVisit,
  type CommercialOpportunity,
  type CommercialTask,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface EmpresaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CommercialCompany;
  contacts: CommercialContact[];
  visits: CommercialVisit[];
  opportunities: CommercialOpportunity[];
  tasks: CommercialTask[];
  onEditCompany: (company: CommercialCompany) => void;
  onDeleteCompany: (companyId: string) => void;
  onAddContact: (companyId: string) => void;
  onAddVisit: (companyId: string) => void;
  onAddOpportunity: (companyId: string) => void;
  onAddTask: (companyId: string) => void;
  onRefresh: () => void;
}

type SubTab = 'general' | 'contactos' | 'visitas' | 'oportunidades' | 'seguimientos' | 'actividad';

export function EmpresaDetalleModal({
  isOpen,
  onClose,
  company,
  contacts,
  visits,
  opportunities,
  tasks,
  onEditCompany,
  onDeleteCompany,
  onAddContact,
  onAddVisit,
  onAddOpportunity,
  onAddTask,
  onRefresh
}: EmpresaDetalleModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SubTab>('general');
  const [converting, setConverting] = useState(false);

  if (!isOpen) return null;

  // Filtrar entidades de esta empresa
  const companyContacts = contacts.filter(c => c.company_id === company.id);
  const companyVisits = visits.filter(v => v.company_id === company.id);
  const companyOpps = opportunities.filter(o => o.company_id === company.id);
  const companyTasks = tasks.filter(t => t.company_id === company.id);

  // Convertir a Cliente SafeLink
  const handleConvertToClient = async () => {
    if (company.consorcio_id) {
      alert('Esta empresa ya está vinculada con un cliente de SafeLink.');
      return;
    }
    const confirmConvert = window.confirm(`¿Deseas dar de alta a "${company.nombre_comercial}" como cliente en SafeLink para generar presupuestos y propuestas técnicas?`);
    if (!confirmConvert) return;

    setConverting(true);
    try {
      await commercialService.convertCompanyToClient(company.id, 'particular');
      alert(`¡Empresa "${company.nombre_comercial}" vinculada exitosamente como cliente en SafeLink!`);
      onRefresh();
    } catch (err: any) {
      console.error('Error al convertir empresa a cliente:', err);
      alert('Error: ' + (err.message || 'No se pudo vincular el cliente'));
    } finally {
      setConverting(false);
    }
  };

  // Generar Presupuesto / Propuesta Técnica
  const handleGenerateDocument = async (tipo: 'presupuestos' | 'reportes') => {
    let clientId = company.consorcio_id;
    if (!clientId) {
      const confirmConvert = window.confirm(
        `Para emitir documentos oficiales de SafeLink, la empresa debe registrarse como cliente en el sistema. ¿Deseas darla de alta automáticamente?`
      );
      if (!confirmConvert) return;

      setConverting(true);
      try {
        clientId = await commercialService.convertCompanyToClient(company.id, 'particular');
        onRefresh();
      } catch (err: any) {
        alert('Error registrando cliente: ' + (err.message || 'Error desconocido'));
        setConverting(false);
        return;
      }
      setConverting(false);
    }

    onClose();
    navigate(`/documentos?tab=${tipo}&nuevo=true&consorcioId=${clientId}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '920px', minHeight: '600px' }}>
        {/* Header de la Ficha */}
        <div className={styles.modalHeader} style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem' }}>{company.nombre_comercial}</h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  background: company.prioridad === 'Alta' ? 'rgba(239, 68, 68, 0.15)' : company.prioridad === 'Media' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  color: company.prioridad === 'Alta' ? '#ef4444' : company.prioridad === 'Media' ? '#f59e0b' : '#64748b'
                }}
              >
                Prioridad {company.prioridad}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: 'var(--primary-color)'
                }}
              >
                {company.estado_investigacion}
              </span>
              {company.consorcio_id && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <CheckCircle2 size={12} /> Cliente SafeLink
                </span>
              )}
            </div>
            {company.razon_social && (
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Razón Social: {company.razon_social} {company.cuit ? `| CUIT: ${company.cuit}` : ''}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEditCompany(company)}
              leftIcon={<Edit size={14} />}
            >
              Editar
            </Button>
            <button className={styles.closeIconBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Acciones principales de integración comercial */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(0, 0, 0, 0.02)',
            borderBottom: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateDocument('presupuestos')}
              leftIcon={<FileText size={14} />}
              disabled={converting}
            >
              Generar Presupuesto
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleGenerateDocument('reportes')}
              leftIcon={<ArrowUpRight size={14} />}
              disabled={converting}
            >
              Generar Propuesta Técnica
            </Button>
            {!company.consorcio_id && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleConvertToClient}
                leftIcon={<CheckCircle2 size={14} />}
                disabled={converting}
              >
                {converting ? 'Vinculando...' : 'Convertir a Cliente SafeLink'}
              </Button>
            )}
          </div>

          <button
            onClick={() => onDeleteCompany(company.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <Trash2 size={14} /> Archivar Empresa
          </button>
        </div>

        {/* Sub-Tabs de la Ficha */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--glass-border)',
            padding: '0 1.5rem',
            background: 'var(--glass-bg)',
            overflowX: 'auto',
            gap: '0.25rem'
          }}
        >
          <button
            onClick={() => setActiveTab('general')}
            className={`${styles.tabBtn} ${activeTab === 'general' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'general' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <Building2 size={16} /> Datos Generales
          </button>
          <button
            onClick={() => setActiveTab('contactos')}
            className={`${styles.tabBtn} ${activeTab === 'contactos' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'contactos' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <Users size={16} /> Contactos ({companyContacts.length})
          </button>
          <button
            onClick={() => setActiveTab('visitas')}
            className={`${styles.tabBtn} ${activeTab === 'visitas' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'visitas' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <Calendar size={16} /> Visitas ({companyVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('oportunidades')}
            className={`${styles.tabBtn} ${activeTab === 'oportunidades' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'oportunidades' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <TrendingUp size={16} /> Oportunidades ({companyOpps.length})
          </button>
          <button
            onClick={() => setActiveTab('seguimientos')}
            className={`${styles.tabBtn} ${activeTab === 'seguimientos' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'seguimientos' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <CheckSquare size={16} /> Seguimientos ({companyTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('actividad')}
            className={`${styles.tabBtn} ${activeTab === 'actividad' ? styles.tabBtnActive : ''}`}
            style={{ borderRadius: '0', borderBottom: activeTab === 'actividad' ? '2px solid var(--primary-color)' : 'none' }}
          >
            <Clock size={16} /> Historial
          </button>
        </div>

        {/* Contenido de la Ficha */}
        <div className={styles.modalBody} style={{ padding: '1.5rem', maxHeight: '55vh', overflowY: 'auto' }}>
          {/* TAB 1: DATOS GENERALES */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><Tag size={13} /> Actividad / Rubro</span>
                  <strong style={valueStyle}>{company.rubro || 'No especificado'}</strong>
                </div>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><Building2 size={13} /> Tipo Establecimiento</span>
                  <strong style={valueStyle}>{company.tipo_establecimiento || 'No especificado'}</strong>
                </div>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><MapPin size={13} /> Ubicación</span>
                  <strong style={valueStyle}>
                    {[company.direccion, company.localidad, company.provincia].filter(Boolean).join(', ') || 'Sin dirección'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><Phone size={13} /> Teléfono</span>
                  <strong style={valueStyle}>
                    {company.telefono ? (
                      <a href={`tel:${company.telefono}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {company.telefono}
                      </a>
                    ) : 'No especificado'}
                  </strong>
                </div>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><Mail size={13} /> Correo Electrónico</span>
                  <strong style={valueStyle}>
                    {company.email ? (
                      <a href={`mailto:${company.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {company.email}
                      </a>
                    ) : 'No especificado'}
                  </strong>
                </div>
                <div style={infoBlockStyle}>
                  <span style={labelStyle}><Globe size={13} /> Sitio Web</span>
                  <strong style={valueStyle}>
                    {company.sitio_web ? (
                      <a href={company.sitio_web.startsWith('http') ? company.sitio_web : `https://${company.sitio_web}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>
                        {company.sitio_web}
                      </a>
                    ) : 'No especificado'}
                  </strong>
                </div>
              </div>

              {/* Servicios Potenciales */}
              <div>
                <span style={labelStyle}>Servicios Potenciales Aplicables</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {company.servicios_potenciales && company.servicios_potenciales.length > 0 ? (
                    company.servicios_potenciales.map(s => (
                      <span
                        key={s}
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ningún servicio marcado</span>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              {company.observaciones && (
                <div style={{ background: 'rgba(0, 0, 0, 0.03)', padding: '1rem', borderRadius: '8px' }}>
                  <span style={labelStyle}>Observaciones Comerciales</span>
                  <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                    {company.observaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTACTOS ASOCIADOS */}
          {activeTab === 'contactos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Contactos de {company.nombre_comercial}</span>
                <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onAddContact(company.id)}>
                  Nuevo Contacto
                </Button>
              </div>

              {companyContacts.length === 0 ? (
                <div style={emptyBoxStyle}>
                  <Users size={32} color="var(--text-secondary)" />
                  <p>No hay contactos cargados para esta empresa.</p>
                  <Button size="sm" variant="secondary" onClick={() => onAddContact(company.id)}>
                    Registrar Primer Contacto
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {companyContacts.map(c => (
                    <div key={c.id} style={cardItemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{c.nombre} {c.apellido || ''}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {c.cargo || 'Sin cargo'} {c.area ? `• ${c.area}` : ''}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.4rem',
                            borderRadius: '4px',
                            background: c.estado_verificacion === 'Confirmado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: c.estado_verificacion === 'Confirmado' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {c.estado_verificacion}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.6rem', fontSize: '0.82rem' }}>
                        {c.telefono && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Phone size={13} color="var(--text-secondary)" />
                            <a href={`tel:${c.telefono}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                              {c.telefono}
                            </a>
                            <a
                              href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '0.72rem', background: '#25D366', color: '#fff', padding: '0.1rem 0.35rem', borderRadius: '4px', textDecoration: 'none' }}
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Mail size={13} color="var(--text-secondary)" />
                            <a href={`mailto:${c.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              {c.email}
                            </a>
                          </div>
                        )}
                        {c.horario_contacto && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                            <Clock size={13} /> {c.horario_contacto}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VISITAS */}
          {activeTab === 'visitas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Visitas Realizadas y Programadas</span>
                <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onAddVisit(company.id)}>
                  Registrar Visita
                </Button>
              </div>

              {companyVisits.length === 0 ? (
                <div style={emptyBoxStyle}>
                  <Calendar size={32} color="var(--text-secondary)" />
                  <p>No se han registrado visitas a este cliente.</p>
                  <Button size="sm" variant="secondary" onClick={() => onAddVisit(company.id)}>
                    Planificar o Registrar Visita
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {companyVisits.map(v => (
                    <div key={v.id} style={cardItemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              {v.fecha} {v.hora ? `a las ${v.hora}` : ''}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: v.estado === 'Realizada' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                color: v.estado === 'Realizada' ? '#10b981' : '#3b82f6'
                              }}
                            >
                              {v.estado}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {v.modalidad}</span>
                          </div>
                          {v.objetivo && (
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              Objetivo: {v.objetivo}
                            </p>
                          )}
                        </div>
                      </div>

                      {v.resultado && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: '6px' }}>
                          <strong>Resultado:</strong> {v.resultado}
                        </p>
                      )}

                      {v.proximo_paso && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--primary-color)' }}>
                          <strong>Próximo paso:</strong> {v.proximo_paso} {v.fecha_proximo_paso ? `(Para: ${v.fecha_proximo_paso})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OPORTUNIDADES COMERCIALES */}
          {activeTab === 'oportunidades' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pipeline de Oportunidades</span>
                <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onAddOpportunity(company.id)}>
                  Nueva Oportunidad
                </Button>
              </div>

              {companyOpps.length === 0 ? (
                <div style={emptyBoxStyle}>
                  <TrendingUp size={32} color="var(--text-secondary)" />
                  <p>No hay oportunidades comerciales abiertas para esta empresa.</p>
                  <Button size="sm" variant="secondary" onClick={() => onAddOpportunity(company.id)}>
                    Crear Oportunidad
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {companyOpps.map(opp => (
                    <div key={opp.id} style={cardItemStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{opp.nombre}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            Detectada el {opp.fecha_deteccion} • Prioridad {opp.prioridad}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            ${opp.importe_estimado.toLocaleString('es-AR')}
                          </span>
                          <div>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                background: opp.estado.includes('Ganada') ? 'rgba(16, 185, 129, 0.15)' : opp.estado.includes('Perdida') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.12)',
                                color: opp.estado.includes('Ganada') ? '#10b981' : opp.estado.includes('Perdida') ? '#ef4444' : 'var(--primary-color)'
                              }}
                            >
                              {opp.estado}
                            </span>
                          </div>
                        </div>
                      </div>

                      {opp.proxima_accion && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <strong>Próxima acción:</strong> {opp.proxima_accion} {opp.fecha_proxima_accion ? `(${opp.fecha_proxima_accion})` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SEGUIMIENTOS Y TAREAS */}
          {activeTab === 'seguimientos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Seguimientos y Tareas Comerciales</span>
                <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onAddTask(company.id)}>
                  Nuevo Seguimiento
                </Button>
              </div>

              {companyTasks.length === 0 ? (
                <div style={emptyBoxStyle}>
                  <CheckSquare size={32} color="var(--text-secondary)" />
                  <p>No hay tareas programadas para esta empresa.</p>
                  <Button size="sm" variant="secondary" onClick={() => onAddTask(company.id)}>
                    Programar Seguimiento
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {companyTasks.map(t => (
                    <div key={t.id} style={{ ...cardItemStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.titulo}</span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              background: t.estado === 'Realizada' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: t.estado === 'Realizada' ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {t.tipo} • {t.estado}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Programado para: {t.fecha_programada} {t.hora_programada || ''}
                        </span>
                      </div>

                      {t.estado !== 'Realizada' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<CheckCircle2 size={13} />}
                          onClick={async () => {
                            await commercialService.completeTask(t.id);
                            onRefresh();
                          }}
                        >
                          Completar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HISTORIAL / ACTIVIDAD */}
          {activeTab === 'actividad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cronología de Interacciones</span>
              <div style={{ borderLeft: '2px solid var(--glass-border)', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-1.45rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(company.created_at).toLocaleDateString()}
                  </span>
                  <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>
                    Empresa registrada en Desarrollo Comercial
                  </p>
                </div>

                {companyVisits.map(v => (
                  <div key={v.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-1.45rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v.fecha}</span>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>
                      Visita: {v.objetivo || 'Comercial'} ({v.estado})
                    </p>
                  </div>
                ))}

                {companyOpps.map(o => (
                  <div key={o.id} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-1.45rem', top: '0.2rem', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{o.fecha_deteccion}</span>
                    <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>
                      Oportunidad: {o.nombre} ({o.estado})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

const infoBlockStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.02)',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.03em'
};

const valueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.92rem',
  color: 'var(--text-primary)',
  marginTop: '0.3rem',
  fontWeight: 500
};

const cardItemStyle: React.CSSProperties = {
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px',
  padding: '0.85rem 1rem'
};

const emptyBoxStyle: React.CSSProperties = {
  padding: '2.5rem 1rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
  color: 'var(--text-secondary)',
  fontSize: '0.9rem'
};
