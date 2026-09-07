import { useState, useRef, useEffect } from 'react';
import {
  landingGalleryService,
  type LandingGalleryCategory,
  type LandingGalleryItem,
  type LandingGalleryMedia,
  type WorkFormPayload,
} from '@/services/landingGalleryService';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  X, Upload, Image as ImageIcon, Trash2, Plus,
  Sparkles, Check, AlertCircle, AlertTriangle, Play, Film
} from 'lucide-react';
import styles from './TrabajoModal.module.css';

interface TrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialWork?: LandingGalleryItem | null;
}

interface NewVideoItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

const CATEGORIAS: { id: LandingGalleryCategory; label: string }[] = [
  { id: 'iluminacion', label: 'Iluminación LED' },
  { id: 'redes', label: 'Redes e infraestructura' },
  { id: 'seguridad', label: 'Seguridad inteligente' },
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEOS_PER_WORK = 6;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function TrabajoModal({ isOpen, onClose, onSuccess, initialWork }: TrabajoModalProps) {
  const toast = useToast();
  const isEditing = Boolean(initialWork);

  // Form State
  const [category, setCategory] = useState<LandingGalleryCategory>('iluminacion');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [active, setActive] = useState<boolean>(true);
  const [featured, setFeatured] = useState<boolean>(false);

  // Files State - Imágenes
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');

  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  // Files State - Videos Múltiples
  const [newVideos, setNewVideos] = useState<NewVideoItem[]>([]);
  const [existingVideos, setExistingVideos] = useState<LandingGalleryMedia[]>([]);

  // Existing Media (para imágenes y control de IDs eliminados)
  const [existingImages, setExistingImages] = useState<LandingGalleryMedia[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

  // Modal de confirmación para eliminar video guardado
  const [videoToDelete, setVideoToDelete] = useState<LandingGalleryMedia | null>(null);

  // Submitting & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos si se está editando
  useEffect(() => {
    if (initialWork) {
      setCategory(initialWork.category);
      setTitle(initialWork.title);
      setCaption(initialWork.caption || initialWork.description || '');
      setSortOrder(initialWork.sort_order ?? 0);
      setActive(initialWork.active ?? true);
      setFeatured(initialWork.featured ?? false);
      setMainImagePreview(initialWork.image_url || '');

      const currentMedia = initialWork.media || [];
      
      // Separar fotos adicionales de videos existentes
      const imgs = currentMedia.filter(m => m.media_type === 'image' && m.storage_path !== initialWork.image_path);
      const vids = currentMedia.filter(m => m.media_type === 'video');

      setExistingImages(imgs);
      setExistingVideos(vids);
    } else {
      // Reset para nuevo trabajo
      setCategory('iluminacion');
      setTitle('');
      setCaption('');
      setSortOrder(0);
      setActive(true);
      setFeatured(false);
      setMainImageFile(null);
      setMainImagePreview('');
      setAdditionalFiles([]);
      setAdditionalPreviews([]);
      setExistingImages([]);
      setExistingVideos([]);
    }

    setNewVideos([]);
    setDeletedMediaIds([]);
    setVideoToDelete(null);
    setErrorMsg(null);
    setUploadProgressText('');
  }, [initialWork, isOpen]);

  // Manejo de Imagen Principal
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Formato no permitido. Utilizá JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('La imagen supera el límite de 10 MB.');
      return;
    }

    setMainImageFile(file);
    const url = URL.createObjectURL(file);
    setMainImagePreview(url);
    setErrorMsg(null);
  };

  // Manejo de Imágenes Adicionales
  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const f of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" no es una imagen válida.`);
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE_BYTES) {
        toast.error(`"${f.name}" supera los 10 MB.`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setAdditionalFiles(prev => [...prev, ...validFiles]);
    setAdditionalPreviews(prev => [...prev, ...validPreviews]);
    e.target.value = '';
  };

  const removeAdditionalNewImage = (index: number) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (mediaItem: LandingGalleryMedia) => {
    setExistingImages(prev => prev.filter(m => m.id !== mediaItem.id));
    setDeletedMediaIds(prev => [...prev, mediaItem.id]);
  };

  // ── MANEJO DE MÚLTIPLES VIDEOS ──
  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentTotal = existingVideos.length + newVideos.length;
    if (currentTotal + files.length > MAX_VIDEOS_PER_WORK) {
      toast.error(`Podés cargar hasta ${MAX_VIDEOS_PER_WORK} videos por trabajo. (Actualmente tenés ${currentTotal})`);
      e.target.value = '';
      return;
    }

    const validItems: NewVideoItem[] = [];

    for (const f of files) {
      if (!ALLOWED_VIDEO_TYPES.includes(f.type)) {
        toast.error(`"${f.name}" no es un formato de video permitido. Utilizá MP4, WebM o MOV.`);
        continue;
      }
      if (f.size > MAX_VIDEO_SIZE_BYTES) {
        toast.error(`"${f.name}" supera el límite de 50 MB.`);
        continue;
      }

      validItems.push({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        name: f.name,
        size: f.size,
      });
    }

    if (validItems.length > 0) {
      setNewVideos(prev => [...prev, ...validItems]);
      setErrorMsg(null);
    }

    e.target.value = '';
  };

  const removeNewVideo = (index: number) => {
    setNewVideos(prev => {
      const item = prev[index];
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Eliminación de video guardado con confirmación
  const handleRequestRemoveExistingVideo = (video: LandingGalleryMedia) => {
    setVideoToDelete(video);
  };

  const confirmDeleteExistingVideo = () => {
    if (!videoToDelete) return;
    setExistingVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
    setDeletedMediaIds(prev => [...prev, videoToDelete.id]);
    setVideoToDelete(null);
    toast.success('Video marcado para eliminar al guardar');
  };

  const cancelDeleteExistingVideo = () => {
    setVideoToDelete(null);
  };

  // Helpers de formato
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getVideoDisplayName = (media: LandingGalleryMedia, index: number) => {
    if (media.storage_path) {
      const parts = media.storage_path.split('/');
      return parts[parts.length - 1];
    }
    return `video-obra-${String(index + 1).padStart(2, '0')}.mp4`;
  };

  const totalVideosCount = existingVideos.length + newVideos.length;

  // Enviar Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('El título es obligatorio.');
      return;
    }

    if (!isEditing && !mainImageFile) {
      setErrorMsg('Debés seleccionar una imagen principal para el trabajo.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText('Procesando datos...');

    try {
      const payload: WorkFormPayload = {
        category,
        title: title.trim(),
        caption: caption.trim() || undefined,
        sort_order: Number(sortOrder) || 0,
        active,
        featured,
      };

      const videoFilesToUpload = newVideos.map(v => v.file);

      if (isEditing && initialWork) {
        await landingGalleryService.updateWork(
          initialWork.id,
          payload,
          {
            mainImage: mainImageFile || undefined,
            additionalImages: additionalFiles.length > 0 ? additionalFiles : undefined,
            videos: videoFilesToUpload.length > 0 ? videoFilesToUpload : undefined,
          },
          deletedMediaIds,
          progress => setUploadProgressText(progress.message)
        );
        toast.success('Trabajo actualizado correctamente');
      } else {
        await landingGalleryService.createWork(
          payload,
          {
            mainImage: mainImageFile!,
            additionalImages: additionalFiles.length > 0 ? additionalFiles : undefined,
            videos: videoFilesToUpload.length > 0 ? videoFilesToUpload : undefined,
          },
          progress => setUploadProgressText(progress.message)
        );
        toast.success('Trabajo publicado correctamente');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error guardando trabajo:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar el trabajo.');
      toast.error('Error al guardar el trabajo');
    } finally {
      setIsSubmitting(false);
      setUploadProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={!isSubmitting ? onClose : undefined}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header del Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2>{isEditing ? 'Editar Trabajo' : 'Nuevo Trabajo Multimedia'}</h2>
              <p>Completá la información y cargá fotos o videos de la obra realizada.</p>
            </div>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {errorMsg && (
            <div className={styles.alertError}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Categoría */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Categoría <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={category}
              onChange={e => setCategory(e.target.value as LandingGalleryCategory)}
              required
              disabled={isSubmitting}
            >
              {CATEGORIAS.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Título */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Título del trabajo <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej.: Rack TV con iluminación indirecta"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Epígrafe / Descripción breve */}
          <div className={styles.fieldGroup}>
            <div className={styles.labelWithCounter}>
              <label className={styles.label}>Epígrafe comercial</label>
              <span className={`${styles.charCounter} ${caption.length > 180 ? styles.counterWarning : ''}`}>
                {caption.length} / 180 caracteres
              </span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Ej.: Diseño e instalación de iluminación LED cálida integrada al mobiliario."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={3}
              maxLength={260}
              disabled={isSubmitting}
            />
            <p className={styles.fieldHelp}>
              Descripción breve y comercial que se mostrará debajo del trabajo en la galería pública.
            </p>
          </div>

          <hr className={styles.divider} />

          {/* ── SECCIÓN MULTIMEDIA ── */}
          <div className={styles.multimediaSection}>
            <h3 className={styles.sectionTitle}>Archivos Multimedia</h3>

            {/* 1. Imagen Principal */}
            <div className={styles.mediaBlock}>
              <label className={styles.label}>
                Imagen principal <span className={styles.required}>*</span>
              </label>
              {mainImagePreview ? (
                <div className={styles.mainImagePreviewBox}>
                  <img src={mainImagePreview} alt="Preview principal" className={styles.mainPreviewImg} />
                  <button
                    type="button"
                    className={styles.changeImgBtn}
                    onClick={() => mainInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Upload size={14} /> Cambiar imagen
                  </button>
                </div>
              ) : (
                <div
                  className={styles.dropzone}
                  onClick={() => mainInputRef.current?.click()}
                >
                  <ImageIcon size={32} className={styles.dropzoneIcon} />
                  <p className={styles.dropzoneText}>Hacé clic para seleccionar la imagen principal</p>
                  <span className={styles.dropzoneSub}>JPG, PNG o WebP · Máximo 10 MB</span>
                </div>
              )}
              <input
                ref={mainInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={styles.hiddenInput}
                onChange={handleMainImageChange}
                disabled={isSubmitting}
              />
            </div>

            {/* 2. Imágenes Adicionales */}
            <div className={styles.mediaBlock}>
              <div className={styles.mediaHeaderRow}>
                <label className={styles.label}>Fotografías adicionales (opcional)</label>
                <button
                  type="button"
                  className={styles.addExtraBtn}
                  onClick={() => extraInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <Plus size={14} /> Agregar imágenes
                </button>
              </div>

              <input
                ref={extraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className={styles.hiddenInput}
                onChange={handleAdditionalImagesChange}
                disabled={isSubmitting}
              />

              {/* Grid de adicionales existentes y nuevas */}
              {(existingImages.length > 0 || additionalPreviews.length > 0) && (
                <div className={styles.extraGrid}>
                  {existingImages.map(m => (
                    <div key={m.id} className={styles.extraItem}>
                      <img src={m.media_url} alt="Foto adicional" className={styles.extraImg} />
                      <button
                        type="button"
                        className={styles.removeMediaBtn}
                        onClick={() => removeExistingImage(m)}
                        title="Eliminar foto"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {additionalPreviews.map((url, idx) => (
                    <div key={idx} className={styles.extraItem}>
                      <img src={url} alt={`Nueva adicional ${idx + 1}`} className={styles.extraImg} />
                      <button
                        type="button"
                        className={styles.removeMediaBtn}
                        onClick={() => removeAdditionalNewImage(idx)}
                        title="Eliminar foto"
                        disabled={isSubmitting}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. VIDEOS DE LA OBRA (MÚLTIPLES VIDEOS) */}
            <div className={styles.mediaBlock}>
              <div className={styles.mediaHeaderRow}>
                <div className={styles.videosLabelGroup}>
                  <label className={styles.label}>Videos de la obra (opcional)</label>
                  <span className={styles.videosCounter}>
                    ({totalVideosCount}/{MAX_VIDEOS_PER_WORK} videos)
                  </span>
                </div>
                {totalVideosCount < MAX_VIDEOS_PER_WORK && (
                  <button
                    type="button"
                    className={styles.addVideosBtn}
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Plus size={14} /> + Agregar videos
                  </button>
                )}
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                multiple
                className={styles.hiddenInput}
                onChange={handleVideosChange}
                disabled={isSubmitting}
              />

              {/* Si no hay videos cargados aún */}
              {totalVideosCount === 0 && (
                <div
                  className={styles.dropzoneVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Film size={32} className={styles.dropzoneVideoIcon} />
                  <p className={styles.dropzoneText}>+ Agregar videos de la obra</p>
                  <span className={styles.dropzoneSub}>
                    Podés seleccionar uno o varios videos · MP4, WebM o MOV · Máx. 50 MB c/u (hasta {MAX_VIDEOS_PER_WORK} videos)
                  </span>
                </div>
              )}

              {/* Grilla Responsiva de Videos */}
              {totalVideosCount > 0 && (
                <div className={styles.videosGrid}>
                  {/* Videos Ya Guardados en Supabase */}
                  {existingVideos.map((video, idx) => (
                    <div key={video.id} className={styles.videoCard}>
                      <div className={styles.videoPlayerContainer}>
                        <video
                          src={video.media_url}
                          controls
                          playsInline
                          preload="metadata"
                          className={styles.videoPlayer}
                        />
                        <span className={styles.savedBadge}>
                          <Check size={11} /> Video guardado
                        </span>
                      </div>
                      <div className={styles.videoCardInfo}>
                        <div className={styles.videoFileName} title={video.storage_path}>
                          <Play size={12} className={styles.videoFileIcon} />
                          <span className={styles.videoFileText}>
                            {getVideoDisplayName(video, idx)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.removeVideoBtn}
                          onClick={() => handleRequestRemoveExistingVideo(video)}
                          disabled={isSubmitting}
                        >
                          <Trash2 size={13} /> Quitar video
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Nuevos Videos Pendientes de Subir */}
                  {newVideos.map((video, idx) => (
                    <div key={video.id} className={`${styles.videoCard} ${styles.videoCardPending}`}>
                      <div className={styles.videoPlayerContainer}>
                        <video
                          src={video.previewUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className={styles.videoPlayer}
                        />
                        <span className={styles.pendingBadge}>
                          <Sparkles size={11} /> Pendiente de guardar
                        </span>
                      </div>
                      <div className={styles.videoCardInfo}>
                        <div className={styles.videoFileName} title={video.name}>
                          <Film size={12} className={styles.videoFileIcon} />
                          <span className={styles.videoFileText}>{video.name}</span>
                        </div>
                        {video.size > 0 && (
                          <span className={styles.videoFileSize}>
                            {formatFileSize(video.size)}
                          </span>
                        )}
                        <button
                          type="button"
                          className={styles.removeVideoBtn}
                          onClick={() => removeNewVideo(idx)}
                          disabled={isSubmitting}
                        >
                          <Trash2 size={13} /> Quitar video
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <hr className={styles.divider} />

          {/* ── OPCIONES DE PUBLICACIÓN ── */}
          <div className={styles.optionsGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Orden de aparición</label>
              <input
                type="number"
                className={styles.input}
                value={sortOrder}
                onChange={e => setSortOrder(parseInt(e.target.value, 10) || 0)}
                min={0}
                step={1}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.toggleField}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className={styles.checkbox}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleCustom} />
                <span>Visible en landing</span>
              </label>
            </div>

            <div className={styles.toggleField}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                  className={styles.checkbox}
                  disabled={isSubmitting}
                />
                <span className={styles.toggleCustom} />
                <span>Trabajo destacado ⭐</span>
              </label>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className={styles.modalFooter}>
            {uploadProgressText && (
              <div className={styles.progressStatus}>
                <span className={styles.spinnerSmall} />
                <span>{uploadProgressText}</span>
              </div>
            )}
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  <span>{uploadProgressText || 'Guardando trabajo...'}</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{isEditing ? 'Guardar Cambios' : 'Publicar Trabajo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE VIDEO GUARDADO ── */}
      {videoToDelete && (
        <div className={styles.confirmOverlay} onClick={cancelDeleteExistingVideo}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIconBox}>
              <AlertTriangle size={24} />
            </div>
            <h4>¿Querés eliminar este video de la obra?</h4>
            <p>
              El video seleccionado dejará de estar asociado a este trabajo y será eliminado definitivamente al guardar los cambios.
            </p>
            <div className={styles.confirmButtonRow}>
              <button
                type="button"
                className={styles.confirmCancelButton}
                onClick={cancelDeleteExistingVideo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.confirmDeleteButton}
                onClick={confirmDeleteExistingVideo}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
