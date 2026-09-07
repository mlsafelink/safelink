import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  landingGalleryService,
  CATEGORIES_INFO,
  type LandingGalleryItem,
  type LandingGalleryCategory,
} from '@/services/landingGalleryService';
import { TrabajoModal } from '../components/TrabajoModal';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  ArrowLeft, Plus, Image as ImageIcon, Video, Eye, EyeOff,
  Edit2, Trash2, Star, Search, Filter, Sparkles, AlertTriangle
} from 'lucide-react';
import styles from './GaleriaTrabajosScreen.module.css';

type CategoriaFiltro = 'todas' | LandingGalleryCategory;
type EstadoFiltro = 'todos' | 'visibles' | 'ocultos' | 'destacados';

export function GaleriaTrabajosScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaFiltro>('todas');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<LandingGalleryItem | null>(null);

  // Delete Confirmation Modal
  const [workToDelete, setWorkToDelete] = useState<LandingGalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch works
  const { data: works = [], isLoading } = useQuery({
    queryKey: ['landing-gallery-admin'],
    queryFn: () => landingGalleryService.getAllAdmin(),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['landing-gallery-admin'] });
  }, [queryClient]);

  // Filtrado
  const filteredWorks = useMemo(() => {
    return works.filter(work => {
      // Filtro Categoría
      if (categoriaFiltro !== 'todas' && work.category !== categoriaFiltro) {
        return false;
      }
      // Filtro Estado
      if (estadoFiltro === 'visibles' && !work.active) return false;
      if (estadoFiltro === 'ocultos' && work.active) return false;
      if (estadoFiltro === 'destacados' && !work.featured) return false;

      // Filtro Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = work.title.toLowerCase().includes(q);
        const matchCaption = (work.caption || work.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCaption) return false;
      }

      return true;
    });
  }, [works, categoriaFiltro, estadoFiltro, searchQuery]);

  // Acciones
  const handleOpenCreate = () => {
    setEditingWork(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (work: LandingGalleryItem) => {
    setEditingWork(work);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (work: LandingGalleryItem) => {
    try {
      await landingGalleryService.toggleActive(work.id, !work.active);
      toast.success(work.active ? 'Trabajo ocultado de la landing' : 'Trabajo visible en la landing');
      refresh();
    } catch {
      toast.error('Error al cambiar visibilidad');
    }
  };

  const handleToggleFeatured = async (work: LandingGalleryItem) => {
    try {
      await landingGalleryService.toggleFeatured(work.id, !work.featured);
      toast.success(work.featured ? 'Trabajo desmarcado de destacados' : 'Trabajo marcado como destacado ⭐');
      refresh();
    } catch {
      toast.error('Error al cambiar estado de destacado');
    }
  };

  const confirmDelete = async () => {
    if (!workToDelete) return;
    setIsDeleting(true);
    try {
      await landingGalleryService.deleteWork(workToDelete.id);
      toast.success('Trabajo y multimedia eliminados');
      setWorkToDelete(null);
      refresh();
    } catch {
      toast.error('Error al eliminar el trabajo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ── HEADER ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>

        <div className={styles.headerRow}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <Sparkles size={24} />
            </div>
            <div>
              <h1>Galería de Trabajos Multimedia</h1>
              <p>Fotos y videos de trabajos realizados por SafeLink para la landing page pública.</p>
            </div>
          </div>

          <button className={styles.addBtn} onClick={handleOpenCreate} id="btn-agregar-trabajo">
            <Plus size={18} />
            <span>+ Agregar trabajo</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE FILTROS Y BÚSQUEDA ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por título o epígrafe..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.filterItem}>
            <Filter size={14} className={styles.filterIcon} />
            <select
              value={categoriaFiltro}
              onChange={e => setCategoriaFiltro(e.target.value as CategoriaFiltro)}
              className={styles.filterSelect}
            >
              <option value="todas">Todas las categorías</option>
              <option value="iluminacion">Iluminación LED</option>
              <option value="redes">Redes e infraestructura</option>
              <option value="seguridad">Seguridad inteligente</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <select
              value={estadoFiltro}
              onChange={e => setEstadoFiltro(e.target.value as EstadoFiltro)}
              className={styles.filterSelect}
            >
              <option value="todos">Todos los estados</option>
              <option value="visibles">🟢 Visibles</option>
              <option value="ocultos">⚪ Ocultos</option>
              <option value="destacados">⭐ Destacados</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GRILLA DE TRABAJOS ── */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className={styles.skeletonCard} />
          ))}
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className={styles.emptyState}>
          <ImageIcon size={48} className={styles.emptyIcon} />
          <h3>No se encontraron trabajos</h3>
          <p>
            {works.length === 0
              ? 'Aún no cargaste trabajos en la galería. Creá el primero.'
              : 'No hay trabajos que coincidan con los filtros seleccionados.'}
          </p>
          <button className={styles.addBtn} onClick={handleOpenCreate}>
            <Plus size={16} /> Crear nuevo trabajo
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredWorks.map(work => {
            const catInfo = CATEGORIES_INFO[work.category];
            const videoCount = work.media?.filter(m => m.media_type === 'video').length || 0;
            const photoCount = work.media?.filter(m => m.media_type === 'image').length || (work.image_url ? 1 : 0);

            return (
              <article key={work.id} className={`${styles.card} ${!work.active ? styles.cardInactive : ''}`}>
                {/* Imagen y Badges */}
                <div className={styles.cardMedia}>
                  <img
                    src={work.image_url || 'https://via.placeholder.com/600x400?text=SafeLink'}
                    alt={work.title}
                    className={styles.cardImg}
                  />

                  {/* Badge Categoría */}
                  <span className={`${styles.categoryBadge} ${styles[`cat_${work.category}`]}`}>
                    {catInfo?.icon} {catInfo?.titulo || work.category}
                  </span>

                  {/* Badges de Medios */}
                  <div className={styles.mediaBadges}>
                    {photoCount > 0 && (
                      <span className={styles.mediaBadge} title={`${photoCount} fotografía${photoCount > 1 ? 's' : ''}`}>
                        <ImageIcon size={12} /> {photoCount}
                      </span>
                    )}
                    {videoCount > 0 && (
                      <span className={`${styles.mediaBadge} ${styles.videoBadge}`} title={`${videoCount} video${videoCount > 1 ? 's' : ''}`}>
                        <Video size={12} /> {videoCount > 1 ? `${videoCount} videos` : '1 video'}
                      </span>
                    )}
                  </div>

                  {/* Badge Destacado */}
                  {work.featured && (
                    <span className={styles.featuredBadge} title="Trabajo destacado">
                      ⭐
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className={styles.cardBody}>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.orderBadge}>Orden: #{work.sort_order}</span>
                    <span className={`${styles.statusBadge} ${work.active ? styles.statusActive : styles.statusInactive}`}>
                      {work.active ? '🟢 Visible' : '⚪ Oculto'}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{work.title}</h3>
                  {work.caption && (
                    <p className={styles.cardCaption}>{work.caption}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className={styles.cardFooter}>
                  <div className={styles.cardFooterLeft}>
                    <button
                      className={`${styles.actionIconBtn} ${work.active ? styles.btnActive : ''}`}
                      onClick={() => handleToggleActive(work)}
                      title={work.active ? 'Ocultar de la landing' : 'Publicar en la landing'}
                    >
                      {work.active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      className={`${styles.actionIconBtn} ${work.featured ? styles.btnStarActive : ''}`}
                      onClick={() => handleToggleFeatured(work)}
                      title={work.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                    >
                      <Star size={16} />
                    </button>
                  </div>

                  <div className={styles.cardFooterRight}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleOpenEdit(work)}
                      title="Editar trabajo"
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => setWorkToDelete(work)}
                      title="Eliminar trabajo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── MODAL DE CREACIÓN / EDICIÓN ── */}
      <TrabajoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refresh}
        initialWork={editingWork}
      />

      {/* ── DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN ── */}
      {workToDelete && (
        <div className={styles.confirmBackdrop} onClick={() => setWorkToDelete(null)}>
          <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <div className={styles.confirmIcon}>
              <AlertTriangle size={28} />
            </div>
            <h3>¿Eliminar este trabajo?</h3>
            <p>
              Estás por eliminar <strong>"{workToDelete.title}"</strong> y todos sus archivos multimedia asociados en Supabase Storage. Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setWorkToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
