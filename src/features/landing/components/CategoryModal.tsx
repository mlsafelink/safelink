import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  landingGalleryService,
  CATEGORIES_INFO,
  type LandingGalleryCategory,
  type LandingGalleryItem,
} from '@/services/landingGalleryService';
import { Lightbox, type LightboxMediaItem } from './Lightbox';
import styles from './CategoryModal.module.css';

interface CategoryModalProps {
  category: LandingGalleryCategory;
  categoryImg: string;
  isOpen: boolean;
  onClose: () => void;
  onContactClick: (category: LandingGalleryCategory) => void;
}

export function CategoryModal({
  category,
  categoryImg,
  isOpen,
  onClose,
  onContactClick,
}: CategoryModalProps) {
  const [works, setWorks] = useState<LandingGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categoryInfo = CATEGORIES_INFO[category];

  // Cargar fotos y videos cuando se abre la categoría
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    landingGalleryService.getByCategory(category).then(data => {
      if (isMounted) {
        setWorks(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [category, isOpen]);

  // Manejar tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxIndex === null) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, lightboxIndex, onClose]);

  // Construir lista plana de medios para el Lightbox
  const lightboxMediaList: LightboxMediaItem[] = useMemo(() => {
    const list: LightboxMediaItem[] = [];

    works.forEach(work => {
      if (work.media && work.media.length > 0) {
        work.media.forEach(m => {
          list.push({
            id: m.id,
            media_type: m.media_type,
            media_url: m.media_url,
            title: work.title,
            caption: work.caption || work.description,
          });
        });
      } else if (work.image_url) {
        list.push({
          id: work.id,
          media_type: 'image',
          media_url: work.image_url,
          title: work.title,
          caption: work.caption || work.description,
        });
      }
    });

    return list;
  }, [works]);

  const handleOpenWorkLightbox = (work: LandingGalleryItem) => {
    const firstMediaUrl = work.media?.[0]?.media_url || work.image_url;
    const targetIdx = lightboxMediaList.findIndex(m => m.media_url === firstMediaUrl);
    setLightboxIndex(targetIdx >= 0 ? targetIdx : 0);
  };

  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const handleContact = () => {
    onClose();
    onContactClick(category);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-modal="true" role="dialog">
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          {/* Botón cerrar flotante */}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
            title="Cerrar (Esc)"
          >
            ✕
          </button>

          {/* ── ENCABEZADO DE CATEGORÍA ── */}
          <header className={styles.header}>
            <div
              className={styles.headerBg}
              style={{ backgroundImage: `url(${categoryImg})` }}
              aria-hidden="true"
            />
            <div className={styles.headerOverlay} />
            <div className={styles.headerContent}>
              <div className={styles.categoryIcon}>{categoryInfo.icon}</div>
              <span className={styles.eyebrow}>{categoryInfo.subtitulo}</span>
              <h2 className={styles.categoryTitle}>{categoryInfo.titulo}</h2>
              <p className={styles.categoryDesc}>{categoryInfo.descripcionComercial}</p>

              {/* Chips de tipos de trabajo */}
              <div className={styles.workTags}>
                {categoryInfo.tiposTrabajo.map(tag => (
                  <span key={tag} className={styles.workTag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* ── SECCIÓN: NUESTROS TRABAJOS ── */}
          <div className={styles.body}>
            <div className={styles.galleryHeader}>
              <div>
                <span className={styles.galleryEyebrow}>Galería de proyectos</span>
                <h3 className={styles.galleryTitle}>Nuestros trabajos</h3>
              </div>
              <span className={styles.galleryBadge}>
                {works.length} {works.length === 1 ? 'proyecto' : 'proyectos'}
              </span>
            </div>

            {isLoading ? (
              <div className={styles.grid}>
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={styles.skeletonCard} />
                ))}
              </div>
            ) : works.length === 0 ? (
              <div className={styles.empty}>
                <p>Próximamente se publicarán trabajos para esta categoría.</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {works.map((work) => {
                  const hasVideo = work.media?.some(m => m.media_type === 'video');
                  const photoCount = work.media?.filter(m => m.media_type === 'image').length || (work.image_url ? 1 : 0);

                  return (
                    <article
                      key={work.id}
                      className={styles.workCard}
                      onClick={() => handleOpenWorkLightbox(work)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOpenWorkLightbox(work);
                        }
                      }}
                    >
                      <div className={styles.workImgWrapper}>
                        <img
                          src={work.image_url || 'https://via.placeholder.com/600x400?text=SafeLink'}
                          alt={work.title}
                          className={styles.workImg}
                          loading="lazy"
                        />

                        {/* Badges de multimedia */}
                        <div className={styles.mediaBadges}>
                          {hasVideo && (
                            <span className={styles.videoBadge} title="Incluye video">
                              ▶ VIDEO
                            </span>
                          )}
                          {photoCount > 1 && (
                            <span className={styles.photoCountBadge} title={`${photoCount} fotos`}>
                              📷 {photoCount}
                            </span>
                          )}
                        </div>

                        <div className={styles.workOverlay}>
                          <span className={styles.zoomIcon}>🔍</span>
                          <h4 className={styles.workTitle}>{work.title}</h4>
                          {(work.caption || work.description) && (
                            <p className={styles.workDesc}>{work.caption || work.description}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* ── CTA FINAL DEL MODAL ── */}
            <div className={styles.modalCta}>
              <div className={styles.modalCtaText}>
                <h4>¿Tenés un proyecto en mente?</h4>
                <p>Contanos qué necesitás. Nosotros pensamos la solución.</p>
              </div>
              <button
                className={styles.modalCtaBtn}
                onClick={handleContact}
                id={`modal-cta-${category}`}
              >
                Hablemos de tu proyecto →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX (NIVEL 2) ── */}
      {lightboxIndex !== null && (
        <Lightbox
          items={lightboxMediaList}
          currentIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
