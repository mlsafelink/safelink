import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeLinkNoteService, type SlnFile } from '@/services/safeLinkNoteService';
import { useSafeLinkNote } from './SafeLinkNoteContext';
import { FileArchive, Download, Clock, Loader2, StickyNote, Bot, X, Send } from 'lucide-react';
import styles from './SafeLinkNotePage.module.css';

function formatDate(isoDate: string | null) {
  if (!isoDate) return { fecha: 'Fecha desconocida', hora: '' };
  try {
    const d = new Date(isoDate);
    return {
      fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      hora:  d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return { fecha: isoDate, hora: '' };
  }
}

function SlnCard({
  file,
  onOpenNathuliaModal
}: {
  file: SlnFile;
  onOpenNathuliaModal: (file: SlnFile) => void;
}) {
  const code = file.name.replace(/\.sln$/i, '');
  const dateSource = file.created_at ?? file.updated_at;
  const { fecha, hora } = formatDate(dateSource);

  const handleDownload = async () => {
    const url = await safeLinkNoteService.getDownloadUrl(file.name);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardIcon}>
        <FileArchive size={28} />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.fileCode}>{code}</div>
        <div className={styles.fileName}>{file.name}</div>
        <div className={styles.fileMeta}>
          <Clock size={12} />
          <span>
            {fecha}
            {hora ? ` · ${hora} hs.` : ''}
          </span>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          title="Descargar / Abrir archivo"
        >
          <Download size={14} />
          <span>Abrir</span>
        </button>

        <button
          className={styles.nathuliaBtn}
          onClick={() => onOpenNathuliaModal(file)}
          title="Enviar este archivo a la asistente IA Nathulia"
        >
          <Bot size={14} />
          <span>Enviar a Nathulia</span>
        </button>
      </div>
    </div>
  );
}

export function SafeLinkNotePage() {
  const { files, isLoading, markAsRead } = useSafeLinkNote();
  const navigate = useNavigate();

  const [selectedFileForNathulia, setSelectedFileForNathulia] = useState<SlnFile | null>(null);
  const [promptText, setPromptText] = useState('');

  // Marcar como leído al entrar al módulo
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

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
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <StickyNote size={28} className={styles.titleIcon} />
            <h1>SafeLink Note</h1>
          </div>
          <p>
            Archivos <span className={styles.slnTag}>.sln</span> recibidos
            desde el bucket de almacenamiento
          </p>
        </div>

        {!isLoading && (
          <div className={styles.countBadge}>
            {files.length} archivo{files.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Contenido ── */}
      {isLoading ? (
        <div className={styles.loadingState}>
          <Loader2 size={36} className={styles.spinner} />
          <p>Cargando archivos desde el bucket…</p>
        </div>
      ) : files.length === 0 ? (
        <div className={styles.emptyState}>
          <FileArchive size={52} />
          <p>No hay archivos <strong>.sln</strong> en el bucket todavía.</p>
          <span>Los archivos aparecerán aquí automáticamente cuando sean subidos.</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {files.map(file => (
            <SlnCard
              key={file.id ?? file.name}
              file={file}
              onOpenNathuliaModal={(f) => setSelectedFileForNathulia(f)}
            />
          ))}
        </div>
      )}

      {/* ── MODAL DIÁLOGO: ENVIAR A NATHULIA ── */}
      {selectedFileForNathulia && (
        <div className={styles.modalOverlay} onClick={() => setSelectedFileForNathulia(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
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
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedFileForNathulia(null)}
              >
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
                <label className={styles.fieldLabel}>Escribe un prompt u observaciones (opcional):</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="Ej: Generar presupuesto a partir del relevamiento en este archivo .sln..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.cancelBtn}
                onClick={() => setSelectedFileForNathulia(null)}
              >
                Cancelar
              </button>

              <button
                className={styles.submitBtn}
                onClick={handleSendToNathulia}
              >
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
