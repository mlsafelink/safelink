import { useEffect, useRef, useCallback } from 'react';
import styles from './Lightbox.module.css';

export interface LightboxMediaItem {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  title: string;
  caption?: string | null;
}

interface LightboxProps {
  items: LightboxMediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ items, currentIndex, onClose, onNavigate }: LightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const currentItem = items[currentIndex];

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    onNavigate(prevIndex);
  }, [currentIndex, items.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    const nextIndex = (currentIndex + 1) % items.length;
    onNavigate(nextIndex);
  }, [currentIndex, items.length, onNavigate]);

  // Teclado: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Bloquear scroll del body mientras el lightbox esté abierto
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, handlePrev, handleNext]);

  // Gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Umbral de 45px para swipe
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  if (!currentItem) return null;

  const isVideo = currentItem.media_type === 'video' || /\.(mp4|webm|mov)$/i.test(currentItem.media_url);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Visor multimedia"
    >
      {/* Barra superior */}
      <div className={styles.topBar} onClick={e => e.stopPropagation()}>
        <div className={styles.counter}>
          {isVideo && <span className={styles.videoIndicator}>🎥 VIDEO · </span>}
          {currentIndex + 1} / {items.length}
        </div>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Cerrar visor"
          title="Cerrar (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Contenedor principal de medios y navegación */}
      <div className={styles.imageContainer} onClick={e => e.stopPropagation()}>
        {items.length > 1 && (
          <button
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={handlePrev}
            aria-label="Anterior"
            title="Anterior (Flecha izquierda)"
          >
            ‹
          </button>
        )}

        <div className={styles.mediaWrapper}>
          {isVideo ? (
            <video
              key={currentItem.id || currentItem.media_url}
              src={currentItem.media_url}
              controls
              playsInline
              preload="metadata"
              className={styles.videoPlayer}
            />
          ) : (
            <img
              key={currentItem.id || currentItem.media_url}
              src={currentItem.media_url}
              alt={currentItem.title}
              className={styles.image}
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={handleNext}
            aria-label="Siguiente"
            title="Siguiente (Flecha derecha)"
          >
            ›
          </button>
        )}
      </div>

      {/* Pie de foto / Título y epígrafe */}
      <div className={styles.captionBar} onClick={e => e.stopPropagation()}>
        <h3 className={styles.captionTitle}>{currentItem.title}</h3>
        {currentItem.caption && (
          <p className={styles.captionDesc}>{currentItem.caption}</p>
        )}
      </div>
    </div>
  );
}
