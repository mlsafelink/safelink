import { useState, useMemo } from 'react';
import {
  Calendar, Search, Plus, Building2,
  CheckCircle2, ArrowRight, Sparkles, Edit, Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialVisit,
  type CommercialCompany,
  type CommercialContact,
  commercialService
} from '@/services/commercialService';

interface VisitasTabProps {
  visits: CommercialVisit[];
  companies: CommercialCompany[];
  contacts: CommercialContact[];
  onOpenNewVisit: (companyId?: string) => void;
  onEditVisit: (visit: CommercialVisit) => void;
  onDeleteVisit: (visitId: string) => void;
  onSelectCompany: (company: CommercialCompany) => void;
  onOpenNewOpportunityFromVisit: (visit: CommercialVisit) => void;
  onRefresh: () => void;
}

export function VisitasTab({
  visits,
  companies,
  contacts,
  onOpenNewVisit,
  onEditVisit,
  onDeleteVisit,
  onSelectCompany,
  onOpenNewOpportunityFromVisit,
  onRefresh
}: VisitasTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const companyMap = useMemo(() => {
    const map = new Map<string, CommercialCompany>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  const contactMap = useMemo(() => {
    const map = new Map<string, CommercialContact>();
    contacts.forEach(c => map.set(c.id, c));
    return map;
  }, [contacts]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (filterEstado && v.estado !== filterEstado) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const comp = companyMap.get(v.company_id)?.nombre_comercial.toLowerCase() || '';
        const obj = (v.objetivo || '').toLowerCase();
        const res = (v.resultado || '').toLowerCase();
        const dir = (v.direccion || '').toLowerCase();
        if (!comp.includes(term) && !obj.includes(term) && !res.includes(term) && !dir.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [visits, searchTerm, filterEstado, companyMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra superior de filtros y acción rápida */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--glass-bg)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px', maxWidth: '380px' }}>
          <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por empresa, objetivo, dirección..."
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            style={{
              padding: '0.5rem 0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          >
            <option value="">Todos los Estados de Visita</option>
            <option value="Planificada">Planificada</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Realizada">Realizada</option>
            <option value="Reprogramada">Reprogramada</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <Button size="sm" variant="primary" leftIcon={<Calendar size={14} />} onClick={() => onOpenNewVisit()}>
            Registrar Visita
          </Button>
        </div>
      </div>

      {/* Lista de Visitas */}
      {filteredVisits.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            background: 'var(--glass-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)'
          }}
        >
          <Calendar size={40} color="var(--text-secondary)" style={{ marginBottom: '0.75rem' }} />
          <h3>No se encontraron visitas registradas</h3>
          <p style={{ margin: '0.2rem 0 1rem 0', fontSize: '0.85rem' }}>
            {searchTerm || filterEstado
              ? 'Prueba modificando los filtros de búsqueda.'
              : 'Registra tus visitas comerciales presenciales o relevamientos técnicos.'}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => onOpenNewVisit()}>
            Registrar Primera Visita
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredVisits.map(visit => {
            const company = companyMap.get(visit.company_id);
            const contact = visit.contact_id ? contactMap.get(visit.contact_id) : null;
            return (
              <Card
                key={visit.id}
                variant="glass"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Header de la Visita */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {visit.fecha} {visit.hora ? `• ${visit.hora} hs` : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: visit.estado === 'Realizada' ? 'rgba(16, 185, 129, 0.15)' : visit.estado === 'Cancelada' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: visit.estado === 'Realizada' ? '#10b981' : visit.estado === 'Cancelada' ? '#ef4444' : '#3b82f6'
                        }}
                      >
                        {visit.estado}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Modalidad: {visit.modalidad}
                      </span>
                    </div>

                    {company && (
                      <div
                        onClick={() => onSelectCompany(company)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--primary-color)',
                          cursor: 'pointer',
                          marginTop: '0.35rem'
                        }}
                      >
                        <Building2 size={14} /> {company.nombre_comercial}
                      </div>
                    )}
                  </div>

                  {/* Acciones principales de visita */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {visit.estado !== 'Realizada' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<CheckCircle2 size={13} />}
                        onClick={async () => {
                          await commercialService.updateVisit(visit.id, { estado: 'Realizada' });
                          onRefresh();
                        }}
                      >
                        Marcar Realizada
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Sparkles size={13} />}
                      onClick={() => onOpenNewOpportunityFromVisit(visit)}
                    >
                      Crear Oportunidad
                    </Button>
                    <button
                      onClick={() => onEditVisit(visit)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem' }}
                      title="Editar visita"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteVisit(visit.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      title="Eliminar visita"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Detalles: Objetivo, Lugar, Contacto */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                  {visit.objetivo && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>OBJETIVO</span>
                      <strong>{visit.objetivo}</strong>
                    </div>
                  )}
                  {visit.direccion && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>LUGAR / DIRECCIÓN</span>
                      <span>{visit.direccion}</span>
                    </div>
                  )}
                  {contact && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>CONTACTO REUNIDO</span>
                      <span>{contact.nombre} {contact.apellido || ''} {contact.cargo ? `(${contact.cargo})` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Minuta o Resultado */}
                {visit.resultado && (
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                      Minuta / Resultado:
                    </strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {visit.resultado}
                    </p>
                  </div>
                )}

                {/* Próximo paso */}
                {visit.proximo_paso && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--primary-color)' }}>
                    <ArrowRight size={14} />
                    <strong>Próximo paso:</strong> {visit.proximo_paso} {visit.fecha_proximo_paso ? `(Fecha límite: ${visit.fecha_proximo_paso})` : ''}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
