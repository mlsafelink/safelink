import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { safeLinkNoteService, type SlnFile } from '@/services/safeLinkNoteService';
import { useSafeLinkNote } from './SafeLinkNoteContext';
import { FileArchive, Download, Clock, Loader2, StickyNote } from 'lucide-react';
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

function SlnCard({ file }: { file: SlnFile }) {
  const code = file.name.replace(/\.sln$/i, '');
  const dateSource = file.created_at ?? file.updated_at;
  const { fecha, hora } = formatDate(dateSource);

  const handleDownload = async () => {
    const url = await safeLinkNoteService.getDownloadUrl(file.name);
    if (url) window.open(url, '_blank');
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

      <button
        className={styles.downloadBtn}
        onClick={handleDownload}
        title="Descargar / Abrir archivo"
      >
        <Download size={15} />
        <span>Abrir</span>
      </button>
    </div>
  );
}

export function SafeLinkNotePage() {
  const { markAsRead } = useSafeLinkNote();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['sln-files'],
    queryFn:  safeLinkNoteService.listSlnFiles,
    refetchInterval: 30_000,
  });

  // Marcar como leído al entrar al módulo
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

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
            <SlnCard key={file.id ?? file.name} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
