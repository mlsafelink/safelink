import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reporteTrabajoService } from '@/services/documentService';
import {
  Calendar, Building, Shield,
  Cpu, CheckSquare, Wrench, Image,
  User, CheckCircle2, Share2, Download, Layers, ClipboardList
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReporteTrabajoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './ReporteViewer.module.css';

export function PublicReporteTrabajoViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      <main className={styles.mainContent}>

        {/* Acciones (Compartir y Descargar PDF) */}
        <div className={styles.actionRow} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={handleShare} className={styles.shareBtn} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
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
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Wrench size={20} className={styles.sectionIcon} />
              <h2>Descripción de Trabajos Efectuados</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporteTrabajo.descripcion_trabajos}</p>
            </div>
          </section>
        )}

        {/* 2. Equipamiento e Instalación */}
        {reporteTrabajo.equipamiento_instalado && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Cpu size={20} className={styles.sectionIcon} />
              <h2>Equipamiento Instalado</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporteTrabajo.equipamiento_instalado}</p>
            </div>
          </section>
        )}

        {/* 3. Materiales Utilizados */}
        {reporteTrabajo.materiales_utilizados && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <ClipboardList size={20} className={styles.sectionIcon} />
              <h2>Materiales Utilizados</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporteTrabajo.materiales_utilizados}</p>
            </div>
          </section>
        )}

        {/* 4. Configuraciones Realizadas */}
        {reporteTrabajo.configuraciones_realizadas && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <CheckSquare size={20} className={styles.sectionIcon} />
              <h2>Configuraciones Realizadas</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporteTrabajo.configuraciones_realizadas}</p>
            </div>
          </section>
        )}

        {/* 5. Fotografías del Trabajo Realizado */}
        {reporteTrabajo.fotografias && reporteTrabajo.fotografias.length > 0 && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Image size={20} className={styles.sectionIcon} />
              <h2>Registro Fotográfico de Obra</h2>
            </div>
            <div className={styles.photoGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {reporteTrabajo.fotografias.map((url, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={url} alt={`Trabajo ${idx + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Garantía & Conformidad */}
        <section className={styles.sectionCard} style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div className={styles.sectionHeader}>
            <Shield size={20} className={styles.sectionIcon} style={{ color: '#16a34a' }} />
            <h2>Garantía del Servicio & Conformidad</h2>
          </div>
          <div className={styles.sectionBody}>
            <p style={{ fontWeight: 600, color: '#15803d' }}>
              {reporteTrabajo.garantia || '6 meses de garantía oficial SafeLink sobre materiales y mano de obra.'}
            </p>
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>
              <CheckCircle2 size={20} style={{ color: '#2563eb' }} />
              <span>Documento firmado digitalmente y respaldado por SafeLink Cloud.</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className={styles.footer} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <p>SafeLink Cloud · Soluciones Inteligentes para tu Seguridad</p>
      </footer>
    </div>
  );
}
