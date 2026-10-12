import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Library,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  FileText,
  Search,
  Play,
  Download,
  HardDrive,
  Edit,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './LibraryPage.module.css';
import { supabase } from '@/lib/supabase';
import { listProjects } from '../../services/projectService';
import type { VibeProject } from '../../types';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
  publicUrl?: string;
}

export function LibraryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image' | 'projects'>('all');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [savingToDriveId, setSavingToDriveId] = useState<string | null>(null);

  // Modal de preview
  const [previewMedia, setPreviewMedia] = useState<{
    title: string;
    url?: string;
    type: 'video' | 'audio' | 'image';
  } | null>(null);

  const checkDrive = () => {
    setIsDriveConnected(googleDriveService.isConnected());
  };

  const loadData = async () => {
    setLoading(true);
    checkDrive();

    try {
      // 1. Obtener archivos de Supabase Storage
      const { data: storageData } = await supabase.storage
        .from('safelink-vibe')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (storageData) {
        const enriched = storageData
          .filter((item) => item.name !== '.emptyFolderPlaceholder')
          .map((item) => {
            const { data: pubData } = supabase.storage
              .from('safelink-vibe')
              .getPublicUrl(item.name);
            return {
              ...item,
              publicUrl: pubData.publicUrl,
            } as StorageFile;
          });
        setFiles(enriched);
      }

      // 2. Obtener proyectos generados
      const projRes = await listProjects({ limit: 50 });
      if (projRes.ok) {
        setProjects(projRes.data);
      }
    } catch {
      // Ignorar errores de carga
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleConnectDrive = async () => {
    try {
      await googleDriveService.signIn();
      setIsDriveConnected(true);
      showToast('Google Drive conectado exitosamente con SafeLink Vibe.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar Google Drive';
      showToast(msg, 'error');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('El archivo supera el tamaño máximo permitido de 50 MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error } = await supabase.storage
        .from('safelink-vibe')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        showToast(`Error al subir a Supabase: ${error.message}`, 'error');
      } else {
        showToast('Archivo subido exitosamente a la biblioteca.', 'success');
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir archivo';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`¿Querés eliminar ${fileName} de la biblioteca?`)) return;
    try {
      const { error } = await supabase.storage.from('safelink-vibe').remove([fileName]);
      if (error) {
        showToast('Error al eliminar archivo.', 'error');
      } else {
        showToast('Archivo eliminado de Supabase Storage.', 'info');
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
      }
    } catch {
      showToast('Error al eliminar archivo.', 'error');
    }
  };

  const handleSaveToDrive = async (name: string, url?: string) => {
    if (!url) {
      showToast('Este recurso no tiene un archivo binario generado aún.', 'error');
      return;
    }

    setSavingToDriveId(name);
    try {
      if (!isDriveConnected) {
        await googleDriveService.signIn();
        setIsDriveConnected(true);
      }

      // Descargar el archivo como blob
      const resp = await fetch(url);
      const blob = await resp.blob();

      await googleDriveService.uploadMedia(blob, name, blob.type || 'video/mp4');
      showToast(`Archivo "${name}" guardado en Google Drive (SafeLink Cloud > Publicidad Vibe).`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir a Google Drive';
      showToast(msg, 'error');
    } finally {
      setSavingToDriveId(null);
    }
  };

  // Filtrado
  const filteredFiles = files.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'image') return f.metadata?.mimetype?.startsWith('image/');
    if (activeTab === 'video') return f.metadata?.mimetype?.startsWith('video/');
    if (activeTab === 'audio') return f.metadata?.mimetype?.startsWith('audio/');
    if (activeTab === 'projects') return false;
    return true;
  });

  const filteredProjects = projects.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'image') return p.format.startsWith('image');
    if (activeTab === 'video') return p.format.startsWith('video') || p.format === 'reel' || p.format === 'story_9_16';
    if (activeTab === 'audio') return !!p.project_data?.voiceoverScript;
    return true;
  });

  return (
    <div className={styles.page}>
      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Biblioteca Multimedia SafeLink</h1>
          <p className={styles.subtitle}>
            Almacenamiento permanente en la nube (Supabase Storage) con respaldo sincronizado en Google Drive y visor interactivo.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={clsx(styles.gdriveBtn, isDriveConnected && styles.gdriveConnected)}
            onClick={handleConnectDrive}
            title={isDriveConnected ? 'Google Drive conectado' : 'Conectar Google Drive'}
          >
            <HardDrive size={16} />
            <span>{isDriveConnected ? 'Google Drive Conectado' : 'Conectar Google Drive'}</span>
          </button>

          <label className={styles.uploadBtn}>
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleUpload}
              disabled={uploading}
            />
            <Upload size={16} />
            <span>{uploading ? 'Subiendo...' : 'Subir Archivo'}</span>
          </label>
        </div>
      </div>

      {/* ── Barra de herramientas ── */}
      <div className={styles.toolbar}>
        <div className={styles.navTabs}>
          <button
            type="button"
            className={clsx(styles.tabBtn, activeTab === 'all' && styles.tabBtnActive)}
            onClick={() => setActiveTab('all')}
          >
            <Library size={14} />
            <span>Todos ({files.length + projects.length})</span>
          </button>
          <button
            type="button"
            className={clsx(styles.tabBtn, activeTab === 'video' && styles.tabBtnActive)}
            onClick={() => setActiveTab('video')}
          >
            <Video size={14} />
            <span>Videos / Status</span>
          </button>
          <button
            type="button"
            className={clsx(styles.tabBtn, activeTab === 'audio' && styles.tabBtnActive)}
            onClick={() => setActiveTab('audio')}
          >
            <Music size={14} />
            <span>Locuciones TTS</span>
          </button>
          <button
            type="button"
            className={clsx(styles.tabBtn, activeTab === 'image' && styles.tabBtnActive)}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon size={14} />
            <span>Imágenes</span>
          </button>
          <button
            type="button"
            className={clsx(styles.tabBtn, activeTab === 'projects' && styles.tabBtnActive)}
            onClick={() => setActiveTab('projects')}
          >
            <FileText size={14} />
            <span>Proyectos ({projects.length})</span>
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} color="var(--vibe-text-muted)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre o formato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Grilla de Archivos y Proyectos ── */}
      {loading ? (
        <div className={styles.emptyState}>
          <p>Cargando recursos multimedia de SafeLink...</p>
        </div>
      ) : filteredFiles.length === 0 && filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <Library size={48} color="var(--vibe-text-muted)" style={{ opacity: 0.3 }} />
          <h3>No se encontraron archivos en la biblioteca</h3>
          <p style={{ color: 'var(--vibe-text-muted)', fontSize: '0.875rem' }}>
            Los videos generados con Veo, audios de voz y piezas de WhatsApp Status se guardarán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {/* Proyectos de SafeLink Vibe */}
          {(activeTab === 'all' || activeTab === 'projects' || activeTab === 'video') &&
            filteredProjects.map((p) => (
              <div key={p.id} className={styles.itemCard}>
                <div
                  className={styles.itemThumb}
                  onClick={() =>
                    setPreviewMedia({
                      title: p.title,
                      url: p.thumbnail_url || undefined,
                      type: p.format.startsWith('video') ? 'video' : 'image',
                    })
                  }
                >
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} />
                  ) : p.format.startsWith('video') || p.format === 'story_9_16' ? (
                    <Video size={36} color="var(--vibe-blue)" />
                  ) : (
                    <ImageIcon size={36} color="var(--vibe-text-muted)" />
                  )}

                  <div className={styles.playOverlay}>
                    <div className={styles.playCircle}>
                      <Play size={18} />
                    </div>
                  </div>
                </div>

                <div className={styles.itemMeta}>
                  <div className={styles.itemName} title={p.title}>
                    {p.title}
                  </div>
                  <div className={styles.itemDetails}>
                    Formato: {p.format.replace('_', ' ')} · {new Date(p.created_at).toLocaleDateString('es-AR')}
                  </div>

                  <div className={styles.cardActions}>
                    <Link
                      to={`/vibe/crear?projectId=${p.id}&format=${p.format}`}
                      className={styles.actionBtn}
                      title="Editar en Creador"
                    >
                      <Edit size={12} />
                      <span>Editar</span>
                    </Link>

                    {p.thumbnail_url && (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleSaveToDrive(p.title, p.thumbnail_url!)}
                        disabled={savingToDriveId === p.title}
                        title="Guardar en Google Drive"
                      >
                        <HardDrive size={12} />
                        <span>{savingToDriveId === p.title ? 'Subiendo...' : 'Drive'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Archivos en Supabase Storage */}
          {activeTab !== 'projects' &&
            filteredFiles.map((file) => {
              const isVid = file.metadata?.mimetype?.startsWith('video/');
              const isAud = file.metadata?.mimetype?.startsWith('audio/');
              const isImg = file.metadata?.mimetype?.startsWith('image/');

              return (
                <div key={file.name} className={styles.itemCard}>
                  <div
                    className={styles.itemThumb}
                    onClick={() =>
                      setPreviewMedia({
                        title: file.name,
                        url: file.publicUrl,
                        type: isVid ? 'video' : isAud ? 'audio' : 'image',
                      })
                    }
                  >
                    {isImg && file.publicUrl ? (
                      <img src={file.publicUrl} alt={file.name} />
                    ) : isVid ? (
                      <Video size={36} color="#60a5fa" />
                    ) : isAud ? (
                      <Music size={36} color="#a78bfa" />
                    ) : (
                      <FileText size={36} color="var(--vibe-text-muted)" />
                    )}

                    <div className={styles.playOverlay}>
                      <div className={styles.playCircle}>
                        <Play size={18} />
                      </div>
                    </div>
                  </div>

                  <div className={styles.itemMeta}>
                    <div className={styles.itemName} title={file.name}>
                      {file.name}
                    </div>
                    <div className={styles.itemDetails}>
                      {file.metadata?.size
                        ? `${(file.metadata.size / 1024 / 1024).toFixed(1)} MB`
                        : 'Almacenado online'}
                    </div>

                    <div className={styles.cardActions}>
                      {file.publicUrl && (
                        <a
                          href={file.publicUrl}
                          download={file.name}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.actionBtn}
                          title="Descargar archivo"
                        >
                          <Download size={12} />
                          <span>Bajar</span>
                        </a>
                      )}

                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleSaveToDrive(file.name, file.publicUrl)}
                        disabled={savingToDriveId === file.name}
                        title="Respaldar en Google Drive"
                      >
                        <HardDrive size={12} />
                        <span>{savingToDriveId === file.name ? 'Guardando...' : 'Drive'}</span>
                      </button>

                      <button
                        type="button"
                        className={clsx(styles.actionBtn, styles.actionBtnDanger)}
                        onClick={() => handleDelete(file.name)}
                        title="Eliminar archivo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Modal Player ── */}
      {previewMedia && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{previewMedia.title}</h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setPreviewMedia(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {previewMedia.url ? (
                previewMedia.type === 'video' ? (
                  <video
                    src={previewMedia.url}
                    controls
                    autoPlay
                    style={{ width: '100%', maxHeight: '65vh', borderRadius: '8px' }}
                  />
                ) : previewMedia.type === 'audio' ? (
                  <audio src={previewMedia.url} controls autoPlay style={{ width: '100%' }} />
                ) : (
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.title}
                    style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }}
                  />
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--vibe-text-muted)' }}>
                  <p>Este recurso es un proyecto multimedia guardado en SafeLink Vibe.</p>
                  <p>Hacé clic en "Editar" para continuar ajustando escenas o exportar el render.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
