import { useState, useMemo } from 'react';
import {
  Search, Plus, Building2, Calendar, AlertCircle,
  CheckCircle2, Clock, Edit, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialTask,
  type CommercialCompany,
  type CommercialContact,
  commercialService
} from '@/services/commercialService';

interface SeguimientosTabProps {
  tasks: CommercialTask[];
  companies: CommercialCompany[];
  contacts?: CommercialContact[];
  onOpenNewTask: (companyId?: string) => void;
  onEditTask: (task: CommercialTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectCompany: (company: CommercialCompany) => void;
  onRefresh: () => void;
}

export function SeguimientosTab({
  tasks,
  companies,
  onOpenNewTask,
  onEditTask,
  onDeleteTask,
  onSelectCompany,
  onRefresh
}: SeguimientosTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [activeGroup, setActiveGroup] = useState<'pendientes' | 'completados' | 'todos'>('pendientes');

  const todayStr = new Date().toISOString().split('T')[0];

  const companyMap = useMemo(() => {
    const map = new Map<string, CommercialCompany>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  // Agrupamiento cronológico
  const groupedTasks = useMemo(() => {
    const vencidos: CommercialTask[] = [];
    const paraHoy: CommercialTask[] = [];
    const proximos: CommercialTask[] = [];
    const futuros: CommercialTask[] = [];
    const completados: CommercialTask[] = [];

    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeekStr = nextWeekDate.toISOString().split('T')[0];

    tasks.forEach(t => {
      // Filtrado por búsqueda y tipo
      if (filterTipo && t.tipo !== filterTipo) return;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const comp = companyMap.get(t.company_id)?.nombre_comercial.toLowerCase() || '';
        const title = t.titulo.toLowerCase();
        const desc = (t.descripcion || '').toLowerCase();
        if (!comp.includes(term) && !title.includes(term) && !desc.includes(term)) {
          return;
        }
      }

      if (t.estado === 'Realizada' || t.estado === 'Cancelada') {
        completados.push(t);
      } else if (t.fecha_programada < todayStr) {
        vencidos.push(t);
      } else if (t.fecha_programada === todayStr) {
        paraHoy.push(t);
      } else if (t.fecha_programada <= nextWeekStr) {
        proximos.push(t);
      } else {
        futuros.push(t);
      }
    });

    return { vencidos, paraHoy, proximos, futuros, completados };
  }, [tasks, searchTerm, filterTipo, companyMap, todayStr]);

  const handleCompleteTask = async (task: CommercialTask) => {
    const notes = window.prompt(`¿Deseas agregar notas del resultado para "${task.titulo}"?`, 'Completado');
    if (notes === null) return; // cancelado por usuario

    try {
      await commercialService.completeTask(task.id, notes || 'Completado');
      onRefresh();
    } catch (err: any) {
      alert('Error completando tarea: ' + (err.message || 'Error desconocido'));
    }
  };

  const renderTaskItem = (task: CommercialTask) => {
    const company = companyMap.get(task.company_id);
    const isOverdue = (task.estado === 'Pendiente' || task.estado === 'En curso') && task.fecha_programada < todayStr;
    const isCompleted = task.estado === 'Realizada';

    return (
      <div
        key={task.id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          background: isOverdue ? 'rgba(239, 68, 68, 0.06)' : isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--glass-bg)',
          border: isOverdue ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '240px', flexGrow: 1 }}>
          <button
            onClick={() => !isCompleted && handleCompleteTask(task)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              border: isCompleted ? '1px solid #10b981' : isOverdue ? '1px solid #ef4444' : '1px solid var(--text-secondary)',
              background: isCompleted ? '#10b981' : 'transparent',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isCompleted ? 'default' : 'pointer',
              flexShrink: 0
            }}
            title={isCompleted ? 'Tarea realizada' : 'Clic para marcar como realizada'}
          >
            {isCompleted && <CheckCircle2 size={16} />}
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                {task.titulo}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.12rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: 'var(--primary-color)'
                }}
              >
                {task.tipo}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.12rem 0.4rem',
                  borderRadius: '4px',
                  background: task.prioridad === 'Urgente' || task.prioridad === 'Alta' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  color: task.prioridad === 'Urgente' || task.prioridad === 'Alta' ? '#ef4444' : '#64748b'
                }}
              >
                {task.prioridad}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              {company && (
                <span
                  onClick={() => onSelectCompany(company)}
                  style={{ color: 'var(--primary-color)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Building2 size={12} /> {company.nombre_comercial}
                </span>
              )}
              <span>• Fecha: {task.fecha_programada} {task.hora_programada || ''}</span>
              {task.resultado && (
                <span style={{ color: '#10b981' }}>• Resultado: {task.resultado}</span>
              )}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {!isCompleted && (
            <Button size="sm" variant="secondary" onClick={() => handleCompleteTask(task)}>
              Completar
            </Button>
          )}
          <button
            onClick={() => onEditTask(task)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.3rem' }}
            title="Editar tarea"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDeleteTask(task.id)}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.3rem' }}
            title="Eliminar tarea"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Barra de Filtros */}
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
            placeholder="Buscar por título, empresa o descripción..."
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
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
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
            <option value="">Todos los Tipos de Seguimiento</option>
            <option value="Llamada telefónica">Llamada telefónica</option>
            <option value="Correo electrónico">Correo electrónico</option>
            <option value="Mensaje WhatsApp">Mensaje WhatsApp</option>
            <option value="Visita presencial">Visita presencial</option>
            <option value="Reunión virtual">Reunión virtual</option>
            <option value="Envío de presupuesto">Envío de presupuesto</option>
            <option value="Seguimiento de propuesta">Seguimiento de propuesta</option>
            <option value="Tarea interna">Tarea interna</option>
          </select>

          <Button size="sm" variant="primary" leftIcon={<Plus size={14} />} onClick={() => onOpenNewTask()}>
            Nuevo Seguimiento
          </Button>
        </div>
      </div>

      {/* Selector de Grupo: Pendientes / Completados / Todos */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setActiveGroup('pendientes')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeGroup === 'pendientes' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
            color: activeGroup === 'pendientes' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Pendientes ({groupedTasks.vencidos.length + groupedTasks.paraHoy.length + groupedTasks.proximos.length + groupedTasks.futuros.length})
        </button>
        <button
          onClick={() => setActiveGroup('completados')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeGroup === 'completados' ? 'var(--primary-color)' : 'rgba(0,0,0,0.04)',
            color: activeGroup === 'completados' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          Completados ({groupedTasks.completados.length})
        </button>
      </div>

      {/* Contenido agrupado */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {activeGroup === 'pendientes' && (
          <>
            {/* 1. SECCIÓN VENCIDOS (SI HAY) */}
            {groupedTasks.vencidos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>
                  <AlertCircle size={16} /> ACCIONES VENCIDAS ({groupedTasks.vencidos.length})
                </div>
                {groupedTasks.vencidos.map(renderTaskItem)}
              </div>
            )}

            {/* 2. SECCIÓN PARA HOY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Clock size={16} color="var(--primary-color)" /> PARA HOY ({groupedTasks.paraHoy.length})
              </div>
              {groupedTasks.paraHoy.length === 0 ? (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No tienes tareas programadas para el día de hoy.
                </span>
              ) : (
                groupedTasks.paraHoy.map(renderTaskItem)
              )}
            </div>

            {/* 3. SECCIÓN PRÓXIMOS 7 DÍAS */}
            {groupedTasks.proximos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Calendar size={16} /> PRÓXIMOS 7 DÍAS ({groupedTasks.proximos.length})
                </div>
                {groupedTasks.proximos.map(renderTaskItem)}
              </div>
            )}

            {/* 4. SECCIÓN FUTUROS */}
            {groupedTasks.futuros.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem' }}>
                  <Calendar size={16} /> EN ADELANTE ({groupedTasks.futuros.length})
                </div>
                {groupedTasks.futuros.map(renderTaskItem)}
              </div>
            )}
          </>
        )}

        {activeGroup === 'completados' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {groupedTasks.completados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <CheckCircle2 size={36} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                <p>Aún no hay tareas completadas registradas.</p>
              </div>
            ) : (
              groupedTasks.completados.map(renderTaskItem)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
