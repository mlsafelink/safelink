import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import styles from './PlanoBackgroundView.module.css';

// Configuración del worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PlanoBackgroundViewProps {
  archivoUrl: string;
  archivoTipo?: 'pdf' | 'imagen';
  nombre?: string;
  className?: string;
  imageRef?: React.RefObject<HTMLImageElement | HTMLCanvasElement | null>;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
}

export const PlanoBackgroundView: React.FC<PlanoBackgroundViewProps> = ({
  archivoUrl,
  archivoTipo,
  nombre = 'Plano',
  className,
  imageRef,
  onDimensionsChange,
}) => {
  const isPdf =
    archivoTipo === 'pdf' ||
    archivoUrl?.toLowerCase().includes('.pdf') ||
    archivoUrl?.startsWith('data:application/pdf');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalImageRef = useRef<HTMLImageElement | null>(null);

  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(isPdf);
  const [error, setError] = useState<string | null>(null);

  // Exponer ref al componente padre (PlanoEditorPage espera imageRef.current con getBoundingClientRect)
  const setCombinedRef = (node: HTMLCanvasElement | null) => {
    canvasRef.current = node;
    if (imageRef) {
      (imageRef as React.MutableRefObject<HTMLCanvasElement | HTMLImageElement | null>).current = node;
    }
  };

  const setImageCombinedRef = (node: HTMLImageElement | null) => {
    internalImageRef.current = node;
    if (imageRef) {
      (imageRef as React.MutableRefObject<HTMLCanvasElement | HTMLImageElement | null>).current = node;
    }
  };

  useEffect(() => {
    if (!isPdf || !archivoUrl) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let renderTask: any = null;

    const renderPDFPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument({
          url: archivoUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        setNumPages(pdf.numPages);

        const page = await pdf.getPage(pageNumber);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Renderizado nítido a 2x o pixelRatio para pantallas de alta densidad
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
        const unscaledViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: pixelRatio });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Aspect ratio proporcional en CSS
        canvas.style.aspectRatio = `${unscaledViewport.width} / ${unscaledViewport.height}`;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
        if (!isMounted) return;

        setIsLoading(false);

        if (onDimensionsChange) {
          onDimensionsChange({
            width: unscaledViewport.width,
            height: unscaledViewport.height,
          });
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.error('[PlanoBackgroundView] Error al renderizar PDF:', err);
        if (isMounted) {
          setError('No se pudo renderizar el plano PDF. Verifique el archivo.');
          setIsLoading(false);
        }
      }
    };

    renderPDFPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [archivoUrl, isPdf, pageNumber, onDimensionsChange]);

  // Si no es PDF, renderizar imagen tradicional
  if (!isPdf) {
    return (
      <img
        ref={setImageCombinedRef}
        src={archivoUrl}
        alt={nombre}
        className={className}
        draggable={false}
      />
    );
  }

  return (
    <div className={styles.pdfWrapper}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <Loader2 className={styles.spinner} size={32} />
          <span>Cargando plano PDF original...</span>
        </div>
      )}

      {error ? (
        <div className={styles.errorOverlay}>
          <AlertCircle size={28} />
          <span>{error}</span>
        </div>
      ) : (
        <canvas
          ref={setCombinedRef}
          className={`${className || ''} ${styles.pdfCanvas}`}
          draggable={false}
        />
      )}

      {/* Controles discretos de páginas múltiples si el PDF contiene más de 1 página */}
      {numPages > 1 && (
        <div className={styles.paginationBar} onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageIndicator}>
            Pág. {pageNumber} / {numPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            title="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
