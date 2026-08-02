import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturaService } from '@/services/facturaService';
import { notificacionService } from '@/services/notificacionService';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, Download, Share2, Check,
  FileText, ClipboardList, BookOpen, Wrench, DollarSign,
  Calendar, Clock, AlertCircle,
} from 'lucide-react';
import { getEstadoConfig, formatMonto, formatFechaCorta, isVencida } from './FinanzasPage';
import styles from './FacturaDetalle.module.css';

interface FacturaDetalleProps {
  facturaId: string;
  onBack: () => void;
  onEdit: () => void;
}

// ── Tarjeta de Documento en el Historial ─────────────────────────────────────

function DocCard({
  icon: Icon,
  label,
  color,
  item,
  publicSlug,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  item: { id: string; titulo?: string; numero_factura?: string; pdf_url?: string | null; public_id?: string; created_at?: string } | null;
  publicSlug?: string;
}) {
  const disponible = !!item;
  const pdfUrl = (item as any)?.pdf_url;
  const publicUrl = item?.public_id && publicSlug
    ? `${window.location.origin}/p/${publicSlug}/${item.public_id}`
    : null;

  return (
    <Card variant="glass" className={styles.docCard}>
      <div className={styles.docCardHeader}>
        <div className={styles.docIconBox} style={{ background: `${color}18`, color }}>
          <Icon size={20} />
        </div>
        <div className={styles.docCardInfo}>
          <span className={styles.docCardLabel}>{label}</span>
          {item && (
            <span className={styles.docCardTitle}>
              {(item as any).numero_factura ?? (item as any).titulo ?? (item as any).codigo ?? '—'}
            </span>
          )}
        </div>
        <span className={`${styles.docEstado} ${disponible ? styles.docEstadoOk : styles.docEstadoNo}`}>
          {disponible ? 'Disponible' : 'No existe'}
        </span>
      </div>
      {disponible && (
        <div className={styles.docCardActions}>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docBtn}
            >
              Ver
            </a>
          )}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.docBtnDownload}
            >
              <Download size={13} /> Descargar
            </a>
          )}
          {!pdfUrl && publicUrl && (
            <span className={styles.docBtnDisabled}>Sin PDF</span>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Evento de Línea de Tiempo ─────────────────────────────────────────────────

function TimelineEvent({ fecha, label, isLast }: { fecha: string | null; label: string; isLast?: boolean }) {
  if (!fecha) return null;
  return (
    <div className={styles.timelineItem}>
      <div className={styles.timelineDot} />
      {!isLast && <div className={styles.timelineLine} />}
      <div className={styles.timelineContent}>
        <span className={styles.timelineFecha}>
          <Calendar size={12} />
          {formatFechaCorta(fecha)}
        </span>
        <span className={styles.timelineLabel}>{label}</span>
      </div>
    </div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────

export function FacturaDetalle({ facturaId, onBack, onEdit }: FacturaDetalleProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Cargar factura
  const { data: factura, isLoading } = useQuery({
    queryKey: ['factura', facturaId],
    queryFn: () => facturaService.getById(facturaId),
  });

  // Cargar historial del trabajo (docs relacionados)
  const { data: historial } = useQuery({
    queryKey: ['historial', facturaId, factura?.consorcio_id],
    queryFn: () =>
      facturaService.getHistorialTrabajo({
        consorcioId: factura!.consorcio_id,
        presupuestoId: factura?.presupuesto_id,
        reporteTrabajoId: factura?.reporte_trabajo_id,
      }),
    enabled: !!factura?.consorcio_id,
  });

  // Cambiar estado rápido
  const updateMutation = useMutation({
    mutationFn: async (nuevoEstado: string) => {
      const updates: any = { estado: nuevoEstado };
      if (nuevoEstado === 'pagado') {
        updates.fecha_pago = new Date().toISOString().split('T')[0];
      }
      await facturaService.update(facturaId, updates);

      if (nuevoEstado === 'pagado') {
        await notificacionService.create({
          tipo: 'factura_pagada',
          cliente_nombre: (factura?.consorcios as any)?.nombre ?? null,
          consorcio_nombre: (factura?.consorcios as any)?.nombre ?? null,
          detalles: { numero_factura: factura?.numero_factura },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factura', facturaId] });
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
  });

  const handleCompartir = () => {
    if (!factura) return;
    const url = `${window.location.origin}/p/factura/${factura.public_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    notificacionService.create({
      tipo: 'factura_compartida',
      cliente_nombre: (factura.consorcios as any)?.nombre ?? null,
      consorcio_nombre: (factura.consorcios as any)?.nombre ?? null,
      detalles: { numero_factura: factura.numero_factura },
    }).catch(console.error);
  };

  // ── Estados de carga ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando factura...</span>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className={styles.errorWrap}>
        <AlertCircle size={40} />
        <p>No se encontró la factura.</p>
        <Button variant="secondary" onClick={onBack}>Volver</Button>
      </div>
    );
  }

  // ── Estado visual ────────────────────────────────────────────────────────

  const estadoReal: any = isVencida(factura) && factura.estado !== 'pagado' ? 'vencida' : factura.estado;
  const est = getEstadoConfig(estadoReal);
  const EstIcon = est.icon;

  const consorcioNombre = (factura.consorcios as any)?.nombre ?? '—';
  const adminNombre = (factura.consorcios as any)?.administraciones?.nombre ?? '—';

  // ── Línea de tiempo ──────────────────────────────────────────────────────

  const timelineEvents: { fecha: string | null; label: string }[] = [
    { fecha: historial?.presupuesto?.created_at ?? null, label: 'Presupuesto generado' },
    { fecha: historial?.presupuesto?.aceptado_at ?? null, label: 'Presupuesto aprobado' },
    { fecha: historial?.reporteTrabajo?.created_at ?? null, label: 'Trabajo realizado' },
    { fecha: historial?.reporte?.created_at ?? null, label: 'Reporte cargado' },
    { fecha: factura.pdf_cargado_at, label: 'Factura cargada' },
    { fecha: factura.fecha_pago, label: 'Pago recibido' },
  ]
    .filter(e => e.fecha)
    .sort((a, b) => new Date(a.fecha!).getTime() - new Date(b.fecha!).getTime());

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
        <div className={styles.headerInfo}>
          <h1>
            Factura <span className={styles.numHighlight}>{factura.numero_factura}</span>
          </h1>
          <p>{consorcioNombre} · {adminNombre}</p>
        </div>
        <div className={styles.headerActions}>
          {factura.pdf_url && (
            <Button
              variant="secondary"
              leftIcon={<Download size={16} />}
              onClick={() => window.open(factura.pdf_url!, '_blank')}
            >
              Descargar PDF
            </Button>
          )}
          <Button
            variant="secondary"
            leftIcon={copied ? <Check size={16} /> : <Share2 size={16} />}
            onClick={handleCompartir}
          >
            {copied ? '¡Copiado!' : 'Compartir Factura'}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Edit size={16} />}
            onClick={onEdit}
          >
            Editar
          </Button>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Columna izquierda */}
        <div className={styles.leftColumn}>
          {/* Datos principales */}
          <Card variant="glass" className={styles.dataCard}>
            <div className={styles.dataGrid}>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>N° Factura</span>
                <span className={styles.dataValor} style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700 }}>
                  {factura.numero_factura}
                </span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Tipo</span>
                <span className={styles.dataValor}>
                  <span className={styles.tipoBadge}>Tipo {factura.tipo_factura}</span>
                </span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Estado</span>
                <span
                  className={styles.estadoBadgeLg}
                  style={{ color: est.color, background: est.bg }}
                >
                  <EstIcon size={14} />
                  {est.label}
                </span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Monto Total</span>
                <span className={styles.dataValorMonto}>{formatMonto(factura.monto_total)}</span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Fecha de Emisión</span>
                <span className={styles.dataValor}>{formatFechaCorta(factura.fecha_emision)}</span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Vencimiento</span>
                <span className={`${styles.dataValor} ${estadoReal === 'vencida' ? styles.vencidaText : ''}`}>
                  {formatFechaCorta(factura.fecha_vencimiento)}
                </span>
              </div>
              {factura.fecha_pago && (
                <div className={styles.dataCelda}>
                  <span className={styles.dataLabel}>Fecha de Pago</span>
                  <span className={styles.dataValor} style={{ color: '#22c55e' }}>
                    {formatFechaCorta(factura.fecha_pago)}
                  </span>
                </div>
              )}
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Cliente / Consorcio</span>
                <span className={styles.dataValor}>{consorcioNombre}</span>
              </div>
              <div className={styles.dataCelda}>
                <span className={styles.dataLabel}>Administración</span>
                <span className={styles.dataValor}>{adminNombre}</span>
              </div>
            </div>

            {factura.observaciones && (
              <div className={styles.observaciones}>
                <span className={styles.dataLabel}>Observaciones</span>
                <p>{factura.observaciones}</p>
              </div>
            )}

            {/* PDF info */}
            {factura.pdf_url && (
              <div className={styles.pdfInfo}>
                <FileText size={16} style={{ color: '#3182ce' }} />
                <div>
                  <p className={styles.pdfNombre}>{factura.pdf_nombre}</p>
                  {factura.pdf_cargado_at && (
                    <p className={styles.pdfMeta}>
                      Cargado el {formatFechaCorta(factura.pdf_cargado_at)}
                      {factura.pdf_cargado_por ? ` por ${factura.pdf_cargado_por}` : ''}
                    </p>
                  )}
                </div>
                <a
                  href={factura.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.pdfViewBtn}
                >
                  <Download size={14} /> Ver PDF
                </a>
              </div>
            )}
          </Card>

          {/* Cambio rápido de estado */}
          <Card variant="neumorphic" className={styles.estadoQuickCard}>
            <h3 className={styles.quickTitle}>Cambiar Estado del Pago</h3>
            <div className={styles.estadoQuickBtns}>
              {(['pendiente', 'parcial', 'pagado'] as const).map(estado => {
                const cfg = getEstadoConfig(estado);
                const EIcon = cfg.icon;
                const isActive = factura.estado === estado;
                return (
                  <button
                    key={estado}
                    className={`${styles.estadoQuickBtn} ${isActive ? styles.estadoQuickBtnActive : ''}`}
                    style={isActive ? { borderColor: cfg.color, color: cfg.color, background: cfg.bg } : undefined}
                    onClick={() => !isActive && updateMutation.mutate(estado)}
                    disabled={updateMutation.isPending || isActive}
                  >
                    <EIcon size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Historial del Trabajo */}
          <div className={styles.historialSection}>
            <h2 className={styles.historialTitle}>
              <Clock size={18} />
              Historial del Trabajo
            </h2>
            <div className={styles.docsList}>
              <DocCard
                icon={FileText}
                label="📄 Presupuesto"
                color="#8b5cf6"
                item={historial?.presupuesto ?? null}
                publicSlug="presupuesto"
              />
              <DocCard
                icon={ClipboardList}
                label="📝 Reporte Técnico"
                color="#d97706"
                item={historial?.reporte ?? null}
                publicSlug="reporte"
              />
              <DocCard
                icon={BookOpen}
                label="📚 Instructivo"
                color="#ec4899"
                item={historial?.instructivo ?? null}
                publicSlug="instructivo"
              />
              <DocCard
                icon={Wrench}
                label="🔧 Reporte de Trabajo"
                color="#10b981"
                item={historial?.reporteTrabajo ?? null}
                publicSlug="reporte-trabajo"
              />
              <DocCard
                icon={DollarSign}
                label="💰 Factura"
                color="#3182ce"
                item={
                  factura.pdf_url
                    ? {
                        id: factura.id,
                        titulo: `Factura ${factura.numero_factura}`,
                        pdf_url: factura.pdf_url,
                        public_id: factura.public_id,
                        created_at: factura.created_at,
                      }
                    : null
                }
                publicSlug="factura"
              />
            </div>
          </div>
        </div>

        {/* Columna derecha — Línea de tiempo */}
        <div className={styles.rightColumn}>
          <Card variant="neumorphic" className={styles.timelineCard}>
            <h2 className={styles.timelineTitle}>
              <Calendar size={18} />
              Línea de Tiempo
            </h2>

            {timelineEvents.length === 0 ? (
              <p className={styles.timelineEmpty}>Sin eventos registrados aún.</p>
            ) : (
              <div className={styles.timeline}>
                {timelineEvents.map((ev, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <TimelineEvent
                      fecha={ev.fecha}
                      label={ev.label}
                      isLast={i === timelineEvents.length - 1}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Enlace rápido cliente */}
          <Card variant="glass" className={styles.linkCard}>
            <h3 className={styles.linkTitle}>Enlace para el Cliente</h3>
            <p className={styles.linkDesc}>
              Este enlace permite al cliente ver y descargar la factura sin acceder al sistema.
            </p>
            <div className={styles.linkBox}>
              <span className={styles.linkText}>
                {window.location.origin}/p/factura/{factura.public_id.slice(0, 12)}...
              </span>
              <button
                className={`${styles.copyBtn} ${copied ? styles.copyBtnActive : ''}`}
                onClick={handleCompartir}
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
