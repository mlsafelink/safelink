import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteService, presupuestoService, instructivoService, reporteTrabajoService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import {
  FileText, ClipboardList, BookOpen, Plus, ExternalLink,
  Edit, Copy, Download, Trash2, Check, X, Wrench, Eye, History,
  Search, Filter, ArrowUpDown, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pdf } from '@react-pdf/renderer';
import { ReportePDF, PresupuestoPDF, InstructivoPDF, ReporteTrabajoPDF } from '@/components/pdf/DocumentPDFs';
import styles from './DocumentPage.module.css';
import { ReporteForm } from './ReporteForm';
import { PresupuestoForm } from './PresupuestoForm';
import { InstructivoForm } from './InstructivoForm';
import { ReporteTrabajoForm } from './ReporteTrabajoForm';
import { ReporteHistorialModal } from './components/ReporteHistorialModal';
import { copyToClipboard } from '@/utils/clipboard';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

/** Botón de descarga PDF completamente lazy: genera el blob solo al hacer click */
function LazyPdfDownload({ document: doc, fileName }: { document: ReactElement<DocumentProps>; fileName: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generando PDF:', e);
    } finally {
      setLoading(false);
    }
  }, [doc, fileName, loading]);
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${styles.actionBtn} ${styles.btnDownload}`}
      title="Descargar PDF"
    >
      {loading ? '...' : <Download size={15} />}
    </button>
  );
}

type ActiveTab = 'reportes' | 'presupuestos' | 'instructivos' | 'reportes_trabajo';
type ViewMode = 'list' | 'form';

export function DocumentPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const initialEditId = searchParams.get('edit');
  const initialTab = (searchParams.get('tab') as ActiveTab) || 'reportes';

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>(initialEditId ? 'form' : 'list');
  const [editingId, setEditingId] = useState<string | null>(initialEditId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historialReporte, setHistorialReporte] = useState<any | null>(null);

  // Filtros y ordenamiento
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [ordenFecha, setOrdenFecha] = useState<'desc' | 'asc'>('desc');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  useEffect(() => {
    const editParam = searchParams.get('edit');
    const tabParam = searchParams.get('tab') as ActiveTab | null;
    if (editParam) {
      if (tabParam) setActiveTab(tabParam);
      setEditingId(editParam);
      setViewMode('form');
    }
  }, [searchParams]);

  // Consultas de datos
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios-documentos'],
    queryFn: () => consorcioService.getAll(),
  });

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

  const { data: reportesTrabajo = [], isLoading: loadingReportesTrabajo } = useQuery({
    queryKey: ['reportes_trabajo'],
    queryFn: reporteTrabajoService.getAll,
    enabled: activeTab === 'reportes_trabajo',
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (activeTab === 'reportes') return reporteService.delete(id);
      if (activeTab === 'presupuestos') return presupuestoService.delete(id);
      if (activeTab === 'reportes_trabajo') return reporteTrabajoService.delete(id);
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

  const getDocPublicIdentifier = (doc: any) => {
    if (doc.public_slug) {
      return doc.public_slug;
    }
    return doc.public_id;
  };

  const handleCopyLink = async (doc: any) => {
    const slug = activeTab === 'instructivos' ? 'instructivo'
      : activeTab === 'presupuestos' ? 'presupuesto'
      : activeTab === 'reportes_trabajo' ? 'reporte-trabajo'
      : 'reporte';
    const identifier = getDocPublicIdentifier(doc);
    const url = `${window.location.origin}/p/${slug}/${identifier}`;
    await copyToClipboard(url);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPublicSlug = () =>
    activeTab === 'instructivos' ? 'instructivo'
    : activeTab === 'presupuestos' ? 'presupuesto'
    : activeTab === 'reportes_trabajo' ? 'reporte-trabajo'
    : 'reporte';

  const isLoading = loadingReportes || loadingPresupuestos || loadingInstructivos || loadingReportesTrabajo;

  const currentData =
    activeTab === 'reportes' ? reportes :
    activeTab === 'presupuestos' ? presupuestos :
    activeTab === 'reportes_trabajo' ? reportesTrabajo :
    instructivos;

  // Lista unificada de clientes para el filtro
  const clientesOptions = useMemo(() => {
    const map = new Map<string, string>();
    consorcios.forEach(c => {
      if (c.nombre) map.set(c.id, c.nombre);
    });
    currentData.forEach((doc: any) => {
      if (doc.consorcios?.id && doc.consorcios?.nombre) {
        map.set(doc.consorcios.id, doc.consorcios.nombre);
      } else if (doc.cliente_nombre) {
        map.set(doc.cliente_nombre, doc.cliente_nombre);
      }
    });
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [consorcios, currentData]);

  // Aplicación reactiva de filtros y ordenamiento
  const filteredData = useMemo(() => {
    let list = [...currentData];

    // 1. Filtro por cliente
    if (filtroCliente) {
      list = list.filter((doc: any) => {
        const docConsorcioId = doc.consorcio_id || doc.consorcios?.id;
        const docClienteNombre = doc.cliente_nombre || doc.consorcios?.nombre;
        return docConsorcioId === filtroCliente || docClienteNombre === filtroCliente;
      });
    }

    // 2. Filtro por búsqueda de texto
    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase().trim();
      list = list.filter((doc: any) => {
        const titulo = (doc.titulo || '').toLowerCase();
        const codigo = (doc.codigo || '').toLowerCase();
        const slug = (doc.public_slug || '').toLowerCase();
        const cliente = (doc.consorcios?.nombre || doc.cliente_nombre || '').toLowerCase();
        return titulo.includes(q) || codigo.includes(q) || slug.includes(q) || cliente.includes(q);
      });
    }

    // 3. Ordenamiento por fecha
    list.sort((a: any, b: any) => {
      const timeA = new Date(a.fecha || a.created_at || 0).getTime();
      const timeB = new Date(b.fecha || b.created_at || 0).getTime();
      return ordenFecha === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [currentData, filtroCliente, busquedaTexto, ordenFecha]);

  const hasActiveFilters = filtroCliente !== '' || ordenFecha !== 'desc' || busquedaTexto !== '';

  const handleClearFilters = () => {
    setFiltroCliente('');
    setOrdenFecha('desc');
    setBusquedaTexto('');
  };

  const tabConfig: { id: ActiveTab; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'reportes', label: 'Propuestas Técnicas', icon: ClipboardList, color: '#d69e2e' },
    { id: 'presupuestos', label: 'Presupuestos', icon: FileText, color: '#805ad5' },
    { id: 'instructivos', label: 'Instructivos', icon: BookOpen, color: '#e53e3e' },
    { id: 'reportes_trabajo', label: 'Informes de Trabajos Realizados', icon: Wrench, color: '#10b981' },
  ];

  if (viewMode === 'form') {
    if (activeTab === 'reportes') return <ReporteForm onBack={handleBack} editingId={editingId} />;
    if (activeTab === 'presupuestos') return <PresupuestoForm onBack={handleBack} editingId={editingId} />;
    if (activeTab === 'instructivos') return <InstructivoForm onBack={handleBack} editingId={editingId} />;
    if (activeTab === 'reportes_trabajo') return <ReporteTrabajoForm onBack={handleBack} editingId={editingId} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Documentos</h1>
          <p>Administrá propuestas técnicas, presupuestos, instructivos e informes de trabajos realizados</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleNew}>
          {activeTab === 'reportes' ? 'Nueva Propuesta Técnica' :
           activeTab === 'reportes_trabajo' ? 'Nuevo Informe de Trabajos' :
           activeTab === 'presupuestos' ? 'Nuevo Presupuesto' :
           'Nuevo Instructivo'}
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

      {/* ── BARRA DE FILTROS Y ORDENAMIENTO ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterControls}>
          {/* Filtro por cliente */}
          <div className={styles.filterItem}>
            <Filter size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <label className={styles.filterLabel}>Cliente:</label>
            <select
              value={filtroCliente}
              onChange={e => setFiltroCliente(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">Todos los clientes</option>
              {clientesOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenamiento por fecha */}
          <div className={styles.filterItem}>
            <ArrowUpDown size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
            <label className={styles.filterLabel}>Fecha:</label>
            <select
              value={ordenFecha}
              onChange={e => setOrdenFecha(e.target.value as 'desc' | 'asc')}
              className={styles.filterSelect}
              style={{ minWidth: 160 }}
            >
              <option value="desc">Más recientes primero</option>
              <option value="asc">Más antiguos primero</option>
            </select>
          </div>

          {/* Buscador de texto */}
          <div className={styles.filterSearchWrap}>
            <Search size={15} style={{ color: '#64748b' }} />
            <input
              type="text"
              placeholder="Buscar por título, código o cliente..."
              value={busquedaTexto}
              onChange={e => setBusquedaTexto(e.target.value)}
              className={styles.filterSearchInput}
            />
            {busquedaTexto && (
              <button
                type="button"
                onClick={() => setBusquedaTexto('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterActions}>
          <span className={styles.filterCountBadge}>
            {filteredData.length} {filteredData.length === 1 ? 'documento' : 'documentos'}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFilterBtn}
              onClick={handleClearFilters}
              title="Restablecer filtros de búsqueda"
            >
              <RotateCcw size={13} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className={styles.loading}>Cargando documentos...</p>
      ) : filteredData.length === 0 ? (
        <Card variant="neumorphic" className={styles.emptyCard}>
          {hasActiveFilters ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>No se encontraron documentos con los filtros seleccionados.</p>
              <button
                type="button"
                className={styles.clearFilterBtn}
                onClick={handleClearFilters}
                style={{ margin: '0 auto' }}
              >
                <RotateCcw size={13} />
                Quitar filtros
              </button>
            </div>
          ) : (
            <p>
              No hay {activeTab === 'reportes' ? 'propuestas técnicas' : activeTab === 'reportes_trabajo' ? 'informes de trabajos' : activeTab === 'presupuestos' ? 'presupuestos' : 'instructivos'}. ¡Creá el primero!
            </p>
          )}
        </Card>
      ) : (
        <div className={styles.docList}>
          {filteredData.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="glass" className={styles.docCard}>
                <div className={styles.docInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 className={styles.docTitle}>{doc.titulo}</h3>
                    {(doc as any).codigo && (
                      <span className={styles.version}>{(doc as any).codigo}</span>
                    )}
                    {(doc as any).public_slug && (
                      <span
                        className={styles.version}
                        style={{
                          background: 'rgba(49, 130, 206, 0.08)',
                          color: '#2b6cb0',
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                        }}
                        title="Enlace público personalizado"
                      >
                        /{(doc as any).public_slug}
                      </span>
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
                      {/* PDF Download - lazy para evitar Buffer error */}
                      {activeTab === 'reportes' && (
                        <LazyPdfDownload
                          document={<ReportePDF reporte={doc as any} />}
                          fileName={`SafeLink_PropuestaTecnica_${(doc as any).codigo || doc.titulo}.pdf`}
                        />
                      )}
                      {activeTab === 'presupuestos' && (
                        <LazyPdfDownload
                          document={<PresupuestoPDF presupuesto={doc as any} />}
                          fileName={`${doc.titulo}.pdf`}
                        />
                      )}
                      {activeTab === 'instructivos' && (
                        <LazyPdfDownload
                          document={<InstructivoPDF instructivo={doc as any} />}
                          fileName={`${doc.titulo}.pdf`}
                        />
                      )}
                      {activeTab === 'reportes_trabajo' && (
                        <LazyPdfDownload
                          document={<ReporteTrabajoPDF reporte={doc as any} />}
                          fileName={`SafeLink_InformeTrabajo_${(doc as any).codigo || doc.titulo}.pdf`}
                        />
                      )}

                      {/* Copiar link */}
                      <button
                        className={`${styles.actionBtn} ${styles.btnCopy} ${copiedId === doc.id ? styles.btnCopied : ''}`}
                        onClick={() => handleCopyLink(doc)}
                        title="Copiar enlace público"
                      >
                        {copiedId === doc.id ? <Check size={15} /> : <Copy size={15} />}
                      </button>

                      {/* Ver link público */}
                      <a
                        href={`/p/${getPublicSlug()}/${getDocPublicIdentifier(doc)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.btnLink}`}
                        title="Ver enlace público"
                      >
                        <ExternalLink size={15} />
                      </a>

                      <div className={styles.actionsDivider} />

                      {/* Historial de versiones y conformidad (solo propuestas técnicas) */}
                      {activeTab === 'reportes' && (
                        <button
                          className={`${styles.actionBtn} ${styles.btnHistory}`}
                          onClick={() => setHistorialReporte(doc)}
                          title="Historial de versiones y conformidad de la propuesta técnica"
                        >
                          <History size={15} />
                        </button>
                      )}

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

                      <div className={styles.actionsDivider} />

                      {/* Contador de accesos públicos */}
                      <div
                        className={`${styles.actionBtn} ${styles.btnCounter}`}
                        title="Cantidad de accesos al enlace público"
                      >
                        <Eye size={13} className={styles.counterIcon} />
                        <span className={styles.counterValue}>{(doc as any).access_count ?? 0}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {historialReporte && (
        <ReporteHistorialModal
          isOpen={!!historialReporte}
          onClose={() => setHistorialReporte(null)}
          reporteId={historialReporte.id}
          reporteTitulo={historialReporte.titulo}
          reporteCodigo={historialReporte.codigo}
        />
      )}
    </div>
  );
}
