import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getReporteHistorial,
  getReporteAceptaciones,
  getReporteSolicitudesModificacion,
  type ReporteVersionHistorial,
} from '@/services/reporteConformidadService';
import {
  History, X, CheckCircle2, Clock, Wrench, Shield,
  Copy, Check, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import styles from './ReporteHistorialModal.module.css';

interface ReporteHistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporteId: string;
  reporteTitulo: string;
  reporteCodigo?: string | null;
}

export function ReporteHistorialModal({
  isOpen,
  onClose,
  reporteId,
  reporteTitulo,
  reporteCodigo,
}: ReporteHistorialModalProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  const { data: versiones = [], isLoading: loadingVersiones } = useQuery({
    queryKey: ['reporte-admin-historial', reporteId],
    queryFn: () => getReporteHistorial(reporteId),
    enabled: isOpen && !!reporteId,
  });

  const { data: aceptaciones = [] } = useQuery({
    queryKey: ['reporte-admin-aceptaciones', reporteId],
    queryFn: () => getReporteAceptaciones(reporteId),
    enabled: isOpen && !!reporteId,
  });

  const { data: solicitudes = [] } = useQuery({
    queryKey: ['reporte-admin-solicitudes', reporteId],
    queryFn: () => getReporteSolicitudesModificacion(reporteId),
    enabled: isOpen && !!reporteId,
  });

  if (!isOpen) return null;

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.warn('Error al copiar al portapapeles:', err);
    }
  };

  const formatFechaHora = (isoDate?: string | null) => {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) + ' hs.';
    } catch {
      return isoDate;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
        return (
          <span className={`${styles.statusPill} ${styles.statusAprobada}`}>
            <CheckCircle2 size={13} />
            Aprobada
          </span>
        );
      case 'modificada':
        return (
          <span className={`${styles.statusPill} ${styles.statusModificada}`}>
            <Wrench size={13} />
            Modificada
          </span>
        );
      default:
        return (
          <span className={`${styles.statusPill} ${styles.statusPendiente}`}>
            <Clock size={13} />
            Pendiente
          </span>
        );
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* ── HEADER ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <History size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Historial y trazabilidad documental</h2>
              <p className={styles.subtitle}>
                {reporteTitulo} {reporteCodigo ? `· ${reporteCodigo}` : ''}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className={styles.body}>
          {loadingVersiones ? (
            <div className={styles.loadingWrap}>
              <Clock size={28} className={styles.headerIcon} />
              <span>Cargando versiones y registros de conformidad...</span>
            </div>
          ) : versiones.length === 0 ? (
            <div className={styles.emptyCard}>
              <Shield size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem', color: '#1e293b' }}>
                Sin versiones previas registradas
              </p>
              <p style={{ fontSize: '0.84rem', margin: 0, color: '#64748b' }}>
                El reporte actual generará automáticamente su snapshot de versión y huella SHA-256 cuando se ejecute la conformidad o se guarde una nueva modificación.
              </p>
            </div>
          ) : (
            versiones.map((v: ReporteVersionHistorial) => {
              const aceptacion = aceptaciones.find(a => a.reporte_version_id === v.id);
              const solicitudesVersion = solicitudes.filter(s => s.reporte_version_id === v.id);
              const isExpanded = expandedVersionId === v.id;
              const doc = v.documento || {};

              return (
                <div key={v.id} className={styles.versionCard}>
                  
                  {/* Fila superior de versión */}
                  <div className={styles.versionTop}>
                    <div className={styles.versionBadgeRow}>
                      <span className={styles.versionTag}>v{v.version}</span>
                      {getStatusBadge(v.estado)}
                    </div>
                    <span className={styles.dateInfo}>
                      Creada: {formatFechaHora(v.created_at)}
                    </span>
                  </div>

                  {/* Metadatos y huella */}
                  <div className={styles.metaGrid}>
                    {v.accepted_at && (
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Aceptación:</span>
                        <span style={{ color: '#15803d', fontWeight: 600 }}>
                          {formatFechaHora(v.accepted_at)}
                          {aceptacion?.cliente_nombre && ` por ${aceptacion.cliente_nombre}`}
                        </span>
                      </div>
                    )}

                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>SHA-256:</span>
                      <div className={styles.hashBox}>
                        <span className={styles.hashText}>{v.sha256}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopyHash(v.sha256)}
                          title="Copiar huella digital completa"
                        >
                          {copiedHash === v.sha256 ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                          <span>{copiedHash === v.sha256 ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Solicitudes de modificación para esta versión */}
                  {solicitudesVersion.length > 0 && (
                    <div className={styles.solicitudesBlock}>
                      <div className={styles.solicitudesTitle}>
                        <Wrench size={13} />
                        <span>Solicitudes de modificación recibidas ({solicitudesVersion.length})</span>
                      </div>
                      {solicitudesVersion.map((sol) => (
                        <div key={sol.id} className={styles.solicitudItem}>
                          <div className={styles.solicitudMeta}>
                            {formatFechaHora(sol.created_at)}
                            {sol.cliente_nombre && ` · ${sol.cliente_nombre}`}
                          </div>
                          <p className={styles.solicitudText}>"{sol.descripcion}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botón para consultar contenido histórico inalterable */}
                  <button
                    type="button"
                    className={styles.viewContentBtn}
                    onClick={() => setExpandedVersionId(isExpanded ? null : v.id)}
                  >
                    <FileText size={14} />
                    <span>{isExpanded ? 'Ocultar contenido histórico' : 'Consultar contenido inalterable'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Vista de contenido histórico */}
                  {isExpanded && (
                    <div className={styles.docPreviewWrap}>
                      <div className={styles.docPreviewTitle}>
                        <FileText size={14} />
                        <span>Contenido congelado de la versión {v.version}</span>
                        <span className={styles.docPreviewBadge}>Solo lectura</span>
                      </div>
                      <div className={styles.docPreviewContent}>
                        <div>
                          <div className={styles.docPreviewFieldLabel}>Título:</div>
                          <div className={styles.docPreviewFieldValue}>{doc.titulo || '-'}</div>
                        </div>
                        {doc.fecha && (
                          <div>
                            <div className={styles.docPreviewFieldLabel}>Fecha de emisión:</div>
                            <div className={styles.docPreviewFieldValue}>{doc.fecha}</div>
                          </div>
                        )}
                        {doc.descripcion && (
                          <div>
                            <div className={styles.docPreviewFieldLabel}>Situación / Descripción:</div>
                            <div className={styles.docPreviewFieldValue}>{doc.descripcion}</div>
                          </div>
                        )}
                        {(doc.equipo_relevado || doc.inspeccion_realizada) && (
                          <div>
                            <div className={styles.docPreviewFieldLabel}>Relevamiento técnico:</div>
                            <div className={styles.docPreviewFieldValue}>
                              {doc.equipo_relevado && `Equipo: ${doc.equipo_relevado}\n`}
                              {doc.inspeccion_realizada && `Inspección: ${doc.inspeccion_realizada}`}
                            </div>
                          </div>
                        )}
                        {(doc.diagnostico || doc.recomendaciones) && (
                          <div>
                            <div className={styles.docPreviewFieldLabel}>Diagnóstico y Recomendaciones:</div>
                            <div className={styles.docPreviewFieldValue}>
                              {doc.diagnostico && `Diagnóstico: ${doc.diagnostico}\n`}
                              {doc.recomendaciones && `Recomendaciones: ${doc.recomendaciones}`}
                            </div>
                          </div>
                        )}
                        {Array.isArray(doc.fotografias) && doc.fotografias.length > 0 && (
                          <div>
                            <div className={styles.docPreviewFieldLabel}>Fotografías adjuntas:</div>
                            <div className={styles.docPreviewFieldValue}>
                              {doc.fotografias.length} foto(s) archivadas en esta versión.
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className={styles.footer}>
          <button type="button" className={styles.copyBtn} onClick={onClose} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
            Cerrar historial
          </button>
        </div>

      </div>
    </div>
  );
}

