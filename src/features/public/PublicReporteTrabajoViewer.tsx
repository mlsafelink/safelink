import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reporteTrabajoService } from '@/services/documentService';
import {
  Calendar, Building, Shield, FileText,
  Cpu, CheckSquare, Wrench, Image,
  User, CheckCircle2, Share2, Download, Layers, ClipboardList, X, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReporteTrabajoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './ReporteViewer.module.css';

export function PublicReporteTrabajoViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: reporteTrabajo, isLoading, isError } = useQuery({
    queryKey: ['public-reporte-trabajo', publicId],
    queryFn: () => reporteTrabajoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleShare = async () => {
    if (!reporteTrabajo) return;
    const shareUrl = window.location.href;
    const shareTitle = `Reporte de Trabajo: ${reporteTrabajo.titulo} - SafeLink`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Reporte de Trabajo SafeLink: ${reporteTrabajo.titulo}`,
          url: shareUrl,
        });
        showToast('Enlace compartido correctamente');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando reporte de trabajo efectuado...</span>
      </div>
    );
  }

  if (isError || !reporteTrabajo) {
    return (
      <div className={styles.notFoundWrap}>
        <Shield size={48} style={{ color: '#94a3b8' }} />
        <h2>Documento no encontrado</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          El enlace puede ser incorrecto o el documento fue removido.
        </p>
      </div>
    );
  }

  const consorcioNombre = (reporteTrabajo.consorcios as any)?.nombre;
  const clienteNombre = reporteTrabajo.cliente_nombre || consorcioNombre || 'Cliente';
  const codigoDoc = reporteTrabajo.codigo || `RTE-${reporteTrabajo.id.slice(0, 8).toUpperCase()}`;

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

  return (
    <div className={styles.page}>
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandSide}>
            <div className={styles.brandLogo}>SafeLink</div>
            <div className={styles.brandTagline}>Soluciones inteligentes para tu seguridad</div>
          </div>
          <div className={styles.titleSide}>
            <div className={styles.reporteBadge} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Wrench size={12} />
              Reporte de Trabajo Efectuado ({codigoDoc})
            </div>
            <h1 className={styles.docTitle}>{reporteTrabajo.titulo}</h1>
            <p className={styles.docSubtitle}>
              Constancia documental de los trabajos técnicos finalizados, equipamiento y garantía ofrecida por SafeLink.
            </p>
          </div>
        </div>
      </header>

      {/* ── BARRA DE INFO ── */}
      <div className={styles.infoBar}>
        <div className={styles.infoBarInner}>
          <div className={styles.infoChip}>
            <Calendar size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Fecha de Ejecución</span>
              <span className={styles.infoValue}>{formatFecha(reporteTrabajo.fecha)}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Building size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Cliente / Consorcio</span>
              <span className={styles.infoValue}>{clienteNombre}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <User size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Técnico a Cargo</span>
              <span className={styles.infoValue}>{reporteTrabajo.tecnico_nombre || 'SafeLink Técnico'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE DE JERARQUÍA DOCUMENTAL PADRE ── */}
      {(reporteTrabajo.presupuestos || reporteTrabajo.reportes) && (
        <div style={{ maxWidth: '900px', margin: '1.5rem auto 0', padding: '0 1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.06))',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Layers size={22} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            <div style={{ fontSize: '0.9rem', color: '#334155' }}>
              <strong>Trazabilidad Documental:</strong> Este trabajo se ejecutó en base a{' '}
              {reporteTrabajo.presupuestos && (
                <span>
                  el presupuesto{' '}
                  <Link
                    to={`/p/presupuesto/${reporteTrabajo.presupuestos.public_id}`}
                    style={{ color: '#8b5cf6', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    {reporteTrabajo.presupuestos.codigo || 'PRES'}
                  </Link>
                </span>
              )}
              {reporteTrabajo.presupuestos && reporteTrabajo.reportes && ' y '}
              {reporteTrabajo.reportes && (
                <span>
                  el reporte técnico{' '}
                  <Link
                    to={`/p/reporte/${reporteTrabajo.reportes.public_id}`}
                    style={{ color: '#d97706', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    {reporteTrabajo.reportes.codigo || 'RT'}
                  </Link>
                </span>
              )}.
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className={styles.main}>

        {/* Acciones (Compartir y Descargar PDF) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <button onClick={handleShare} className={styles.shareBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
            <Share2 size={16} />
            <span>Compartir</span>
          </button>

          <PDFDownloadLink
            document={<ReporteTrabajoPDF reporte={reporteTrabajo as any} />}
            fileName={`SafeLink_Reporte_Trabajo_${codigoDoc}.pdf`}
            style={{ textDecoration: 'none' }}
          >
            {({ loading }) => (
              <button disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                <Download size={16} />
                <span>{loading ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>
            )}
          </PDFDownloadLink>
        </div>

        {/* 1. Descripción de los Trabajos */}
        {reporteTrabajo.descripcion_trabajos && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepIcon}><Wrench size={18} /></div>
              <span className={styles.stepLabel}>Trabajos</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Descripción de Trabajos Efectuados</h2>
              <p className={styles.cardText}>{reporteTrabajo.descripcion_trabajos}</p>
            </div>
          </div>
        )}

        {/* 2. Equipamiento e Instalación */}
        {reporteTrabajo.equipamiento_instalado && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepIcon}><Cpu size={18} /></div>
              <span className={styles.stepLabel}>Equipos</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Equipamiento Instalado</h2>
              <p className={styles.cardText}>{reporteTrabajo.equipamiento_instalado}</p>
            </div>
          </div>
        )}

        {/* 3. Materiales Utilizados */}
        {reporteTrabajo.materiales_utilizados && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepIcon}><ClipboardList size={18} /></div>
              <span className={styles.stepLabel}>Materiales</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Materiales Utilizados</h2>
              <p className={styles.cardText}>{reporteTrabajo.materiales_utilizados}</p>
            </div>
          </div>
        )}

        {/* 4. Configuraciones Realizadas */}
        {reporteTrabajo.configuraciones_realizadas && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepIcon}><CheckSquare size={18} /></div>
              <span className={styles.stepLabel}>Configuración</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Configuraciones Realizadas</h2>
              <p className={styles.cardText}>{reporteTrabajo.configuraciones_realizadas}</p>
            </div>
          </div>
        )}

        {/* 5. Observaciones */}
        {reporteTrabajo.observaciones && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>5</span>
              <div className={styles.stepIcon}><FileText size={18} /></div>
              <span className={styles.stepLabel}>Observaciones</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Observaciones</h2>
              <p className={styles.cardText}>{reporteTrabajo.observaciones}</p>
            </div>
          </div>
        )}

        {/* 6. Fotografías del Trabajo Realizado */}
        {reporteTrabajo.fotografias && reporteTrabajo.fotografias.length > 0 && (
          <div className={styles.galleryCard}>
            <div className={styles.galleryHeader}>
              <Image size={20} style={{ color: '#2563eb' }} />
              <span>Registro Fotográfico de Obra</span>
            </div>
            <div className={styles.galleryGrid}>
              {reporteTrabajo.fotografias.map((url, idx) => (
                <div
                  key={idx}
                  className={styles.galleryItem}
                  onClick={() => setSelectedImage(url)}
                  style={{ cursor: 'zoom-in' }}
                >
                  <img src={url} alt={`Trabajo ${idx + 1}`} className={styles.galleryImg} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Garantía & Conformidad */}
        <div className={styles.card}>
          <div className={styles.cardLeft} style={{ background: 'linear-gradient(180deg, #059669 0%, #047857 100%)' }}>
            <span className={styles.stepNum}>Garantía</span>
            <span className={styles.stepNumber}><Shield size={28} /></span>
            <span className={styles.stepLabel}>SafeLink</span>
          </div>
          <div className={styles.cardRight}>
            <h2 className={styles.cardHeading}>Garantía del Servicio & Conformidad</h2>
            <p style={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem', margin: 0 }}>
              {reporteTrabajo.garantia || '6 meses de garantía oficial SafeLink sobre materiales y mano de obra.'}
            </p>
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} style={{ color: '#2563eb' }} />
              <span>Documento firmado digitalmente y respaldado por SafeLink Cloud.</span>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <p>SafeLink Cloud · Soluciones Inteligentes para tu Seguridad</p>
      </footer>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
            }}
          >
            {/* Botones de control */}
            <div
              style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={16} />
              </a>
              <button
                onClick={() => setSelectedImage(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '2.25rem', height: '2.25rem', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', color: '#fff',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Imagen ampliada */}
            <motion.img
              src={selectedImage}
              alt="Fotografía ampliada"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw', maxHeight: '88vh',
                borderRadius: '12px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                objectFit: 'contain',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
