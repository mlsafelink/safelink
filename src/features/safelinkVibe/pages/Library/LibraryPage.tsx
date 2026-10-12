import { useState, useEffect } from 'react';
import {
  Library,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  FileText,
  Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './LibraryPage.module.css';
import { supabase } from '@/lib/supabase';
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
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('safelink-vibe').list('', {
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) {
        // Si el bucket aún no existe o no tiene permisos, mostrar lista vacía sin romper la UI
        console.warn('Storage bucket safelink-vibe:', error.message);
        setFiles([]);
      } else if (data) {
        const enriched = data
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
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    // Validación de tamaño (máx 25MB)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('El archivo supera el tamaño máximo permitido de 25 MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

      const { error } = await supabase.storage
        .from('safelink-vibe')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        showToast(`Error al subir: ${error.message}. Asegurate de que el bucket safelink-vibe esté creado.`, 'error');
      } else {
        showToast('Archivo subido exitosamente a la biblioteca.', 'success');
        fetchFiles();
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
        showToast('Archivo eliminado.', 'success');
        setFiles((prev) => prev.filter((f) => f.name !== fileName));
      }
    } catch {
      showToast('Error al eliminar archivo.', 'error');
    }
  };

  const filteredFiles = files.filter((f) => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'image') return f.metadata?.mimetype?.startsWith('image/');
    if (activeTab === 'video') return f.metadata?.mimetype?.startsWith('video/');
    if (activeTab === 'audio') return f.metadata?.mimetype?.startsWith('audio/');
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Biblioteca Creativa</h1>
          <p className={styles.subtitle}>
            Almacenamiento seguro de recursos multimedia de marca (imágenes, videos, audios y logotipos).
          </p>
        </div>

        <label className={styles.uploadBtn}>
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={handleUpload}
            disabled={uploading}
          />
          <Upload size={16} />
          <span>{uploading ? 'Subiendo recurso...' : 'Subir Recurso'}</span>
        </label>
      </div>

      <div className={styles.navTabs}>
        <button
          type="button"
          className={clsx(styles.tabBtn, activeTab === 'all' && styles.tabBtnActive)}
          onClick={() => setActiveTab('all')}
        >
          <Library size={14} />
          <span>Todos ({files.length})</span>
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
          className={clsx(styles.tabBtn, activeTab === 'video' && styles.tabBtnActive)}
          onClick={() => setActiveTab('video')}
        >
          <Video size={14} />
          <span>Videos</span>
        </button>
        <button
          type="button"
          className={clsx(styles.tabBtn, activeTab === 'audio' && styles.tabBtnActive)}
          onClick={() => setActiveTab('audio')}
        >
          <Music size={14} />
          <span>Audios</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--vibe-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--vibe-radius-sm)', border: '1px solid var(--vibe-border)' }}>
        <Search size={16} color="var(--vibe-text-muted)" />
        <input
          type="text"
          placeholder="Buscar archivo por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'var(--vibe-text-primary)', fontSize: '0.8125rem', width: '100%', outline: 'none' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--vibe-text-muted)' }}>
          Cargando biblioteca multimedia...
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className={styles.emptyState}>
          <Library size={36} color="var(--vibe-text-muted)" />
          <h3 style={{ margin: 0, color: 'var(--vibe-text-primary)' }}>
            No hay recursos en esta categoría
          </h3>
          <p style={{ margin: 0, color: 'var(--vibe-text-muted)', fontSize: '0.8125rem', maxWidth: '420px' }}>
            Subí fotografías de instalaciones, logotipos oficiales o piezas de prueba para utilizarlas en tus composiciones de SafeLink Vibe.
          </p>
          <label className={styles.uploadBtn} style={{ marginTop: '0.5rem' }}>
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={handleUpload}
              disabled={uploading}
            />
            <Upload size={16} />
            <span>Seleccionar archivo para subir</span>
          </label>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredFiles.map((file) => (
            <div key={file.name} className={styles.itemCard}>
              <div className={styles.itemThumb}>
                {file.metadata?.mimetype?.startsWith('image/') && file.publicUrl ? (
                  <img src={file.publicUrl} alt={file.name} />
                ) : file.metadata?.mimetype?.startsWith('video/') ? (
                  <Video size={32} color="var(--vibe-text-muted)" />
                ) : (
                  <FileText size={32} color="var(--vibe-text-muted)" />
                )}
              </div>
              <div className={styles.itemMeta} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className={styles.itemName} title={file.name}>
                    {file.name}
                  </div>
                  <div className={styles.itemDetails}>
                    {file.metadata?.size
                      ? `${(file.metadata.size / 1024).toFixed(0)} KB`
                      : 'Recurso guardado'}
                  </div>
                </div>
                <button
                  type="button"
                  title="Eliminar recurso"
                  onClick={() => handleDelete(file.name)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--vibe-text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
