import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { landingService } from '@/services/landingService';
import { ConsultaForm } from './components/ConsultaForm';
import { GaleriaCarrusel } from './components/GaleriaCarrusel';
import { Testimonios } from './components/Testimonios';
import { CategoryModal } from './components/CategoryModal';
import type { ServicioTipo } from '@/services/landingService';
import type { LandingGalleryCategory } from '@/services/landingGalleryService';
import iluminacionImg from '@/assets/iluminacion.jpeg';
import redesImg from '@/assets/redes.jpeg';
import seguridadImg from '@/assets/seguridad.jpeg';
import styles from './LandingPage.module.css';

// Configuración de WhatsApp e Instagram — se leen de localStorage si el admin los guardó
function useSiteConfig() {
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('instagram.com/ml.safelink');
  const [googleReviews, setGoogleReviews] = useState('https://www.google.com/search?q=SafeLink+reseñas');

  useEffect(() => {
    const stored = localStorage.getItem('sl_site_config');
    if (stored) {
      try {
        const cfg = JSON.parse(stored);
        if (cfg.whatsapp) setWhatsapp(cfg.whatsapp);
        if (cfg.instagram) setInstagram(cfg.instagram);
        if (cfg.googleReviews) setGoogleReviews(cfg.googleReviews);
      } catch { /* noop */ }
    }
  }, []);

  return { whatsapp, instagram, googleReviews };
}

function buildWhatsappUrl(numero: string, servicio?: string) {
  const base = numero
    ? `https://wa.me/${numero.replace(/\D/g, '')}`
    : '#formulario-consulta';
  if (!numero) return base;
  const msg = servicio
    ? `Hola! Quiero consultar sobre ${servicio}.`
    : 'Hola! Quiero hacer una consulta.';
  return `${base}?text=${encodeURIComponent(msg)}`;
}

const SERVICIOS_CARDS: {
  id: LandingGalleryCategory;
  formServicio: ServicioTipo;
  icon: string;
  titulo: string;
  descripcion: string;
  img: string;
  cta: string;
}[] = [
  {
    id: 'iluminacion',
    formServicio: 'iluminacion',
    icon: '✦',
    titulo: 'Iluminación LED',
    descripcion: 'Diseño e instalación de iluminación cálida, eficiente y funcional para cada ambiente.',
    img: iluminacionImg,
    cta: 'Quiero iluminar mi espacio →',
  },
  {
    id: 'redes',
    formServicio: 'redes',
    icon: '⌁',
    titulo: 'Redes e infraestructura',
    descripcion: 'Cableado estructurado, armado de racks y redes estables para que tu operación no se detenga.',
    img: redesImg,
    cta: 'Necesito conectar mi empresa →',
  },
  {
    id: 'seguridad',
    formServicio: 'camaras',
    icon: '◉',
    titulo: 'Seguridad inteligente',
    descripcion: 'Cámaras, control de acceso y cerraduras smart para proteger lo que más te importa.',
    img: seguridadImg,
    cta: 'Quiero proteger mi espacio →',
  },
];

const TRUST_ITEMS = [
  { value: '4.9 ★', label: 'clientes satisfechos' },
  { value: '100%', label: 'atención personalizada' },
];

