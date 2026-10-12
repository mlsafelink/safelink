import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Search,
  Plus,
  Copy,
  Trash2,
  Film,
  RefreshCw,
} from 'lucide-react';
import styles from './ProjectsListPage.module.css';
import { listProjects, duplicateProject, deleteProject } from '../../services/projectService';
import type { VibeProject, ProjectStatus } from '../../types';
import type { ContentFormat } from '../../constants/formats';
import { CONTENT_FORMATS } from '../../constants/formats';
import { useToast } from '@/components/ui/Toast/ToastContext';

export function ProjectsListPage() {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');

  const loadProjects = async () => {
    setLoading(true);
    const res = await listProjects({
      status: statusFilter === 'all' ? undefined : (statusFilter as ProjectStatus),
      format: formatFilter === 'all' ? undefined : (formatFilter as ContentFormat),
    });

    if (res.ok) {
      setProjects(res.data);
    } else {
      showToast('Error al cargar proyectos.', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter, formatFilter]);

  const handleDuplicate = async (id: string) => {
    const res = await duplicateProject(id);
    if (res.ok) {
      showToast('Proyecto duplicado con éxito.', 'success');
      loadProjects();
    } else {
      showToast('No se pudo duplicar el proyecto.', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`¿Confirmás que querés eliminar el proyecto "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const res = await deleteProject(id);
    if (res.ok) {
      showToast('Proyecto eliminado.', 'success');
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } else {
      showToast('Error al eliminar proyecto.', 'error');
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Proyectos Publicitarios</h1>
          <p className={styles.subtitle}>
            Administrá todas tus piezas y campañas creadas en SafeLink Vibe.
          </p>
        </div>

        <Link to="/vibe/crear" className={styles.createBtn}>
          <Plus size={16} />
          <span>Crear Pieza</span>
        </Link>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar proyectos por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Listo / Completado</option>
          <option value="archived">Archivado</option>
        </select>

        <select
          className={styles.selectFilter}
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
        >
          <option value="all">Todos los formatos</option>
          {Object.entries(CONTENT_FORMATS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label} ({v.aspectRatio})
            </option>
          ))}
        </select>
      </div>

      {/* Grid de Proyectos o Estado Vacío */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--vibe-text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
          <div>Cargando proyectos...</div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FolderOpen size={28} />
          </div>
          <h3 style={{ margin: 0, color: 'var(--vibe-text-primary)' }}>
            No se encontraron proyectos
          </h3>
          <p style={{ margin: 0, color: 'var(--vibe-text-muted)', fontSize: '0.875rem' }}>
            {search
              ? 'No hay proyectos que coincidan con la búsqueda.'
              : 'Todavía no creaste ninguna pieza publicitaria con los filtros seleccionados.'}
          </p>
          <Link to="/vibe/crear" className={styles.createBtn} style={{ marginTop: '0.5rem' }}>
            <Plus size={16} />
            <span>Crear la primera pieza</span>
          </Link>
        </div>
      ) : (
        <div className={styles.projectsGrid}>
          {filteredProjects.map((p) => {
            const formatMeta = CONTENT_FORMATS[p.format];
            return (
              <div key={p.id} className={styles.projectCard}>
                <div className={styles.thumbWrapper}>
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} className={styles.thumbImg} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>
                      <Film size={32} />
                      <span>{formatMeta?.aspectRatio || 'Publicidad'}</span>
                    </div>
                  )}
                  <span className={styles.formatBadge}>{formatMeta?.aspectRatio ?? p.format}</span>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor:
                        p.status === 'completed'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                      color:
                        p.status === 'completed' ? 'var(--vibe-success)' : 'var(--vibe-warning)',
                    }}
                  >
                    {p.status === 'draft' ? 'Borrador' : p.status}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.projectTitle} title={p.title}>
                    {p.title}
                  </h3>
                  <p className={styles.projectDesc}>
                    {p.description || 'Sin descripción adicional.'}
                  </p>
                </div>

                <div className={styles.projectFooter}>
                  <span className={styles.projectDate}>
                    {new Date(p.updated_at).toLocaleDateString('es-AR')}
                  </span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Duplicar proyecto"
                      onClick={() => handleDuplicate(p.id)}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      title="Eliminar proyecto"
                      onClick={() => handleDelete(p.id, p.title)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
