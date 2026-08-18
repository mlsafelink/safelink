import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { infraestructuraService } from '@/services/infraestructuraService';
import logoImg from '@/assets/logo.png';
import {
  ZoomIn, ZoomOut, RotateCcw, Shield,
  ArrowRight, Building,
} from 'lucide-react';
import styles from './PublicPlanoViewer.module.css';

export function PublicPlanoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['public-infra-plan', publicId],
    queryFn: () => infraestructuraService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
  };

  const elements = plan?.elementos || [];
  const selectedElement = elements.find(el => el.id === selectedElementId);
  const parentElement = selectedElement?.parent_element_id
    ? elements.find(el => el.id === selectedElement.parent_element_id)
    : null;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <span>Cargando plano de infraestructura...</span>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className={styles.errorContainer}>
        <Shield size={48} className={styles.errorIcon} />
        <h2>Documento no encontrado</h2>
        <p>El enlace de infraestructura puede ser incorrecto o ya no se encuentra disponible.</p>
      </div>
    );
  }

  const clientName =
    plan.consorcio?.nombre ||
    plan.particular?.nombre ||
    'Cliente SafeLink';

  return (
    <div className={styles.publicViewerLayout}>
      {/* Header Institucional Seguro */}
      <header className={styles.header}>
        <div className={styles.logoWrap}>
          <img src={logoImg} alt="SafeLink Logo" className={styles.logoImage} />
          <div className={styles.logoText}>
            <h2>SafeLink</h2>
            <span>Infraestructura Técnica</span>
          </div>
        </div>

        <div className={styles.planHeaderInfo}>
          <div className={styles.titleBadgeRow}>
            <h1>{plan.nombre}</h1>
            <span
              className={`${styles.typeBadge} ${
                plan.tipo === 'redes'
                  ? styles.badgeRedes
                  : plan.tipo === 'camaras'
                  ? styles.badgeCamaras
                  : styles.badgeMixto
              }`}
            >
              {plan.tipo.toUpperCase()}
            </span>
          </div>
          <div className={styles.clientSubtitle}>
            <Building size={14} />
            <span>{clientName}</span>
          </div>
        </div>
      </header>

      {/* Workspace de Visualización de Solo Lectura */}
      <div className={styles.viewerWorkspace}>
        <main
          className={`${styles.canvasViewport} ${isPanning ? styles.cursorGrabbing : styles.cursorGrab}`}
          ref={canvasRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onMouseLeave={handleMouseUpCanvas}
        >
          {/* Contenedor con Transform (Zoom & Pan) */}
          <div
            className={styles.canvasTransformWrapper}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <div className={styles.planImageContainer}>
              {/* Imagen / Plano PDF de Fondo */}
              <img
                src={plan.archivo_url}
                alt={plan.nombre}
                className={styles.planImage}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
                }}
              />

              {/* Marcadores Técnicos Interactivos (Solo Lectura) */}
              {elements.map(elem => {
                const isSelected = selectedElementId === elem.id;
                const isParentOfSelected = selectedElement?.parent_element_id === elem.id;

                return (
                  <div
                    key={elem.id}
                    className={`${styles.markerPin} ${isSelected ? styles.markerSelected : ''} ${
                      isParentOfSelected ? styles.markerParentHighlight : ''
                    } ${styles[`marker_${elem.tipo}`]}`}
                    style={{
                      left: `${elem.pos_x}%`,
                      top: `${elem.pos_y}%`,
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedElementId(elem.id);
                    }}
                    title={`${elem.codigo} — ${elem.nombre}`}
                  >
                    <div className={styles.markerBadge}>
                      {elem.tipo === 'switch' ? '🌐' :
                       elem.tipo === 'boca' ? '🔌' :
                       elem.tipo === 'ap' ? '📡' :
                       elem.tipo === 'dvr' ? '🖥️' : '📹'}
                    </div>
                    <span className={styles.markerLabel}>{elem.codigo}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controles Flotantes de Zoom */}
          <div className={styles.zoomControls}>
            <button className={styles.zoomBtn} onClick={handleZoomIn} title="Acercar">
              <ZoomIn size={18} />
            </button>
            <span className={styles.zoomPercent}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={handleZoomOut} title="Alejar">
              <ZoomOut size={18} />
            </button>
            <button className={styles.zoomBtn} onClick={handleResetZoom} title="Restablecer">
              <RotateCcw size={16} />
            </button>
          </div>
        </main>

        {/* Inspector de Elemento Seleccionado (Solo Lectura) */}
        {selectedElement && (
          <aside className={styles.inspectorSidebar}>
            <div className={styles.inspectorHeader}>
              <span className={styles.inspectorTag}>Detalle Técnico</span>
              <button
                className={styles.closeInspectorBtn}
                onClick={() => setSelectedElementId(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.inspectorContent}>
              <div className={styles.inspectorCodeHeader}>
                <span className={`${styles.inspectorTypeBadge} ${styles[`typeBadge_${selectedElement.tipo}`]}`}>
                  {selectedElement.tipo.toUpperCase()}
                </span>
                <h3>{selectedElement.codigo}</h3>
                <p className={styles.inspectorName}>{selectedElement.nombre}</p>
              </div>

              {/* Trazado / Conexión Física */}
              {parentElement && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Conexión Física:</span>
                  <div className={styles.traceMiniRow}>
                    <strong>{parentElement.codigo}</strong>
                    <ArrowRight size={14} />
                    <span className={styles.tracePortHighlight}>
                      {selectedElement.tipo === 'camara' ? `Canal ${selectedElement.puerto_canal}` : `Puerto ${selectedElement.puerto_canal}`}
                    </span>
                  </div>
                  <span className={styles.traceMiniSub}>{parentElement.nombre}</span>
                </div>
              )}

              {/* Propiedades */}
              <div className={styles.inspectorPropsList}>
                {(selectedElement.propiedades as any)?.ubicacion && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Ubicación:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).ubicacion}</span>
                  </div>
                )}
                {(selectedElement.propiedades as any)?.modelo && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Modelo:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).modelo}</span>
                  </div>
                )}
                {selectedElement.tipo === 'switch' && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Puertos:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).cantidadPuertos || 24} Bocas RJ45</span>
                  </div>
                )}
                {selectedElement.tipo === 'dvr' && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Canales:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).cantidadCanales || 16} Canales CCTV</span>
                  </div>
                )}
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Estado:</span>
                  <span className={`${styles.statusPill} ${styles[`status_${selectedElement.estado}`]}`}>
                    {selectedElement.estado}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Footer de solo lectura */}
      <footer className={styles.footer}>
        <span>Documentación generada por <strong>SafeLink Cloud</strong> • Documento técnico privado</span>
      </footer>
    </div>
  );
}
