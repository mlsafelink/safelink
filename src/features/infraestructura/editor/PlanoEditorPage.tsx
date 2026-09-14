import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infraestructuraService } from '@/services/infraestructuraService';
import { ElementoDetalleModal } from '../components/ElementoDetalleModal';
import { CompartirPlanoModal } from '../components/CompartirPlanoModal';
import { PlanoBackgroundView } from '../components/PlanoBackgroundView';
import {
  DISPOSITIVOS_CATALOGO,
  getDispositivoMeta,
} from '../constants/dispositivos';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw,
  Save, Share2, Shield, Info, Trash2, Edit3,
  Eye, ArrowRight, Zap, Globe,
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
  const imageRef = useRef<HTMLImageElement | HTMLCanvasElement | null>(null);

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
    // Si estamos haciendo clic en el fondo (no en un pin o popover)
    const tagName = (e.target as HTMLElement).tagName;
    if (e.target === canvasRef.current || tagName === 'IMG' || tagName === 'CANVAS') {
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

    const meta = getDispositivoMeta(addingType);
    const countType = elements.filter(el => el.tipo === addingType).length + 1;
    const autoCode = `${meta.codigoPrefix}-${countType.toString().padStart(2, '0')}`;

    const newElement: ElementoPlano = {
      id: crypto.randomUUID(),
      plan_id: id!,
      tipo: addingType,
      codigo: autoCode,
      nombre: `${meta.nombre} ${countType}`,
      description: '',
      pos_x: Math.round(xPercent * 10) / 10,
      pos_y: Math.round(yPercent * 10) / 10,
      estado: 'activo',
      propiedades:
        addingType === 'modem'
          ? { proveedor: 'Fibertel', tipoConexion: 'Fibra', ip: '192.168.1.1' }
          : addingType === 'switch'
          ? { cantidadPuertos: 24 }
          : addingType === 'dvr'
          ? { cantidadCanales: 16 }
          : addingType === 'rack'
          ? { unidades: 12, tipoMontaje: 'Mural' }
          : addingType === 'periscopio'
          ? { cantidadBocas: 4, tipoCable: 'Cat 6 UTP' }
          : addingType === 'boca'
          ? { tipoCable: 'Cat 6 UTP', use_poe_injector: false }
          : addingType.startsWith('alarma_')
          ? { tipoConexion: 'Cableada', zona: `Zona ${countType.toString().padStart(2, '0')}` }
          : {},
    };

    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    setAddingType(null);
    setHasUnsavedChanges(true);
    showToast(`Se colocó ${newElement.codigo} (${meta.nombre}) sobre el plano.`, 'info');
  };

  const handleUpdateElement = (updated: ElementoPlano) => {
    setElements(prev => prev.map(el => (el.id === updated.id ? updated : el)));
    setHasUnsavedChanges(true);
  };

  const handleDeleteElement = (elemId: string) => {
    setElements(prev =>
      prev
        .filter(el => el.id !== elemId)
        .map(el => {
          if (el.parent_element_id === elemId) {
            const props = { ...(el.propiedades as any) };
            delete props.modemId;
            delete props.switchId;
            delete props.dvrId;
            return { ...el, parent_element_id: null, propiedades: props };
          }
          if ((el.propiedades as any)?.modemId === elemId) {
            const props = { ...(el.propiedades as any) };
            delete props.modemId;
            return { ...el, propiedades: props };
          }
          return el;
        })
    );
    if (selectedElementId === elemId) setSelectedElementId(null);
    setHasUnsavedChanges(true);
    showToast('Elemento eliminado del plano.', 'info');
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);
  const parentElement = selectedElement?.parent_element_id
    ? elements.find(el => el.id === selectedElement.parent_element_id)
    : null;

  // Módem padre del switch (si el seleccionado es un switch)
  const modemOfCurrentSwitch =
    selectedElement?.tipo === 'switch'
      ? elements.find(
          el =>
            el.tipo === 'modem' &&
            (el.id === selectedElement.parent_element_id || el.id === (selectedElement.propiedades as any)?.modemId)
        )
      : null;

  // Módem del switch padre (si el seleccionado es boca o ap)
  const modemOfParentSwitch =
    parentElement && parentElement.tipo === 'switch'
      ? elements.find(
          el =>
            el.tipo === 'modem' &&
            (el.id === parentElement.parent_element_id || el.id === (parentElement.propiedades as any)?.modemId)
        )
      : null;

  // Switches conectados a este módem (si el seleccionado es un módem)
  const switchesConnectedToModem =
    selectedElement?.tipo === 'modem'
      ? elements.filter(
          el =>
            el.tipo === 'switch' &&
            (el.parent_element_id === selectedElement.id || (el.propiedades as any)?.modemId === selectedElement.id)
        )
      : [];

  // Elementos conectados a este switch
  const endpointsConnectedToSwitch =
    selectedElement?.tipo === 'switch'
      ? elements.filter(el => el.parent_element_id === selectedElement.id)
      : [];

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

          {/* Categoría: Redes */}
          <div className={styles.toolsGroup}>
            <span className={styles.toolsGroupLabel}>Redes</span>

            <button
              className={`${styles.toolBtn} ${addingType === 'ap' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'ap' ? null : 'ap')}
              title="Colocar Access Point WiFi"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapPurple}`}>
                {DISPOSITIVOS_CATALOGO.ap.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Access Point</strong>
                <span>Punto de Acceso</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'rack' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'rack' ? null : 'rack')}
              title="Colocar Rack de Comunicaciones"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapIndigo}`}>
                {DISPOSITIVOS_CATALOGO.rack.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Rack</strong>
                <span>Gabinete mural/piso</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'periscopio' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'periscopio' ? null : 'periscopio')}
              title="Colocar Periscopio de red (en piso)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapGreen}`}>
                {DISPOSITIVOS_CATALOGO.periscopio.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Periscopio</strong>
                <span>En piso</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'boca' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'boca' ? null : 'boca')}
              title="Colocar Boca de red (en pared)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapBlue}`}>
                {DISPOSITIVOS_CATALOGO.boca.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Boca de red</strong>
                <span>En pared</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'switch' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'switch' ? null : 'switch')}
              title="Colocar Switch en el plano"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapBlue}`}>
                {DISPOSITIVOS_CATALOGO.switch.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Switch</strong>
                <span>Distribución LAN</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'modem' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'modem' ? null : 'modem')}
              title="Colocar Módem de Acceso (ISP / WAN)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapAmber}`}>
                {DISPOSITIVOS_CATALOGO.modem.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Módem</strong>
                <span>Equipo de acceso</span>
              </div>
            </button>
          </div>

          {/* Categoría: Alarmas */}
          <div className={styles.toolsGroup}>
            <span className={styles.toolsGroupLabel}>Alarma</span>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_central' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_central' ? null : 'alarma_central')}
              title="Colocar Central de Alarma"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapRed}`}>
                {DISPOSITIVOS_CATALOGO.alarma_central.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Central</strong>
                <span>Panel de alarma</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_sirena_interior' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_sirena_interior' ? null : 'alarma_sirena_interior')}
              title="Colocar Sirena interior"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapOrange}`}>
                {DISPOSITIVOS_CATALOGO.alarma_sirena_interior.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Sirena interior</strong>
                <span>Alerta sonora</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_sirena_exterior' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_sirena_exterior' ? null : 'alarma_sirena_exterior')}
              title="Colocar Sirena exterior"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapOrange}`}>
                {DISPOSITIVOS_CATALOGO.alarma_sirena_exterior.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Sirena exterior</strong>
                <span>Con flash exterior</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_magnetico' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_magnetico' ? null : 'alarma_magnetico')}
              title="Colocar Sensor Magnético de puerta o ventana"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapYellow}`}>
                {DISPOSITIVOS_CATALOGO.alarma_magnetico.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Magnético</strong>
                <span>Apertura puerta/ventana</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_movimiento' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_movimiento' ? null : 'alarma_movimiento')}
              title="Colocar Sensor de movimiento (punto azul)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapBlue}`}>
                {DISPOSITIVOS_CATALOGO.alarma_movimiento.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Sensor mov.</strong>
                <span>Sensor PIR</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_humo' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_humo' ? null : 'alarma_humo')}
              title="Colocar Sensor de humo (punto rojo)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapRed}`}>
                {DISPOSITIVOS_CATALOGO.alarma_humo.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Sensor humo</strong>
                <span>Detección incendio</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'alarma_teclado' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'alarma_teclado' ? null : 'alarma_teclado')}
              title="Colocar Teclado de Alarma"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapCyan}`}>
                {DISPOSITIVOS_CATALOGO.alarma_teclado.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Teclado</strong>
                <span>Armado / Desarmado</span>
              </div>
            </button>
          </div>

          {/* Categoría: Videovigilancia */}
          <div className={styles.toolsGroup}>
            <span className={styles.toolsGroupLabel}>Videovigilancia</span>
            <button
              className={`${styles.toolBtn} ${addingType === 'dvr' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'dvr' ? null : 'dvr')}
              title="Colocar Grabador DVR / NVR"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapViolet}`}>
                {DISPOSITIVOS_CATALOGO.dvr.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ DVR / NVR</strong>
                <span>Grabador CCTV</span>
              </div>
            </button>

            <button
              className={`${styles.toolBtn} ${addingType === 'camara' ? styles.toolBtnActive : ''}`}
              onClick={() => setAddingType(addingType === 'camara' ? null : 'camara')}
              title="Colocar Cámara de seguridad (punto verde)"
            >
              <div className={`${styles.toolIconWrap} ${styles.iconWrapGreen}`}>
                {DISPOSITIVOS_CATALOGO.camara.renderSidebarIcon(18)}
              </div>
              <div className={styles.toolBtnText}>
                <strong>+ Cámara</strong>
                <span>CCTV</span>
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
                  <span className={`${styles.typeDot} ${styles[`typeDot_${el.tipo}`] || ''}`} />
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
              {/* Plano PDF o Imagen de Fondo */}
              <PlanoBackgroundView
                archivoUrl={plan.archivo_url}
                archivoTipo={plan.archivo_tipo}
                nombre={plan.nombre}
                className={styles.planImage}
                imageRef={imageRef}
              />

              {/* ── Capa Vectorial de Marcadores Interactivos ── */}
              {elements.map(elem => {
                const isSelected = selectedElementId === elem.id;
                const isParentOfSelected = selectedElement?.parent_element_id === elem.id;
                const meta = getDispositivoMeta(elem.tipo);

                return (
                  <div
                    key={elem.id}
                    className={`${styles.markerPin} ${isSelected ? styles.markerSelected : ''} ${
                      isParentOfSelected ? styles.markerParentHighlight : ''
                    } ${styles[`marker_${elem.tipo}`] || ''}`}
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
                    title={`${elem.codigo} — ${elem.nombre}${elem.description ? ` (${elem.description})` : ''}`}
                  >
                    {/* Popover flotante informativo al seleccionar en el plano */}
                    {isSelected && (
                      <div
                        className={styles.markerPopover}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      >
                        <div className={styles.markerPopoverTitle}>
                          <span>{meta.badgeContent}</span>
                          <strong>{elem.codigo}</strong>
                          <span className={styles.markerPopoverType}>{meta.nombre}</span>
                        </div>
                        {elem.description ? (
                          <p className={styles.markerPopoverDesc}>{elem.description}</p>
                        ) : (
                          <p className={styles.markerPopoverDesc} style={{ fontStyle: 'italic', opacity: 0.7 }}>
                            Sin descripción (opcional)
                          </p>
                        )}
                        <div className={styles.markerPopoverActions}>
                          <button
                            type="button"
                            className={styles.popoverEditBtn}
                            onClick={() => setIsDetailModalOpen(true)}
                          >
                            <Edit3 size={11} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className={styles.popoverDeleteBtn}
                            onClick={() => handleDeleteElement(elem.id)}
                          >
                            <Trash2 size={11} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={styles.markerBadge}>
                      {meta.badgeContent}
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

              {/* ── Trazado de Conexión en Inspector ── */}

              {/* CASO A: Dispositivo (Boca / AP) conectado a Switch */}
              {parentElement && (selectedElement.tipo === 'boca' || selectedElement.tipo === 'ap') && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Trazado de Conexión:</span>
                  <div className={styles.traceMiniRow}>
                    <span className={styles.traceNodeBadgeMini}>{selectedElement.codigo}</span>

                    {(selectedElement.propiedades as any)?.use_poe_injector && (
                      <>
                        <ArrowRight size={12} className={styles.traceMiniArrow} />
                        <span
                          className={`${styles.poeMiniBadge} ${
                            (selectedElement.propiedades as any)?.poe_voltage === '48V'
                              ? styles.poe48Badge
                              : styles.poe24Badge
                          }`}
                        >
                          <Zap size={10} />
                          PoE {(selectedElement.propiedades as any)?.poe_voltage || '24V'}
                        </span>
                      </>
                    )}

                    <ArrowRight size={12} className={styles.traceMiniArrow} />
                    <span
                      className={styles.traceNodeBadgeMini}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setSelectedElementId(parentElement.id)}
                      title="Ver Switch"
                    >
                      {parentElement.codigo}
                    </span>

                    <ArrowRight size={12} className={styles.traceMiniArrow} />
                    <span className={styles.tracePortHighlight}>
                      Puerto {selectedElement.puerto_canal || '01'}
                    </span>

                    {modemOfParentSwitch && (
                      <>
                        <ArrowRight size={12} className={styles.traceMiniArrow} />
                        <span
                          className={styles.modemMiniBadge}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedElementId(modemOfParentSwitch.id)}
                          title="Ver Módem"
                        >
                          <Globe size={10} />
                          {modemOfParentSwitch.codigo}
                        </span>

                        <ArrowRight size={12} className={styles.traceMiniArrow} />
                        <span className={styles.internetMiniBadge}>
                          Internet
                        </span>
                      </>
                    )}
                  </div>
                  <span className={styles.traceMiniSub}>{parentElement.nombre}</span>
                </div>
              )}

              {/* CASO B: Switch */}
              {selectedElement.tipo === 'switch' && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Trazado de Conexión:</span>
                  <div className={styles.traceMiniRow}>
                    {modemOfCurrentSwitch && (
                      <>
                        <span className={styles.internetMiniBadge}>Internet</span>
                        <ArrowRight size={12} className={styles.traceMiniArrow} />
                        <span
                          className={styles.modemMiniBadge}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedElementId(modemOfCurrentSwitch.id)}
                          title="Ver Módem"
                        >
                          <Globe size={10} />
                          {modemOfCurrentSwitch.codigo}
                        </span>
                        <ArrowRight size={12} className={styles.traceMiniArrow} />
                      </>
                    )}
                    <span className={styles.traceNodeBadgeMini}>{selectedElement.codigo}</span>
                    <ArrowRight size={12} className={styles.traceMiniArrow} />
                    <span className={styles.tracePortHighlight}>
                      {endpointsConnectedToSwitch.length} Dispositivos
                    </span>
                  </div>
                  <span className={styles.traceMiniSub}>
                    {modemOfCurrentSwitch ? `Uplink a ${modemOfCurrentSwitch.codigo} (${(modemOfCurrentSwitch.propiedades as any)?.proveedor || 'ISP'})` : 'Sin módem asociado'}
                  </span>
                </div>
              )}

              {/* CASO C: Módem */}
              {selectedElement.tipo === 'modem' && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Trazado de Conexión:</span>
                  <div className={styles.traceMiniRow}>
                    <span className={styles.internetMiniBadge}>Internet</span>
                    <ArrowRight size={12} className={styles.traceMiniArrow} />
                    <span className={styles.modemMiniBadge}>
                      <Globe size={10} />
                      {selectedElement.codigo}
                    </span>
                    <ArrowRight size={12} className={styles.traceMiniArrow} />
                    <span className={styles.tracePortHighlight}>
                      {switchesConnectedToModem.length} Switches
                    </span>
                  </div>
                  <span className={styles.traceMiniSub}>
                    {(selectedElement.propiedades as any)?.proveedor || 'Proveedor ISP'} • {(selectedElement.propiedades as any)?.tipoConexion || 'Fibra'}
                  </span>
                </div>
              )}

              {/* CASO D: Cámara conectada a DVR */}
              {parentElement && selectedElement.tipo === 'camara' && (
                <div className={styles.inspectorTraceCard}>
                  <span className={styles.traceMiniTag}>Conectado a DVR:</span>
                  <div className={styles.traceMiniRow}>
                    <strong
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setSelectedElementId(parentElement.id)}
                    >
                      {parentElement.codigo}
                    </strong>
                    <ArrowRight size={14} />
                    <span className={styles.tracePortHighlight}>
                      Canal {selectedElement.puerto_canal || 'CH01'}
                    </span>
                  </div>
                  <span className={styles.traceMiniSub}>{parentElement.nombre}</span>
                </div>
              )}

              {/* Propiedades Clave */}
              <div className={styles.inspectorPropsList}>
                {/* Descripción Opcional del Dispositivo */}
                <div className={styles.propRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className={styles.propLabel}>Descripción:</span>
                  <span
                    className={styles.propValue}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontStyle: selectedElement.description ? 'normal' : 'italic',
                      color: selectedElement.description ? 'var(--text-primary)' : 'var(--text-secondary)',
                      lineHeight: '1.4',
                      fontSize: '0.75rem',
                    }}
                  >
                    {selectedElement.description || 'Sin descripción asignada (opcional)'}
                  </span>
                </div>

                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Posición en plano:</span>
                  <span className={styles.propValue} style={{ fontFamily: 'monospace' }}>
                    X: {selectedElement.pos_x}% | Y: {selectedElement.pos_y}%
                  </span>
                </div>

                {(selectedElement.propiedades as any)?.unidades && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Tamaño Rack:</span>
                    <span className={styles.propValue}>
                      {(selectedElement.propiedades as any).unidades}U ({(selectedElement.propiedades as any).tipoMontaje || 'Mural'})
                    </span>
                  </div>
                )}

                {(selectedElement.propiedades as any)?.cantidadBocas && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Bocas Periscopio:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).cantidadBocas} Bocas</span>
                  </div>
                )}

                {(selectedElement.propiedades as any)?.zona && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Zona de Alarma:</span>
                    <span className={styles.propValue} style={{ color: '#ef4444', fontWeight: 600 }}>
                      {(selectedElement.propiedades as any).zona}
                    </span>
                  </div>
                )}

                {(selectedElement.propiedades as any)?.proveedor && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Proveedor:</span>
                    <span className={styles.propValue} style={{ color: '#f59e0b', fontWeight: 700 }}>
                      {(selectedElement.propiedades as any).proveedor}
                    </span>
                  </div>
                )}
                {(selectedElement.propiedades as any)?.tipoConexion && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Conexión:</span>
                    <span className={styles.propValue}>{(selectedElement.propiedades as any).tipoConexion}</span>
                  </div>
                )}
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
                    <span className={styles.propValue} style={{ fontFamily: 'monospace' }}>
                      {(selectedElement.propiedades as any).ip}
                    </span>
                  </div>
                )}
                {(selectedElement.propiedades as any)?.mac && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>MAC:</span>
                    <span className={styles.propValue} style={{ fontFamily: 'monospace' }}>
                      {(selectedElement.propiedades as any).mac}
                    </span>
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
