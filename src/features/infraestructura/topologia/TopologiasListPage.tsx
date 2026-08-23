import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { topologiaService } from '@/services/topologiaService';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { NuevaTopologiaModal } from './components/NuevaTopologiaModal';
import { CompartirTopologiaModal } from './components/CompartirTopologiaModal';
import {
  ArrowLeft, Plus, Network, Wifi, Video, Radio,
  Layers, MapPin, Edit3, Share2, Copy, Trash2,
  Calendar, Cpu, AlertCircle,
} from 'lucide-react';
import type { TopologiaRed, TopologiaTipo } from '@/types/topologia';
import styles from './TopologiasListPage.module.css';

export function TopologiasListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return localStorage.getItem('safelink_last_topo_client') || 'c1';
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [shareTopology, setShareTopology] = useState<TopologiaRed | null>(null);

  // 1. Cargar clientes
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios-list'],
    queryFn: () => consorcioService.getAll(),
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares-list'],
    queryFn: () => particularService.getAll(),
  });

  // 2. Cargar todas las topologías
  const { data: allTopologias = [] } = useQuery({
    queryKey: ['topologias-list'],
    queryFn: () => topologiaService.getAll(),
  });

  // Cliente actual seleccionado
  const selectedClient = useMemo(() => {
    const cons = consorcios.find(c => c.id === selectedClientId);
    if (cons) return { id: cons.id, nombre: cons.nombre, direccion: cons.direccion, tipo: 'consorcio' as const };
    const part = particulares.find(p => p.id === selectedClientId);
    if (part) return { id: part.id, nombre: part.nombre, direccion: part.direccion, tipo: 'particular' as const };
    return consorcios[0] ? { id: consorcios[0].id, nombre: consorcios[0].nombre, direccion: consorcios[0].direccion, tipo: 'consorcio' as const } : null;
  }, [consorcios, particulares, selectedClientId]);

  // Topologías filtradas para la instalación seleccionada
  const topologiesForClient = useMemo(() => {
    if (!selectedClient) return [];
    return allTopologias.filter(t => {
      if (selectedClient.tipo === 'consorcio') {
        return t.consorcio_id === selectedClient.id;
      }
      return t.particular_id === selectedClient.id;
    });
  }, [allTopologias, selectedClient]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    localStorage.setItem('safelink_last_topo_client', clientId);
  };

  // Crear nueva topología
  const handleCreateTopology = async ({
    nombre,
    descripcion,
    tipo,
  }: {
    nombre: string;
    descripcion: string;
    tipo: TopologiaTipo;
  }) => {
    if (!selectedClient) return;

    const now = new Date().toISOString();
    const newTopo: TopologiaRed = {
      id: `topo-${Date.now()}`,
      public_id: crypto.randomUUID(),
      nombre,
      descripcion,
      tipo,
      consorcio_id: selectedClient.tipo === 'consorcio' ? selectedClient.id : undefined,
      particular_id: selectedClient.tipo === 'particular' ? selectedClient.id : undefined,
      consorcio: selectedClient.tipo === 'consorcio' ? {
        id: selectedClient.id,
        nombre: selectedClient.nombre,
        direccion: selectedClient.direccion || null,
      } : null,
      particular: selectedClient.tipo === 'particular' ? {
        id: selectedClient.id,
        nombre: selectedClient.nombre,
        direccion: selectedClient.direccion || null,
      } : null,
      nodos: [
        {
          id: 'node-wan',
          tipo: 'otro',
          codigo: 'INTERNET',
          nombre: 'Enlace WAN / Internet',
          x: 600,
          y: 80,
          estado: 'activo',
          propiedades: {},
        },
      ],
      conexiones: [],
      created_at: now,
      updated_at: now,
    };

    await topologiaService.save(newTopo);
    queryClient.invalidateQueries({ queryKey: ['topologias-list'] });
    setIsNewModalOpen(false);
    showToast(`Topología "${nombre}" creada con éxito`, 'success');
    navigate(`/infraestructura/topologia/${newTopo.id}`);
  };

  // Duplicar topología
  const handleDuplicate = async (e: React.MouseEvent, topo: TopologiaRed) => {
    e.stopPropagation();
    const dup = await topologiaService.duplicate(topo.id);
    if (dup) {
      queryClient.invalidateQueries({ queryKey: ['topologias-list'] });
      showToast(`Se duplicó "${topo.nombre}" como nueva topología`, 'success');
    }
  };

  // Eliminar topología
  const handleDelete = async (e: React.MouseEvent, topo: TopologiaRed) => {
    e.stopPropagation();
    if (
      window.confirm(
        `¿Desea eliminar la topología "${topo.nombre}"?\n\nEsta acción no puede deshacerse. (Los equipos físicos del inventario NO serán eliminados).`
      )
    ) {
      await topologiaService.delete(topo.id);
      queryClient.invalidateQueries({ queryKey: ['topologias-list'] });
      showToast(`Topología "${topo.nombre}" eliminada`, 'info');
    }
  };

  const getTypeIcon = (tipo?: TopologiaTipo) => {
    switch (tipo) {
      case 'wifi':
        return <Wifi size={22} />;
      case 'cctv':
        return <Video size={22} />;
      case 'enlaces':
        return <Radio size={22} />;
      case 'otra':
        return <Layers size={22} />;
      case 'red_general':
      default:
        return <Network size={22} />;
    }
  };

  const getTypeClass = (tipo?: TopologiaTipo) => {
    switch (tipo) {
      case 'wifi':
        return { icon: styles.iconWifi, badge: styles.typeBadgeWifi, label: 'WiFi' };
      case 'cctv':
        return { icon: styles.iconCctv, badge: styles.typeBadgeCctv, label: 'CCTV' };
      case 'enlaces':
        return { icon: styles.iconEnlaces, badge: styles.typeBadgeEnlaces, label: 'Enlaces' };
      case 'otra':
        return { icon: styles.iconOtra, badge: styles.typeBadgeOtra, label: 'Otra' };
      case 'red_general':
      default:
        return { icon: styles.iconRedGeneral, badge: styles.typeBadgeRedGeneral, label: 'Red General' };
    }
  };

  const formatDate = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* ── Barra Superior / Breadcrumb ── */}
      <header className={styles.topNav}>
        <div className={styles.topLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/infraestructura')}
            title="Volver a Infraestructura Técnica"
          >
            <ArrowLeft size={18} />
          </button>

          <div className={styles.titleArea}>
            <h2 className={styles.pageTitle}>
              <Network size={22} style={{ color: '#3b82f6' }} />
              Topologías de Red
            </h2>
            <p className={styles.pageSubtitle}>
              Documentación técnica y diagramas de conexionado lógico por instalación
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsNewModalOpen(true)}
        >
          + Nueva Topología
        </Button>
      </header>

      {/* ── Selector de Cliente e Instalación ── */}
      <section className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Cliente</label>
          <select
            className={styles.clientSelect}
            value={selectedClientId}
            onChange={e => handleSelectClient(e.target.value)}
          >
            <optgroup label="Consorcios / Edificios">
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
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Dirección / Instalación</label>
          <div className={styles.installationBadge}>
            <MapPin size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <span>{selectedClient?.direccion || 'Sede Principal / Sin dirección registrada'}</span>
          </div>
        </div>
      </section>

      {/* ── Header de Listado ── */}
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>
          Topologías registradas
          <span className={styles.listCount}>({topologiesForClient.length})</span>
        </h3>
      </div>

      {/* ── Grid de Tarjetas ── */}
      {topologiesForClient.length > 0 ? (
        <div className={styles.topologiesGrid}>
          {topologiesForClient.map(topo => {
            const typeInfo = getTypeClass(topo.tipo);
            const nodeCount = topo.nodos?.length || 0;

            return (
              <div key={topo.id} className={styles.topologyCard}>
                <div className={styles.cardHeader}>
                  <div className={`${styles.cardIconWrap} ${typeInfo.icon}`}>
                    {getTypeIcon(topo.tipo)}
                  </div>
                  <div className={styles.cardTitleBlock}>
                    <span className={`${styles.typeBadge} ${typeInfo.badge}`}>
                      {typeInfo.label}
                    </span>
                    <h4 className={styles.cardTitle}>{topo.nombre}</h4>
                  </div>
                </div>

                {topo.descripcion && (
                  <p className={styles.cardDesc}>{topo.descripcion}</p>
                )}

                <div className={styles.cardStatsRow}>
                  <div className={styles.statItem}>
                    <Cpu size={14} style={{ color: '#38bdf8' }} />
                    <span>
                      <strong className={styles.statNumber}>{nodeCount}</strong> equipos
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <Calendar size={14} />
                    <span>Modif: {formatDate(topo.updated_at)}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={`${styles.btnAction} ${styles.btnEdit}`}
                    onClick={() => navigate(`/infraestructura/topologia/${topo.id}`)}
                    title="Editar diagrama de topología"
                  >
                    <Edit3 size={15} />
                    <span>Editar</span>
                  </button>

                  <button
                    className={`${styles.btnAction} ${styles.btnSecondary}`}
                    onClick={() => setShareTopology(topo)}
                    title="Compartir enlace privado de solo lectura"
                  >
                    <Share2 size={15} />
                    <span>Compartir</span>
                  </button>

                  <button
                    className={styles.btnIconOnly}
                    onClick={e => handleDuplicate(e, topo)}
                    title="Duplicar topología (crear copia independiente)"
                  >
                    <Copy size={15} />
                  </button>

                  <button
                    className={`${styles.btnIconOnly} ${styles.btnDelete}`}
                    onClick={e => handleDelete(e, topo)}
                    title="Eliminar topología"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrap}>
            <AlertCircle size={32} />
          </div>
          <div>
            <h4 className={styles.emptyTitle}>No hay topologías para esta instalación</h4>
            <p className={styles.emptySubtitle}>
              Podés crear diagramas de Red General, WiFi, CCTV o enlaces para documentar la
              infraestructura lógica de {selectedClient?.nombre}.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsNewModalOpen(true)}
          >
            Crear Primera Topología
          </Button>
        </div>
      )}

      {/* ── Modal Nueva Topología ── */}
      <NuevaTopologiaModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        clientName={selectedClient?.nombre || 'Cliente'}
        clientAddress={selectedClient?.direccion || undefined}
        onSubmit={handleCreateTopology}
      />

      {/* ── Modal Compartir Topología ── */}
      {shareTopology && (
        <CompartirTopologiaModal
          topologia={shareTopology}
          onClose={() => setShareTopology(null)}
        />
      )}
    </div>
  );
}
