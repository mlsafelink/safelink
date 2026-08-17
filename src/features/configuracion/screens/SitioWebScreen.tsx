import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { galeriaService, type GaleriaItem } from '@/services/galeriaService';
import {
  landingService,
  type EstadisticasSitio,
  type VisitaDetalle,
  type ResumenDispositivos,
  type ResumenGeograficoItem,
} from '@/services/landingService';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, Globe, Image, BarChart3, Upload, Trash2,
  Eye, EyeOff, GripVertical, MessageCircle, Share2,
  Save, TrendingUp, Users, Calendar, CheckCircle2, Clock,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import styles from './SitioWebScreen.module.css';

// ── Configuración del sitio (WhatsApp / Instagram) ─────────────
type SiteConfig = {
  whatsapp: string;
  instagram: string;
};

const SITE_CONFIG_KEY = 'sl_site_config';

function loadSiteConfig(): SiteConfig {
  try {
    const s = localStorage.getItem(SITE_CONFIG_KEY);
    return s ? JSON.parse(s) : { whatsapp: '', instagram: 'instagram.com/ml.safelink' };
  } catch { return { whatsapp: '', instagram: 'instagram.com/ml.safelink' }; }
}

function saveSiteConfig(cfg: SiteConfig) {
  localStorage.setItem(SITE_CONFIG_KEY, JSON.stringify(cfg));
}

function formatFechaHora(isoDate: string) {
  try {
    const d = new Date(isoDate);
    const fecha = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    return `${fecha} ${hora}`;
  } catch {
    return isoDate;
  }
}

function nivelLabel(nivel: string | null | undefined): { emoji: string; label: string; className: string } {
  switch (nivel) {
    case 'automatizado': return { emoji: '🔴', label: 'Potencialmente automatizado', className: styles.nivelAutomatizado };
    case 'sospechoso':   return { emoji: '🟠', label: 'Actividad sospechosa',         className: styles.nivelSospechoso };
    case 'inusual':      return { emoji: '🟡', label: 'Actividad inusual',             className: styles.nivelInusual };
    case 'sin_determinar': return { emoji: '⬜', label: 'Sin determinar',              className: styles.nivelSinDeterminar };
    default:             return { emoji: '🟢', label: 'Normal',                        className: styles.nivelNormal };
  }
}

