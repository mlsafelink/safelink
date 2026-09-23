import { useState, useEffect, useMemo } from 'react';
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
  StickyNote,
  FileText,
  MapPin,
  Phone,
  Camera,
  Package,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import styles from './SafeLinkNotePage.module.css';

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

const TIPOS_MAP: Record<string, { label: string; emoji: string }> = {
  CAMARAS:      { label: 'Cámaras',      emoji: '📷' },
  REDES:        { label: 'Redes',         emoji: '🌐' },
  ILUMINACION:  { label: 'Iluminación',   emoji: '💡' },
  ELECTRICIDAD: { label: 'Electricidad',  emoji: '⚡' },
  OTRO:         { label: 'Otro',          emoji: '🔧' },
};

function RelevamientoCard({
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
  const isFinalizado = rel.estado === 'FINALIZADO';

  return (
    <div className={styles.relCard} onClick={onToggleExpand}>
      <div className={styles.relHeader}>
        <div className={styles.relClienteBox}>
          <span className={styles.relCliente}>
            {rel.cliente?.trim() || 'Sin nombre de cliente'}
          </span>
          <span className={styles.relDate}>
            <Clock size={11} />
            {fecha}{hora ? ` · ${hora} hs.` : ''}
          </span>
        </div>
        <span className={isFinalizado ? styles.relBadgeFinalizado : styles.relBadgePendiente}>
          {isFinalizado ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {rel.estado}
        </span>
      </div>

      <div className={styles.relDetails}>
        {rel.direccion && (
          <div className={styles.relDetailRow}>
            <MapPin size={13} className={styles.relDetailIcon} />
            <span>{rel.direccion}</span>
          </div>
        )}
        {rel.contacto && (
          <div className={styles.relDetailRow}>
            <Phone size={13} className={styles.relDetailIcon} />
            <span>{rel.contacto}</span>
          </div>
        )}
      </div>

      {rel.tipos_trabajo && rel.tipos_trabajo.length > 0 && (
        <div className={styles.relTagsRow}>
          {rel.tipos_trabajo.map(t => {
            const info = TIPOS_MAP[t] || { label: t, emoji: '🔧' };
            return (
              <span key={t} className={styles.relTag}>
                {info.emoji} {info.label}
              </span>
            );
          })}
        </div>
      )}

      <div className={styles.relStatsRow}>
        {rel.fotos && rel.fotos.length > 0 && (
          <span className={styles.relStatItem}>
            <Camera size={13} className={styles.relStatIcon} />
            {rel.fotos.length} foto{rel.fotos.length !== 1 ? 's' : ''}
          </span>
        )}
        {rel.materiales && rel.materiales.length > 0 && (
          <span className={styles.relStatItem}>
            <Package size={13} className={styles.relStatIcon} />
            {rel.materiales.length} material{rel.materiales.length !== 1 ? 'es' : ''}
          </span>
        )}
        {rel.observaciones && (
          <span className={styles.relStatItem}>
            <FileText size={13} className={styles.relStatIcon} />
            Observaciones
          </span>
        )}
        <button
          className={styles.relDeleteBtn}
          onClick={onDelete}
          title="Eliminar relevamiento"
          aria-label="Eliminar relevamiento"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className={styles.relExpanded} onClick={e => e.stopPropagation()}>
          {rel.observaciones && (
            <div className={styles.relObsBox}>
              "{rel.observaciones}"
            </div>
          )}
          {rel.materiales && rel.materiales.length > 0 && (
            <div className={styles.relMatList}>
              <strong style={{ fontSize: '0.78rem', color: '#1e293b' }}>Materiales / Equipos:</strong>
              {rel.materiales.map(m => (
                <div key={m.id} className={styles.relMatItem}>
                  <span>• {m.nombre} (cant: {m.cantidad})</span>
                  {m.costo ? <span>${m.costo}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

export function SafeLinkNotePage() {
  const { files, isLoading: isLoadingFiles, markAsRead } = useSafeLinkNote();
  const navigate = useNavigate();

  // Relevamientos técnicos guardados en Supabase
  const [relevamientos, setRelevamientos] = useState<Relevamiento[]>([]);
  const [loadingRelevamientos, setLoadingRelevamientos] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'todos' | 'pendientes' | 'historial'>('todos');
  const [expandedRelId, setExpandedRelId] = useState<string | null>(null);

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

  const pendientesList = useMemo(() => relevamientos.filter(r => r.estado === 'PENDIENTE'), [relevamientos]);
  const finalizadosList = useMemo(() => relevamientos.filter(r => r.estado === 'FINALIZADO'), [relevamientos]);

  const relevamientosMostrados = useMemo(() => {
    if (activeFilter === 'pendientes') return pendientesList;
    if (activeFilter === 'historial') return finalizadosList;
    return relevamientos;
  }, [activeFilter, relevamientos, pendientesList, finalizadosList]);

  const handleEliminarRelevamiento = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este relevamiento técnico?')) return;
    try {
      await relevamientoService.eliminar(id);
      setRelevamientos(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('No se pudo eliminar el relevamiento.');
    }
  };

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

      {/* ── ENCABEZADO ── */}
      <div className={styles.header}>
        <div className={styles.headerBrand}>
          <StickyNote size={22} className={styles.brandIcon} />
          <div>
            <span className={styles.brandSafe}>SafeLink</span>
            <span className={styles.brandNote}>NOTE</span>
          </div>
        </div>
        <p className={styles.headerSub}>Relevamiento Técnico</p>
      </div>

      {/* ── BOTÓN PRINCIPAL ── */}
      <Link to="/safelink-note/nuevo" className={styles.btnPrimary}>
        <Plus size={20} />
        NUEVO RELEVAMIENTO
      </Link>

      {/* ── BOTONES SECUNDARIOS: HISTORIAL Y PENDIENTES ── */}
      <div className={styles.secondaryRow}>
        <button
          className={`${styles.btnSecondary} ${activeFilter === 'historial' ? styles.btnSecondaryActive : ''}`}
          onClick={() => setActiveFilter(prev => prev === 'historial' ? 'todos' : 'historial')}
          title="Ver historial de relevamientos finalizados"
        >
          <History size={16} />
          HISTORIAL
          {finalizadosList.length > 0 && (
            <span className={`${styles.badge} ${activeFilter === 'historial' ? styles.badgeActive : ''}`}>
              {finalizadosList.length}
            </span>
          )}
        </button>

        <button
          className={`${styles.btnSecondary} ${activeFilter === 'pendientes' ? styles.btnSecondaryActive : ''}`}
          onClick={() => setActiveFilter(prev => prev === 'pendientes' ? 'todos' : 'pendientes')}
          title="Ver relevamientos pendientes"
        >
          <AlertCircle size={16} />
          PENDIENTES
          {pendientesList.length > 0 && (
            <span className={`${styles.badge} ${activeFilter === 'pendientes' ? styles.badgeActive : ''}`}>
              {pendientesList.length}
            </span>
          )}
        </button>
      </div>

      {/* ── SECCIÓN 1: RELEVAMIENTOS TÉCNICOS EN SUPABASE ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FileText size={16} className={styles.sectionIcon} />
            <span>
              {activeFilter === 'pendientes'
                ? 'Relevamientos Pendientes'
                : activeFilter === 'historial'
                ? 'Historial de Relevamientos'
                : 'Relevamientos Técnicos'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {activeFilter !== 'todos' && (
              <button
                className={styles.filterBadgeClear}
                onClick={() => setActiveFilter('todos')}
              >
                Ver todos ({relevamientos.length})
              </button>
            )}
            {!loadingRelevamientos && (
              <span className={styles.sectionBadge}>{relevamientosMostrados.length}</span>
            )}
          </div>
        </div>

        {loadingRelevamientos ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} />
            <span>Cargando relevamientos…</span>
          </div>
        ) : relevamientosMostrados.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={32} className={styles.emptyIcon} />
            <p>
              {activeFilter === 'pendientes'
                ? 'No tenés relevamientos pendientes.'
                : activeFilter === 'historial'
                ? 'No tenés relevamientos en el historial.'
                : 'No hay relevamientos cargados todavía.'}
            </p>
            <span>Tocá <strong>+ NUEVO RELEVAMIENTO</strong> para registrar uno.</span>
          </div>
        ) : (
          <div className={styles.relList}>
            {relevamientosMostrados.map(rel => (
              <RelevamientoCard
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

      {/* ── SECCIÓN 2: ARCHIVOS .SLN ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FileArchive size={16} className={styles.sectionIcon} />
            <span>Archivos .SLN</span>
          </div>
          {!isLoadingFiles && (
            <span className={styles.sectionBadge}>{files.length}</span>
          )}
        </div>

        {isLoadingFiles ? (
          <div className={styles.loadingRow}>
            <Loader2 size={18} className={styles.spinner} />
            <span>Cargando archivos…</span>
          </div>
        ) : files.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileArchive size={32} className={styles.emptyIcon} />
            <p>No hay archivos <strong>.sln</strong> en el bucket todavía.</p>
            <span>Aparecerán aquí automáticamente cuando sean subidos.</span>
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

      {/* ── SECCIÓN 3: PROCESAMIENTO IA ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <Cpu size={16} className={styles.sectionIconIA} />
            <span>Procesamiento IA</span>
          </div>
        </div>
        <button
          className={styles.iaLinkBtn}
          onClick={() => navigate('/safelink-ia')}
        >
          <Bot size={17} className={styles.iaLinkIcon} />
          <div>
            <strong>Nathulia IA</strong>
            <span>Generar documentos desde relevamientos</span>
          </div>
          <ChevronRight size={16} className={styles.iaLinkArrow} />
        </button>
      </section>

      {/* ── MODAL: ENVIAR A NATHULIA ── */}
      {selectedFileForNathulia && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFileForNathulia(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleBox}>
                <div className={styles.nathuliaIconBox}>
                  <Bot size={18} />
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
                <FileArchive size={16} className={styles.bannerIcon} />
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
                <Send size={14} />
                <span>Enviar a Nathulia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
