import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { landingService } from '@/services/landingService';
import { ConsultaForm } from './components/ConsultaForm';
import { GaleriaCarrusel } from './components/GaleriaCarrusel';
import { Testimonios } from './components/Testimonios';
import type { ServicioTipo } from '@/services/landingService';
import styles from './LandingPage.module.css';

// Configuración de WhatsApp e Instagram — se leen de localStorage si el admin los guardó
function useSiteConfig() {
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('instagram.com/ml.safelink');

  useEffect(() => {
    const stored = localStorage.getItem('sl_site_config');
    if (stored) {
      try {
        const cfg = JSON.parse(stored);
        if (cfg.whatsapp) setWhatsapp(cfg.whatsapp);
        if (cfg.instagram) setInstagram(cfg.instagram);
      } catch { /* noop */ }
    }
  }, []);

  return { whatsapp, instagram };
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

export function LandingPage() {
  const { whatsapp, instagram } = useSiteConfig();
  const [servicioForm, setServicioForm] = useState<ServicioTipo | undefined>(undefined);
  const formRef = useRef<HTMLElement>(null);

  // Registrar visita al cargar
  useEffect(() => {
    landingService.registrarVisita();
  }, []);

  const scrollToForm = (servicio?: ServicioTipo) => {
    setServicioForm(servicio);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const SERVICIOS_CARDS = [
    {
      id: 'camaras' as ServicioTipo,
      icon: '📷',
      titulo: 'Cámaras',
      descripcion: 'Instalación, ampliación, configuración y mantenimiento de sistemas de videovigilancia.',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
      accent: '#818cf8',
    },
    {
      id: 'iluminacion' as ServicioTipo,
      icon: '💡',
      titulo: 'Iluminación',
      descripcion: 'Iluminación interior y exterior, tecnología LED, mejoras y soluciones personalizadas.',
      gradient: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
      accent: '#fbbf24',
    },
    {
      id: 'redes' as ServicioTipo,
      icon: '🌐',
      titulo: 'Redes',
      descripcion: 'Cableado estructurado, Wi-Fi, conectividad y redes para hogares, comercios y empresas.',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
      accent: '#34d399',
    },
  ];

  const instagramUrl = instagram.startsWith('http') ? instagram : `https://${instagram}`;

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>S</div>
            <div>
              <span className={styles.logoName}>SafeLink</span>
              <span className={styles.logoSub}>Soluciones técnicas y seguridad</span>
            </div>
          </div>
          <nav className={styles.headerNav}>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnSecondary}
              id="header-instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.igIcon}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
            <button
              className={styles.btnPrimary}
              onClick={() => scrollToForm()}
              id="header-consultar"
            >
              Quiero consultar
            </button>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Instalación · Mantenimiento · Soporte
          </div>
          <h1 className={styles.heroTitle}>
            Cuidamos lo que importa.
            <br />
            <span className={styles.heroAccent}>Instalamos lo que necesitás.</span>
          </h1>
          <p className={styles.heroDesc}>
            Cámaras, iluminación y redes.<br />
            Instalación, mantenimiento y soluciones técnicas para hogares, comercios y empresas.
          </p>
          <div className={styles.heroBtns}>
            <button
              className={styles.btnPrimary}
              onClick={() => scrollToForm()}
              id="hero-consultar"
            >
              Quiero consultar
            </button>
            <a href="#servicios" className={styles.btnOutline} id="hero-conoce-mas">
              Conocé más ↓
            </a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroCard}>
            <div className={styles.heroCardIcon}>🔒</div>
            <span>Sistema activo</span>
            <div className={styles.heroCardPulse} />
          </div>
          <div className={`${styles.heroCard} ${styles.heroCard2}`}>
            <div className={styles.heroCardIcon}>📡</div>
            <span>Red conectada</span>
            <div className={`${styles.heroCardPulse} ${styles.heroCardPulse2}`} />
          </div>
          <div className={`${styles.heroCard} ${styles.heroCard3}`}>
            <div className={styles.heroCardIcon}>💡</div>
            <span>Iluminación LED</span>
            <div className={`${styles.heroCardPulse} ${styles.heroCardPulse3}`} />
          </div>
          {/* Decorative orbit */}
          <div className={styles.orbit} />
          <div className={styles.orbit2} />
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section className={styles.section} id="servicios">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>¿Qué necesitás resolver?</h2>
        </div>
        <div className={styles.serviciosGrid}>
          {SERVICIOS_CARDS.map(s => (
            <div key={s.id} className={styles.servicioCard} style={{ '--card-accent': s.accent } as React.CSSProperties}>
              <div className={styles.servicioCardBg} style={{ background: s.gradient }} />
              <div className={styles.servicioIcon}>{s.icon}</div>
              <h3 className={styles.servicioTitle}>{s.titulo}</h3>
              <p className={styles.servicioDesc}>{s.descripcion}</p>
              <button
                className={styles.servicioBtn}
                onClick={() => scrollToForm(s.id)}
                id={`btn-servicio-${s.id}`}
              >
                Consultar →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMULARIO ── */}
      <section className={styles.formSection} ref={formRef} id="formulario-consulta">
        <div className={styles.formContainer}>
          <div className={styles.formLeft}>
            <div className={styles.formBadge}>Consulta gratuita</div>
            <h2 className={styles.formTitle}>¿Ya te cotizaron?</h2>
            <p className={styles.formDesc}>
              Contanos qué necesitás y te ayudamos a encontrar la mejor solución.
            </p>
            <div className={styles.formFeatures}>
              <div className={styles.formFeature}>
                <span className={styles.formFeatureDot} style={{ background: '#818cf8' }} />
                Respuesta rápida
              </div>
              <div className={styles.formFeature}>
                <span className={styles.formFeatureDot} style={{ background: '#34d399' }} />
                Sin compromiso
              </div>
              <div className={styles.formFeature}>
                <span className={styles.formFeatureDot} style={{ background: '#fbbf24' }} />
                Presupuesto claro
              </div>
            </div>
          </div>
          <div className={styles.formRight}>
            <ConsultaForm servicioPreseleccionado={servicioForm} />
          </div>
        </div>
      </section>

      {/* ── GALERÍA ── */}
      <section className={styles.section} id="galeria">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Trabajos realizados</h2>
        </div>
        <GaleriaCarrusel />
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className={styles.section} id="testimonios">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Lo que dicen nuestros clientes</h2>
          <p className={styles.sectionSubtitle}>Opiniones de nuestros clientes en Google</p>
        </div>
        <Testimonios />
      </section>

      {/* ── BLOQUE DE CONFIANZA ── */}
      <section className={styles.trustSection}>
        <div className={styles.trustGrid}>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>🏆</div>
            <h3>Experiencia</h3>
            <p>Soluciones pensadas para cada instalación.</p>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>📋</div>
            <h3>Transparencia</h3>
            <p>Presupuestos claros y trabajos documentados.</p>
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustIcon}>🔁</div>
            <h3>Seguimiento</h3>
            <p>Registro de los trabajos realizados y acompañamiento.</p>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>¿Tenés un proyecto?</h2>
          <p className={styles.ctaDesc}>Contanos qué necesitás. Estamos para ayudarte.</p>
          <div className={styles.ctaBtns}>
            <a
              href={buildWhatsappUrl(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.ctaBtn} ${styles.ctaBtnWhatsapp}`}
              id="cta-whatsapp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.ctaBtnIcon}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.ctaBtn} ${styles.ctaBtnInstagram}`}
              id="cta-instagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.ctaBtnIcon}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <div className={styles.logoIcon}>S</div>
              <div>
                <span className={styles.footerLogoName}>SafeLink</span>
                <span className={styles.footerLogoSub}>Soluciones técnicas y seguridad</span>
              </div>
            </div>
          </div>

          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <h4>Servicios</h4>
              <ul>
                <li><button onClick={() => scrollToForm('camaras')}>Cámaras</button></li>
                <li><button onClick={() => scrollToForm('iluminacion')}>Iluminación</button></li>
                <li><button onClick={() => scrollToForm('redes')}>Redes</button></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Enlaces</h4>
              <ul>
                <li><a href="#servicios">Sobre nosotros</a></li>
                <li><a href="#formulario-consulta">Preguntas frecuentes</a></li>
                <li><a href="#formulario-consulta">Contacto</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Seguinos</h4>
              <ul>
                <li>
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
                </li>
                <li>
                  <a href={buildWhatsappUrl(whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© {new Date().getFullYear()} SafeLink. Todos los derechos reservados.</span>
          <Link to="/login" className={styles.technicalAccess} id="acceso-tecnico">
            🔒 Acceso técnico
          </Link>
        </div>
      </footer>
    </div>
  );
}