export function LandingPage() {
  const { whatsapp, instagram, googleReviews } = useSiteConfig();
  const [servicioForm, setServicioForm] = useState<ServicioTipo | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<LandingGalleryCategory | null>(null);
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    landingService.registrarVisita();
  }, []);

  const scrollToForm = (servicio?: ServicioTipo) => {
    setServicioForm(servicio);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleOpenCategory = (cat: LandingGalleryCategory) => {
    setSelectedCategory(cat);
  };

  const handleCategoryContact = (cat: LandingGalleryCategory) => {
    const card = SERVICIOS_CARDS.find(s => s.id === cat);
    scrollToForm(card?.formServicio ?? 'camaras');
  };

  const instagramUrl = instagram.startsWith('http') ? instagram : `https://${instagram}`;
  const currentCard = SERVICIOS_CARDS.find(s => s.id === selectedCategory);

  return (
    <div className={styles.page}>

      {/* ── TOP BAR ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarWrap}>
          <span>Instalaciones profesionales para hogares y empresas</span>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" id="topbar-instagram">
            Seguinos en Instagram ↗
          </a>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <nav className={styles.headerInner}>
          <a className={styles.brand} href="#inicio">
            <span className={styles.brandMark}>◆</span>
            SafeLink
          </a>
          <div className={styles.navLinks}>
            <a href="#servicios">Servicios</a>
            <a href="#trabajos">Proyectos</a>
            <a href="#testimonios">Opiniones</a>
            <a href="#formulario-consulta">Contacto</a>
          </div>
          <button
            className={styles.btnPrimary}
            onClick={() => scrollToForm()}
            id="header-consultar"
          >
            Pedí tu presupuesto
          </button>
        </nav>
      </header>

      <main>
        {/* ── HERO ── */}
        <section className={styles.hero} id="inicio">
          <div className={styles.heroWrap}>
            <span className={styles.eyebrow}>Seguridad · Redes · Iluminación</span>
            <h1 className={styles.heroTitle}>
              Tu tranquilidad,<br />nuestra prioridad.
            </h1>
            <p className={styles.heroDesc}>
              Soluciones de instalación pensadas para que vivas y trabajes con más seguridad, conectividad y confort.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.btnPrimary}
                onClick={() => scrollToForm()}
                id="hero-consultar"
              >
                Solicitá tu presupuesto
              </button>
              <a
                className={styles.btnGhost}
                href={buildWhatsappUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                id="hero-whatsapp"
              >
                ◉ Consultar por WhatsApp
              </a>
            </div>
            <div className={styles.trust}>
              {TRUST_ITEMS.map(t => (
                <div key={t.label}>
                  <strong>{t.value}</strong>
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICIOS (TARJETAS INTERACTIVAS CON ACCESO A GALERÍA) ── */}
        <section className={styles.services} id="servicios">
          <div className={styles.wrap}>
            <div className={styles.heading}>
              <span className={styles.eyebrow}>Soluciones SafeLink</span>
              <h2>Instalamos lo que hace funcionar tu espacio.</h2>
              <p>Un equipo, tres especialidades, el mismo compromiso con cada detalle.</p>
            </div>
            <div className={styles.cards}>
              {SERVICIOS_CARDS.map(s => (
                <article
                  key={s.id}
                  className={styles.serviceCard}
                  onClick={() => handleOpenCategory(s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenCategory(s.id);
                    }
                  }}
                  id={`card-servicio-${s.id}`}
                  aria-label={`Ver galería de trabajos de ${s.titulo}`}
                >
                  <div
                    className={styles.serviceImg}
                    style={{ backgroundImage: `url(${s.img})` }}
                    aria-hidden="true"
                  />
                  <div className={styles.serviceOverlay} />
                  <div className={styles.serviceCopy}>
                    <div className={styles.icon}>{s.icon}</div>
                    <h3>{s.titulo}</h3>
                    <p>{s.descripcion}</p>
                    <button
                      className={styles.serviceLink}
                      onClick={e => {
                        e.stopPropagation();
                        handleOpenCategory(s.id);
                      }}
                      id={`btn-servicio-${s.id}`}
                    >
                      {s.cta}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRABAJOS (galería carrusel) ── */}
        <section className={styles.sectionPad} id="trabajos">
          <div className={styles.wrap}>
            <div className={styles.heading}>
              <span className={styles.eyebrow}>Trabajos realizados</span>
              <h2>Instalaciones que hablan por sí solas.</h2>
              <p>Conocé algunos de los espacios que transformamos.</p>
            </div>
          </div>
          <GaleriaCarrusel />
          <div className={styles.galeriaActions}>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnInstagram}
              id="galeria-instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.igIcon}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Seguinos en Instagram
            </a>
          </div>
        </section>

        {/* ── FORMULARIO DE CONTACTO ── */}
        <section className={styles.contactSection} ref={formRef} id="formulario-consulta">
          <div className={`${styles.wrap} ${styles.contactGrid}`}>
            <div className={styles.contactInfo}>
              <span className={styles.eyebrow}>Hablemos de tu proyecto</span>
              <h2>Hacemos que tu espacio funcione mejor.</h2>
              <p>
                Contanos qué necesitás y te respondemos a la brevedad por WhatsApp para coordinar una visita o presupuesto.
              </p>
              <a
                className={styles.btnGhost}
                href={buildWhatsappUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                id="contact-whatsapp"
              >
                ◉ Abrir WhatsApp
              </a>
            </div>
            <div className={styles.contactFormWrap}>
              <ConsultaForm servicioPreseleccionado={servicioForm} />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIOS (Elfsight / Google Reviews) ── */}
        <section className={styles.reviewsSection} id="testimonios">
          <div className={styles.wrap}>
            <div className={styles.heading}>
              <span className={styles.eyebrow}>Lo que dicen nuestros clientes</span>
              <h2>La confianza se construye proyecto a proyecto.</h2>
              <p>Experiencias reales de quienes eligieron SafeLink.</p>
            </div>
            <div className={styles.ratingRow}>
              <span>Google</span>
              <b>4.9</b>
              <span className={styles.stars}>★★★★★</span>
              <small>+80 reseñas</small>
            </div>
            <Testimonios />
            <p className={styles.reviewsLink}>
              <a href={googleReviews} target="_blank" rel="noopener noreferrer" id="ver-reviews-google">
                Ver reseñas en Google →
              </a>
            </p>
          </div>
        </section>

        {/* ── ACCESO A PLATAFORMA ── */}
        <section className={styles.platformSection} id="plataforma">
          <div className={styles.wrap}>
            <div className={styles.platformCenter}>
              <Link to="/login" className={styles.btnPlatform} id="acceso-plataforma">
                Acceso a plataforma →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── MODAL DE DETALLE DE CATEGORÍA Y GALERÍA ── */}
      {selectedCategory && currentCard && (
        <CategoryModal
          category={selectedCategory}
          categoryImg={currentCard.img}
          isOpen={true}
          onClose={() => setSelectedCategory(null)}
          onContactClick={handleCategoryContact}
        />
      )}

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <div>
            <a className={styles.brand} href="#inicio">
              <span className={styles.brandMark}>◆</span>
              SafeLink
            </a>
            <p className={styles.footerCopy}>© {new Date().getFullYear()} SafeLink. Todos los derechos reservados.</p>
          </div>
          <div className={styles.social}>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" id="footer-instagram">Instagram</a>
            <a href={buildWhatsappUrl(whatsapp)} target="_blank" rel="noopener noreferrer" id="footer-whatsapp">WhatsApp</a>
            <a href={googleReviews} target="_blank" rel="noopener noreferrer" id="footer-google">Google Reviews</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <Link to="/login" className={styles.technicalAccess} id="acceso-tecnico">
            🔒 Acceso técnico
          </Link>
        </div>
      </footer>
    </div>
  );
}