// ── Helpers ─────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, accent, sub,
}: { icon: React.ElementType; label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className={styles.statCard} style={{ '--accent': accent } as React.CSSProperties}>
      <div className={styles.statIcon} style={{ background: `${accent}22`, color: accent }}>
        <Icon size={20} />
      </div>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Panel de detalle expandible ──────────────────────────────────
function DetallePanel({ visita }: { visita: VisitaDetalle }) {
  const nivel = nivelLabel(visita.nivel_actividad);
  return (
    <div className={styles.detallePanel}>
      <div className={styles.detallePanelGrid}>
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Zona</span>
          <span className={styles.detalleValor}>{visita.zona || 'Desconocida'}</span>
        </div>
        {visita.pais && (
          <div className={styles.detalleItem}>
            <span className={styles.detalleLabel}>País</span>
            <span className={styles.detalleValor}>{visita.pais}</span>
          </div>
        )}
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Dispositivo</span>
          <span className={styles.detalleValor}>{visita.dispositivo || 'Desconocido'}</span>
        </div>
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Sistema operativo</span>
          <span className={styles.detalleValor}>{visita.sistema_operativo || 'Desconocido'}</span>
        </div>
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Navegador</span>
          <span className={styles.detalleValor}>{visita.navegador || 'Desconocido'}</span>
        </div>
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Origen</span>
          <span className={styles.detalleValor}>{visita.origen || 'Directo'}</span>
        </div>
        <div className={styles.detalleItem}>
          <span className={styles.detalleLabel}>Evaluación</span>
          <span className={`${styles.nivelBadge} ${nivel.className}`}>
            {nivel.emoji} {nivel.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Fila de tabla con expansión ───────────────────────────────────
function VisitaRow({ visita }: { visita: VisitaDetalle }) {
  const [expanded, setExpanded] = useState(false);
  const dispKey = `badge_${(visita.dispositivo || 'PC').toLowerCase().replace('ó', 'o')}`;
  const nivel = nivelLabel(visita.nivel_actividad);

  return (
    <>
      <tr
        className={`${styles.visitaRow} ${expanded ? styles.visitaRowExpanded : ''}`}
        onClick={() => setExpanded(e => !e)}
        title="Click para ver detalle"
      >
        <td className={styles.tdFecha}>{formatFechaHora(visita.created_at)}</td>
        <td className={styles.tdZona}>{visita.zona || 'Desconocida'}</td>
        <td className={styles.tdDispositivo}>
          <span className={`${styles.badgeDispositivo} ${styles[dispKey] || ''}`}>
            {visita.dispositivo || 'PC'}
          </span>
        </td>
        <td className={styles.tdSO}>{visita.sistema_operativo || '—'}</td>
        <td className={styles.tdNavegador}>{visita.navegador || '—'}</td>
        <td className={styles.tdOrigen}>{visita.origen || 'Directo'}</td>
        <td className={styles.tdActividad}>
          <span className={`${styles.nivelBadge} ${nivel.className}`}>
            {nivel.emoji} {nivel.label}
          </span>
        </td>
        <td className={styles.tdExpand}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {expanded && (
        <tr className={styles.detallePanelRow}>
          <td colSpan={8}>
            <DetallePanel visita={visita} />
          </td>
        </tr>
      )}
    </>
  );
}


// ── Tab de Estadísticas ──────────────────────────────────────────
function EstadisticasTab() {
  const [stats, setStats] = useState<EstadisticasSitio | null>(null);
  const [detalleData, setDetalleData] = useState<{
    visitas: VisitaDetalle[];
    resumenDispositivos: ResumenDispositivos;
    resumenGeografico: ResumenGeograficoItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      landingService.getEstadisticas(),
      landingService.getDetalleVisitantes(),
    ]).then(([s, d]) => {
      setStats(s);
      setDetalleData(d);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <p className={styles.loading}>Cargando estadísticas...</p>;
  }

  if (!stats) return null;

  const detalleVisitantes = detalleData?.visitas || [];
  const resumenDispositivos = detalleData?.resumenDispositivos || { pc: 0, notebook: 0, movil: 0, tablet: 0 };
  const resumenGeografico = detalleData?.resumenGeografico || [];

  return (
    <div className={styles.statsSection}>
      {/* ── Estadísticas existentes (sin cambios) ── */}
      <h3 className={styles.statsGroupTitle}>Visitas al sitio</h3>
      <div className={styles.statsGrid}>
        <StatCard icon={Users}     label="Visitas totales" value={stats.visitas_total}  accent="#818cf8" />
        <StatCard icon={Calendar}  label="Hoy"             value={stats.visitas_hoy}    accent="#34d399" />
        <StatCard icon={TrendingUp} label="Esta semana"    value={stats.visitas_semana} accent="#fbbf24" />
        <StatCard icon={BarChart3} label="Este mes"        value={stats.visitas_mes}    accent="#60a5fa" />
      </div>

      <h3 className={styles.statsGroupTitle}>Consultas recibidas</h3>
      <div className={styles.statsGrid}>
        <StatCard icon={MessageCircle} label="Total"       value={stats.consultas_total}      accent="#a78bfa" />
        <StatCard icon={Clock}         label="Pendientes"  value={stats.consultas_pendientes} accent="#fb923c" />
        <StatCard icon={CheckCircle2}  label="Atendidas"   value={stats.consultas_atendidas}  accent="#4ade80" />
        <StatCard icon={TrendingUp}    label="Conversión"  value={`${stats.conversion}%`}     accent="#f472b6" sub="consultas / visitas" />
      </div>

      <h3 className={styles.statsGroupTitle}>Consultas por servicio</h3>
      <div className={styles.statsGrid}>
        <StatCard icon={BarChart3} label="Cámaras"     value={stats.consultas_por_servicio.camaras}     accent="#818cf8" />
        <StatCard icon={BarChart3} label="Iluminación" value={stats.consultas_por_servicio.iluminacion} accent="#fbbf24" />
        <StatCard icon={BarChart3} label="Redes"       value={stats.consultas_por_servicio.redes}       accent="#34d399" />
        <StatCard icon={BarChart3} label="Otro"        value={stats.consultas_por_servicio.otro}        accent="#94a3b8" />
      </div>

      {/* ── DETALLE DE VISITANTES ── */}
      <h3 className={styles.statsGroupTitle}>DETALLE DE VISITANTES</h3>

      {/* Tabla principal */}
      <div className={styles.tableContainer}>
        <table className={styles.visitantesTable}>
          <thead>
            <tr>
              <th className={styles.tdFecha}>Fecha y hora</th>
              <th className={styles.tdZona}>Zona</th>
              <th className={styles.tdDispositivo}>Dispositivo</th>
              <th className={styles.thHideXs}>SO</th>
              <th className={styles.thHideXs}>Navegador</th>
              <th className={styles.thHideSm}>Origen</th>
              <th>Actividad</th>
              <th className={styles.thExpand}></th>
            </tr>
          </thead>
          <tbody>
            {detalleVisitantes.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyCell}>
                  No hay detalle de visitantes registrado aún.
                </td>
              </tr>
            ) : (
              detalleVisitantes.map(v => <VisitaRow key={v.id} visita={v} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Resúmenes inferiores */}
      <div className={styles.resumenesGrid}>
        <div className={styles.resumenCard}>
          <h4>RESUMEN DE DISPOSITIVOS</h4>
          <div className={styles.resumenList}>
            <div className={styles.resumenRow}><span>PC</span><span className={styles.resumenValue}>{resumenDispositivos.pc}</span></div>
            <div className={styles.resumenRow}><span>Notebook</span><span className={styles.resumenValue}>{resumenDispositivos.notebook}</span></div>
            <div className={styles.resumenRow}><span>Móvil</span><span className={styles.resumenValue}>{resumenDispositivos.movil}</span></div>
            <div className={styles.resumenRow}><span>Tablet</span><span className={styles.resumenValue}>{resumenDispositivos.tablet}</span></div>
          </div>
        </div>

        <div className={styles.resumenCard}>
          <h4>RESUMEN GEOGRÁFICO</h4>
          <div className={styles.resumenList}>
            {resumenGeografico.length === 0 ? (
              <p className={styles.emptyText}>Sin datos geográficos aún</p>
            ) : (
              resumenGeografico.map((item, idx) => (
                <div key={idx} className={styles.resumenRow}>
                  <span>{item.zona}</span>
                  <span className={styles.resumenValue}>{item.visitas} visitas</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab de Galería ───────────────────────────────────────────────
function GaleriaTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['galeria-admin'],
    queryFn: galeriaService.getAll,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['galeria-admin'] });
  }, [queryClient]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await galeriaService.upload(file, { descripcion: descripcion.trim() || undefined });
      setDescripcion('');
      e.target.value = '';
      toast.success('Imagen subida correctamente');
      refresh();
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleVisible = async (item: GaleriaItem) => {
    try {
      await galeriaService.toggleVisible(item.id, !item.visible);
      refresh();
      toast.info(item.visible ? 'Imagen ocultada' : 'Imagen visible');
    } catch {
      toast.error('Error al actualizar visibilidad');
    }
  };

  const handleDelete = async (item: GaleriaItem) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await galeriaService.delete(item);
      refresh();
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar la imagen');
    }
  };

  // Drag & Drop para reordenar
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = items.findIndex(i => i.id === draggingId);
    const toIdx = items.findIndex(i => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const updates = reordered.map((item, idx) => ({ id: item.id, orden: idx }));
    try {
      await galeriaService.updateOrden(updates);
      refresh();
    } catch {
      toast.error('Error al reordenar');
    }
    setDraggingId(null);
    setDragOverId(null);
  };

  return (
    <div className={styles.galeriaSection}>
      {/* Upload */}
      <div className={styles.uploadCard}>
        <div className={styles.uploadIcon}><Image size={28} /></div>
        <h3>Agregar imagen</h3>
        <div className={styles.uploadFieldGroup}>
          <input
            type="text"
            className={styles.uploadInput}
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
          <label className={`${styles.uploadBtn} ${isUploading ? styles.uploadBtnLoading : ''}`}>
            {isUploading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <Upload size={16} />
                <span>Seleccionar imagen</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
        <p className={styles.uploadHint}>JPG, PNG, WebP · Máx. 10MB</p>
      </div>

      {/* Grid de imágenes */}
      {isLoading ? (
        <p className={styles.loading}>Cargando galería...</p>
      ) : items.length === 0 ? (
        <div className={styles.galeriaEmpty}>
          <Image size={40} opacity={0.3} />
          <p>No hay imágenes en la galería. Subí la primera.</p>
        </div>
      ) : (
        <div className={styles.galeriaGrid}>
          {items.map(item => (
            <div
              key={item.id}
              className={`${styles.galeriaItem} ${!item.visible ? styles.galeriaItemHidden : ''} ${dragOverId === item.id ? styles.galeriaItemDragOver : ''}`}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={e => handleDragOver(e, item.id)}
              onDrop={e => handleDrop(e, item.id)}
              onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
            >
              <div className={styles.galeriaItemHandle}>
                <GripVertical size={16} />
              </div>
              <img src={item.imagen_url} alt={item.descripcion ?? 'Trabajo'} className={styles.galeriaItemImg} />
              {item.descripcion && <p className={styles.galeriaItemDesc}>{item.descripcion}</p>}
              {!item.visible && <div className={styles.hiddenOverlay}>Oculta</div>}
              <div className={styles.galeriaItemActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleToggleVisible(item)}
                  title={item.visible ? 'Ocultar' : 'Mostrar'}
                >
                  {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => handleDelete(item)}
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab de Configuración ─────────────────────────────────────────
function ConfigTab() {
  const toast = useToast();
  const [cfg, setCfg] = useState<SiteConfig>(loadSiteConfig);

  const handleSave = () => {
    saveSiteConfig(cfg);
    toast.success('Configuración guardada');
  };

  return (
    <div className={styles.configSection}>
      <div className={styles.configCard}>
        <div className={styles.configCardHeader}>
          <MessageCircle size={20} />
          <h3>WhatsApp</h3>
        </div>
        <p className={styles.configDesc}>
          Número de WhatsApp para los botones de contacto. Incluí el código de área sin el "0" inicial.<br />
          Ej: <code>5491112345678</code>
        </p>
        <input
          type="tel"
          className={styles.configInput}
          placeholder="5491112345678"
          value={cfg.whatsapp}
          onChange={e => setCfg(prev => ({ ...prev, whatsapp: e.target.value }))}
        />
      </div>

      <div className={styles.configCard}>
        <div className={styles.configCardHeader}>
          <Share2 size={20} />
          <h3>Instagram</h3>
        </div>
        <p className={styles.configDesc}>
          URL o usuario de Instagram para los botones de redes sociales.
        </p>
        <input
          type="text"
          className={styles.configInput}
          placeholder="instagram.com/ml.safelink"
          value={cfg.instagram}
          onChange={e => setCfg(prev => ({ ...prev, instagram: e.target.value }))}
        />
      </div>

      <button className={styles.saveBtn} onClick={handleSave} id="btn-guardar-config-sitio">
        <Save size={16} />
        Guardar configuración
      </button>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
type Tab = 'galeria' | 'estadisticas' | 'configuracion';

export function SitioWebScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('galeria');

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'galeria', label: 'Galería', icon: Image },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Globe },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <Globe size={24} />
          </div>
          <div>
            <h1>Sitio Web</h1>
            <p>Administrá la galería, estadísticas y configuración del sitio público</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
              id={`tab-${t.id}`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.tabContent}>
        {tab === 'galeria' && <GaleriaTab />}
        {tab === 'estadisticas' && <EstadisticasTab />}
        {tab === 'configuracion' && <ConfigTab />}
      </div>
    </div>
  );
}
