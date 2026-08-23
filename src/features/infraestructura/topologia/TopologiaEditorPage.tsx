import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { topologiaService } from '@/services/topologiaService';
import { infraestructuraService } from '@/services/infraestructuraService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { TopologiaNodeView } from './components/TopologiaNodeView';
import { ConectarModal } from './components/ConectarModal';
import { CompartirTopologiaModal } from './components/CompartirTopologiaModal';
import { ElementoDetalleModal } from '../components/ElementoDetalleModal';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw,
  Save, Share2, FileText, Sparkles,
  GitBranch, Trash2, Edit3, Globe, Network,
  Wifi, Zap, Printer, Server, Shield, CircleDot,
  ArrowRight, Maximize2,
} from 'lucide-react';
import type {
  TopologiaRed,
  TopologiaNodo,
  TopologiaConexion,
} from '@/types/topologia';
import type { ElementoTipo, ElementoPlano } from '@/types/infraestructura';
import styles from './TopologiaEditorPage.module.css';

export function TopologiaEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [topologia, setTopologia] = useState<TopologiaRed | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('c1'); // Default: Álvarez Thomas 774 / Avellaneda 229
  const [isConectarModalOpen, setIsConectarModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingElemento, setEditingElemento] = useState<ElementoPlano | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Zoom y Pan
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Arrastre de nodos (Drag & Drop)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Función de Auto-Fit al viewport ──
  const fitTopologyToViewport = useCallback((nodos: typeof nodes) => {
    if (!nodos || nodos.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasW = canvas.clientWidth || canvas.offsetWidth;
    const canvasH = canvas.clientHeight || canvas.offsetHeight;
    if (!canvasW || !canvasH) return;

    // Bounding box de todos los nodos (asumimos ancho de nodo ~130px, alto ~80px)
    const NODE_W = 140;
    const NODE_H = 90;
    const PADDING = 60; // margen alrededor

    const minX = Math.min(...nodos.map(n => n.x)) - NODE_W / 2;
    const maxX = Math.max(...nodos.map(n => n.x)) + NODE_W / 2;
    const minY = Math.min(...nodos.map(n => n.y)) - NODE_H / 2;
    const maxY = Math.max(...nodos.map(n => n.y)) + NODE_H / 2;

    const topoW = maxX - minX + PADDING * 2;
    const topoH = maxY - minY + PADDING * 2;

    // Calcular zoom para que entre todo con margen
    const scaleX = canvasW / topoW;
    const scaleY = canvasH / topoH;
    const newZoom = Math.max(0.35, Math.min(1.0, Math.min(scaleX, scaleY)));

    // Centrar la topología en el canvas
    const newPanX = (canvasW - (minX + maxX) * newZoom) / 2;
    const newPanY = (canvasH - (minY + maxY) * newZoom) / 2;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, []);


  // 1. Cargar lista de clientes e instalaciones
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios-list'],
    queryFn: () => consorcioService.getAll(),
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares-list'],
    queryFn: () => particularService.getAll(),
  });

  // 2. Cargar planos de infraestructura existentes
  const { data: planos = [] } = useQuery({
    queryKey: ['infra-plans'],
    queryFn: () => infraestructuraService.getAll(),
  });

  // 3. Cargar o Inicializar Topología para el cliente seleccionado
  useEffect(() => {
    async function loadTopology() {
      if (id) {
        const found = await topologiaService.getById(id);
        if (found) {
          setTopologia(found);
          return;
        }
      }

      // Buscar por cliente seleccionado
      const existing = await topologiaService.getByClient(selectedClientId, selectedClientId);
      if (existing) {
        setTopologia(existing);
      } else {
        // Buscar si hay un plano asociado para auto-generar la topología con sus equipos reales
        const planForClient = planos.find(
          p => p.consorcio_id === selectedClientId || p.particular_id === selectedClientId || p.consorcio?.id === selectedClientId
        ) || planos[0];

        if (planForClient && planForClient.elementos && planForClient.elementos.length > 0) {
          const generated = topologiaService.generateFromPlan(planForClient);
          setTopologia(generated);
        } else {
          // Crear topología base vacía
          const clientObj = consorcios.find(c => c.id === selectedClientId) ||
                            particulares.find(p => p.id === selectedClientId);
          const newTopo: TopologiaRed = {
            id: `topo-${Date.now()}`,
            consorcio_id: selectedClientId,
            public_id: crypto.randomUUID(),
            nombre: `Topología de Red — ${clientObj?.nombre || 'Instalación Técnica'}`,
            descripcion: 'Topología de red',
            consorcio: clientObj ? { id: clientObj.id, nombre: clientObj.nombre, direccion: (clientObj as any).direccion } : null,
            nodos: [
              {
                id: 'node-wan',
                tipo: 'otro',
                codigo: 'INTERNET',
                nombre: 'Enlace WAN / Internet',
                x: 650,
                y: 60,
                estado: 'activo',
                propiedades: {},
              },
            ],
            conexiones: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setTopologia(newTopo);
        }
      }
    }

    loadTopology();
  }, [id, selectedClientId, planos]);

  // Auto-fit al cargar la topología (100ms de delay para que el canvas se haya pintado)
  useEffect(() => {
    if (!topologia || topologia.nodos.length === 0) return;
    const timer = setTimeout(() => {
      fitTopologyToViewport(topologia.nodos);
    }, 120);
    return () => clearTimeout(timer);
  }, [topologia?.id, fitTopologyToViewport]);


  // Selección de nodo y ruta de conexión activa
  const selectedNode = topologia?.nodos.find(n => n.id === selectedNodeId) || null;

  // Calcular ruta destacada (upstream & downstream path)
  const highlightedNodeIds = new Set<string>();
  const highlightedConnIds = new Set<string>();

  if (selectedNode && topologia) {
    highlightedNodeIds.add(selectedNode.id);

    // 1. Upstream (hacia Internet / Switch padre)
    const findUpstream = (targetId: string) => {
      const inConns = topologia.conexiones.filter(c => c.target_id === targetId);
      inConns.forEach(c => {
        highlightedConnIds.add(c.id);
        highlightedNodeIds.add(c.source_id);
        findUpstream(c.source_id);
      });
    };
    findUpstream(selectedNode.id);

    // 2. Downstream (hacia dispositivos hijos)
    const findDownstream = (sourceId: string) => {
      const outConns = topologia.conexiones.filter(c => c.source_id === sourceId);
      outConns.forEach(c => {
        highlightedConnIds.add(c.id);
        highlightedNodeIds.add(c.target_id);
        findDownstream(c.target_id);
      });
    };
    findDownstream(selectedNode.id);
  }

  // ── Acciones de Edición de Nodos ──
  const handleAddEquipment = (tipo: ElementoTipo) => {
    if (!topologia) return;

    const countOfSameType = topologia.nodos.filter(n => n.tipo === tipo).length + 1;
    const prefix = tipo === 'switch' ? 'SW' :
                   tipo === 'modem' ? 'MODEM' :
                   tipo === 'ap' ? 'AP' :
                   tipo === 'router' ? 'RT' :
                   tipo === 'servidor' ? 'SRV' :
                   tipo === 'impresora' ? 'PRN' :
                   tipo === 'fuente_poe' ? 'POE' : 'BOCA';

    const codigo = `${prefix}-${countOfSameType < 10 ? `0${countOfSameType}` : countOfSameType}`;

    // Posición predeterminada debajo del centro
    const newNode: TopologiaNodo = {
      id: `node-${Date.now()}`,
      tipo,
      codigo,
      nombre: `Nuevo ${tipo.toUpperCase()}`,
      x: 650 + (Math.random() * 80 - 40),
      y: 500 + (Math.random() * 80 - 40),
      estado: 'activo',
      propiedades: tipo === 'switch' ? { cantidadPuertos: 16 } : {},
    };

    setTopologia(prev => prev ? {
      ...prev,
      nodos: [...prev.nodos, newNode],
    } : null);
    setSelectedNodeId(newNode.id);
    setHasUnsavedChanges(true);
    showToast(`Se agregó ${codigo} a la topología`, 'info');
  };

  const handleAutoLayout = () => {
    if (!topologia) return;
    const organized = topologiaService.autoLayout(topologia.nodos, topologia.conexiones);
    setTopologia(prev => prev ? { ...prev, nodos: [...organized] } : null);
    setHasUnsavedChanges(true);
    showToast('Topología auto-organizada jerárquicamente', 'success');
  };

  const handleSaveTopology = async () => {
    if (!topologia) return;
    await topologiaService.save(topologia);
    setHasUnsavedChanges(false);
    showToast('Topología guardada correctamente', 'success');
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId || !topologia) return;
    if (window.confirm('¿Desea remover este equipo de la topología?')) {
      setTopologia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nodos: prev.nodos.filter(n => n.id !== selectedNodeId),
          conexiones: prev.conexiones.filter(
            c => c.source_id !== selectedNodeId && c.target_id !== selectedNodeId
          ),
        };
      });
      setSelectedNodeId(null);
      setHasUnsavedChanges(true);
      showToast('Equipo removido de la topología', 'info');
    }
  };

  const handleAddConnection = (newConn: TopologiaConexion) => {
    if (!topologia) return;
    setTopologia(prev => prev ? {
      ...prev,
      conexiones: [...prev.conexiones, newConn],
    } : null);
    setHasUnsavedChanges(true);
    showToast('Conexión establecida con éxito', 'success');
  };

  // Abrir edición del elemento real
  const handleOpenEditElementModal = () => {
    if (!selectedNode || !topologia) return;

    // Construir o encontrar ElementoPlano
    const elem: ElementoPlano = {
      id: selectedNode.elemento_id || selectedNode.id,
      plan_id: topologia.plan_id || 'temp',
      tipo: selectedNode.tipo,
      codigo: selectedNode.codigo,
      nombre: selectedNode.nombre,
      pos_x: 50,
      pos_y: 50,
      parent_element_id: selectedNode.parent_element_id,
      puerto_canal: selectedNode.puerto_canal,
      estado: selectedNode.estado,
      propiedades: selectedNode.propiedades,
    };
    setEditingElemento(elem);
  };

  const handleSaveElementModal = (saved: ElementoPlano) => {
    if (!topologia || !selectedNodeId) return;

    // Actualizar nodo en caliente
    setTopologia(prev => {
      if (!prev) return null;
      return {
        ...prev,
        nodos: prev.nodos.map(n => {
          if (n.id === selectedNodeId) {
            return {
              ...n,
              codigo: saved.codigo,
              nombre: saved.nombre,
              estado: saved.estado,
              parent_element_id: saved.parent_element_id,
              puerto_canal: saved.puerto_canal,
              propiedades: saved.propiedades,
            };
          }
          return n;
        }),
      };
    });
    setEditingElemento(null);
    setHasUnsavedChanges(true);
    showToast('Datos del equipo actualizados', 'success');
  };

  // ── Drag & Drop de Nodos en Canvas ──
  const handleNodeMouseDown = (e: React.MouseEvent, node: TopologiaNodo) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    setSelectedNodeId(node.id);
    setDragOffset({
      x: e.clientX - (node.x * zoom + pan.x),
      y: e.clientY - (node.y * zoom + pan.y),
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingNodeId && topologia) {
        const newX = (e.clientX - pan.x - dragOffset.x) / zoom;
        const newY = (e.clientY - pan.y - dragOffset.y) / zoom;

        setTopologia(prev => {
          if (!prev) return null;
          return {
            ...prev,
            nodos: prev.nodos.map(n =>
              n.id === draggingNodeId ? { ...n, x: Math.round(newX), y: Math.round(newY) } : n
            ),
          };
        });
        setHasUnsavedChanges(true);
      } else if (isPanning) {
        setPan({
          x: e.clientX - startPan.x,
          y: e.clientY - startPan.y,
        });
      }
    },
    [draggingNodeId, isPanning, pan, dragOffset, zoom, topologia, startPan]
  );

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  const handleReportSnapshot = () => {
    showToast('Topología preparada para incluir en el próximo Reporte Técnico', 'success');
  };

  const nodes = topologia?.nodos || [];
  const connections = topologia?.conexiones || [];

  return (
    <div className={styles.editorPage} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* ── Top Bar Institucional ── */}
      <header className={styles.topBar}>
        <div className={styles.topLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/infraestructura')}
            title="Volver a Infraestructura"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={styles.clientSelectorWrap}>
            <select
              className={styles.clientSelect}
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <optgroup label="Consorcios">
                {consorcios.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Clientes Particulares">
                {particulares.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </optgroup>
            </select>

            <div className={styles.clientSubInfo}>
              <span>Instalación Técnica</span>
              <span className={styles.bullet}>•</span>
              <span style={{ color: '#3b82f6', fontWeight: 700 }}>Topología de Red</span>
              <span className={styles.bullet}>•</span>
              <span>{nodes.length} equipos relevados</span>
              {hasUnsavedChanges && (
                <>
                  <span className={styles.bullet}>•</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Cambios sin guardar</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.topRight}>
          <Button
            variant="secondary"
            leftIcon={<Sparkles size={16} />}
            onClick={handleAutoLayout}
            title="Organizar nodos automáticamente"
          >
            Organizar
          </Button>

          <Button
            variant="secondary"
            leftIcon={<GitBranch size={16} />}
            onClick={() => setIsConectarModalOpen(true)}
            title="Conectar dos nodos"
          >
            + Conectar
          </Button>

          <Button
            variant="secondary"
            leftIcon={<FileText size={16} />}
            onClick={handleReportSnapshot}
            title="Incluir en informe técnico"
          >
            Reporte
          </Button>

          <Button
            variant="secondary"
            leftIcon={<Share2 size={16} />}
            onClick={() => setIsShareModalOpen(true)}
            title="Generar enlace público de solo lectura"
          >
            Compartir
          </Button>

          <Button
            variant="primary"
            leftIcon={<Save size={16} />}
            onClick={handleSaveTopology}
          >
            Guardar
          </Button>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className={styles.workspace}>
        {/* Sidebar Izquierda: Herramientas */}
        <aside className={styles.toolsSidebar}>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarHeading}>Equipos — Redes</span>
            <button className={styles.toolItem} onClick={() => handleAddEquipment('modem')}>
              <div className={`${styles.toolIconWrap} ${styles.iconModem}`}>
                <Globe size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Módem</span>
                <span className={styles.toolSub}>Equipo de acceso / ISP</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('switch')}>
              <div className={`${styles.toolIconWrap} ${styles.iconSwitch}`}>
                <Network size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Switch</span>
                <span className={styles.toolSub}>Rack / Core Gigabit</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('ap')}>
              <div className={`${styles.toolIconWrap} ${styles.iconAp}`}>
                <Wifi size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Access Point</span>
                <span className={styles.toolSub}>Punto de acceso WiFi</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('boca')}>
              <div className={`${styles.toolIconWrap} ${styles.iconBoca}`}>
                <CircleDot size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Boca / Puesto</span>
                <span className={styles.toolSub}>RJ45 Cat6 / Datos</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('fuente_poe')}>
              <div className={`${styles.toolIconWrap} ${styles.iconPoe}`}>
                <Zap size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Fuente PoE</span>
                <span className={styles.toolSub}>Inyector 24V / 48V</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('router')}>
              <div className={`${styles.toolIconWrap} ${styles.iconRouter}`}>
                <Shield size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Router / Firewall</span>
                <span className={styles.toolSub}>Gateway y Seguridad</span>
              </div>
            </button>
          </div>

          <div className={styles.sidebarSection}>
            <span className={styles.sidebarHeading}>Otros Dispositivos</span>
            <button className={styles.toolItem} onClick={() => handleAddEquipment('servidor')}>
              <div className={`${styles.toolIconWrap} ${styles.iconServer}`}>
                <Server size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Servidor</span>
                <span className={styles.toolSub}>Host / Rack</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('impresora')}>
              <div className={`${styles.toolIconWrap} ${styles.iconPrinter}`}>
                <Printer size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Impresora</span>
                <span className={styles.toolSub}>Red LAN IP</span>
              </div>
            </button>

            <button className={styles.toolItem} onClick={() => handleAddEquipment('otro')}>
              <div className={`${styles.toolIconWrap} ${styles.iconOther}`}>
                <CircleDot size={16} />
              </div>
              <div className={styles.toolText}>
                <span className={styles.toolTitle}>+ Otro dispositivo</span>
                <span className={styles.toolSub}>Equipo genérico</span>
              </div>
            </button>
          </div>

          <div className={styles.legendBox}>
            <span className={styles.sidebarHeading} style={{ padding: 0 }}>Referencias</span>
            <div className={styles.legendRow}>
              <span className={styles.legendLineDatos}>────</span>
              <span>Datos / Red</span>
            </div>
            <div className={styles.legendRow}>
              <span className={styles.legendLinePoe}>- - -</span>
              <span>Alimentación PoE</span>
            </div>
            <div className={styles.legendRow}>
              <span className={styles.legendLineInalambrico}>····</span>
              <span>Enlace Inalámbrico</span>
            </div>
          </div>
        </aside>

        {/* Lienzo Central de Topología */}
        <main
          className={`${styles.canvasViewport} ${isPanning ? styles.cursorGrabbing : styles.cursorGrab}`}
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
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
              <defs>
                <marker
                  id="arrow-datos"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                </marker>
                <marker
                  id="arrow-poe"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                </marker>
              </defs>

              {connections.map(conn => {
                const source = nodes.find(n => n.id === conn.source_id);
                const target = nodes.find(n => n.id === conn.target_id);
                if (!source || !target) return null;

                const isConnHighlighted = highlightedConnIds.has(conn.id);
                const isConnDimmed = selectedNodeId && !isConnHighlighted;

                // Curva de Bézier suave
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
                  onMouseDown={handleNodeMouseDown}
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
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.25))}
              title="Alejar"
            >
              <ZoomOut size={16} />
            </button>
            <div className={styles.zoomDivider} />
            <button
              className={styles.fitBtn}
              onClick={() => fitTopologyToViewport(nodes)}
              title="Encajar topología en pantalla"
            >
              <Maximize2 size={13} style={{ marginRight: '3px', display: 'inline' }} />
              Encajar
            </button>
            <div className={styles.zoomDivider} />
            <button
              className={styles.zoomBtn}
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title="Restablecer zoom al 100%"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </main>

        {/* Panel Lateral Derecho: Inspector Técnico */}
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
                <span className={`${styles.typeBadge} ${styles[`typeBadge_${selectedNode.tipo}`]}`}>
                  {selectedNode.tipo.toUpperCase()}
                </span>
                <h3>{selectedNode.codigo}</h3>
                <p className={styles.inspectorName}>{selectedNode.nombre}</p>
              </div>

              {/* Trazado de Conexión Dinámico */}
              <div className={styles.traceCard}>
                <span className={styles.traceLabel}>Trazado de Conexión</span>
                <div className={styles.tracePathRow}>
                  <span className={styles.traceNodePill}>{selectedNode.codigo}</span>
                  {selectedNode.puerto_canal && (
                    <>
                      <ArrowRight size={12} style={{ color: '#64748b' }} />
                      <span className={styles.tracePortPill}>Puerto {selectedNode.puerto_canal}</span>
                    </>
                  )}
                  {selectedNode.is_intermediate_poe && (
                    <>
                      <ArrowRight size={12} style={{ color: '#64748b' }} />
                      <span className={styles.tracePoePill}>
                        <Zap size={10} /> PoE {selectedNode.poe_voltage || '24V'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Mapeo de Puertos si es un Switch */}
              {selectedNode.tipo === 'switch' && (
                <div className={styles.propsList}>
                  <span className={styles.traceLabel}>Mapeo de Puertos</span>
                  <div className={styles.switchPortsTable}>
                    {connections
                      .filter(c => c.source_id === selectedNode.id)
                      .map(c => {
                        const target = nodes.find(n => n.id === c.target_id);
                        return (
                          <div key={c.id} className={styles.portRowItem}>
                            <span className={styles.portRowNumber}>{c.puerto || 'Pto'}</span>
                            <span className={styles.portRowTarget}>
                              {target ? `${target.codigo} (${target.nombre})` : 'Dispositivo'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Propiedades Técnicas */}
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
                {(selectedNode.propiedades as any)?.mac && (
                  <div className={styles.propRow}>
                    <span className={styles.propLabel}>MAC:</span>
                    <span className={`${styles.propValue} ${styles.propMono}`}>{(selectedNode.propiedades as any).mac}</span>
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

              {/* Botones de Acción del Inspector */}
              <div className={styles.inspectorActions}>
                <Button
                  variant="primary"
                  leftIcon={<Edit3 size={16} />}
                  onClick={handleOpenEditElementModal}
                  style={{ width: '100%', fontSize: '0.82rem' }}
                >
                  Editar parámetros y puertos
                </Button>

                {selectedNode.codigo !== 'INTERNET' && (
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 size={16} />}
                    onClick={handleDeleteSelectedNode}
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  >
                    Eliminar equipo
                  </Button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Modales ── */}
      {isConectarModalOpen && (
        <ConectarModal
          nodos={nodes}
          initialSourceId={selectedNodeId}
          onSave={handleAddConnection}
          onClose={() => setIsConectarModalOpen(false)}
        />
      )}

      {isShareModalOpen && topologia && (
        <CompartirTopologiaModal
          topologia={topologia}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {editingElemento && (
        <ElementoDetalleModal
          elemento={editingElemento}
          todosElementos={nodes.map(n => ({
            id: n.elemento_id || n.id,
            plan_id: topologia?.plan_id || 'temp',
            tipo: n.tipo,
            codigo: n.codigo,
            nombre: n.nombre,
            pos_x: 50,
            pos_y: 50,
            parent_element_id: n.parent_element_id,
            puerto_canal: n.puerto_canal,
            estado: n.estado,
            propiedades: n.propiedades,
          }))}
          isOpen={true}
          onClose={() => setEditingElemento(null)}
          onSave={handleSaveElementModal}
          onDelete={() => {
            setEditingElemento(null);
            handleDeleteSelectedNode();
          }}
        />
      )}
    </div>
  );
}
