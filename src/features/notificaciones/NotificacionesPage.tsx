import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacionService, type EventoSistema, type EventoTipo } from '@/services/notificacionService';
import { landingService } from '@/services/landingService';
import {
  getReporteSolicitudesModificacion,
  responderSolicitudModificacion,
  type ReporteSolicitudModificacion,
} from '@/services/reporteConformidadService';
import { Card } from '@/components/ui/Card/Card';
import { clsx } from 'clsx';
import {
  Eye, Share2, CheckCircle2, Bell, Clock,
  Wrench, CheckSquare, ShieldAlert, FileText, BookOpen, FileArchive,
  DollarSign, Download, AlertTriangle, MessageCircle, MessageSquare, Check,
  Trash2, CheckCheck, Square, X, User, Calendar, ChevronDown, ChevronUp,
  Send, ExternalLink, CornerDownRight
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

function getEventConfig(tipo: EventoTipo, detalles?: Record<string, any> | null): EventConfig {
  const normTipo = (tipo || '').toLowerCase().trim();
  const mensaje = detalles?.mensaje || '';

  if (normTipo === 'reporte_modificacion_solicitada' || mensaje === 'Solicitud de modificación de reporte') {
    return {
      icon: Wrench,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      label: 'Solicitud de modificación de reporte',
    };
  }

  if (normTipo === 'reporte_aceptado' || mensaje === 'Reporte aprobado por el cliente') {
    return {
      icon: CheckCircle2,
      color: '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.12)',
      label: 'Reporte aprobado por el cliente',
    };
  }

  switch (normTipo) {
    case 'consulta_web':
      return {
        icon: MessageCircle,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        label: 'Nueva consulta desde el sitio',
        isConsultaWeb: true,
      };
    case 'presupuesto_visto':
      return { icon: Eye, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)', label: 'visualizó el presupuesto' };
    case 'presupuesto_compartido':
      return { icon: Share2, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)', label: 'compartió el presupuesto' };
    case 'presupuesto_aceptado':
      return { icon: CheckCircle2, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)', label: 'aceptó el presupuesto' };
    case 'inicio_obra':
      return { icon: Wrench, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)', label: 'Inicio de obra programado' };
    case 'trabajo_finalizado':
      return { icon: CheckSquare, color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)', label: 'Trabajo finalizado' };
    case 'garantia_vencer':
      return { icon: ShieldAlert, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.12)', label: 'Garantía próxima a vencer' };
    case 'nuevo_reporte':
      return { icon: FileText, color: '#d97706', bgColor: 'rgba(217, 119, 6, 0.12)', label: 'Nuevo reporte generado' };
    case 'nuevo_instructivo':
      return { icon: BookOpen, color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.12)', label: 'Nuevo instructivo publicado' };
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
      return { icon: DollarSign, color: '#059669', bgColor: 'rgba(5, 150, 105, 0.12)', label: 'Nueva factura cargada' };
    case 'factura_descargada':
      return { icon: Download, color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)', label: 'descargó la factura' };
    case 'factura_compartida':
      return { icon: Share2, color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)', label: 'Factura compartida correctamente' };
    case 'factura_proxima_vencer':
      return { icon: AlertTriangle, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)', label: 'Factura próxima a vencer' };
    case 'factura_pagada':
      return { icon: CheckCircle2, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.12)', label: 'Factura marcada como pagada' };
    default:
      return { icon: Bell, color: '#64748b', bgColor: 'rgba(100, 116, 139, 0.12)', label: 'Notificación del sistema' };
  }
}

// ── Cuadro de conversación y detalle de solicitud de modificación ─────────────
function SolicitudConversacionModal({ ev, onClose }: { ev: EventoSistema; onClose: () => void }) {
  const queryClient = useQueryClient();
  const detalles = ev.detalles || {};
  const cliente = ev.cliente_nombre || detalles.cliente_nombre || 'Cliente';
  const reporteTitulo = detalles.titulo || 'Reporte técnico';
  const reporteId = ev.reporte_id || detalles.reporte_id || null;
  const reportePublicId = detalles.reporte_public_id ?? ev.reporte_public_id ?? null;
  const versionReporte = ev.reporte_version ?? detalles.version ?? null;
  const mensajeOriginal = detalles.descripcion ?? detalles.mensaje ?? '';

  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Cargar historial de mensajes asociados a este reporte
  const { data: mensajes = [], isLoading: cargandoHistorial } = useQuery({
    queryKey: ['reporte-solicitudes-mensajes', reporteId],
    queryFn: () => (reporteId ? getReporteSolicitudesModificacion(reporteId) : Promise.resolve([])),
    enabled: !!reporteId,
  });

  const fechaHora = (() => {
    try {
      const d = new Date(ev.created_at);
      return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return ev.created_at; }
  })();

  const formatFechaItem = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const handleEnviarRespuesta = async () => {
    const txt = respuestaTexto.trim();
    if (!txt || !reporteId) return;

    try {
      setEnviando(true);
      await responderSolicitudModificacion(reporteId, txt, 'SafeLink (Administración)');
      setRespuestaTexto('');
      setFeedback('Respuesta registrada con éxito.');
      queryClient.invalidateQueries({ queryKey: ['reporte-solicitudes-mensajes', reporteId] });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Error al registrar respuesta');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del cuadro */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleBox}>
            <Wrench size={18} style={{ color: '#f59e0b' }} />
            <div>
              <h2 className={styles.modalTitle}>Solicitud de modificación de reporte</h2>
              <span className={styles.modalSubtitle}>{reporteTitulo}</span>
            </div>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Metadatos principales */}
        <div className={styles.modalMetaGrid}>
          <div className={styles.modalMetaChip}>
            <User size={14} className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Cliente</span>
              <strong className={styles.metaValue}>{cliente}</strong>
            </div>
          </div>
          <div className={styles.modalMetaChip}>
            <Calendar size={14} className={styles.metaIcon} />
            <div>
              <span className={styles.metaLabel}>Fecha y hora</span>
              <span className={styles.metaValue}>{fechaHora} hs.</span>
            </div>
          </div>
          {versionReporte !== null && (
            <div className={styles.modalMetaChip}>
              <FileText size={14} className={styles.metaIcon} />
              <div>
                <span className={styles.metaLabel}>Versión</span>
                <span className={styles.metaValue}>v{versionReporte}</span>
              </div>
            </div>
          )}
          {reportePublicId && (
            <div className={styles.modalMetaChip}>
              <ExternalLink size={14} className={styles.metaIcon} />
              <div>
                <span className={styles.metaLabel}>Acceso directo</span>
                <a
                  href={`/p/reporte/${reportePublicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.metaLink}
                >
                  Abrir reporte público
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Historial de la conversación */}
        <div className={styles.conversacionArea}>
          <h3 className={styles.conversacionTitle}>
            Historial de mensajes y solicitudes
          </h3>

          <div className={styles.conversacionList}>
            {cargandoHistorial ? (
              <p className={styles.conversacionLoading}>Cargando historial...</p>
            ) : mensajes.length > 0 ? (
              // Mostrar mensajes de reporte_solicitudes_modificacion en orden cronológico
              [...mensajes].reverse().map((msg: ReporteSolicitudModificacion) => {
                const isAdmin = msg.cliente_nombre?.toLowerCase().includes('safelink') || msg.cliente_nombre?.toLowerCase().includes('admin');
                return (
                  <div
                    key={msg.id}
                    className={clsx(
                      styles.msgBubble,
                      isAdmin ? styles.msgBubbleAdmin : styles.msgBubbleCliente
                    )}
                  >
                    <div className={styles.msgHeader}>
                      <span className={styles.msgAuthor}>
                        {isAdmin ? 'SafeLink (Administración)' : (msg.cliente_nombre || cliente)}
                      </span>
                      <span className={styles.msgTime}>{formatFechaItem(msg.created_at)}</span>
                    </div>
                    <div className={styles.msgBody}>{msg.descripcion}</div>
                  </div>
                );
              })
            ) : (
              // Fallback si la tabla aún no tiene múltiples mensajes: mostrar el mensaje actual
              <div className={clsx(styles.msgBubble, styles.msgBubbleCliente)}>
                <div className={styles.msgHeader}>
                  <span className={styles.msgAuthor}>{cliente}</span>
                  <span className={styles.msgTime}>{fechaHora}</span>
                </div>
                <div className={styles.msgBody}>{mensajeOriginal}</div>
              </div>
            )}
          </div>
        </div>

        {/* Formulario para responder desde el mismo cuadro */}
        <div className={styles.conversacionReplyBox}>
          <div className={styles.replyBoxLabel}>
            <CornerDownRight size={14} />
            <span>Responder o registrar nota administrativa sobre esta solicitud</span>
          </div>
          <textarea
            className={styles.replyTextarea}
            value={respuestaTexto}
            onChange={(e) => setRespuestaTexto(e.target.value)}
            placeholder="Escribí una respuesta o aclaración vinculada a este reporte..."
            rows={3}
          />
          <div className={styles.replyFooter}>
            {feedback && <span className={styles.replyFeedback}>{feedback}</span>}
            <button
              type="button"
              className={styles.replySendBtn}
              onClick={handleEnviarRespuesta}
              disabled={enviando || !respuestaTexto.trim() || !reporteId}
            >
              <Send size={14} />
              {enviando ? 'Guardando...' : 'Enviar respuesta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export function NotificacionesPage() {
  const queryClient = useQueryClient();
  const [atendidasState, setAtendidasState] = useState<Record<string, boolean>>({});

  // Selección múltiple
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<string[] | null>(null);
  const [bulkWorking, setBulkWorking] = useState(false);

  // Cuadro de conversación modal para solicitudes de modificación
  const [conversacionEvento, setConversacionEvento] = useState<EventoSistema | null>(null);

  // Expandir texto largo en tarjetas
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ['notificaciones-eventos'],
    queryFn: notificacionService.getAll,
  });

  // Suscripción en tiempo real
  useEffect(() => {
    const unsubscribe = notificacionService.subscribeToEventos((nuevoEvento) => {
      queryClient.setQueryData<EventoSistema[]>(['notificaciones-eventos'], (old = []) => {
        const exists = old.some(e => e.id === nuevoEvento.id);
        if (exists) return old;
        return [nuevoEvento, ...old];
      });
    });
    return () => { unsubscribe(); };
  }, [queryClient]);

  // ── Handlers individuales ──────────────────────────────────────────────────
  const handleMarcarLeida = async (eventoId: string) => {
    setAtendidasState(prev => ({ ...prev, [eventoId]: true }));
    queryClient.setQueryData<EventoSistema[]>(['notificaciones-eventos'], (old = []) =>
      old.map(e => (e.id === eventoId ? { ...e, leida: true, detalles: { ...(e.detalles || {}), leida: true } } : e))
    );
    await notificacionService.marcarLeida(eventoId);
  };

  const handleMarcarAtendida = async (eventoId: string, consultaId?: string) => {
    handleMarcarLeida(eventoId);
    if (consultaId) {
      try { await landingService.marcarAtendida(consultaId); }
      catch (e) { console.warn('Error al marcar consulta atendida:', e); }
    }
  };

  // ── Selección múltiple ─────────────────────────────────────────────────────
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(eventos.map(e => e.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const selectedCount = selected.size;
  const allSelected = eventos.length > 0 && selectedCount === eventos.length;

  // ── Acciones bulk ──────────────────────────────────────────────────────────
  const handleBulkMarcarLeidas = async () => {
    if (selectedCount === 0) return;
    setBulkWorking(true);
    const ids = [...selected];
    queryClient.setQueryData<EventoSistema[]>(['notificaciones-eventos'], (old = []) =>
      old.map(e => ids.includes(e.id) ? { ...e, leida: true, detalles: { ...(e.detalles || {}), leida: true } } : e)
    );
    setAtendidasState(prev => { const next = { ...prev }; ids.forEach(id => { next[id] = true; }); return next; });
    await notificacionService.marcarLeidasBulk(ids);
    clearSelection();
    setBulkWorking(false);
  };

  const handleConfirmarEliminar = () => {
    if (selectedCount === 0) return;
    setDeletingIds([...selected]);
  };

  const handleEjecutarEliminar = async () => {
    if (!deletingIds || deletingIds.length === 0) return;
    setBulkWorking(true);
    const ids = deletingIds;
    setDeletingIds(null);
    queryClient.setQueryData<EventoSistema[]>(['notificaciones-eventos'], (old = []) =>
      old.filter(e => !ids.includes(e.id))
    );
    clearSelection();
    await notificacionService.eliminarNotificaciones(ids);
    queryClient.invalidateQueries({ queryKey: ['notificaciones-eventos'] });
    setBulkWorking(false);
  };

  // ── Helpers de UI ──────────────────────────────────────────────────────────
  const formatFechaHora = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return { fecha, hora };
    } catch { return { fecha: isoDate, hora: '' }; }
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

  const toggleExpanded = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
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

      {/* ── Barra de administración y selección múltiple ── */}
      {eventos.length > 0 && (
        <div className={styles.bulkBar}>
          <button
            type="button"
            className={styles.bulkSelectAll}
            onClick={allSelected ? clearSelection : selectAll}
            title={allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}
          >
            {allSelected ? <CheckCheck size={16} /> : <Square size={16} />}
            <span>{allSelected ? 'Deseleccionar todas' : 'Seleccionar todas'}</span>
          </button>

          {selectedCount > 0 && (
            <div className={styles.bulkActions}>
              <span className={styles.bulkCount}>
                {selectedCount} seleccionada{selectedCount !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className={styles.bulkBtnLeidas}
                onClick={handleBulkMarcarLeidas}
                disabled={bulkWorking}
                title="Marcar seleccionadas como leídas"
              >
                <Check size={14} />
                Marcar leídas
              </button>
              <button
                type="button"
                className={styles.bulkBtnEliminar}
                onClick={handleConfirmarEliminar}
                disabled={bulkWorking}
                title="Eliminar seleccionadas de la bandeja"
              >
                <Trash2 size={14} />
                Eliminar seleccionadas
              </button>
              <button
                type="button"
                className={styles.bulkBtnCancelar}
                onClick={clearSelection}
                title="Cancelar selección"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de confirmación para eliminar ── */}
      {deletingIds && deletingIds.length > 0 && (
        <div className={styles.confirmOverlay} onClick={() => setDeletingIds(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>
              <Trash2 size={18} style={{ color: '#ef4444' }} />
              Confirmar eliminación
            </h3>
            <p className={styles.confirmText}>
              ¿Eliminar {deletingIds.length} notificación{deletingIds.length !== 1 ? 'es' : ''} de la bandeja?
            </p>
            <p className={styles.confirmSubText}>
              Esta acción solo quita las notificaciones de la bandeja administrativa. Los reportes, las versiones históricas, las aprobaciones y las solicitudes de modificación permanecen intactas en Supabase para auditoría y trazabilidad.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmBtnCancelar}
                onClick={() => setDeletingIds(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmBtnEliminar}
                onClick={handleEjecutarEliminar}
                disabled={bulkWorking}
              >
                <Trash2 size={14} />
                Eliminar de la bandeja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cuadro de conversación y detalle de solicitud de modificación ── */}
      {conversacionEvento && (
        <SolicitudConversacionModal
          ev={conversacionEvento}
          onClose={() => setConversacionEvento(null)}
        />
      )}

      {isLoading ? (
        <p className={styles.loading}>Cargando notificaciones...</p>
      ) : eventos.length === 0 ? (
        <Card variant="neumorphic" className={styles.empty}>
          <p>No hay notificaciones registradas aún.</p>
        </Card>
      ) : (
        <div className={styles.list}>
          {eventos.map((ev) => {
            const config = getEventConfig(ev.tipo, ev.detalles);
            const Icon = config.icon;
            const { fecha, hora } = formatFechaHora(ev.created_at);
            const cliente = ev.cliente_nombre || ev.detalles?.cliente_nombre || ev.consorcio_nombre || 'Cliente';
            const codigo = ev.codigo_presupuesto ? ` ${ev.codigo_presupuesto}` : '';
            const reportePublicId = ev.detalles?.reporte_public_id ?? ev.reporte_public_id ?? null;
            const versionReporte = ev.reporte_version ?? ev.detalles?.version ?? null;
            const reporteTitulo = ev.detalles?.titulo ?? null;
            const detalleTexto = ev.detalles?.descripcion ?? ev.detalles?.mensaje ?? '';

            // Detección robusta de solicitud de modificación o reporte
            const normTipo = (ev.tipo || '').toLowerCase().trim();
            const isSolicitudModificacion =
              normTipo === 'reporte_modificacion_solicitada' ||
              ev.detalles?.mensaje === 'Solicitud de modificación de reporte';
            const isAprobacion =
              normTipo === 'reporte_aceptado' ||
              ev.detalles?.mensaje === 'Reporte aprobado por el cliente';
            const isReporteEvento = isSolicitudModificacion || isAprobacion;

            const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
            const isSlnRead = config.isSln && !!lastVisit && ev.created_at < lastVisit;
            const isPersistedRead = ev.leida === true || ev.detalles?.leida === true || atendidasState[ev.id] === true;
            const isRead = isPersistedRead || isSlnRead;
            const slnFile = ev.detalles?.archivo as string | undefined;

            const isConsulta = config.isConsultaWeb;
            const detalles = ev.detalles || {};
            const whatsappNum = detalles.whatsapp as string | undefined;
            const servicio = detalles.servicio as string | undefined;
            const monto = detalles.monto_cotizado ? Number(detalles.monto_cotizado) : undefined;
            const descripcion = detalles.descripcion as string | undefined;
            const consultaId = detalles.consulta_id as string | undefined;
            const isAtendida = atendidasState[ev.id] || detalles.estado === 'atendida' || isPersistedRead;

            const cleanPhone = whatsappNum ? whatsappNum.replace(/\D/g, '') : '';
            const waUrl = cleanPhone
              ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${cliente}, gracias por comunicarte con SafeLink. Recibimos tu consulta sobre ${formatServicioLabel(servicio)}.`)}`
              : '#';

            const isSelected = selected.has(ev.id);
            const isExpanded = expandedIds.has(ev.id);
            const isMsgLong = detalleTexto.length > 180;

            return (
              <div
                key={ev.id}
                className={clsx(
                  styles.notifCard,
                  config.isSln && styles.notifCardSln,
                  isConsulta && styles.notifCardConsulta,
                  isReporteEvento && styles.notifCardReporte,
                  isRead && styles.notifCardRead,
                  isSelected && styles.notifCardSelected,
                )}
                onClick={() => {
                  if (isSolicitudModificacion) {
                    setConversacionEvento(ev);
                  }
                }}
                style={{ cursor: isSolicitudModificacion ? 'pointer' : 'default' }}
              >
                {/* ── Selector individual (checkbox) ── */}
                <button
                  type="button"
                  className={clsx(styles.checkboxBtn, isSelected && styles.checkboxBtnActive)}
                  onClick={(e) => toggleSelect(ev.id, e)}
                  title={isSelected ? 'Deseleccionar' : 'Seleccionar'}
                >
                  {isSelected ? <Check size={13} /> : null}
                </button>

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

                      <div className={styles.consultaActions} onClick={(e) => e.stopPropagation()}>
                        {whatsappNum && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.actionBtnWa}>
                            <MessageSquare size={14} />
                            Responder por WhatsApp
                          </a>
                        )}
                        {!isAtendida && (
                          <button
                            type="button"
                            className={styles.actionBtnAtendida}
                            onClick={() => handleMarcarAtendida(ev.id, consultaId)}
                          >
                            <Check size={14} />
                            Marcar como atendida
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.actionBtnEliminarSingle}
                          onClick={() => setDeletingIds([ev.id])}
                          title="Eliminar notificación de la bandeja"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
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
                      <div className={styles.consultaActions} style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={styles.actionBtnEliminarSingle}
                          onClick={() => setDeletingIds([ev.id])}
                          title="Eliminar notificación de la bandeja"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </>
                  ) : isReporteEvento ? (
                    <>
                      <div className={styles.notifText}>
                        <span className={styles.highlight}>{config.label}</span>
                        {isRead && <span className={styles.leidaTag}>Leída</span>}
                      </div>

                      <div className={styles.consultaDetails}>
                        <div className={styles.consultaField}>
                          <span className={styles.consultaFieldLabel}>Reporte:</span>
                          <span>{reporteTitulo || 'Reporte técnico'}</span>
                        </div>
                        <div className={styles.consultaField}>
                          <span className={styles.consultaFieldLabel}>Cliente:</span>
                          <span>{cliente}</span>
                        </div>
                        {versionReporte !== null && (
                          <div className={styles.consultaField}>
                            <span className={styles.consultaFieldLabel}>Versión:</span>
                            <span>v{versionReporte}</span>
                          </div>
                        )}
                        {isSolicitudModificacion && detalleTexto && (
                          <div
                            className={styles.consultaField}
                            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}
                          >
                            <span className={styles.consultaFieldLabel}>Modificaciones solicitadas:</span>
                            <div className={styles.consultaMensaje} style={{ width: '100%', fontStyle: 'normal', whiteSpace: 'pre-wrap' }}>
                              {isMsgLong && !isExpanded
                                ? detalleTexto.slice(0, 180) + '…'
                                : detalleTexto}
                            </div>
                            {isMsgLong && (
                              <button
                                type="button"
                                className={styles.expandBtn}
                                onClick={(e) => toggleExpanded(ev.id, e)}
                              >
                                {isExpanded ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> Ver todo el mensaje</>}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.consultaActions} onClick={(e) => e.stopPropagation()}>
                        {/* Abrir cuadro de conversación / detalle */}
                        {isSolicitudModificacion && (
                          <button
                            type="button"
                            className={styles.actionBtnDetalle}
                            onClick={() => setConversacionEvento(ev)}
                            title="Abrir cuadro de conversación y detalle"
                          >
                            <MessageSquare size={14} />
                            Abrir conversación
                          </button>
                        )}
                        {reportePublicId && (
                          <a
                            href={`/p/reporte/${reportePublicId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnWa}
                          >
                            <FileText size={14} />
                            Abrir reporte
                          </a>
                        )}
                        {!isRead && (
                          <button
                            type="button"
                            className={styles.actionBtnAtendida}
                            onClick={() => handleMarcarLeida(ev.id)}
                          >
                            <Check size={14} />
                            Marcar como leída
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.actionBtnEliminarSingle}
                          onClick={() => setDeletingIds([ev.id])}
                          title="Eliminar notificación de la bandeja"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.notifText}>
                        <span className={styles.highlight}>{cliente}</span> {config.label}
                        {codigo && <span className={styles.highlight}>{codigo}</span>}
                        {isRead && <span className={styles.leidaTag}>Leída</span>}
                      </div>

                      <div className={styles.consultaActions} style={{ marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        {!isRead && (
                          <button
                            type="button"
                            className={styles.actionBtnAtendida}
                            onClick={() => handleMarcarLeida(ev.id)}
                          >
                            <Check size={14} />
                            Marcar como leída
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.actionBtnEliminarSingle}
                          onClick={() => setDeletingIds([ev.id])}
                          title="Eliminar notificación de la bandeja"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      </div>
                    </>
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
