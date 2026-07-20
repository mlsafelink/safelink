import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import {
  Calendar, Building, FileText, Clock, HelpCircle, Shield,
  DollarSign, AlertCircle, Info, Phone, Mail, FileCheck,
} from 'lucide-react';
import styles from './PresupuestoViewer.module.css';

export function PublicPresupuestoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: presupuesto, isLoading, isError } = useQuery({
    queryKey: ['public-presupuesto', publicId],
    queryFn: () => presupuestoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando presupuesto...</span>
      </div>
    );
  }

  if (isError || !presupuesto) {
    return (
      <div className={styles.notFoundWrap}>
        <Shield size={48} style={{ color: '#94a3b8' }} />
        <h2>Presupuesto no encontrado</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          El enlace puede ser incorrecto o el documento fue removido.
        </p>
      </div>
    );
  }

  const consorcioNombre = (presupuesto.consorcios as any)?.nombre;
  const urlSitioWeb = presupuesto.url_sitio_web ?? 'instagram.com/ml.safelink';

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

  const fmtPrice = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  return (
    <div className={styles.page}>
      
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandSide}>
            <div className={styles.brandLogo}>SafeLink</div>
            <div className={styles.brandTagline}>Soluciones inteligentes para tu seguridad</div>
          </div>
          <div className={styles.titleSide}>
            <div className={styles.reporteBadge}>
              <FileCheck size={12} />
              Presupuesto Comercial
            </div>
            <h1 className={styles.docTitle}>{presupuesto.titulo}</h1>
            <p className={styles.docSubtitle}>
              Presupuesto detallado para la provisión e instalación de sistemas de seguridad técnica.
            </p>
          </div>
        </div>
      </header>

      {/* ── BARRA DE INFO ── */}
      <div className={styles.infoBar}>
        <div className={styles.infoBarInner}>
          <div className={styles.infoChip}>
            <Calendar size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Fecha de Emisión</span>
              <span className={styles.infoValue}>{formatFecha(presupuesto.fecha)}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Building size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Consorcio</span>
              <span className={styles.infoValue}>{consorcioNombre || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Clock size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Validez</span>
              <span className={styles.infoValue}>{presupuesto.validez || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Shield size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Garantía</span>
              <span className={styles.infoValue}>{presupuesto.garantia || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL (CARDS) ── */}
      <main className={styles.main}>

        {/* Card 1: Descripción de los trabajos */}
        {presupuesto.descripcion && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepIcon}><FileText size={18} /></div>
              <span className={styles.stepLabel}>Trabajos</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Trabajos a realizar</h2>
              <p className={styles.cardText}>{presupuesto.descripcion}</p>
            </div>
          </div>
        )}

        {/* Card 2: Monto Total */}
        <div className={styles.card}>
          <div className={styles.cardLeft}>
            <span className={styles.stepNum}>Sección</span>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepIcon}><DollarSign size={18} /></div>
            <span className={styles.stepLabel}>Inversión</span>
          </div>
          <div className={styles.cardRight}>
            <h2 className={styles.cardHeading}>Propuesta Económica</h2>
            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>Monto total del presupuesto</span>
              <span className={styles.priceValue}>{fmtPrice(presupuesto.total)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Condiciones */}
        {presupuesto.condiciones && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepIcon}><AlertCircle size={18} /></div>
              <span className={styles.stepLabel}>Condiciones</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Condiciones comerciales</h2>
              <p className={styles.cardText}>{presupuesto.condiciones}</p>
            </div>
          </div>
        )}

        {/* Card 4: Observaciones */}
        {presupuesto.observaciones && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepIcon}><Info size={18} /></div>
              <span className={styles.stepLabel}>Observ.</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Observaciones adicionales</h2>
              <p className={styles.cardText}>{presupuesto.observaciones}</p>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER — solo ¿Necesita ayuda? ── */}
      <footer className={styles.footer}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', borderBottom: `1px solid var(--pv-border)` }}>
          <div className={styles.footerColTitle} style={{ marginBottom: '1rem' }}>
            <HelpCircle size={14} />
            ¿Necesita ayuda?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {presupuesto.telefono_soporte && (
              <div className={styles.contactRow}>
                <Phone size={14} className={styles.contactIcon} strokeWidth={2} />
                <span>{presupuesto.telefono_soporte}</span>
              </div>
            )}
            {presupuesto.email_soporte && (
              <div className={styles.contactRow}>
                <Mail size={14} className={styles.contactIcon} strokeWidth={2} />
                <span>{presupuesto.email_soporte}</span>
              </div>
            )}
            {presupuesto.horario_soporte && (
              <div className={styles.contactRow}>
                <Clock size={14} className={styles.contactIcon} strokeWidth={2} />
                <span>{presupuesto.horario_soporte}</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra final */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomBarInner}>
            <div className={styles.bottomBrand}>
              <span className={styles.bottomBrandName}>SafeLink</span>
              <span className={styles.bottomTagline}>Soluciones inteligentes para tu seguridad</span>
            </div>
            <a
              href={urlSitioWeb.includes('instagram.com') ? `https://${urlSitioWeb.replace(/^https?:\/\//, '')}` : `https://www.instagram.com/${urlSitioWeb.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bottomUrl}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>{urlSitioWeb.includes('instagram.com') ? urlSitioWeb.split('/').pop() : urlSitioWeb}</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
