import {
  Building2, Users, Calendar, TrendingUp, CheckSquare,
  Plus, CheckCircle2, Clock, UploadCloud
} from 'lucide-react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { type CommercialSummary, commercialService } from '@/services/commercialService';

interface ResumenTabProps {
  summary: CommercialSummary;
  onNavigateTab: (tab: 'empresas' | 'contactos' | 'visitas' | 'oportunidades' | 'seguimientos') => void;
  onOpenNewCompany: () => void;
  onOpenNewContact: () => void;
  onOpenNewVisit: () => void;
  onOpenNewOpportunity: () => void;
  onOpenNewTask: () => void;
  onOpenImportExcel: () => void;
  onRefresh: () => void;
}

export function ResumenTab({
  summary,
  onNavigateTab,
  onOpenNewCompany,
  onOpenNewContact,
  onOpenNewVisit,
  onOpenNewOpportunity,
  onOpenNewTask,
  onOpenImportExcel,
  onRefresh
}: ResumenTabProps) {
  const kpis = [
    {
      title: 'Empresas Registradas',
      value: summary.totalEmpresas,
      icon: <Building2 size={20} color="var(--primary-color)" />,
      tab: 'empresas' as const,
      color: 'var(--primary-color)'
    },
    {
      title: 'Contactos Identificados',
      value: summary.totalContactos,
      icon: <Users size={20} color="#3b82f6" />,
      tab: 'contactos' as const,
      color: '#3b82f6'
    },
    {
      title: 'Visitas Programadas',
      value: summary.visitasProgramadas,
      subtitle: `${summary.visitasRealizadas} realizadas`,
      icon: <Calendar size={20} color="#10b981" />,
      tab: 'visitas' as const,
      color: '#10b981'
    },
    {
      title: 'Oportunidades Abiertas',
      value: summary.oportunidadesAbiertas,
      subtitle: `${summary.presupuestosGenerados} con propuesta/presupuesto`,
      icon: <TrendingUp size={20} color="#8b5cf6" />,
      tab: 'oportunidades' as const,
      color: '#8b5cf6'
    },
    {
      title: 'Seguimientos Pendientes',
      value: summary.seguimientosPendientes,
      badge: summary.seguimientosVencidos > 0 ? `${summary.seguimientosVencidos} vencidos` : undefined,
      icon: <CheckSquare size={20} color={summary.seguimientosVencidos > 0 ? '#ef4444' : '#f59e0b'} />,
      tab: 'seguimientos' as const,
      color: summary.seguimientosVencidos > 0 ? '#ef4444' : '#f59e0b'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Barra de Accesos Rápidos */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          background: 'var(--glass-bg)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--glass-border)'
        }}
      >
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.4rem' }}>
          Accesos rápidos:
        </span>
        <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={onOpenNewCompany}>
          Nueva Empresa
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={onOpenNewContact}>
          Nuevo Contacto
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<Calendar size={14} />} onClick={onOpenNewVisit}>
          Registrar Visita
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<TrendingUp size={14} />} onClick={onOpenNewOpportunity}>
          Nueva Oportunidad
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<CheckSquare size={14} />} onClick={onOpenNewTask}>
          Nuevo Seguimiento
        </Button>
        <Button size="sm" variant="secondary" leftIcon={<UploadCloud size={14} />} onClick={onOpenImportExcel}>
          Importar Excel
        </Button>
      </div>

      {/* 2. Grid de KPIs Dinámicos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            variant="glass"
            style={{
              padding: '1.1rem 1.25rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onClick={() => onNavigateTab(kpi.tab)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {kpi.title}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {kpi.icon}
              </div>
            </div>

            <div style={{ marginTop: '0.6rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {kpi.value}
              </span>
              {kpi.badge ? (
                <span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444'
                  }}
                >
                  {kpi.badge}
                </span>
              ) : kpi.subtitle ? (
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {kpi.subtitle}
                </p>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Próximas Actividades y Actividad Reciente */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Próximas Actividades */}
        <Card variant="glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--primary-color)" /> Próximas Actividades y Tareas
            </h3>
            <button
              onClick={() => onNavigateTab('seguimientos')}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Ver todas →
            </button>
          </div>

          {summary.proximasActividades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>¡Todo al día! No tienes actividades pendientes urgentes.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {summary.proximasActividades.map(act => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: act.vencido ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.02)',
                    border: act.vencido ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--glass-border)'
                  }}
                >
                  <div style={{ minWidth: 0, flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {act.titulo}
                      </span>
                      {act.vencido && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          VENCIDO
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {act.empresa} • {act.fecha} {act.hora || ''}
                    </span>
                  </div>

                  {act.tipo === 'seguimiento' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await commercialService.completeTask(act.id);
                        onRefresh();
                      }}
                    >
                      ✓
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card variant="glass" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--primary-color)" /> Actividad Comercial Reciente
            </h3>
          </div>

          {summary.actividadReciente.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <Building2 size={32} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>Aún no hay actividad registrada. ¡Comienza creando una empresa!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {summary.actividadReciente.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--glass-border)'
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: item.tipo === 'empresa' ? 'var(--primary-color)' : item.tipo === 'visita' ? '#3b82f6' : item.tipo === 'oportunidad' ? '#8b5cf6' : '#10b981',
                      marginTop: '0.4rem',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.titulo}
                    </span>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.subtitulo}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {new Date(item.fecha).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
