import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import { motion } from 'framer-motion';
import { Calendar, Building, FileText, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PresupuestoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './PublicViewer.module.css';

export function PublicPresupuestoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: presupuesto, isLoading, isError } = useQuery({
    queryKey: ['public-presupuesto', publicId],
    queryFn: () => presupuestoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) return <div className={styles.loading}>Cargando documento...</div>;
  if (isError || !presupuesto) return (
    <div className={styles.notFound}>
      <h2>Documento no encontrado</h2>
      <p>El enlace puede ser incorrecto o el documento fue removido.</p>
    </div>
  );

  const adminNombre = (presupuesto.consorcios as any)?.administraciones?.nombre;
  const consorcioNombre = (presupuesto.consorcios as any)?.nombre;
  const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  const subtotal = (presupuesto.materiales || []).reduce((acc, m) => acc + (m.subtotal || 0), 0);

  return (
    <div className={styles.viewer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandMark}>
            <div className={styles.brandIcon} />
            <span className={styles.brandName}>SafeLink</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <PDFDownloadLink document={<PresupuestoPDF presupuesto={presupuesto} />} fileName={`${presupuesto.titulo}.pdf`} className={styles.downloadBtn}>
              {/* @ts-ignore */}
              {({ loading }) => (loading ? 'Generando...' : <><Download size={14} /> PDF</>)}
            </PDFDownloadLink>
            <span className={`${styles.docTypeBadge} ${styles.badgePresupuesto}`}>
              <FileText size={14} /> Presupuesto
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
              <span className={styles.metaChip}><Calendar size={13} /> {presupuesto.fecha}</span>
              {consorcioNombre && <span className={styles.metaChip}><Building size={13} /> {consorcioNombre}</span>}
              {adminNombre && <span className={styles.metaChip}>{adminNombre}</span>}
              <span className={styles.metaChip}>v{presupuesto.version}</span>
            </div>
            <h1 className={styles.docTitle}>{presupuesto.titulo}</h1>
          </div>

          {/* Materiales */}
          {presupuesto.materiales?.length > 0 && (
            <div className={styles.sections}>
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Materiales y Trabajos</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th className={styles.numCol}>Cant.</th>
                        <th className={styles.numCol}>Precio Unit.</th>
                        <th className={styles.numCol}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {presupuesto.materiales.map((m, i) => (
                        <tr key={i}>
                          <td>{m.nombre}</td>
                          <td className={styles.numCol}>{m.cantidad}</td>
                          <td className={styles.numCol}>{fmt(m.precio_unitario)}</td>
                          <td className={styles.numCol}>{fmt(m.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Totales */}
          <div className={styles.totalsBlock}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal materiales</span>
              <span className={styles.totalValue}>{fmt(subtotal)}</span>
            </div>
            {presupuesto.mano_obra > 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Mano de obra</span>
                <span className={styles.totalValue}>{fmt(presupuesto.mano_obra)}</span>
              </div>
            )}
            {presupuesto.descuentos > 0 && (
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Descuentos</span>
                <span className={styles.totalValue}>- {fmt(presupuesto.descuentos)}</span>
              </div>
            )}
            <div className={styles.totalRowFinal}>
              <span className={styles.totalFinalLabel}>Total</span>
              <span className={styles.totalFinalValue}>{fmt(presupuesto.total)}</span>
            </div>
          </div>

          {/* Info extra */}
          <div className={styles.sections} style={{ paddingTop: 0 }}>
            {(presupuesto.validez || presupuesto.garantia) && (
              <div className={styles.infoGrid}>
                {presupuesto.validez && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoItemLabel}>Validez</div>
                    <div className={styles.infoItemValue}>{presupuesto.validez}</div>
                  </div>
                )}
                {presupuesto.garantia && (
                  <div className={styles.infoItem}>
                    <div className={styles.infoItemLabel}>Garantía</div>
                    <div className={styles.infoItemValue}>{presupuesto.garantia}</div>
                  </div>
                )}
              </div>
            )}

            {presupuesto.condiciones && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Condiciones</div>
                <p className={styles.sectionBody}>{presupuesto.condiciones}</p>
              </div>
            )}
            {presupuesto.observaciones && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Observaciones</div>
                <p className={styles.sectionBody}>{presupuesto.observaciones}</p>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <p>Documento generado por <strong>SafeLink</strong> · Plataforma Técnica de Administraciones</p>
        </footer>
      </motion.div>
    </div>
  );
}
