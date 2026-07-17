import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reporteService } from '@/services/documentService';
import { motion } from 'framer-motion';
import { Calendar, Building, ClipboardList, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportePDF } from '@/components/pdf/DocumentPDFs';
import styles from './PublicViewer.module.css';

const FIELDS: { key: keyof ReturnType<typeof placeholderReporte>; label: string }[] = [
  { key: 'motivo', label: 'Motivo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'trabajo_realizado', label: 'Trabajo Realizado' },
  { key: 'recomendaciones', label: 'Recomendaciones' },
  { key: 'conclusiones', label: 'Conclusiones' },
  { key: 'observaciones', label: 'Observaciones' },
];

// Solo para inferencia de tipo
function placeholderReporte() {
  return {
    motivo: '', descripcion: '', diagnostico: '',
    trabajo_realizado: '', recomendaciones: '', conclusiones: '', observaciones: ''
  };
}

export function PublicReporteViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: reporte, isLoading, isError } = useQuery({
    queryKey: ['public-reporte', publicId],
    queryFn: () => reporteService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) return <div className={styles.loading}>Cargando documento...</div>;
  if (isError || !reporte) return (
    <div className={styles.notFound}>
      <h2>Documento no encontrado</h2>
      <p>El enlace puede ser incorrecto o el documento fue removido.</p>
    </div>
  );

  const adminNombre = (reporte.consorcios as any)?.administraciones?.nombre;
  const consorcioNombre = (reporte.consorcios as any)?.nombre;

  return (
    <div className={styles.viewer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon} />
            <span className={styles.brandName}>SafeLink</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PDFDownloadLink document={<ReportePDF reporte={reporte} />} fileName={`${reporte.titulo}.pdf`} className={styles.downloadBtn}>
              {/* @ts-ignore */}
              {({ loading }) => (loading ? 'Generando...' : <><Download size={14} /> PDF</>)}
            </PDFDownloadLink>
            <span className={`${styles.docTypeBadge} ${styles.badgeReporte}`}>
              <ClipboardList size={14} /> Reporte Técnico
            </span>
          </div>
        </div>
      </header>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.docCard}>
          {/* Hero */}
          <div className={styles.docHero}>
            <div className={styles.docMeta}>
              <span className={styles.metaChip}><Calendar size={13} /> {reporte.fecha}</span>
              {consorcioNombre && <span className={styles.metaChip}><Building size={13} /> {consorcioNombre}</span>}
              {adminNombre && <span className={styles.metaChip}>{adminNombre}</span>}
              <span className={styles.metaChip}>v{reporte.version}</span>
            </div>
            <h1 className={styles.docTitle}>{reporte.titulo}</h1>
          </div>

          {/* Campos del reporte */}
          <div className={styles.sections}>
            {FIELDS.map(({ key, label }) => {
              const value = (reporte as Record<string, unknown>)[key];
              if (!value || String(value).trim() === '') return null;
              return (
                <div key={key} className={styles.section}>
                  <div className={styles.sectionTitle}>{label}</div>
                  <p className={styles.sectionBody}>{String(value)}</p>
                </div>
              );
            })}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>Documento generado por <strong>SafeLink</strong> · Plataforma Técnica de Administraciones</p>
        </footer>
      </motion.div>
    </div>
  );
}
