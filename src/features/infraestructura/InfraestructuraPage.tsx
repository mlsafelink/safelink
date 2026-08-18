import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { infraestructuraService } from '@/services/infraestructuraService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { SwitchIllustration } from './components/SwitchIllustration';
import { DVRIllustration } from './components/DVRIllustration';
import { NuevoPlanoModal } from './components/NuevoPlanoModal';
import { CompartirPlanoModal } from './components/CompartirPlanoModal';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  Network, Video, Plus, Layers, ArrowRight,
  ChevronRight, Calendar, Building, ExternalLink,
  Trash2, Edit3, Share2, UploadCloud,
} from 'lucide-react';
import type { PlanoTipo, PlanoInfraestructura } from '@/types/infraestructura';
import styles from './InfraestructuraPage.module.css';

export function InfraestructuraPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeFilter, setActiveFilter] = useState<'todos' | 'redes' | 'camaras'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTipo, setModalInitialTipo] = useState<PlanoTipo>('redes');
  const [sharePlan, setSharePlan] = useState<PlanoInfraestructura | null>(null);

  // Cargar planos
  const { data: planos = [], isLoading } = useQuery({
    queryKey: ['infra-plans', activeFilter],
    queryFn: () =>
      infraestructuraService.getAll(activeFilter === 'todos' ? undefined : activeFilter),
  });

  // Cargar resumen métrico
  const { data: summary } = useQuery({
    queryKey: ['infra-summary'],
    queryFn: () => infraestructuraService.getSummary(),
  });

  const handleOpenNewModal = (tipo: PlanoTipo = 'redes') => {
    setModalInitialTipo(tipo);
    setIsModalOpen(true);
  };

  const handlePlanCreated = (newPlan: PlanoInfraestructura) => {
    queryClient.invalidateQueries({ queryKey: ['infra-plans'] });
    queryClient.invalidateQueries({ queryKey: ['infra-summary'] });
    showToast(`El plano "${newPlan.nombre}" se creó con éxito.`, 'success');
    navigate(`/infraestructura/plano/${newPlan.id}`);
  };

  const handleOpenShare = (e: React.MouseEvent, plan: PlanoInfraestructura) => {
    e.stopPropagation();
    setSharePlan(plan);
  };

  const handleDeletePlan = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseás eliminar el plano "${name}"?`)) {
      await infraestructuraService.delete(id);
      queryClient.invalidateQueries({ queryKey: ['infra-plans'] });
      queryClient.invalidateQueries({ queryKey: ['infra-summary'] });
      showToast(`El plano "${name}" ha sido removido.`, 'info');
    }
  };

  const formatFecha = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Principal */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Layers size={28} />
          </div>
          <div>
            <h1>Infraestructura técnica</h1>
            <p>Visualiza y gestiona la infraestructura técnica de tus instalaciones</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button
            variant="primary"
            leftIcon={<Plus size={18} />}
            onClick={() => handleOpenNewModal('redes')}
            className={styles.headerBtn}
          >
            + Nuevo plano
          </Button>
        </div>
      </div>

      {/* Grid de Tarjetas Principales & Resumen Lateral */}
      <div className={styles.mainGrid}>
        {/* Columna Izquierda: Tarjetas Redes y Cámaras */}
        <div className={styles.cardsColumn}>
          {/* Tarjeta 1 — Redes */}
          <Card variant="glass" className={`${styles.featureCard} ${styles.redesCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <div className={`${styles.iconWrap} ${styles.iconRedes}`}>
                  <Network size={24} />
                </div>
                <div>
                  <h2>Redes</h2>
                  <p className={styles.cardDescription}>
                    Planos de conectividad, switches, puestos de red, bocas, access points y más.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => { setActiveFilter('redes'); }}
                className={styles.cardActionBtn}
              >
                Ver planos de redes
              </Button>
            </div>

            {/* Ilustración Vectorial del Switch */}
            <div className={styles.illustrationWrapper}>
              <SwitchIllustration />
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.footerMetric}>
                <span className={styles.metricValue}>{summary?.planosRedes ?? 2}</span>
                <span className={styles.metricLabel}>Planos de Red</span>
              </div>
              <div className={styles.footerMetricDivider} />
              <div className={styles.footerMetric}>
                <span className={styles.metricValue}>{summary?.dispositivosRed ?? 48}</span>
                <span className={styles.metricLabel}>Dispositivos de Red</span>
              </div>
              <div className={styles.footerMetricDivider} />
              <button
                className={styles.footerNewLink}
                onClick={() => handleOpenNewModal('redes')}
              >
                <Plus size={14} />
                <span>Crear plano de red</span>
              </button>
            </div>
          </Card>

          {/* Tarjeta 2 — Cámaras */}
          <Card variant="glass" className={`${styles.featureCard} ${styles.camarasCard}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIcon}>
                <div className={`${styles.iconWrap} ${styles.iconCamaras}`}>
                  <Video size={24} />
                </div>
                <div>
                  <h2>Cámaras</h2>
                  <p className={styles.cardDescription}>
                    Planos de videovigilancia, DVR/NVR, cámaras, canales y ubicaciones.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => { setActiveFilter('camaras'); }}
                className={styles.cardActionBtn}
              >
                Ver planos de cámaras
              </Button>
            </div>

            {/* Ilustración Vectorial del DVR/NVR */}
            <div className={styles.illustrationWrapper}>
              <DVRIllustration />
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.footerMetric}>
                <span className={styles.metricValue}>{summary?.planosCamaras ?? 2}</span>
                <span className={styles.metricLabel}>Planos de CCTV</span>
              </div>
              <div className={styles.footerMetricDivider} />
              <div className={styles.footerMetric}>
                <span className={styles.metricValue}>{summary?.camaras ?? 32}</span>
                <span className={styles.metricLabel}>Cámaras Instaladas</span>
              </div>
              <div className={styles.footerMetricDivider} />
              <button
                className={styles.footerNewLink}
                onClick={() => handleOpenNewModal('camaras')}
              >
                <Plus size={14} />
                <span>Crear plano de cámaras</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Resumen del Módulo y Acciones Rápidas */}
        <div className={styles.sidebarColumn}>
          {/* Tarjeta Resumen del Módulo */}
          <Card variant="glass" className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3>Resumen del módulo</h3>
            </div>
            <div className={styles.summaryList}>
              <div
                className={styles.summaryItem}
                onClick={() => setActiveFilter('todos')}
              >
                <div className={`${styles.summaryItemIcon} ${styles.iconGradPurple}`}>
                  <Layers size={18} />
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemTitle}>Planos totales</span>
                  <span className={styles.summaryItemValue}>{summary?.planosTotales ?? 4}</span>
                </div>
                <ChevronRight size={18} className={styles.summaryArrow} />
              </div>

              <div
                className={styles.summaryItem}
                onClick={() => setActiveFilter('redes')}
              >
                <div className={`${styles.summaryItemIcon} ${styles.iconGradBlue}`}>
                  <Network size={18} />
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemTitle}>Dispositivos de red</span>
                  <span className={styles.summaryItemValue}>{summary?.dispositivosRed ?? 48}</span>
                </div>
                <ChevronRight size={18} className={styles.summaryArrow} />
              </div>

              <div
                className={styles.summaryItem}
                onClick={() => setActiveFilter('camaras')}
              >
                <div className={`${styles.summaryItemIcon} ${styles.iconGradRose}`}>
                  <Video size={18} />
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemTitle}>Cámaras</span>
                  <span className={styles.summaryItemValue}>{summary?.camaras ?? 32}</span>
                </div>
                <ChevronRight size={18} className={styles.summaryArrow} />
              </div>

              <div
                className={styles.summaryItem}
                onClick={() => setActiveFilter('camaras')}
              >
                <div className={`${styles.summaryItemIcon} ${styles.iconGradViolet}`}>
                  <Layers size={18} />
                </div>
                <div className={styles.summaryItemInfo}>
                  <span className={styles.summaryItemTitle}>DVR / NVR</span>
                  <span className={styles.summaryItemValue}>{summary?.dvrs ?? 6}</span>
                </div>
                <ChevronRight size={18} className={styles.summaryArrow} />
              </div>
            </div>
          </Card>

          {/* Tarjeta Acciones Rápidas */}
          <Card variant="glass" className={styles.sideCard}>
            <div className={styles.sideCardHeader}>
              <h3>Acciones rápidas</h3>
            </div>
            <div className={styles.quickActionsList}>
              <button
                className={styles.quickActionBtn}
                onClick={() => handleOpenNewModal('redes')}
              >
                <div className={styles.quickActionIcon}>
                  <Network size={18} className={styles.colorBlue} />
                </div>
                <div className={styles.quickActionText}>
                  <strong>Nuevo plano de redes</strong>
                  <span>Crear un nuevo plano de conectividad</span>
                </div>
              </button>

              <button
                className={styles.quickActionBtn}
                onClick={() => handleOpenNewModal('camaras')}
              >
                <div className={styles.quickActionIcon}>
                  <Video size={18} className={styles.colorPurple} />
                </div>
                <div className={styles.quickActionText}>
                  <strong>Nuevo plano de cámaras</strong>
                  <span>Crear un nuevo plano de CCTV</span>
                </div>
              </button>

              <button
                className={styles.quickActionBtn}
                onClick={() => handleOpenNewModal('mixto')}
              >
                <div className={styles.quickActionIcon}>
                  <UploadCloud size={18} className={styles.colorGreen} />
                </div>
                <div className={styles.quickActionText}>
                  <strong>Importar plano PDF</strong>
                  <span>Subir y preparar un plano existente</span>
                </div>
              </button>

              <button
                className={styles.quickActionBtn}
                onClick={() => {
                  if (planos.length > 0) {
                    navigate(`/infraestructura/plano/${planos[0].id}`);
                  } else {
                    handleOpenNewModal('redes');
                  }
                }}
              >
                <div className={styles.quickActionIcon}>
                  <Layers size={18} className={styles.colorOrange} />
                </div>
                <div className={styles.quickActionText}>
                  <strong>Gestionar capas</strong>
                  <span>Administrar elementos interactivos</span>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Sección Planos Recientes */}
      <section className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <div>
            <h2>Planos recientes</h2>
            <p>Accedé y editá la documentación interactiva de cada instalación</p>
          </div>
          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTab} ${activeFilter === 'todos' ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter('todos')}
            >
              Todos ({planos.length})
            </button>
            <button
              className={`${styles.filterTab} ${activeFilter === 'redes' ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter('redes')}
            >
              🌐 Redes
            </button>
            <button
              className={`${styles.filterTab} ${activeFilter === 'camaras' ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter('camaras')}
            >
              📹 Cámaras
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className={styles.loadingText}>Cargando planos de infraestructura...</p>
        ) : planos.length === 0 ? (
          <Card variant="glass" className={styles.emptyCard}>
            <Layers size={40} className={styles.emptyIcon} />
            <h3>No hay planos registrados</h3>
            <p>Creá tu primer plano interactivo para comenzar a documentar redes o cámaras.</p>
            <Button
              variant="primary"
              leftIcon={<Plus size={16} />}
              onClick={() => handleOpenNewModal('redes')}
            >
              Nuevo Plano
            </Button>
          </Card>
        ) : (
          <div className={styles.plansGrid}>
            {planos.map(plan => {
              const clientName =
                plan.consorcio?.nombre ||
                plan.particular?.nombre ||
                'Consorcio General';
              const elementsCount = plan.elementos?.length ?? 0;

              return (
                <Card
                  key={plan.id}
                  variant="glass"
                  className={styles.planCard}
                  onClick={() => navigate(`/infraestructura/plano/${plan.id}`)}
                >
                  {/* Thumbnail / Vista previa */}
                  <div className={styles.planThumbnailWrap}>
                    <img
                      src={plan.archivo_url}
                      alt={plan.nombre}
                      className={styles.planThumbnail}
                      onError={e => {
                        // Fallback imagen
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <span
                      className={`${styles.typeBadge} ${
                        plan.tipo === 'redes'
                          ? styles.badgeRedes
                          : plan.tipo === 'camaras'
                          ? styles.badgeCamaras
                          : styles.badgeMixto
                      }`}
                    >
                      {plan.tipo === 'redes' ? 'Redes' : plan.tipo === 'camaras' ? 'Cámaras' : 'Mixto'}
                    </span>
                    <span className={styles.elementsCountBadge}>
                      {elementsCount} {elementsCount === 1 ? 'elemento' : 'elementos'}
                    </span>
                  </div>

                  {/* Info del Plano */}
                  <div className={styles.planInfo}>
                    <h3 className={styles.planTitle}>{plan.nombre}</h3>
                    <div className={styles.planMeta}>
                      <div className={styles.metaRow}>
                        <Building size={14} />
                        <span>{clientName}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <Calendar size={14} />
                        <span>{formatFecha(plan.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className={styles.planActions}>
                    <button
                      className={styles.actionIconBtn}
                      title="Compartir link privado de solo lectura"
                      onClick={e => handleOpenShare(e, plan)}
                    >
                      <Share2 size={16} />
                    </button>
                    <button
                      className={styles.actionIconBtn}
                      title="Abrir visor público"
                      onClick={e => {
                        e.stopPropagation();
                        window.open(`/p/plano/${plan.public_id || plan.id}`, '_blank');
                      }}
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      className={styles.actionIconBtn}
                      title="Abrir editor"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/infraestructura/plano/${plan.id}`);
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      className={`${styles.actionIconBtn} ${styles.actionDelete}`}
                      title="Eliminar plano"
                      onClick={e => handleDeletePlan(e, plan.id, plan.nombre)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal de Nuevo Plano */}
      <NuevoPlanoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlanCreated={handlePlanCreated}
        initialTipo={modalInitialTipo}
      />

      {/* Modal para Compartir Plano */}
      <CompartirPlanoModal
        isOpen={!!sharePlan}
        onClose={() => setSharePlan(null)}
        plan={sharePlan}
      />
    </div>
  );
}
