import { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileArchive,
  Camera,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import type { RelevamientoFoto } from '@/services/relevamientoService';
import {
  descargarFotoIndividual,
  descargarTodasLasFotosRelevamiento,
} from '../utils/descargarFotos';
import styles from './RelevamientoFotoModal.module.css';

interface Props {
  fotos: RelevamientoFoto[];
  initialIndex?: number;
  clienteNombre?: string;
  onClose: () => void;
}

export function RelevamientoFotoModal({
  fotos,
  initialIndex = 0,
  clienteNombre = 'Relevamiento',
  onClose,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.max(0, Math.min(initialIndex, fotos.length - 1))
  );
  const [isZipping, setIsZipping] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const currentFoto = fotos[currentIndex];

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex(prev => (prev + 1) % fotos.length);
  }, [fotos.length]);

  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setCurrentIndex(prev => (prev - 1 + fotos.length) % fotos.length);
  }, [fotos.length]);

  // Teclado: Escape para cerrar, Flechas para navegar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Descargar foto actual
  const handleDownloadCurrent = async () => {
    if (!currentFoto) return;
    await descargarFotoIndividual(currentFoto, clienteNombre, currentIndex + 1);
  };

  // Descargar todas las fotos
  const handleDownloadAll = async () => {
    if (!fotos || fotos.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      await descargarTodasLasFotosRelevamiento(fotos, clienteNombre);
    } catch (err) {
      console.error('Error generando ZIP de fotos:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.35, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.35, 1));
  const handleResetZoom = () => setZoomLevel(1);

  if (!currentFoto) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      {/* ── Barra Superior ── */}
      <div className={styles.topBar} onClick={e => e.stopPropagation()}>
        <div className={styles.topLeft}>
          <div className={styles.cameraIconBox}>
            <Camera size={20} />
          </div>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>
              {clienteNombre} — Fotografía técnica
            </h3>
            <span className={styles.counter}>
              Foto {currentIndex + 1} de {fotos.length}
            </span>
          </div>
        </div>

        <div className={styles.topActions}>
          {/* Zoom controls */}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleZoomIn}
            title="Acercar (Zoom +)"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            title="Alejar (Zoom -)"
          >
            <ZoomOut size={15} />
          </button>
          {zoomLevel > 1 && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleResetZoom}
              title="Restablecer tamaño"
            >
              <RotateCcw size={14} />
            </button>
          )}

          {/* Descargar foto actual */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={handleDownloadCurrent}
            title="Descargar esta foto en resolución original"
          >
            <Download size={15} />
            <span>Descargar foto</span>
          </button>

          {/* Descargar todas (si hay más de 1) */}
          {fotos.length > 1 && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleDownloadAll}
              disabled={isZipping}
              title="Descargar todas las fotos empaquetadas en un archivo .ZIP"
            >
              {isZipping ? (
                <>
                  <Loader2 size={15} className={styles.spinner} />
                  <span>Generando ZIP…</span>
                </>
              ) : (
                <>
                  <FileArchive size={15} />
                  <span>Descargar todas ({fotos.length})</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar visor"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ── Área Principal de Visualización ── */}
      <div className={styles.mainArea} onClick={e => e.stopPropagation()}>
        {/* Flecha Anterior */}
        {fotos.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnLeft}`}
            onClick={handlePrev}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        <div className={styles.imageWrapper}>
          <img
            src={currentFoto.dataUrl}
            alt={currentFoto.descripcion || `Foto ${currentIndex + 1} de ${clienteNombre}`}
            className={styles.currentImage}
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>

        {/* Flecha Siguiente */}
        {fotos.length > 1 && (
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnRight}`}
            onClick={handleNext}
            aria-label="Foto siguiente"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* ── Barra Inferior con Tira de Miniaturas ── */}
      <div className={styles.bottomBar} onClick={e => e.stopPropagation()}>
        {currentFoto.descripcion && (
          <div className={styles.descripcionBox}>
            {currentFoto.descripcion}
          </div>
        )}

        {fotos.length > 1 && (
          <div className={styles.thumbnailsStrip}>
            {fotos.map((f, idx) => (
              <div
                key={f.id || idx}
                className={`${styles.thumbItem} ${
                  idx === currentIndex ? styles.thumbItemActive : ''
                }`}
                onClick={() => {
                  setZoomLevel(1);
                  setCurrentIndex(idx);
                }}
                title={`Ver foto ${idx + 1}`}
              >
                <img src={f.dataUrl} alt={`Miniatura ${idx + 1}`} className={styles.thumbImg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
