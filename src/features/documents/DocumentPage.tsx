import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteService, presupuestoService, instructivoService } from '@/services/documentService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import {
  FileText, ClipboardList, BookOpen, Plus, ExternalLink,
  Edit, Copy, Download, Trash2, Check, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportePDF, PresupuestoPDF, InstructivoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './DocumentPage.module.css';
import { ReporteForm } from './ReporteForm';
import { PresupuestoForm } from './PresupuestoForm';
import { InstructivoForm } from './InstructivoForm';

type ActiveTab = 'reportes' | 'presupuestos' | 'instructivos';
type ViewMode = 'list' | 'form';

export function DocumentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('reportes');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: reportes = [], isLoading: loadingReportes } = useQuery({
    queryKey: ['reportes'],
    queryFn: reporteService.getAll,
    enabled: activeTab === 'reportes',
  });

  const { data: presupuestos = [], isLoading: loadingPresupuestos } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: presupuestoService.getAll,
    enabled: activeTab === 'presupuestos',
  });

  const { data: instructivos = [], isLoading: loadingInstructivos } = useQuery({
    queryKey: ['instructivos'],
    queryFn: instructivoService.getAll,
    enabled: activeTab === 'instructivos',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (activeTab === 'reportes') return reporteService.delete(id);
      if (activeTab === 'presupuestos') return presupuestoService.delete(id);
      return instructivoService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeTab] });
      setDeletingId(null);
    },
  });

  const handleNew = () => { setEditingId(null); setViewMode('form'); };
  const handleEdit = (id: string) => { setEditingId(id); setViewMode('form'); };
  const handleBack = () => { setEditingId(null); setViewMode('list'); };

  const handleCopyLink = (publicId: string, docId: string) => {
    const slug = activeTab === 'instructivos' ? 'instructivo'
      : activeTab === 'presupuestos' ? 'presupuesto' : 'reporte';
    const url = `${window.location.origin}/p/${slug}/${publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPublicSlug = () =>
    activeTab === 'instructivos' ? 'instructivo'
    : activeTab === 'presupuestos' ? 'presupuesto' : 'reporte';

  if (viewMode === 'form') {
    if (activeTab === 'reportes') return <ReporteForm onBack={handleBack} editingId={editingId} />;
    if (activeTab === 'presupuestos') return <PresupuestoForm onBack={handleBack} editingId={editingId} />;
    if (activeTab === 'instructivos') return <InstructivoForm onBack={handleBack} editingId={editingId} />;
  }

  const isLoading = loadingReportes || loadingPresupuestos || loadingInstructivos;

  const currentData =
    activeTab === 'reportes' ? reportes :
    activeTab === 'presupuestos' ? presupuestos :
    instructivos;

  const tabConfig: { id: ActiveTab; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'reportes', label: 'Reportes Técnicos', icon: ClipboardList, color: '#d69e2e' },
    { id: 'presupuestos', label: 'Presupuestos', icon: FileText, color: '#805ad5' },
    { id: 'instructivos', label: 'Instructivos', icon: BookOpen, color: '#e53e3e' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Documentos</h1>
          <p>Administrá reportes, presupuestos e instructivos</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleNew}>
          Nuevo Documento
        </Button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab(tab.id); setViewMode('list'); setDeletingId(null); }}
            style={activeTab === tab.id ? { borderBottomColor: tab.color, color: tab.color } : {}}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className={styles.loading}>Cargando documentos...</p>
      ) : currentData.length === 0 ? (
        <Card variant="neumorphic" className={styles.emptyCard}>
          <p>No hay documentos de este tipo. ¡Creá el primero!</p>
        </Card>
      ) : (
        <div className={styles.docList}>
          {currentData.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="glass" className={styles.docCard}>
                <div className={styles.docInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 className={styles.docTitle}>{doc.titulo}</h3>
                    {activeTab === 'presupuestos' && (doc as any).codigo && (
                      <span className={styles.version}>{(doc as any).codigo}</span>
                    )}
                  </div>
                  <div className={styles.docMeta}>
                    {activeTab === 'presupuestos' && (
                      <>
                        {((doc as any).estado === 'aceptado' && <span className={`${styles.statusBadge} ${styles.statusAceptado}`}>✅ Aceptado</span>) ||
                         ((doc as any).estado === 'compartido' && <span className={`${styles.statusBadge} ${styles.statusCompartido}`}>📤 Compartido</span>) ||
                         ((doc as any).estado === 'visto' && <span className={`${styles.statusBadge} ${styles.statusVisto}`}>👁️ Visto</span>) ||
                         <span className={`${styles.statusBadge} ${styles.statusEnviado}`}>🟡 Enviado</span>}
                        <span className={styles.dot}>·</span>
                      </>
                    )}
                    {doc.consorcios && (
                      <span>{(doc.consorcios as any).nombre}</span>
                    )}
                    <span className={styles.dot}>·</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('es-AR')}</span>
                    <span className={styles.dot}>·</span>
                    <span className={styles.version}>v{doc.version}</span>
                  </div>
                </div>

                {/* ── Acciones ── */}
                <AnimatePresence mode="wait">
                  {deletingId === doc.id ? (
                    /* Confirmación de eliminación */
                    <motion.div
                      key="confirm"
                      className={styles.deleteConfirm}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className={styles.confirmText}>¿Eliminar?</span>
                      <button
                        className={`${styles.actionBtn} ${styles.btnConfirmYes}`}
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                        title="Confirmar"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.btnConfirmNo}`}
                        onClick={() => setDeletingId(null)}
                        title="Cancelar"
                      >
                        <X size={15} />
                      </button>
                    </motion.div>
                  ) : (
                    /* Botones normales */
                    <motion.div
                      key="actions"
                      className={styles.docActions}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* PDF Download */}
                      {activeTab === 'reportes' && (
                        <PDFDownloadLink
                          document={<ReportePDF reporte={doc as any} />}
                          fileName={`${doc.titulo}.pdf`}
                          className={`${styles.actionBtn} ${styles.btnDownload}`}
                          title="Descargar PDF"
                        >
                          {/* @ts-ignore */}
                          {({ loading }) => loading ? '...' : <Download size={15} />}
                        </PDFDownloadLink>
                      )}
                      {activeTab === 'presupuestos' && (
                        <PDFDownloadLink
                          document={<PresupuestoPDF presupuesto={doc as any} />}
                          fileName={`${doc.titulo}.pdf`}
                          className={`${styles.actionBtn} ${styles.btnDownload}`}
                          title="Descargar PDF"
                        >
                          {/* @ts-ignore */}
                          {({ loading }) => loading ? '...' : <Download size={15} />}
                        </PDFDownloadLink>
                      )}
                      {activeTab === 'instructivos' && (
                        <PDFDownloadLink
                          document={<InstructivoPDF instructivo={doc as any} />}
                          fileName={`${doc.titulo}.pdf`}
                          className={`${styles.actionBtn} ${styles.btnDownload}`}
                          title="Descargar PDF"
                        >
                          {/* @ts-ignore */}
                          {({ loading }) => loading ? '...' : <Download size={15} />}
                        </PDFDownloadLink>
                      )}

                      {/* Copiar link */}
                      <button
                        className={`${styles.actionBtn} ${styles.btnCopy} ${copiedId === doc.id ? styles.btnCopied : ''}`}
                        onClick={() => handleCopyLink(doc.public_id, doc.id)}
                        title="Copiar enlace público"
                      >
                        {copiedId === doc.id ? <Check size={15} /> : <Copy size={15} />}
                      </button>

                      {/* Ver link público */}
                      <a
                        href={`/p/${getPublicSlug()}/${doc.public_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.btnLink}`}
                        title="Ver enlace público"
                      >
                        <ExternalLink size={15} />
                      </a>

                      <div className={styles.actionsDivider} />

                      {/* Editar */}
                      <button
                        className={`${styles.actionBtn} ${styles.btnEdit}`}
                        onClick={() => handleEdit(doc.id)}
                        title="Editar"
                      >
                        <Edit size={15} />
                      </button>

                      {/* Eliminar */}
                      <button
                        className={`${styles.actionBtn} ${styles.btnDelete}`}
                        onClick={() => setDeletingId(doc.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
