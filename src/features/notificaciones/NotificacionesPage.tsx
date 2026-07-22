import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacionService, type EventoSistema, type EventoTipo } from '@/services/notificacionService';
import { Card } from '@/components/ui/Card/Card';
import {
  Eye, Share2, CheckCircle2, Bell, Clock,
  Wrench, CheckSquare, ShieldAlert, FileText, BookOpen,
} from 'lucide-react';
import styles from './NotificacionesPage.module.css';

function getEventConfig(tipo: EventoTipo) {
  switch (tipo) {
    case 'presupuesto_visto':
      return {
        icon: Eye,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        label: 'visualizó el presupuesto',
      };
    case 'presupuesto_compartido':
      return {
        icon: Share2,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.12)',
        label: 'compartió el presupuesto',
      };
    case 'presupuesto_aceptado':
      return {
        icon: CheckCircle2,
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.12)',
        label: 'aceptó el presupuesto',
      };
    case 'inicio_obra':
      return {
        icon: Wrench,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        label: 'Inicio de obra programado',
      };
    case 'trabajo_finalizado':
      return {
        icon: CheckSquare,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        label: 'Trabajo finalizado',
      };
    case 'garantia_vencer':
      return {
        icon: ShieldAlert,
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        label: 'Garantía próxima a vencer',
      };
    case 'nuevo_reporte':
      return {
        icon: FileText,
        color: '#d97706',
        bgColor: 'rgba(217, 119, 6, 0.12)',
        label: 'Nuevo reporte generado',
      };
    case 'nuevo_instructivo':
      return {
        icon: BookOpen,
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.12)',
        label: 'Nuevo instructivo publicado',
      };
    default:
      return {
        icon: Bell,
        color: '#64748b',
        bgColor: 'rgba(100, 116, 139, 0.12)',
        label: 'Notificación del sistema',
      };
  }
}

export function NotificacionesPage() {
  const queryClient = useQueryClient();

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['notificaciones-eventos'],
    queryFn: notificacionService.getAll,
  });

  // Suscripción en tiempo real a Supabase Realtime
  useEffect(() => {
    const unsubscribe = notificacionService.subscribeToEventos((nuevoEvento) => {
      queryClient.setQueryData<EventoSistema[]>(['notificaciones-eventos'], (old = []) => {
        const exists = old.some(e => e.id === nuevoEvento.id);
        if (exists) return old;
        return [nuevoEvento, ...old];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  const formatFechaHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return { fecha, hora };
    } catch {
      return { fecha: isoDate, hora: '' };
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Notificaciones</h1>
          <p>Registro de actividad y seguimiento de clientes en tiempo real</p>
        </div>
        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span>Tiempo real activo</span>
        </div>
      </div>

      {isLoading ? (
        <p className={styles.loading}>Cargando notificaciones...</p>
      ) : eventos.length === 0 ? (
        <Card variant="neumorphic" className={styles.empty}>
          <p>No hay notificaciones registradas aún.</p>
        </Card>
      ) : (
        <div className={styles.list}>
          {eventos.map((ev) => {
            const config = getEventConfig(ev.tipo);
            const Icon = config.icon;
            const { fecha, hora } = formatFechaHora(ev.created_at);
            const cliente = ev.cliente_nombre || ev.consorcio_nombre || 'Cliente';
            const codigo = ev.codigo_presupuesto ? ` ${ev.codigo_presupuesto}` : '';

            return (
              <div key={ev.id} className={styles.notifCard}>
                <div
                  className={styles.iconBox}
                  style={{ background: config.bgColor, color: config.color }}
                >
                  <Icon size={24} />
                </div>
                <div className={styles.notifContent}>
                  <div className={styles.notifText}>
                    <span className={styles.highlight}>{cliente}</span> {config.label}
                    {codigo && <span className={styles.highlight}>{codigo}</span>}
                  </div>
                  <div className={styles.notifMeta}>
                    <Clock size={12} />
                    <span>{fecha} a las {hora} hs.</span>
                    {ev.consorcio_nombre && ev.consorcio_nombre !== ev.cliente_nombre && (
                      <>
                        <span className={styles.dot}>·</span>
                        <span>{ev.consorcio_nombre}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
