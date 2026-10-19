import { useState } from 'react';
import { Camera, Trash2, ExternalLink, Tag, Image as ImageIcon } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import { normalizeFotos, type FotoItem, type DocumentFoto } from '@/services/documentService';
import styles from './DocumentPhotoUploader.module.css';

export interface DocumentPhotoUploaderProps {
  fotografias: DocumentFoto[];
  onChange: (fotos: FotoItem[]) => void;
  label?: string;
  hint?: string;
}

export function DocumentPhotoUploader({
  fotografias,
  onChange,
  label = 'Registro Fotográfico',
  hint = 'Sube fotografías de evidencia o trabajo realizado. Puedes ingresar una descripción opcional a cada una.',
}: DocumentPhotoUploaderProps) {
  const [pendingDescription, setPendingDescription] = useState('');

  const fotos = normalizeFotos(fotografias);

  const handleAddPhoto = (url: string) => {
    if (!url) return;
    const newFoto: FotoItem = {
      url,
      descripcion: pendingDescription.trim(),
    };
    onChange([...fotos, newFoto]);
    setPendingDescription('');
  };

  const handleUpdateDescription = (index: number, descripcion: string) => {
    const updated = fotos.map((f, i) => (i === index ? { ...f, descripcion } : f));
    onChange(updated);
  };

  const handleRemovePhoto = (index: number) => {
    const updated = fotos.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className={styles.container}>
      {/* ── Subida de nueva fotografía ── */}
      <div className={styles.uploadSection}>
        <div className={styles.uploadHeader}>
          <span className={styles.uploadTitle}>
            <Camera size={16} />
            {label}
          </span>
        </div>
        {hint && <p className={styles.uploadHint}>{hint}</p>}

        <div className={styles.preDescriptionBox}>
          <label className={styles.preDescriptionLabel}>
            <Tag size={13} />
            Descripción para la próxima fotografía (opcional):
          </label>
          <input
            type="text"
            className={styles.preDescriptionInput}
            value={pendingDescription}
            onChange={(e) => setPendingDescription(e.target.value)}
            placeholder="Ej: Tablero principal, cámara en hall de acceso, conexión estanca..."
          />
        </div>

        <div className={styles.uploaderWrapper}>
          <ImageUploader
            onChange={handleAddPhoto}
            label="Selecciona o arrastra la imagen aquí"
          />
        </div>
      </div>

      {/* ── Galería de imágenes cargadas ── */}
      <div className={styles.gallerySection}>
        <div className={styles.galleryHeader}>
          <span className={styles.galleryTitle}>
            <ImageIcon size={15} />
            Imágenes cargadas
            {fotos.length > 0 && (
              <span className={styles.counterBadge}>
                {fotos.length} {fotos.length === 1 ? 'fotografía' : 'fotografías'}
              </span>
            )}
          </span>
        </div>

        {fotos.length === 0 ? (
          <div className={styles.emptyGallery}>
            <Camera size={26} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No hay fotografías adjuntas aún.</p>
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {fotos.map((foto, index) => (
              <div key={index} className={styles.photoCard}>
                <div className={styles.photoPreviewWrapper}>
                  <img
                    src={foto.url}
                    alt={foto.descripcion || `Foto ${index + 1}`}
                    className={styles.photoImg}
                  />
                  <span className={styles.photoIndexBadge}>#{index + 1}</span>

                  <div className={styles.photoActions}>
                    <a
                      href={foto.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionBtn}
                      title="Ver imagen en tamaño completo"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleRemovePhoto(index)}
                      title="Eliminar fotografía"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className={styles.photoCaptionContainer}>
                  <div className={styles.captionHeader}>
                    <label className={styles.captionLabel}>
                      <Tag size={11} />
                      Descripción:
                    </label>
                  </div>
                  <input
                    type="text"
                    className={styles.captionInput}
                    value={foto.descripcion || ''}
                    onChange={(e) => handleUpdateDescription(index, e.target.value)}
                    placeholder="Descripción opcional..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
