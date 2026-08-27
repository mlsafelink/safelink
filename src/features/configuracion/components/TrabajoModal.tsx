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
  X, Upload, Image as ImageIcon, Video, Trash2, Plus,
  Sparkles, Check, AlertCircle, Play
} from 'lucide-react';
import styles from './TrabajoModal.module.css';

interface TrabajoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialWork?: LandingGalleryItem | null;
}

const CATEGORIAS: { id: LandingGalleryCategory; label: string }[] = [
  { id: 'iluminacion', label: 'Iluminación LED' },
  { id: 'redes', label: 'Redes e infraestructura' },
  { id: 'seguridad', label: 'Seguridad inteligente' },
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
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

  // Files State
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>('');

  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');

  // Existing Media (for editing)
  const [existingMedia, setExistingMedia] = useState<LandingGalleryMedia[]>([]);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setExistingMedia(currentMedia);

      // Si existe un video previo
      const existingVideo = currentMedia.find(m => m.media_type === 'video');
      if (existingVideo) {
        setVideoPreview(existingVideo.media_url);
      }
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
      setVideoFile(null);
      setVideoPreview('');
      setExistingMedia([]);
      setDeletedMediaIds([]);
    }
    setErrorMsg(null);
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

  const removeExistingMedia = (mediaItem: LandingGalleryMedia) => {
    setExistingMedia(prev => prev.filter(m => m.id !== mediaItem.id));
    setDeletedMediaIds(prev => [...prev, mediaItem.id]);
    if (mediaItem.media_type === 'video') {
      setVideoPreview('');
    }
  };

  // Manejo de Video
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error('Formato de video no permitido. Utilizá MP4, WebM o MOV.');
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.error('El video supera el límite de 50 MB.');
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setErrorMsg(null);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    // Si había un video existente, marcarlo para borrar
    const existingVideo = existingMedia.find(m => m.media_type === 'video');
    if (existingVideo) {
      removeExistingMedia(existingVideo);
    }
  };

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

    try {
      const payload: WorkFormPayload = {
        category,
        title: title.trim(),
        caption: caption.trim() || undefined,
        sort_order: Number(sortOrder) || 0,
        active,
        featured,
      };

      if (isEditing && initialWork) {
        await landingGalleryService.updateWork(
          initialWork.id,
          payload,
          {
            mainImage: mainImageFile || undefined,
            additionalImages: additionalFiles.length > 0 ? additionalFiles : undefined,
            video: videoFile || undefined,
          },
          deletedMediaIds
        );
        toast.success('Trabajo actualizado correctamente');
      } else {
        await landingGalleryService.createWork(
          payload,
          {
            mainImage: mainImageFile!,
            additionalImages: additionalFiles.length > 0 ? additionalFiles : undefined,
            video: videoFile || undefined,
          }
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
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
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
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
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
              />

              {/* Grid de adicionales existentes y nuevas */}
              <div className={styles.extraGrid}>
                {existingMedia
                  .filter(m => m.media_type === 'image' && m.storage_path !== initialWork?.image_path)
                  .map(m => (
                    <div key={m.id} className={styles.extraItem}>
                      <img src={m.media_url} alt="Foto adicional" className={styles.extraImg} />
                      <button
                        type="button"
                        className={styles.removeMediaBtn}
                        onClick={() => removeExistingMedia(m)}
                        title="Eliminar foto"
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
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Video Corto */}
            <div className={styles.mediaBlock}>
              <label className={styles.label}>Video corto de la obra (opcional)</label>
              {videoPreview ? (
                <div className={styles.videoPreviewBox}>
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    preload="metadata"
                    className={styles.videoPlayer}
                  />
                  <div className={styles.videoActions}>
                    <span className={styles.videoBadge}>
                      <Play size={12} /> Video cargado
                    </span>
                    <button
                      type="button"
                      className={styles.deleteVideoBtn}
                      onClick={removeVideo}
                    >
                      <Trash2 size={14} /> Quitar video
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.dropzoneVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video size={30} className={styles.dropzoneVideoIcon} />
                  <p className={styles.dropzoneText}>Subir video corto del trabajo</p>
                  <span className={styles.dropzoneSub}>MP4, WebM o MOV · Máx. 50 MB · Recomendado &lt; 60 seg</span>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className={styles.hiddenInput}
                onChange={handleVideoChange}
              />
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
              />
            </div>

            <div className={styles.toggleField}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                  className={styles.checkbox}
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
                />
                <span className={styles.toggleCustom} />
                <span>Trabajo destacado ⭐</span>
              </label>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className={styles.modalFooter}>
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
                  <span>Subiendo y guardando...</span>
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
    </div>
  );
}
