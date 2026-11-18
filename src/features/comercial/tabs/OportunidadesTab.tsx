import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Search, Plus, Building2,
  ArrowRight, FileText,
  Clock, Edit, Trash2, ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialOpportunity,
  type CommercialCompany,
  OPPORTUNITY_STAGES,
  commercialService
} from '@/services/commercialService';

interface OportunidadesTabProps {
  opportunities: CommercialOpportunity[];
  companies: CommercialCompany[];
  onOpenNewOpportunity: (companyId?: string) => void;
  onEditOpportunity: (opp: CommercialOpportunity) => void;
  onDeleteOpportunity: (oppId: string) => void;
  onSelectCompany: (company: CommercialCompany) => void;
  onChangeStage: (opp: CommercialOpportunity) => void;
  onRefresh: () => void;
}

export function OportunidadesTab({
  opportunities,
  companies,
  onOpenNewOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onSelectCompany,
  onChangeStage,
  onRefresh
}: OportunidadesTabProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('');

  const companyMap = useMemo(() => {
    const map = new Map<string, CommercialCompany>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  // Cálculos de Pipeline
  const pipelineMetrics = useMemo(() => {
    const totalCount = opportunities.length;
    const totalAmount = opportunities.reduce((acc, o) => acc + (Number(o.importe_estimado) || 0), 0);
    const wonCount = opportunities.filter(o => o.estado === '8. Ganada').length;
    const wonAmount = opportunities.filter(o => o.estado === '8. Ganada').reduce((acc, o) => acc + (Number(o.importe_estimado) || 0), 0);
    const openCount = opportunities.filter(o => o.estado !== '8. Ganada' && o.estado !== '9. Perdida').length;
    const openAmount = opportunities.filter(o => o.estado !== '8. Ganada' && o.estado !== '9. Perdida').reduce((acc, o) => acc + (Number(o.importe_estimado) || 0), 0);

    return { totalCount, totalAmount, wonCount, wonAmount, openCount, openAmount };
  }, [opportunities]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(opp => {
      if (filterPrioridad && opp.prioridad !== filterPrioridad) return false;
      if (filterEtapa && opp.estado !== filterEtapa) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const comp = companyMap.get(opp.company_id)?.nombre_comercial.toLowerCase() || '';
        const name = opp.nombre.toLowerCase();
        const need = (opp.necesidad || '').toLowerCase();
        if (!comp.includes(term) && !name.includes(term) && !need.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [opportunities, searchTerm, filterPrioridad, filterEtapa, companyMap]);

  // Generar Presupuesto o Propuesta Técnica
  const handleGenerateDocument = async (opp: CommercialOpportunity, tipo: 'presupuestos' | 'reportes') => {
    const company = companyMap.get(opp.company_id);
    if (!company) return;

    let clientId = company.consorcio_id;
    if (!clientId) {
      const confirmConvert = window.confirm(
        `Para generar el documento en SafeLink, la empresa "${company.nombre_comercial}" se registrará como cliente. ¿Deseas continuar?`
      );
      if (!confirmConvert) return;

      try {
        clientId = await commercialService.convertCompanyToClient(company.id, 'particular');
        onRefresh();
      } catch (err: any) {
        alert('Error: ' + (err.message || 'No se pudo vincular cliente'));
        return;
      }
    }

    navigate(`/documentos?tab=${tipo}&nuevo=true&consorcioId=${clientId}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Resumen numérico del Pipeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card variant="glass" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VALOR PIPELINE ABIERTO</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginTop: '0.2rem' }}>
            ${pipelineMetrics.openAmount.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pipelineMetrics.openCount} oportunidades activas</span>
        </Card>

        <Card variant="glass" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VENTAS GANADAS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>
            ${pipelineMetrics.wonAmount.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pipelineMetrics.wonCount} operaciones cerradas</span>
        </Card>

        <Card variant="glass" style={{ padding: '1rem 1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL EN GESTIÓN</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            ${pipelineMetrics.totalAmount.toLocaleString('es-AR')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pipelineMetrics.totalCount} oportunidades totales</span>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
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
            placeholder="Buscar por oportunidad, empresa o necesidad..."
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
            value={filterEtapa}
            onChange={e => setFilterEtapa(e.target.value)}
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
            <option value="">Todas las Etapas</option>
            {OPPORTUNITY_STAGES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>

          <select
            value={filterPrioridad}
            onChange={e => setFilterPrioridad(e.target.value)}
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
            <option value="">Todas las Prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onOpenNewOpportunity()}>
            Nueva Oportunidad
          </Button>
        </div>
      </div>

      {/* Lista de Oportunidades */}
      {filteredOpps.length === 0 ? (
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
          <TrendingUp size={40} color="var(--text-secondary)" style={{ marginBottom: '0.75rem' }} />
          <h3>No se encontraron oportunidades</h3>
          <p style={{ margin: '0.2rem 0 1rem 0', fontSize: '0.85rem' }}>
            {searchTerm || filterEtapa || filterPrioridad
              ? 'Prueba modificando los filtros de búsqueda.'
              : 'Registra tus oportunidades de negocio para gestionar el pipeline y emitir propuestas.'}
          </p>
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => onOpenNewOpportunity()}>
            Crear Oportunidad
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filteredOpps.map(opp => {
            const company = companyMap.get(opp.company_id);
            const isWon = opp.estado === '8. Ganada';
            const isLost = opp.estado === '9. Perdida';
            const isPaused = opp.estado === '10. En pausa';

            return (
              <Card
                key={opp.id}
                variant="glass"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Cabecera de la Oportunidad */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flexGrow: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                        {opp.nombre}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: opp.prioridad === 'Alta' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: opp.prioridad === 'Alta' ? '#ef4444' : '#f59e0b'
                        }}
                      >
                        Prioridad {opp.prioridad}
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

                  {/* Importe y Estado con botón de cambio */}
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${opp.importe_estimado.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => onChangeStage(opp)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        border: 'none',
                        cursor: 'pointer',
                        background: isWon ? 'rgba(16, 185, 129, 0.15)' : isLost ? 'rgba(239, 68, 68, 0.15)' : isPaused ? 'rgba(100, 116, 139, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                        color: isWon ? '#10b981' : isLost ? '#ef4444' : isPaused ? '#64748b' : 'var(--primary-color)'
                      }}
                      title="Haz clic para avanzar o cambiar etapa"
                    >
                      {opp.estado} <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Necesidad y Alcance */}
                {(opp.necesidad || opp.alcance) && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    {opp.necesidad && (
                      <p style={{ margin: '0 0 0.35rem 0' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Necesidad:</strong> {opp.necesidad}
                      </p>
                    )}
                    {opp.alcance && (
                      <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Alcance:</strong> {opp.alcance}
                      </p>
                    )}
                  </div>
                )}

                {/* Próxima acción */}
                {opp.proxima_accion && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <Clock size={13} color="var(--primary-color)" />
                    <strong>Próxima acción:</strong> {opp.proxima_accion} {opp.fecha_proxima_accion ? `(Para: ${opp.fecha_proxima_accion})` : ''}
                  </div>
                )}

                {/* Footer con acciones clave: Generar Presupuesto / Propuesta */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--glass-border)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<FileText size={13} />}
                      onClick={() => handleGenerateDocument(opp, 'presupuestos')}
                    >
                      Generar Presupuesto
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<ArrowUpRight size={13} />}
                      onClick={() => handleGenerateDocument(opp, 'reportes')}
                    >
                      Generar Propuesta Técnica
                    </Button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => onEditOpportunity(opp)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem' }}
                      title="Editar oportunidad"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteOpportunity(opp.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
                      title="Eliminar oportunidad"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
