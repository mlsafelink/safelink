import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { topologiaService } from '@/services/topologiaService';
import { TopologiaNodeView } from '../infraestructura/topologia/components/TopologiaNodeView';
import logoImg from '@/assets/logo.png';
import {
  ZoomIn, ZoomOut, RotateCcw, Shield,
  Building, ArrowRight
} from 'lucide-react';
import styles from './PublicTopologiaViewer.module.css';

export function PublicTopologiaViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Zoom y Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Cargar Topología
  const { data: topologia, isLoading, isError } = useQuery({
    queryKey: ['public-topology', publicId],
    queryFn: () => topologiaService.getByPublicId(publicId!),
    enabled: !!publicId,
  });

  const nodes = topologia?.nodos || [];
  const connections = topologia?.conexiones || [];
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Highlight connections for selected node
  const highlightedNodeIds = new Set<string>();
  const highlightedConnIds = new Set<string>();

  if (selectedNode) {
    highlightedNodeIds.add(selectedNode.id);

    const findUpstream = (targetId: string) => {
      const inConns = connections.filter(c => c.target_id === targetId);
      inConns.forEach(c => {
        highlightedConnIds.add(c.id);
        highlightedNodeIds.add(c.source_id);
        findUpstream(c.source_id);
      });
    };
    findUpstream(selectedNode.id);

    const findDownstream = (sourceId: string) => {
      const outConns = connections.filter(c => c.source_id === sourceId);
      outConns.forEach(c => {
        highlightedConnIds.add(c.id);
        highlightedNodeIds.add(c.target_id);
        findDownstream(c.target_id);
      });
    };
    findDownstream(selectedNode.id);
  }

  // Métricas del resumen en cabecera
  const modemCount = nodes.filter(n => n.tipo === 'modem').length;
  const switchCount = nodes.filter(n => n.tipo === 'switch').length;
  const poeCount = nodes.filter(n => n.tipo === 'fuente_poe' || n.is_intermediate_poe).length;
  const endpointsCount = nodes.filter(
    n => n.codigo !== 'INTERNET' && n.tipo !== 'modem' && n.tipo !== 'switch' && n.tipo !== 'fuente_poe' && !n.is_intermediate_poe
  ).length;

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
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
        <p>Cargando topología de red de SafeLink...</p>
      </div>
    );
  }

  if (isError || !topologia) {
    return (
      <div className={styles.errorContainer}>
        <Shield size={48} className={styles.errorIcon} />
        <h2>Topología no disponible</h2>
        <p>El enlace ingresado no es válido o ha expirado.</p>
      </div>
    );
  }

  const clientName =
    topologia.consorcio?.nombre ||
    topologia.particular?.nombre ||
    'Instalación Técnica';

  return (
    <div className={styles.viewerPage}>
      {/* ── Top Bar Institucional SafeLink ── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.brandBadge}>
            <img src={logoImg} alt="SafeLink" className={styles.brandLogo} />
          </div>

          <div className={styles.planInfo}>
            <h1>{topologia.nombre}</h1>
            <div className={styles.subInfo}>
              <Building size={14} className={styles.subIcon} />
              <span>{clientName}</span>
              <span className={styles.bullet}>•</span>
              <span className={styles.typeBadge}>TOPOLOGÍA DE RED</span>
            </div>
          </div>
        </div>

        {/* Resumen de Infraestructura en Cabecera */}
        <div className={styles.summaryRow}>
          <div className={styles.summaryMetric}>
            <strong>{modemCount}</strong>
            <span>{modemCount === 1 ? 'Módem' : 'Módems'}</span>
          </div>
          <div className={styles.summaryMetric}>
            <strong>{switchCount}</strong>
            <span>{switchCount === 1 ? 'Switch' : 'Switches'}</span>
          </div>
          <div className={styles.summaryMetric}>
            <strong>{endpointsCount}</strong>
            <span>Dispositivos</span>
          </div>
          {poeCount > 0 && (
            <div className={styles.summaryMetric}>
              <strong>{poeCount}</strong>
              <span>Fuentes PoE</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Área del Lienzo Interactivo ── */}
      <div className={styles.viewerWorkspace}>
        <main
          className={`${styles.canvasViewport} ${isPanning ? styles.cursorGrabbing : styles.cursorGrab}`}
          ref={canvasRef}
          onMouseDown={handleMouseDownCanvas}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
        >
          <div
            className={styles.canvasContainer}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Capa SVG de Conexiones */}
            <svg className={styles.canvasSvg}>
              {connections.map(conn => {
                const source = nodes.find(n => n.id === conn.source_id);
                const target = nodes.find(n => n.id === conn.target_id);
                if (!source || !target) return null;

                const isConnHighlighted = highlightedConnIds.has(conn.id);
                const isConnDimmed = selectedNodeId && !isConnHighlighted;

                const midY = (source.y + target.y) / 2;
                const pathD = `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`;

                const lineClass =
                  conn.tipo_conexion === 'poe' ? styles.connPoe :
                  conn.tipo_conexion === 'inalambrico' ? styles.connInalambrico : styles.connDatos;

                return (
                  <g key={conn.id}>
                    <path
                      d={pathD}
                      className={`${styles.connLine} ${lineClass} ${
                        isConnHighlighted ? styles.connHighlighted : ''
                      } ${isConnDimmed ? styles.connDimmed : ''}`}
                    />
                    {conn.puerto && (
                      <text
                        x={(source.x + target.x) / 2}
                        y={midY - 6}
                        className={`${styles.connBadge} ${isConnDimmed ? styles.connDimmed : ''}`}
                      >
                        {conn.puerto}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Capa de Nodos React */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isHighlighted = highlightedNodeIds.has(node.id);
              const isDimmed = selectedNodeId !== null && !isHighlighted;

              return (
                <TopologiaNodeView
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isHighlighted={isHighlighted}
                  isDimmed={isDimmed}
                  connections={connections}
                  onSelect={n => setSelectedNodeId(n.id)}
                  onMouseDown={() => {}} // Solo lectura
                />
              );
            })}
          </div>

          {/* Controles de Zoom Flotantes */}
          <div className={styles.zoomControls}>
            <button
              className={styles.zoomBtn}
              onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}
              title="Acercar"
            >
              <ZoomIn size={16} />
            </button>
            <span className={styles.zoomPercent}>{Math.round(zoom * 100)}%</span>
            <button
              className={styles.zoomBtn}
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
              title="Alejar"
            >
              <ZoomOut size={16} />
            </button>
            <button
              className={styles.zoomBtn}
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title="Restablecer"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </main>

        {/* Inspector Técnico de Solo Lectura */}
        {selectedNode && (
          <aside className={styles.inspectorSidebar}>
            <div className={styles.inspectorHeader}>
              <span className={styles.inspectorTag}>Detalle Técnico</span>
              <button
                className={styles.closeInspectorBtn}
                onClick={() => setSelectedNodeId(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.inspectorContent}>
              <div className={styles.inspectorCodeHeader}>
                <span className={`${styles.inspectorTypeBadge} ${styles[`typeBadge_${selectedNode.tipo}`]}`}>
                  {selectedNode.tipo.toUpperCase()}
                </span>
                <h3>{selectedNode.codigo}</h3>
                <p className={styles.inspectorName}>{selectedNode.nombre}</p>
              </div>

              {/* Trazado */}
              <div className={styles.traceCard}>
                <span className={styles.traceLabel}>Conexión</span>
                <div className={styles.tracePathRow}>
                  <span className={styles.traceNodePill}>{selectedNode.codigo}</span>
                  {selectedNode.puerto_canal && (
                    <>
                      <ArrowRight size={12} style={{ color: '#64748b' }} />
                      <span className={styles.tracePortPill}>Puerto {selectedNode.puerto_canal}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Propiedades */}
              <div className={styles.propsList}>
                {(selectedNode.propiedades as any)?.proveedor && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Proveedor:</span>
                    <span className={styles.propValue}>{(selectedNode.propiedades as any).proveedor}</span>
                  </div>
                )}
                {(selectedNode.propiedades as any)?.tipoConexion && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Conexión:</span>
                    <span className={styles.propValue}>{(selectedNode.propiedades as any).tipoConexion}</span>
                  </div>
                )}
                {(selectedNode.propiedades as any)?.marca && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Marca:</span>
                    <span className={styles.propValue}>{(selectedNode.propiedades as any).marca}</span>
                  </div>
                )}
                {(selectedNode.propiedades as any)?.modelo && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Modelo:</span>
                    <span className={styles.propValue}>{(selectedNode.propiedades as any).modelo}</span>
                  </div>
                )}
                {(selectedNode.propiedades as any)?.ip && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>IP:</span>
                    <span className={`${styles.propValue} ${styles.propMono}`}>{(selectedNode.propiedades as any).ip}</span>
                  </div>
                )}
                {(selectedNode.propiedades as any)?.ubicacion && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>Ubicación:</span>
                    <span className={styles.propValue}>{(selectedNode.propiedades as any).ubicacion}</span>
                  </div>
                )}
                <div className={styles.propRow}>
                  <span className={styles.propLabel}>Estado:</span>
                  <span className={styles.propValue} style={{ textTransform: 'capitalize', color: '#10b981' }}>
                    {selectedNode.estado}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
