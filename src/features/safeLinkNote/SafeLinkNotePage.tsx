import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { safeLinkNoteService, type SlnFile } from '@/services/safeLinkNoteService';
import { relevamientoService, type Relevamiento } from '@/services/relevamientoService';
import { useSafeLinkNote } from './SafeLinkNoteContext';
import {
  FileArchive,
  Download,
  Clock,
  Loader2,
  Bot,
  X,
  Send,
  Plus,
  History,
  AlertCircle,
  Cpu,
  ChevronRight,
  FileText,
  MapPin,
  User,
  Trash2,
  CheckCircle2,
  Camera,
  Network,
  Lightbulb,
  Zap,
  Calendar,
} from 'lucide-react';
import styles from './SafeLinkNotePage.module.css';

// ── Formateo de fecha y hora ───────────────────────────────────────
function formatDate(isoDate: string | null) {
  if (!isoDate) return { fecha: 'Fecha desconocida', hora: '' };
  try {
    const d = new Date(isoDate);
    return {
      fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { fecha: isoDate, hora: '' };
  }
}

// ── Tipos de trabajo e iconos ──────────────────────────────────────
const TIPOS_INFO: Record<string, { label: string; icon: typeof Camera; classBox: string; classTag: string }> = {
  CAMARAS:      { label: 'Cámaras',      icon: Camera,    classBox: styles.typeCamaras,      classTag: styles.tagCamaras },
  REDES:        { label: 'Redes',        icon: Network,   classBox: styles.typeRedes,        classTag: styles.tagRedes },
  ILUMINACION:  { label: 'Iluminación',  icon: Lightbulb, classBox: styles.typeIluminacion,  classTag: styles.tagIluminacion },
  ELECTRICIDAD: { label: 'Electricidad', icon: Zap,       classBox: styles.typeElectricidad, classTag: styles.tagElectricidad },
  OTRO:         { label: 'Otro',         icon: FileText,  classBox: styles.typeOtro,         classTag: styles.tagOtro },
};

function getPrimaryWorkTypeInfo(tipos: string[]) {
  if (!tipos || tipos.length === 0) {
    return { label: 'Relevamiento', icon: FileText, classBox: styles.typeOtro, classTag: styles.tagOtro };
  }
  const first = tipos[0].toUpperCase();
  return TIPOS_INFO[first] || { label: tipos[0], icon: FileText, classBox: styles.typeOtro, classTag: styles.tagOtro };
}

// ── Tarjeta de Relevamiento Grande Horizontal ──────────────────────
function RelevamientoCardLarge({
  rel,
  isExpanded,
  onToggleExpand,
  onDelete,
}: {
  rel: Relevamiento;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { fecha, hora } = formatDate(rel.created_at);
  const primaryType = getPrimaryWorkTypeInfo(rel.tipos_trabajo);
  const IconComponent = primaryType.icon;

  const isFinalizado = rel.estado === 'FINALIZADO';
  const isPendiente = rel.estado === 'PENDIENTE';

  return (
    <div className={`${styles.relCardWrapper} ${isExpanded ? styles.relCardWrapperExpanded : ''}`}>
      <div className={styles.relCard} onClick={onToggleExpand}>
        {/* Columna Izquierda: Icono tintado + Información */}
        <div className={styles.relCardLeft}>
          <div className={`${styles.relTypeIconBox} ${primaryType.classBox}`}>
            <IconComponent size={24} />
          </div>

          <div className={styles.relInfo}>
            <span className={styles.relCliente}>
              {rel.cliente?.trim() || 'Cliente / Lugar sin nombre'}
            </span>

            <div className={styles.relMetaRow}>
              {rel.direccion && (
                <div className={styles.relMetaItem}>
                  <MapPin size={13} />
                  <span>{rel.direccion}</span>
                </div>
              )}
              {rel.contacto && (
                <>
                  {rel.direccion && <span className={styles.relMetaDot}>•</span>}
                  <div className={styles.relMetaItem}>
                    <User size={13} />
                    <span>{rel.contacto}</span>
                  </div>
                </>
              )}
            </div>

            {/* Chips de tipo de trabajo */}
            {rel.tipos_trabajo && rel.tipos_trabajo.length > 0 && (
              <div className={styles.relTags}>
                {rel.tipos_trabajo.map(t => {
                  const info = TIPOS_INFO[t.toUpperCase()] || { label: t, classTag: styles.tagOtro };
                  return (
                    <span key={t} className={`${styles.relTagPill} ${info.classTag}`}>
                      {info.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Estado + Fecha + Chevron */}
        <div className={styles.relCardRight}>
          <div className={styles.relRightMeta}>
            <span
              className={`${styles.relStatusBadge} ${
                isFinalizado ? styles.statusFinalizado : isPendiente ? styles.statusPendiente : styles.statusEnProceso
              }`}
            >
              {isFinalizado ? <CheckCircle2 size={12} /> : isPendiente ? <AlertCircle size={12} /> : <Clock size={12} />}
              {rel.estado}
            </span>

            <div className={styles.relDateTime}>
              <Calendar size={13} />
              <span>{fecha}</span>
              {hora && <span>{hora}</span>}
            </div>
          </div>

          <ChevronRight size={18} className={styles.relArrow} />
        </div>
      </div>

      {/* Detalle desplegable al hacer clic */}
      {isExpanded && (
        <div className={styles.relExpandedBody} onClick={e => e.stopPropagation()}>
          {rel.observaciones && (
            <div className={styles.relExpandedObs}>
              "{rel.observaciones}"
            </div>
          )}

          {rel.materiales && rel.materiales.length > 0 && (
            <div className={styles.relMaterialsGroup}>
              <span className={styles.relMaterialsTitle}>Materiales / Equipos relevados:</span>
              {rel.materiales.map(m => (
                <div key={m.id} className={styles.relMaterialRow}>
                  <span>• {m.nombre} (cant: {m.cantidad}{m.observacion ? ` - ${m.observacion}` : ''})</span>
                  {m.costo && <strong>${m.costo}</strong>}
                </div>
              ))}
            </div>
          )}

          <div className={styles.relActionsRow}>
            {rel.fotos && rel.fotos.length > 0 && (
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginRight: 'auto' }}>
                📷 {rel.fotos.length} fotografía{rel.fotos.length !== 1 ? 's' : ''} adjunta{rel.fotos.length !== 1 ? 's' : ''}
              </span>
            )}

            <button
              className={styles.deleteBtn}
              onClick={onDelete}
              title="Eliminar este relevamiento"
            >
              <Trash2 size={13} />
              Eliminar relevamiento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de archivo .SLN del bucket ──────────────────────────────
function SlnCard({
  file,
  onOpenNathuliaModal,
}: {
  file: SlnFile;
  onOpenNathuliaModal: (file: SlnFile) => void;
}) {
  const code = file.name.replace(/\.sln$/i, '');
  const dateSource = file.created_at ?? file.updated_at;
  const { fecha, hora } = formatDate(dateSource);

  const handleDownload = async () => {
    const url = await safeLinkNoteService.getDownloadUrl(file.name);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className={styles.slnCard}>
      <div className={styles.slnCardLeft}>
        <div className={styles.slnIcon}>
          <FileArchive size={20} />
        </div>
        <div className={styles.slnInfo}>
          <span className={styles.slnCode}>{code}</span>
          <span className={styles.slnName}>{file.name}</span>
          <span className={styles.slnDate}>
            <Clock size={11} />
            {fecha}{hora ? ` · ${hora} hs.` : ''}
          </span>
        </div>
      </div>
      <div className={styles.slnActions}>
        <button className={styles.slnActionBtn} onClick={handleDownload} title="Descargar">
          <Download size={15} />
        </button>
        <button
          className={`${styles.slnActionBtn} ${styles.slnActionBtnIA}`}
          onClick={() => onOpenNathuliaModal(file)}
          title="Enviar a Nathulia IA"
        >
          <Bot size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Componente Principal SafeLinkNotePage ──────────────────────────
export function SafeLinkNotePage() {
  const { files, isLoading: isLoadingFiles, markAsRead } = useSafeLinkNote();
  const navigate = useNavigate();
  const slnSectionRef = useRef<HTMLDivElement>(null);

  // Relevamientos guardados en Supabase
  const [relevamientos, setRelevamientos] = useState<Relevamiento[]>([]);
  const [loadingRelevamientos, setLoadingRelevamientos] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendientes' | 'historial'>('todos');
  const [expandedRelId, setExpandedRelId] = useState<string | null>(null);

  // Modal Nathulia
  const [selectedFileForNathulia, setSelectedFileForNathulia] = useState<SlnFile | null>(null);
  const [promptText, setPromptText] = useState('');

  const cargarRelevamientos = async () => {
    setLoadingRelevamientos(true);
    try {
      const data = await relevamientoService.listar();
      setRelevamientos(data);
    } catch (err) {
      console.error('[SafeLinkNotePage] Error cargando relevamientos:', err);
    } finally {
      setLoadingRelevamientos(false);
    }
  };

  useEffect(() => {
    markAsRead();
    cargarRelevamientos();
  }, [markAsRead]);

  // Listas filtradas
  const pendientesList = useMemo(() => relevamientos.filter(r => r.estado === 'PENDIENTE'), [relevamientos]);
  const finalizadosList = useMemo(() => relevamientos.filter(r => r.estado === 'FINALIZADO'), [relevamientos]);

  const relevamientosMostrados = useMemo(() => {
    if (activeFilter === 'pendientes') return pendientesList;
    if (activeFilter === 'historial') return finalizadosList;
    return relevamientos;
  }, [activeFilter, relevamientos, pendientesList, finalizadosList]);

  // Manejo de eliminación
  const handleEliminarRelevamiento = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este relevamiento técnico de Supabase?')) return;
    try {
      await relevamientoService.eliminar(id);
      setRelevamientos(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('No se pudo eliminar el relevamiento.');
    }
  };

  // Enviar a Nathulia IA
  const handleSendToNathulia = () => {
    if (!selectedFileForNathulia) return;
    const file = selectedFileForNathulia;
    const prompt = promptText;
    setSelectedFileForNathulia(null);
    setPromptText('');
    navigate('/safelink-ia', {
      state: {
        slnFile: file.name,
        prompt: prompt.trim() || `Analizar relevamiento de archivo ${file.name} y redactar borrador técnico.`,
      },
    });
  };

  return (
    <div className={styles.page}>

      {/* ── 1. ENCABEZADO DEL MÓDULO ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBox}>
            <FileText size={24} />
          </div>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerBrand}>
              <span className={styles.brandSafe}>SafeLink</span>
              <span className={styles.brandNote}>Note</span>
            </div>
            <p className={styles.headerSub}>Relevamientos técnicos</p>
          </div>
        </div>
      </div>

      {/* ── 2. ACCIÓN PRINCIPAL (HERO CARD) ── */}
      <Link to="/safelink-note/nuevo" className={styles.heroAction}>
        <div className={styles.heroLeft}>
          <div className={styles.heroIconCircle}>
            <Plus size={22} />
          </div>
          <div className={styles.heroText}>
            <span className={styles.heroTitle}>+ NUEVO RELEVAMIENTO</span>
            <span className={styles.heroSub}>Crear un nuevo relevamiento técnico</span>
          </div>
        </div>
        <ChevronRight size={22} className={styles.heroArrow} />
      </Link>

      {/* ── 3. TARJETAS DE RESUMEN (4 COLUMNAS) ── */}
      <div className={styles.summaryGrid}>
        {/* Tarjeta 1: HISTORIAL */}
        <div
          className={`${styles.summaryCard} ${activeFilter === 'historial' ? styles.summaryCardActive : ''}`}
          onClick={() => setActiveFilter(prev => prev === 'historial' ? 'todos' : 'historial')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.summaryTop}>
            <div className={styles.summaryIconBox}>
              <History size={18} />
            </div>
            <span className={styles.summaryTitle}>HISTORIAL</span>
          </div>
          <div className={styles.summaryValue}>{finalizadosList.length}</div>
          <div className={styles.summaryBottom}>
            <span>relevamientos</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Tarjeta 2: PENDIENTES */}
        <div
          className={`${styles.summaryCard} ${activeFilter === 'pendientes' ? styles.summaryCardActive : ''}`}
          onClick={() => setActiveFilter(prev => prev === 'pendientes' ? 'todos' : 'pendientes')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.summaryTop}>
            <div className={styles.summaryIconBox}>
              <AlertCircle size={18} />
            </div>
            <span className={styles.summaryTitle}>PENDIENTES</span>
          </div>
          <div className={styles.summaryValue}>{pendientesList.length}</div>
          <div className={styles.summaryBottom}>
            <span>relevamientos</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Tarjeta 3: ARCHIVOS .SLN */}
        <div
          className={styles.summaryCard}
          onClick={() => slnSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          role="button"
          tabIndex={0}
        >
          <div className={styles.summaryTop}>
            <div className={styles.summaryIconBox}>
              <FileArchive size={18} />
            </div>
            <span className={styles.summaryTitle}>ARCHIVOS .SLN</span>
          </div>
          <div className={styles.summaryValue}>{files.length}</div>
          <div className={styles.summaryBottom}>
            <span>archivos recibidos</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Tarjeta 4: PROCESAMIENTO IA */}
        <div
          className={styles.summaryCard}
          onClick={() => navigate('/safelink-ia')}
          role="button"
          tabIndex={0}
        >
          <div className={styles.summaryTop}>
            <div className={`${styles.summaryIconBox} ${styles.summaryIconBoxPurple}`}>
              <Cpu size={18} />
            </div>
            <span className={styles.summaryTitle}>PROCESAMIENTO IA</span>
          </div>
          <div className={styles.summaryValue}>0</div>
          <div className={`${styles.summaryBottom} ${styles.summaryBottomPurple}`}>
            <span>en proceso</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* ── 4. SECCIÓN: ÚLTIMOS RELEVAMIENTOS ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Últimos relevamientos</h2>
          <div className={styles.sectionActions}>
            {activeFilter !== 'todos' && (
              <span className={styles.filterBadgeActive}>
                Filtro: {activeFilter}
              </span>
            )}
            <button
              className={styles.viewAllBtn}
              onClick={() => setActiveFilter('todos')}
            >
              <span>Ver todos</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {loadingRelevamientos ? (
          <div className={styles.loadingRow}>
            <Loader2 size={20} className={styles.spinner} />
            <span>Cargando relevamientos técnicos…</span>
          </div>
        ) : relevamientosMostrados.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={36} className={styles.emptyIcon} />
            <p>
              {activeFilter === 'pendientes'
                ? 'No tenés relevamientos pendientes.'
                : activeFilter === 'historial'
                ? 'No tenés relevamientos en el historial.'
                : 'No hay relevamientos cargados todavía.'}
            </p>
            <span>Tocá el botón <strong>+ NUEVO RELEVAMIENTO</strong> para cargar el primero.</span>
          </div>
        ) : (
          <div className={styles.relList}>
            {relevamientosMostrados.map(rel => (
              <RelevamientoCardLarge
                key={rel.id}
                rel={rel}
                isExpanded={expandedRelId === rel.id}
                onToggleExpand={() => setExpandedRelId(prev => prev === rel.id ? null : rel.id)}
                onDelete={(e) => handleEliminarRelevamiento(rel.id, e)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 5. SECCIÓN: ARCHIVOS .SLN DEL BUCKET ── */}
      <section className={styles.section} ref={slnSectionRef}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1rem', color: '#94a3b8' }}>
            Archivos .SLN recibidos ({files.length})
          </h2>
        </div>

        {isLoadingFiles ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} />
            <span>Cargando archivos del bucket…</span>
          </div>
        ) : files.length === 0 ? (
          <div className={styles.emptyCard} style={{ padding: '2rem 1rem' }}>
            <FileArchive size={30} className={styles.emptyIcon} />
            <p>No hay archivos <strong>.sln</strong> en el bucket todavía.</p>
            <span>Aparecerán aquí automáticamente cuando sean subidos desde la app móvil.</span>
          </div>
        ) : (
          <div className={styles.slnList}>
            {files.map(file => (
              <SlnCard
                key={file.id ?? file.name}
                file={file}
                onOpenNathuliaModal={f => setSelectedFileForNathulia(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 6. SECCIÓN: PROCESAMIENTO IA LINK ── */}
      <section className={styles.section}>
        <button
          className={styles.iaLinkBtn}
          onClick={() => navigate('/safelink-ia')}
        >
          <Bot size={20} className={styles.iaLinkIcon} />
          <div>
            <strong>Nathulia IA</strong>
            <span>Generar documentos técnicos y presupuestos desde relevamientos</span>
          </div>
          <ChevronRight size={18} className={styles.iaLinkArrow} />
        </button>
      </section>

      {/* ── 7. MODAL: ENVIAR A NATHULIA IA ── */}
      {selectedFileForNathulia && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFileForNathulia(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBox}>
                <div className={styles.nathuliaIconBox}>
                  <Bot size={20} />
                </div>
                <div>
                  <h3>Enviar a Nathulia IA</h3>
                  <p>Asistente virtual de documentación SafeLink</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedFileForNathulia(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.fileInfoBanner}>
                <FileArchive size={18} className={styles.bannerIcon} />
                <div>
                  <span className={styles.bannerLabel}>Archivo seleccionado:</span>
                  <span className={styles.bannerFileName}>{selectedFileForNathulia.name}</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Observaciones o prompt (opcional):</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Ej: Generar presupuesto a partir del relevamiento en este archivo .sln..."
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setSelectedFileForNathulia(null)}>
                Cancelar
              </button>
              <button className={styles.submitBtn} onClick={handleSendToNathulia}>
                <Send size={15} />
                <span>Enviar a Nathulia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
