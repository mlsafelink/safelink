import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reporteService, presupuestoService, instructivoService } from '@/services/documentService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { FileText, ClipboardList, BookOpen, Plus, ExternalLink, Edit, Copy, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportePDF, PresupuestoPDF, InstructivoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './DocumentPage.module.css';
import { ReporteForm } from './ReporteForm';
import { PresupuestoForm } from './PresupuestoForm';
import { InstructivoForm } from './InstructivoForm';

type ActiveTab = 'reportes' | 'presupuestos' | 'instructivos';
type ViewMode = 'list' | 'form';

export function DocumentPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reportes');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleNew = () => { setEditingId(null); setViewMode('form'); };
  const handleEdit = (id: string) => { setEditingId(id); setViewMode('form'); };
  const handleBack = () => { setEditingId(null); setViewMode('list'); };

  const copyPublicLink = (publicId: string) => {
    const url = `${window.location.origin}/p/${activeTab.slice(0, -1)}/${publicId}`;
    navigator.clipboard.writeText(url);
  };

  // Mostrar formularios
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
            onClick={() => { setActiveTab(tab.id); setViewMode('list'); }}
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
                  <h3 className={styles.docTitle}>{doc.titulo}</h3>
                  <div className={styles.docMeta}>
                    {doc.consorcios && (
                      <span>{(doc.consorcios as any).nombre}</span>
                    )}
                    <span className={styles.dot}>·</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('es-AR')}</span>
                    <span className={styles.dot}>·</span>
                    <span className={styles.version}>v{doc.version}</span>
                  </div>
                </div>
                <div className={styles.docActions}>
                  {activeTab === 'reportes' && (
                    <PDFDownloadLink document={<ReportePDF reporte={doc as any} />} fileName={`${doc.titulo}.pdf`} className={styles.actionBtn} title="Descargar PDF">
                      {/* @ts-ignore */}
                      {({ loading }) => (loading ? '...' : <Download size={16} />)}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'presupuestos' && (
                    <PDFDownloadLink document={<PresupuestoPDF presupuesto={doc as any} />} fileName={`${doc.titulo}.pdf`} className={styles.actionBtn} title="Descargar PDF">
                      {/* @ts-ignore */}
                      {({ loading }) => (loading ? '...' : <Download size={16} />)}
                    </PDFDownloadLink>
                  )}
                  {activeTab === 'instructivos' && (
                    <PDFDownloadLink document={<InstructivoPDF instructivo={doc as any} />} fileName={`${doc.titulo}.pdf`} className={styles.actionBtn} title="Descargar PDF">
                      {/* @ts-ignore */}
                      {({ loading }) => (loading ? '...' : <Download size={16} />)}
                    </PDFDownloadLink>
                  )}
                  <button
                    className={styles.actionBtn}
                    onClick={() => copyPublicLink(doc.public_id)}
                    title="Copiar enlace público"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={`/p/${activeTab.slice(0, -1)}/${doc.public_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionBtn}
                    title="Ver enlace público"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleEdit(doc.id)}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
