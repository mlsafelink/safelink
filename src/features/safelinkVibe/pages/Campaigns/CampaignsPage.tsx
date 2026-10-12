import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Shield,
  Wifi,
  Zap,
  Layers,
  Calendar,
  Trash2,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './CampaignsPage.module.css';
import {
  listCampaigns,
  createCampaign,
  deleteCampaign,
  getCampaignStats,
} from '../../services/campaignService';
import type {
  VibeCampaign,
  CampaignStatus,
  CampaignObjective,
  CampaignSummaryStats,
  CreateCampaignInput,
} from '../../types/campaigns';
import { useToast } from '@/components/ui/Toast/ToastContext';

type ServiceFilter = 'todos' | 'seguridad' | 'redes' | 'iluminacion';

export function CampaignsPage() {
  const { showToast } = useToast();

  const [campaigns, setCampaigns] = useState<VibeCampaign[]>([]);
  const [stats, setStats] = useState<CampaignSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedService, setSelectedService] = useState<ServiceFilter>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: '',
    description: '',
    service_target: 'seguridad',
    objective: 'lead_generation',
    status: 'active',
    channels: ['instagram_reels', 'instagram_feed'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    target_audience: '',
    budget: 300,
    metrics: {
      targetLeads: 10,
      estimatedReach: 5000,
      targetPieces: 3,
      completedPieces: 0,
    },
  });

  const loadData = async () => {
    setLoading(true);
    const [cResult, sResult] = await Promise.all([
      listCampaigns(),
      getCampaignStats(),
    ]);

    if (cResult.ok) setCampaigns(cResult.data);
    if (sResult.ok) setStats(sResult.data);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtrado de campañas
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesService =
      selectedService === 'todos' || c.service_target === selectedService;
    const matchesStatus =
      selectedStatus === 'todos' || c.status === selectedStatus;
    return matchesService && matchesStatus;
  });

  // Manejo del formulario de creación
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Por favor ingresá un nombre para la campaña.', 'error');
      return;
    }

    setIsSubmitting(true);
    const result = await createCampaign(formData);
    setIsSubmitting(false);

    if (result.ok) {
      showToast('Campaña publicitaria creada con éxito.', 'success');
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        service_target: 'seguridad',
        objective: 'lead_generation',
        status: 'active',
        channels: ['instagram_reels', 'instagram_feed'],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        target_audience: '',
        budget: 300,
        metrics: {
          targetLeads: 10,
          estimatedReach: 5000,
          targetPieces: 3,
          completedPieces: 0,
        },
      });
      await loadData();
    } else {
      showToast(result.error || 'Error al crear la campaña', 'error');
    }
  };

  // Manejo de eliminación
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que querés eliminar la campaña "${name}"?`)) {
      return;
    }
    const result = await deleteCampaign(id);
    if (result.ok) {
      showToast('Campaña eliminada correctamente.', 'info');
      await loadData();
    }
  };

  const getServiceBadgeClass = (service: string) => {
    switch (service) {
      case 'seguridad':
        return styles.serviceSeguridad;
      case 'redes':
        return styles.serviceRedes;
      case 'iluminacion':
        return styles.serviceIluminacion;
      default:
        return styles.serviceGeneral;
    }
  };

  const getServiceLabel = (service: string) => {
    switch (service) {
      case 'seguridad':
        return 'Cámaras CCTV';
      case 'redes':
        return 'Redes & WiFi 6';
      case 'iluminacion':
        return 'Iluminación Smart';
      default:
        return 'General';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'seguridad':
        return <Shield size={12} />;
      case 'redes':
        return <Wifi size={12} />;
      case 'iluminacion':
        return <Zap size={12} />;
      default:
        return <Layers size={12} />;
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'active':
        return <span className={clsx(styles.statusBadge, styles.statusActive)}>● Activa</span>;
      case 'planned':
        return <span className={clsx(styles.statusBadge, styles.statusPlanned)}>Planificada</span>;
      case 'draft':
        return <span className={clsx(styles.statusBadge, styles.statusDraft)}>Borrador</span>;
      case 'paused':
        return <span className={clsx(styles.statusBadge, styles.statusPaused)}>Pausada</span>;
      case 'completed':
        return <span className={clsx(styles.statusBadge, styles.statusCompleted)}>Completada</span>;
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>Campañas Publicitarias</h1>
          <p className={styles.subtitle}>
            Planificá estrategias de difusión multiformato orientadas a objetivos comerciales reales para los servicios de SafeLink.
          </p>
        </div>

        <button
          type="button"
          className={styles.newCampaignBtn}
          onClick={() => setIsModalOpen(true)}
          id="btn-nueva-campana"
        >
          <Plus size={16} />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* ── Métricas y KPIs de Campañas ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Campañas Activas</span>
          <span className={styles.metricValue}>{stats?.active ?? 0}</span>
          <span className={styles.metricSub}>de {stats?.total ?? 0} totales creadas</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Piezas en Producción</span>
          <span className={styles.metricValue}>{stats?.totalPieces ?? 0}</span>
          <span className={styles.metricSub}>videos, reels e imágenes asignados</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Planificadas / Borradores</span>
          <span className={styles.metricValue}>
            {(stats?.planned ?? 0) + (stats?.draft ?? 0)}
          </span>
          <span className={styles.metricSub}>próximos lanzamientos en agenda</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Campañas Concluidas</span>
          <span className={styles.metricValue}>{stats?.completed ?? 0}</span>
          <span className={styles.metricSub}>historial de difusión SafeLink</span>
        </div>
      </div>

      {/* ── Barra de Filtros ── */}
      <div className={styles.toolbar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={clsx(styles.filterTab, selectedService === 'todos' && styles.filterTabActive)}
            onClick={() => setSelectedService('todos')}
          >
            <Layers size={14} />
            <span>Todos los servicios</span>
          </button>
          <button
            type="button"
            className={clsx(styles.filterTab, selectedService === 'seguridad' && styles.filterTabActive)}
            onClick={() => setSelectedService('seguridad')}
          >
            <Shield size={14} />
            <span>Seguridad CCTV</span>
          </button>
          <button
            type="button"
            className={clsx(styles.filterTab, selectedService === 'redes' && styles.filterTabActive)}
            onClick={() => setSelectedService('redes')}
          >
            <Wifi size={14} />
            <span>Redes & WiFi 6</span>
          </button>
          <button
            type="button"
            className={clsx(styles.filterTab, selectedService === 'iluminacion' && styles.filterTabActive)}
            onClick={() => setSelectedService('iluminacion')}
          >
            <Zap size={14} />
            <span>Iluminación Domótica</span>
          </button>
        </div>

        <div>
          <select
            className={styles.statusSelect}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="planned">Planificadas</option>
            <option value="draft">Borradores</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
      </div>

      {/* ── Listado de Campañas ── */}
      {loading ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>Cargando campañas publicitarias...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={40} style={{ opacity: 0.3 }} />
          <h2 className={styles.emptyStateTitle}>No se encontraron campañas</h2>
          <p className={styles.emptyStateText}>
            No hay campañas que coincidan con los filtros seleccionados. Creá tu primera campaña con el botón superior.
          </p>
        </div>
      ) : (
        <div className={styles.campaignsGrid}>
          {filteredCampaigns.map((camp) => {
            const completed = camp.metrics.completedPieces || 0;
            const target = camp.metrics.targetPieces || 1;
            const pct = Math.min(100, Math.round((completed / target) * 100));

            return (
              <div key={camp.id} className={styles.campaignCard}>
                <div className={styles.cardTop}>
                  <span className={clsx(styles.serviceBadge, getServiceBadgeClass(camp.service_target))}>
                    {getServiceIcon(camp.service_target)}
                    {getServiceLabel(camp.service_target)}
                  </span>
                  {getStatusBadge(camp.status)}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.campaignTitle}>{camp.name}</h3>
                  {camp.description && <p className={styles.campaignDesc}>{camp.description}</p>}
                </div>

                {/* Progreso de piezas */}
                <div className={styles.progressSection}>
                  <div className={styles.progressLabels}>
                    <span>Piezas publicitarias listas</span>
                    <strong>{completed} de {target} ({pct}%)</strong>
                  </div>
                  <div className={styles.progressBarTrack}>
                    <div className={styles.progressBarFill} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Metadatos */}
                <div className={styles.cardMeta}>
                  <div className={styles.channelsList}>
                    {camp.channels.map((ch) => (
                      <span key={ch} className={styles.channelTag}>
                        {ch.replace('instagram_', '').replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {camp.start_date && (
                    <span title="Fecha de inicio">
                      <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {new Date(camp.start_date).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className={styles.cardActions}>
                  <Link
                    to={`/vibe/crear?campaignId=${camp.id}&service=${camp.service_target}`}
                    className={styles.createPieceBtn}
                    title="Crear nueva pieza con el contexto de esta campaña"
                  >
                    <Plus size={14} />
                    <span>Crear Pieza</span>
                  </Link>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(camp.id, camp.name)}
                    title="Eliminar campaña"
                    aria-label={`Eliminar campaña ${camp.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal de Creación de Campaña ── */}
      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva Campaña Publicitaria SafeLink</h2>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre de la Campaña *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ej. Consorcios Seguros Q4 — Cámaras IP"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Descripción y Propuesta de Valor</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="Detallá el foco del mensaje comercial, dolores del cliente y beneficios a resaltar..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Servicio SafeLink</label>
                    <select
                      className={styles.formSelect}
                      value={formData.service_target}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service_target: e.target.value as any,
                        })
                      }
                    >
                      <option value="seguridad">Cámaras de Seguridad CCTV</option>
                      <option value="redes">Redes & Fibra Óptica WiFi 6</option>
                      <option value="iluminacion">Iluminación Inteligente</option>
                      <option value="general">General SafeLink</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Objetivo Comercial</label>
                    <select
                      className={styles.formSelect}
                      value={formData.objective}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          objective: e.target.value as CampaignObjective,
                        })
                      }
                    >
                      <option value="lead_generation">Captación de Presupuestos / Leads</option>
                      <option value="brand_awareness">Reconocimiento de Marca</option>
                      <option value="seasonal_promo">Promoción de Temporada</option>
                      <option value="service_launch">Lanzamiento de Servicio</option>
                      <option value="customer_retention">Fidelización de Clientes</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Estado Inicial</label>
                    <select
                      className={styles.formSelect}
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as CampaignStatus,
                        })
                      }
                    >
                      <option value="active">Activa</option>
                      <option value="planned">Planificada</option>
                      <option value="draft">Borrador</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Objetivo de Piezas</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className={styles.formInput}
                      value={formData.metrics?.targetPieces || 3}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metrics: {
                            ...formData.metrics,
                            targetPieces: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Público Objetivo (Target)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Ej. Administradores de consorcios, propietarios, comercios..."
                    value={formData.target_audience || ''}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
