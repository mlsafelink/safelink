import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Monitor, Smartphone, Square, Film, GalleryVertical,
  LayoutGrid, Plus, ChevronRight, FolderOpen,
  Camera, Wifi, Lightbulb, ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './VibeDashboard.module.css';
import { listProjects, getProjectStats, duplicateProject, archiveProject } from '../../services/projectService';
import type { VibeProject, ProjectStats } from '../../types';
import { CONTENT_FORMATS } from '../../constants/formats';
import type { ContentFormat } from '../../constants/formats';

// ---- Accesos rápidos de creación ----

interface QuickAction {
  label: string;
  format: ContentFormat;
  icon: React.ReactNode;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Video',
    format: 'video_9_16',
    icon: <Smartphone size={18} />,
    color: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)',
  },
  {
    label: 'Reel',
    format: 'reel',
    icon: <Film size={18} />,
    color: 'linear-gradient(135deg,#8b5cf6,#c084fc)',
  },
  {
    label: 'Historia',
    format: 'story_9_16',
    icon: <GalleryVertical size={18} />,
    color: 'linear-gradient(135deg,#f43f5e,#fb923c)',
  },
  {
    label: 'Publicación',
    format: 'image_1_1',
    icon: <Square size={18} />,
    color: 'linear-gradient(135deg,#06b6d4,#3b82f6)',
  },
  {
    label: 'Carrusel',
    format: 'carousel',
    icon: <LayoutGrid size={18} />,
    color: 'linear-gradient(135deg,#10b981,#3b82f6)',
  },
  {
    label: 'Horizontal',
    format: 'video_16_9',
    icon: <Monitor size={18} />,
    color: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  },
];

// ---- Utilidades ----

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `Hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr}h`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En proceso',
  completed: 'Completado',
  archived: 'Archivado',
};

function FormatLabel({ format }: { format: ContentFormat }) {
  const def = CONTENT_FORMATS[format];
  return <span>{def?.label ?? format}</span>;
}

// ---- Skeleton ----

function ProjectCardSkeleton() {
  return (
    <div className={styles.projectCard} style={{ pointerEvents: 'none' }}>
      <div className={clsx(styles.projectCardThumb, styles.skeleton, styles.skeletonThumb)} />
      <div className={styles.projectCardBody} style={{ gap: '0.75rem' }}>
        <div className={clsx(styles.skeleton, styles.skeletonLine)} />
        <div className={clsx(styles.skeleton, styles.skeletonLineShort)} />
      </div>
    </div>
  );
}

// ---- Componente principal ----

