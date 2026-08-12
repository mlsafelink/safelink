import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacionService, type EventoSistema, type EventoTipo } from '@/services/notificacionService';
import { landingService } from '@/services/landingService';
import { Card } from '@/components/ui/Card/Card';
import { clsx } from 'clsx';
import {
  Eye, Share2, CheckCircle2, Bell, Clock,
  Wrench, CheckSquare, ShieldAlert, FileText, BookOpen, FileArchive,
  DollarSign, Download, AlertTriangle, MessageCircle, MessageSquare, Check,
} from 'lucide-react';
import { LAST_VISIT_KEY } from '@/features/safeLinkNote/SafeLinkNoteContext';
import styles from './NotificacionesPage.module.css';

type EventConfig = {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
  description?: string;
  isSln?: boolean;
  isConsultaWeb?: boolean;
};


function getEventConfig(tipo: EventoTipo): EventConfig {
  switch (tipo) {
    case 'consulta_web':
      return {
        icon: MessageCircle,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        label: 'Nueva consulta desde el sitio',
        isConsultaWeb: true,
      };
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
    case 'nuevo_sln':
      return {
        icon: FileArchive,
        color: '#f97316',
        bgColor: 'rgba(249, 115, 22, 0.12)',
        label: 'Nuevo archivo .sln recibido',
        description: 'Se recibió un nuevo archivo de SafeLink Note listo para importar.',
        isSln: true,
      };
    case 'factura_cargada':
      return {
        icon: DollarSign,
        color: '#059669',
        bgColor: 'rgba(5, 150, 105, 0.12)',
        label: 'Nueva factura cargada',
      };
    case 'factura_descargada':
      return {
        icon: Download,
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        label: 'descargó la factura',
      };
    case 'factura_compartida':
      return {
        icon: Share2,
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.12)',
        label: 'Factura compartida correctamente',
      };
    case 'factura_proxima_vencer':
      return {
        icon: AlertTriangle,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        label: 'Factura próxima a vencer',
      };
    case 'factura_pagada':
      return {
        icon: CheckCircle2,
        color: '#22c55e',
        bgColor: 'rgba(34, 197, 94, 0.12)',
        label: 'Factura marcada como pagada',
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
  const [atendidasState, setAtendidasState] = useState<Record<string, boolean>>({});

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

  const handleMarcarAtendida = async (eventoId: string, consultaId?: string) => {
    setAtendidasState(prev => ({ ...prev, [eventoId]: true }));
    if (consultaId) {
      try {
        await landingService.marcarAtendida(consultaId);
      } catch (e) {
        console.warn('Error al marcar consulta atendida:', e);
      }
    }
  };

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

  const formatServicioLabel = (servicio?: string) => {
    switch (servicio) {
      case 'camaras': return 'Cámaras';
      case 'iluminacion': return 'Iluminación';
      case 'redes': return 'Redes';
      case 'otro': return 'Otro';
      default: return servicio || 'General';
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

            // Estado "leído" para notificaciones SafeLink Note
            const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
            const isRead = config.isSln && !!lastVisit && ev.created_at < lastVisit;
            const slnFile = ev.detalles?.archivo as string | undefined;

            // Datos de consulta_web
            const isConsulta = config.isConsultaWeb;
            const detalles = ev.detalles || {};
            const whatsappNum = detalles.whatsapp as string | undefined;
            const servicio = detalles.servicio as string | undefined;
            const monto = detalles.monto_cotizado ? Number(detalles.monto_cotizado) : undefined;
            const descripcion = detalles.descripcion as string | undefined;
            const consultaId = detalles.consulta_id as string | undefined;
            const isAtendida = atendidasState[ev.id] || detalles.estado === 'atendida';

            const cleanPhone = whatsappNum ? whatsappNum.replace(/\D/g, '') : '';
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${cliente}, gracias por comunicarte con SafeLink. Recibimos tu consulta sobre ${formatServicioLabel(servicio)}.`)}`
              : '#';

            return (
              <div
                key={ev.id}
                className={clsx(
                  styles.notifCard,
                  config.isSln && styles.notifCardSln,
                  isConsulta && styles.notifCardConsulta,
                  isRead && styles.notifCardRead,
                )}
              >
                <div
                  className={styles.iconBox}
                  style={{ background: config.bgColor, color: config.color }}
                >
                  <Icon size={24} />
                </div>
                <div className={styles.notifContent}>
                  {isConsulta ? (
                    <>
                      <div className={styles.notifText}>
                        <span className={styles.highlight}>{config.label}</span>
                        {isAtendida && <span className={styles.atendidaBadge}><Check size={12} /> Atendida</span>}
                      </div>

                      <div className={styles.consultaDetails}>
                        <div className={styles.consultaField}>
                          <span className={styles.consultaFieldLabel}>Nombre:</span>
                          <span>{cliente}</span>
                        </div>
                        {whatsappNum && (
                          <div className={styles.consultaField}>
                            <span className={styles.consultaFieldLabel}>WhatsApp:</span>
                            <span>{whatsappNum}</span>
                          </div>
                        )}
                        <div className={styles.consultaField}>
                          <span className={styles.consultaFieldLabel}>Servicio:</span>
                          <span>{formatServicioLabel(servicio)}</span>
                        </div>
                        {monto !== undefined && (
                          <div className={styles.consultaField}>
                            <span className={styles.consultaFieldLabel}>Presupuesto informado:</span>
                            <span>${monto.toLocaleString('es-AR')}</span>
                          </div>
                        )}
                        {descripcion && (
                          <div className={styles.consultaMensaje}>
                            "{descripcion}"
                          </div>
                        )}
                      </div>

                      <div className={styles.consultaActions}>
                        {whatsappNum && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnWa}
                          >
                            <MessageSquare size={14} />
                            Responder por WhatsApp
                          </a>
                        )}
                        {!isAtendida && (
                          <button
                            className={styles.actionBtnAtendida}
                            onClick={() => handleMarcarAtendida(ev.id, consultaId)}
                          >
                            <Check size={14} />
                            Marcar como atendida
                          </button>
                        )}
                      </div>
                    </>
                  ) : config.isSln ? (
                    <>
                      <div className={styles.notifText}>
                        <span className={styles.highlightOrange}>{config.label}</span>
                        {isRead && <span className={styles.leidaTag}>Leída</span>}
                      </div>
                      <div className={styles.slnDesc}>{config.description}</div>
                      {slnFile && (
                        <div className={styles.notifMeta}>
                          <FileArchive size={12} />
                          <span className={styles.fileTag}>{slnFile}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.notifText}>
                      <span className={styles.highlight}>{cliente}</span> {config.label}
                      {codigo && <span className={styles.highlight}>{codigo}</span>}
                    </div>
                  )}
                  <div className={styles.notifMeta}>
                    <Clock size={12} />
                    <span>{fecha} a las {hora} hs.</span>
                    {!config.isSln && ev.consorcio_nombre && ev.consorcio_nombre !== ev.cliente_nombre && (
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
