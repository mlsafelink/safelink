import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infraestructuraService } from '@/services/infraestructuraService';
import { ElementoDetalleModal } from '../components/ElementoDetalleModal';
import { CompartirPlanoModal } from '../components/CompartirPlanoModal';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw,
  Save, Share2, Network, Video, Wifi,
  Server, Shield, Info, Trash2, Edit3,
  Eye, ArrowRight,
} from 'lucide-react';
import type {
  ElementoPlano,
  ElementoTipo,
} from '@/types/infraestructura';
import styles from './PlanoEditorPage.module.css';

export function PlanoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [elements, setElements] = useState<ElementoPlano[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [addingType, setAddingType] = useState<ElementoTipo | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Zoom y Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Arrastre de pines
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Cargar Plano
  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['infra-plan', id],
    queryFn: () => infraestructuraService.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (plan?.elementos) {
      setElements(JSON.parse(JSON.stringify(plan.elementos)));
      setHasUnsavedChanges(false);
    }
  }, [plan]);

  // Guardar cambios mutation
  const saveMutation = useMutation({
    mutationFn: () => infraestructuraService.saveElements(id!, elements),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infra-plan', id] });
      queryClient.invalidateQueries({ queryKey: ['infra-plans'] });
      queryClient.invalidateQueries({ queryKey: ['infra-summary'] });
      setHasUnsavedChanges(false);
      showToast('Los elementos técnicos han sido guardados con éxito.', 'success');
    },
    onError: (err: any) => {
      showToast(err?.message || 'No se pudieron guardar los cambios.', 'error');
    },
  });

  // ── Controles de Zoom y Pan ──
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    // Si estamos haciendo clic en el fondo (no en un pin)
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'IMG') {
      if (addingType) {
        // Colocar nuevo elemento
        handlePlaceElementAt(e);
      } else {
        // Iniciar Pan
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingElementId && imageRef.current) {
      // Arrastrar marcador
      const rect = imageRef.current.getBoundingClientRect();
      const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      setElements(prev =>
        prev.map(el =>
          el.id === draggingElementId ? { ...el, pos_x: Math.round(xPercent * 10) / 10, pos_y: Math.round(yPercent * 10) / 10 } : el
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanning(false);
    setDraggingElementId(null);
  };

  // Colocar un nuevo elemento en el lienzo
  const handlePlaceElementAt = (e: React.MouseEvent) => {
    if (!addingType || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    // Contar cuántos hay de este tipo para el código automático
    const countType = elements.filter(el => el.tipo === addingType).length + 1;
    const prefix =
      addingType === 'switch' ? 'SW' :
      addingType === 'boca' ? 'P' :
      addingType === 'ap' ? 'AP' :
      addingType === 'dvr' ? 'DVR' : 'CAM';
    const autoCode = `${prefix}-${countType.toString().padStart(2, '0')}`;

    const newElement: ElementoPlano = {
      id: crypto.randomUUID(),
      plan_id: id!,
      tipo: addingType,
      codigo: autoCode,
      nombre: `${prefix === 'SW' ? 'Switch' : prefix === 'P' ? 'Puesto de Red' : prefix === 'AP' ? 'Access Point' : prefix === 'DVR' ? 'Grabador DVR/NVR' : 'Cámara'} ${countType}`,
      pos_x: Math.round(xPercent * 10) / 10,
      pos_y: Math.round(yPercent * 10) / 10,
      estado: 'activo',
      propiedades: addingType === 'switch' ? { cantidadPuertos: 24 } : addingType === 'dvr' ? { cantidadCanales: 16 } : {},
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setAddingType(null);
    setHasUnsavedChanges(true);
    showToast(`Se colocó ${newElement.codigo} sobre el plano. Podés configurarlo ahora.`, 'info');
  };

  const handleUpdateElement = (updated: ElementoPlano) => {
    setElements(prev => prev.map(el => (el.id === updated.id ? updated : el)));
    setHasUnsavedChanges(true);
  };

  const handleDeleteElement = (elemId: string) => {
    setElements(prev => prev.filter(el => el.id !== elemId));
    if (selectedElementId === elemId) setSelectedElementId(null);
    setHasUnsavedChanges(true);
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);
  const parentElement = selectedElement?.parent_element_id
    ? elements.find(el => el.id === selectedElement.parent_element_id)
    : null;

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando plano interactivo...</p>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className={styles.errorContainer}>
        <Shield size={48} className={styles.errorIcon} />
        <h2>Plano no encontrado</h2>
        <p>El plano solicitado no existe o ha sido removido.</p>
        <Button variant="secondary" onClick={() => navigate('/infraestructura')}>
          Volver a Infraestructura
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.editorPage}>
      {/* ── Top Bar / Header del Editor ── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/infraestructura')} title="Volver">
            <ArrowLeft size={18} />
          </button>
          <div className={styles.planTitleWrap}>
            <div className={styles.titleRow}>
              <h1>{plan.nombre}</h1>
              <span
                className={`${styles.typeBadge} ${
                  plan.tipo === 'redes' ? styles.badgeRedes : plan.tipo === 'camaras' ? styles.badgeCamaras : styles.badgeMixto
                }`}
              >
                {plan.tipo.toUpperCase()}
              </span>
              {hasUnsavedChanges && (
                <span className={styles.unsavedBadge}>• Cambios sin guardar</span>
              )}
            </div>
            <p className={styles.clientSubtitle}>
              {plan.consorcio?.nombre || plan.particular?.nombre || 'Plano de Infraestructura Técnica'}
            </p>
          </div>
        </div>

        <div className={styles.topRight}>
          <Button
            variant="secondary"
            leftIcon={<Share2 size={16} />}
            onClick={() => setIsShareModalOpen(true)}
            className={styles.headerActionBtn}
          >
            Compartir Enlace
          </Button>

          <button
            className={styles.iconActionBtn}
            onClick={() => window.open(`/p/plano/${plan.public_id || plan.id}`, '_blank')}
            title="Vista de cliente"
          >
            <Eye size={18} />
          </button>

          <Button
            variant="primary"
            leftIcon={<Save size={16} />}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className={styles.saveBtn}
          >
            Guardar Cambios
          </Button>
        </div>
      </header>

      {/* ── Contenedor Principal: Herramientas + Lienzo + Inspector ── */}
      <div className={styles.editorWorkspace}>
        {/* ── 1. Paleta de Herramientas Lateral ── */}
        <aside className={styles.toolsSidebar}>
          <div className={styles.toolsHeader}>
            <span>Herramientas</span>
          </div>

          <div className={styles.toolsGroup}>
            <span className={styles.toolsGroupLabel}>Redes</span>
            <button
              className={`${styles.toolBtn} ${addingType === 'switch' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'switch' ? null : 'switch')}
              title="Colocar Switch en el plano"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapBlue}`}>
                <Network size={18} />
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Switch</strong>
                <span>Rack / Core</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'boca' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'boca' ? null : 'boca')}
              title="Colocar Boca / Puesto de red"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapGreen}`}>
                <Server size={18} />
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Boca / Puesto</strong>
                <span>RJ45 Cat6</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'ap' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'ap' ? null : 'ap')}
              title="Colocar Access Point WiFi"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapPurple}`}>
                <Wifi size={18} />
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Access Point</strong>
                <span>Punto de Acceso</span>
              </div>
            </button>
          </div>

          <div className={styles.toolsGroup}>
            <span className={styles.toolsGroupLabel}>Videovigilancia</span>
            <button
              className={`${styles.toolBtn} ${addingType === 'dvr' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'dvr' ? null : 'dvr')}
              title="Colocar Grabador DVR / NVR"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapViolet}`}>
                <Video size={18} />
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ DVR / NVR</strong>
                <span>Grabador CCTV</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'camara' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'camara' ? null : 'camara')}
              title="Colocar Cámara de seguridad"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapRose}`}>
                <Video size={18} />
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Cámara</strong>
                <span>Domo / Bullet</span>
              </div>
            </button>
          </div>

          {addingType && (
            <div className={styles.addingPrompt}>
              <Info size={16} />
              <span>Hacé clic en el plano donde querés colocar el elemento.</span>
            </div>
          )}

          {/* Lista rápida de elementos */}
          <div className={styles.elementsQuickList}>
            <span className={styles.toolsGroupLabel}>Elementos ({elements.length})</span>
            <div className={styles.quickElementsScroll}>
              {elements.map(el => (
                <button
                  key={el.id}
                  className={`${styles.quickElementItem} ${selectedElementId === el.id ? styles.quickElementSelected : ''}`}
                  onClick={() => setSelectedElementId(el.id)}
                >
                  <span className={`${styles.typeDot} ${styles[`typeDot_${el.tipo}`]}`} />
                  <strong>{el.codigo}</strong>
                  <span>{el.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── 2. Lienzo Interactivo del Plano ── */}
        <main
          className={`${styles.canvasViewport} ${addingType ? styles.cursorCrosshair : isPanning ? styles.cursorGrabbing : styles.cursorGrab}`}
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
                ref={imageRef}
                src={plan.archivo_url}
                alt={plan.nombre}
                className={styles.planImage}
                draggable={false}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
                }}
              />

              {/* ── Capa Vectorial de Marcadores Interactivos ── */}
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
                    onMouseDown={e => {
                      e.stopPropagation();
                      setDraggingElementId(elem.id);
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

          {/* ── Controles Flotantes de Zoom ── */}
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

        {/* ── 3. Panel Inspector Lateral Derecho (Elemento Seleccionado) ── */}
        {selectedElement && (
          <aside className={styles.inspectorSidebar}>
            <div className={styles.inspectorHeader}>
              <span className={styles.inspectorTag}>Inspector Técnico</span>
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

              {/* Trazado / Conexión */}
              {parentElement && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Conectado a:</span>
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

              {/* Propiedades Clave */}
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
                {(selectedElement.propiedades as any)?.ip && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>IP:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).ip}</span>
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

              {/* Botón para abrir modal completo */}
              <Button
                variant="primary"
                leftIcon={<Edit3 size={16} />}
                onClick={() => setIsDetailModalOpen(true)}
                className={styles.inspectorEditBtn}
              >
                Editar Parámetros y Puertos
              </Button>

              <button
                className={styles.inspectorDeleteBtn}
                onClick={() => handleDeleteElement(selectedElement.id)}
              >
                <Trash2 size={14} />
                <span>Quitar del plano</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Modal Detallado de Configuración Técnica */}
      <ElementoDetalleModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        elemento={selectedElement || null}
        todosElementos={elements}
        onSave={handleUpdateElement}
        onDelete={handleDeleteElement}
      />

      {/* Modal de Compartir Enlace */}
      <CompartirPlanoModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        plan={plan}
      />
    </div>
  );
}
