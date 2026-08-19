import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { infraestructuraService } from '@/services/infraestructuraService';
import logoImg from '@/assets/logo.png';
import {
  ZoomIn, ZoomOut, RotateCcw, Shield,
  ArrowRight, Building, Zap, Globe,
} from 'lucide-react';
import styles from './PublicPlanoViewer.module.css';

export function PublicPlanoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Zoom y Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Cargar Plano por ID público
  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ['infra-public-plan', publicId],
    queryFn: () => infraestructuraService.getByPublicId(publicId!),
    enabled: !!publicId,
  });

  const elements = plan?.elementos || [];
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

  // Controles de Zoom
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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Cargando visor técnico de SafeLink...</p>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className={styles.errorContainer}>
        <Shield size={48} className={styles.errorIcon} />
        <h2>Plano no disponible</h2>
        <p>El enlace ingresado no es válido o ha expirado.</p>
      </div>
    );
  }

  return (
    <div className={styles.viewerPage}>
      {/* ── Top Bar Institucional SafeLink ── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.brandBadge}>
            <img src={logoImg} alt="SafeLink Logo" className={styles.brandLogo} />
            <span className={styles.brandTitle}>SAFElink</span>
            <span className={styles.brandDivider}>|</span>
            <span className={styles.brandModule}>Infraestructura</span>
          </div>

          <div className={styles.planInfo}>
            <h1>{plan.nombre}</h1>
            <div className={styles.subInfo}>
              <Building size={14} className={styles.subIcon} />
              <span>{plan.consorcio?.nombre || plan.particular?.nombre || 'Instalación Técnica'}</span>
              <span className={styles.bullet}>•</span>
              <span
                className={`${styles.typeBadge} ${
                  plan.tipo === 'redes' ? styles.badgeRedes : plan.tipo === 'camaras' ? styles.badgeCamaras : styles.badgeMixto
                }`}
              >
                {plan.tipo.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.topRight}>
          <div className={styles.deviceCounter}>
            <strong>{elements.length}</strong>
            <span>equipos relevados</span>
          </div>
        </div>
      </header>

      {/* ── Área del Plano Interactivo ── */}
      <div className={styles.viewerWorkspace}>
        <main
          className={`${styles.canvasViewport} ${isPanning ? styles.cursorGrabbing : styles.cursorGrab}`}
          ref={canvasRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          onMouseLeave={handleMouseUpCanvas}
        >
          <div
            className={styles.canvasTransformWrapper}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <div className={styles.planImageContainer}>
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
                      {elem.tipo === 'modem' ? '🌐' :
                       elem.tipo === 'switch' ? '🖧' :
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

              {/* Propiedades */}
              <div className={styles.inspectorPropsList}>
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