export function VibeDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [projectsResult, statsResult] = await Promise.all([
        listProjects({ limit: 6 }),
        getProjectStats(),
      ]);

      if (cancelled) return;

      if (!projectsResult.ok) {
        setError(projectsResult.error);
      } else {
        setProjects(projectsResult.data);
      }

      if (statsResult.ok) {
        setStats(statsResult.data);
      }

      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  function handleCreateWithFormat(format: ContentFormat) {
    navigate(`/vibe/crear?format=${format}`);
  }

  async function handleDuplicate(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = await duplicateProject(id);
    if (result.ok) {
      setProjects((prev) => [result.data, ...prev.slice(0, 5)]);
    }
  }

  async function handleArchive(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = await archiveProject(id);
    if (result.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (stats) {
        setStats({ ...stats, total: stats.total - 1, archived: stats.archived + 1, drafts: stats.drafts - 1 });
      }
    }
  }

  return (
    <div className={styles.page}>

      {/* ---- Bienvenida ---- */}
      <section className={styles.welcome} aria-labelledby="vibe-welcome-heading">
        <div className={styles.welcomeText}>
          <p className={styles.welcomeEyebrow}>Estudio Creativo de Publicidad</p>
          <h1 id="vibe-welcome-heading" className={styles.welcomeHeading}>
            Convertí tus ideas en publicidad<br />que hace crecer tu negocio.
          </h1>
          <p className={styles.welcomeSubheading}>
            Creá imágenes, videos y Reels para cámaras de seguridad, redes e iluminación.
            Todo desde un solo lugar.
          </p>
        </div>

        {/* Servicios autorizados */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { icon: <Camera size={13} />, label: 'Cámaras' },
            { icon: <Wifi size={13} />, label: 'Redes' },
            { icon: <Lightbulb size={13} />, label: 'Iluminación' },
          ].map(({ icon, label }) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.3125rem 0.75rem',
                background: 'var(--vibe-surface-2)',
                border: '1px solid var(--vibe-border)',
                borderRadius: '999px',
                fontSize: '0.75rem',
                color: 'var(--vibe-text-secondary)',
              }}
            >
              {icon}
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ---- Accesos rápidos ---- */}
      <section aria-labelledby="vibe-quick-heading">
        <div className={styles.sectionHeader}>
          <h2 id="vibe-quick-heading" className={styles.sectionTitle}>¿Qué querés crear hoy?</h2>
          <Link to="/vibe/crear" className={styles.sectionLink}>
            Ver todos los formatos <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.format}
              id={`quick-create-${action.format}`}
              type="button"
              className={styles.quickActionBtn}
              onClick={() => handleCreateWithFormat(action.format)}
              title={`Crear ${CONTENT_FORMATS[action.format]?.description}`}
              aria-label={`Crear ${action.label}`}
            >
              <div
                className={styles.quickActionIcon}
                style={{ background: action.color }}
                aria-hidden="true"
              >
                <span style={{ color: 'white' }}>{action.icon}</span>
              </div>
              <span className={styles.quickActionLabel}>{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Estadísticas ---- */}
      <section aria-labelledby="vibe-stats-heading">
        <div className={styles.sectionHeader}>
          <h2 id="vibe-stats-heading" className={styles.sectionTitle}>Resumen</h2>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Proyectos</span>
            <span className={styles.statValue}>{stats?.total ?? '—'}</span>
            <span className={styles.statSub}>en total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Borradores</span>
            <span className={styles.statValue}>{stats?.drafts ?? '—'}</span>
            <span className={styles.statSub}>sin finalizar</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Completados</span>
            <span className={styles.statValue}>{stats?.completed ?? '—'}</span>
            <span className={styles.statSub}>listos para publicar</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Motor IA</span>
            <span className={styles.statValue} style={{ fontSize: '1rem', marginTop: '0.25rem' }}>
              Fase 2
            </span>
            <span className={styles.statSub}>próximamente</span>
          </div>
        </div>
      </section>

      {/* ---- Proyectos recientes ---- */}
      <section aria-labelledby="vibe-recent-heading">
        <div className={styles.sectionHeader}>
          <h2 id="vibe-recent-heading" className={styles.sectionTitle}>Proyectos recientes</h2>
          {projects.length > 0 && (
            <Link to="/vibe/proyectos" className={styles.sectionLink}>
              Ver todos <ChevronRight size={13} aria-hidden="true" />
            </Link>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--vibe-radius-md)',
              color: 'var(--vibe-error)',
              fontSize: '0.875rem',
            }}
          >
            No se pudieron cargar los proyectos: {error}
          </div>
        )}

        <div className={styles.projectsGrid}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : projects.length === 0 ? (
            <div className={styles.emptyState} role="status">
              <div className={styles.emptyStateIcon} aria-hidden="true">
                <FolderOpen size={24} />
              </div>
              <h3 className={styles.emptyStateTitle}>Todavía no tenés proyectos</h3>
              <p className={styles.emptyStateSub}>
                Creá tu primer pieza publicitaria y aparecerá acá con todas sus opciones.
              </p>
              <Link to="/vibe/crear" className={styles.emptyStateCta} id="vibe-first-create-btn">
                <Plus size={14} aria-hidden="true" />
                Crear primer proyecto
              </Link>
            </div>
          ) : (
            projects.map((project) => (
              <article
                key={project.id}
                className={styles.projectCard}
                onClick={() => navigate(`/vibe/proyectos/${project.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Proyecto: ${project.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/vibe/proyectos/${project.id}`);
                }}
              >
                {/* Thumbnail */}
                <div className={styles.projectCardThumb}>
                  {project.thumbnail_url ? (
                    <img
                      src={project.thumbnail_url}
                      alt={`Vista previa de ${project.title}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={styles.projectCardThumbInner}>
                      <Film size={24} aria-hidden="true" />
                      <span className={styles.projectCardThumbLabel}>Sin miniatura</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={styles.projectCardBody}>
                  <div className={styles.projectCardTitle}>{project.title}</div>
                  <div className={styles.projectCardMeta}>
                    <span className={styles.projectCardFormat}>
                      <FormatLabel format={project.format} />
                    </span>
                    <span
                      className={clsx(styles.badge, styles[project.status])}
                      aria-label={`Estado: ${STATUS_LABELS[project.status]}`}
                    >
                      {STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <div
                    className={styles.projectCardMeta}
                    style={{ marginTop: '0.25rem' }}
                  >
                    <span className={styles.projectCardDate}>
                      {formatRelativeDate(project.updated_at)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(project.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.6875rem',
                          color: 'var(--vibe-text-muted)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--vibe-radius-sm)',
                          transition: 'color var(--vibe-transition)',
                        }}
                        aria-label={`Duplicar ${project.title}`}
                        title="Duplicar"
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleArchive(project.id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.6875rem',
                          color: 'var(--vibe-text-muted)',
                          padding: '0.125rem 0.375rem',
                          borderRadius: 'var(--vibe-radius-sm)',
                          transition: 'color var(--vibe-transition)',
                        }}
                        aria-label={`Archivar ${project.title}`}
                        title="Archivar"
                      >
                        Archivar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
