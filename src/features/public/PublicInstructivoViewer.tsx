import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { instructivoService, type InstructivoBloque } from '@/services/documentService';
import { motion } from 'framer-motion';
import { Building, BookOpen, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InstructivoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './PublicViewer.module.css';

export function PublicInstructivoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: instructivo, isLoading, isError } = useQuery({
    queryKey: ['public-instructivo', publicId],
    queryFn: () => instructivoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) return <div className={styles.loading}>Cargando documento...</div>;
  if (isError || !instructivo) return (
    <div className={styles.notFound}>
      <h2>Documento no encontrado</h2>
      <p>El enlace puede ser incorrecto o el documento fue removido.</p>
    </div>
  );

  const adminNombre = (instructivo.consorcios as any)?.administraciones?.nombre;
  const consorcioNombre = (instructivo.consorcios as any)?.nombre;

  const renderBloque = (bloque: InstructivoBloque, i: number) => {
    if (bloque.tipo === 'titulo') {
      return <h2 key={i} className={styles.bloquesTitulo}>{bloque.contenido}</h2>;
    }
    if (bloque.tipo === 'imagen') {
      return (
        <div key={i} className={styles.bloquesImagen}>
          <img src={bloque.contenido} alt={`Imagen ${i + 1}`} loading="lazy" />
        </div>
      );
    }
    return <p key={i} className={styles.bloquesTexto}>{bloque.contenido}</p>;
  };

  return (
    <div className={styles.viewer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon} />
            <span className={styles.brandName}>SafeLink</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PDFDownloadLink document={<InstructivoPDF instructivo={instructivo} />} fileName={`${instructivo.titulo}.pdf`} className={styles.downloadBtn}>
              {/* @ts-ignore */}
              {({ loading }) => (loading ? 'Generando...' : <><Download size={14} /> PDF</>)}
            </PDFDownloadLink>
            <span className={`${styles.docTypeBadge} ${styles.badgeInstructivo}`}>
              <BookOpen size={14} /> Instructivo
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
              {consorcioNombre && <span className={styles.metaChip}><Building size={13} /> {consorcioNombre}</span>}
              {adminNombre && <span className={styles.metaChip}>{adminNombre}</span>}
              <span className={styles.metaChip}>v{instructivo.version}</span>
            </div>
            <h1 className={styles.docTitle}>{instructivo.titulo}</h1>
          </div>

          {/* Bloques de contenido */}
          <div className={styles.sections}>
            {(instructivo.contenido || []).map((bloque, i) => renderBloque(bloque, i))}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>Documento generado por <strong>SafeLink</strong> · Plataforma Técnica de Administraciones</p>
        </footer>
      </motion.div>
    </div>
  );
}
