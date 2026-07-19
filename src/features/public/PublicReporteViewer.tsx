import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reporteService } from '@/services/documentService';
import {
  Calendar, Building, ClipboardList, Clock, HelpCircle, Shield,
  FileText, Cpu, Eye, AlertTriangle, CheckSquare, Phone, Mail, Image,
} from 'lucide-react';
import styles from './ReporteViewer.module.css';

export function PublicReporteViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: reporte, isLoading, isError } = useQuery({
    queryKey: ['public-reporte', publicId],
    queryFn: () => reporteService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando reporte técnico...</span>
      </div>
    );
  }

  if (isError || !reporte) {
    return (
      <div className={styles.notFoundWrap}>
        <Shield size={48} style={{ color: '#94a3b8' }} />
        <h2>Documento no encontrado</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          El enlace puede ser incorrecto o el documento fue removido.
        </p>
      </div>
    );
  }

  const adminNombre = (reporte.consorcios as any)?.administraciones?.nombre;
  const consorcioNombre = (reporte.consorcios as any)?.nombre;
  const urlSitioWeb = reporte.url_sitio_web ?? 'www.safelink.com.ar';

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

  // Convertir recomendaciones separadas por salto de línea en un array
  const listRecomendaciones = reporte.recomendaciones
    ? reporte.recomendaciones.split('\n').map(r => r.replace(/^•\s*/, '').trim()).filter(Boolean)
    : [
        'Mantener el equipo en un área ventilada y limpia.',
        'No compartir credenciales con terceros.',
        'Realizar mantenimientos preventivos trimestrales.',
      ];

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
              <ClipboardList size={12} />
              Reporte Técnico
            </div>
            <h1 className={styles.docTitle}>{reporte.titulo}</h1>
            <p className={styles.docSubtitle}>
              Informe detallado de relevamiento técnico, equipos y diagnóstico realizado por SafeLink.
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
              <span className={styles.infoValue}>{formatFecha(reporte.fecha)}</span>
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
            <Shield size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Administración</span>
              <span className={styles.infoValue}>{adminNombre || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <HelpCircle size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Estado</span>
              <span className={styles.infoValue}>v{reporte.version} (Vigente)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL (CARDS) ── */}
      <main className={styles.main}>

        {/* Card 1: Descripción de la situación */}
        {reporte.descripcion && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepIcon}><FileText size={18} /></div>
              <span className={styles.stepLabel}>Situación</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Descripción de la situación</h2>
              <p className={styles.cardText}>{reporte.descripcion}</p>
            </div>
          </div>
        )}

        {/* Card 2: Equipo relevado */}
        {reporte.equipo_relevado && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepIcon}><Cpu size={18} /></div>
              <span className={styles.stepLabel}>Equipos</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Equipo relevado</h2>
              <p className={styles.cardText}>{reporte.equipo_relevado}</p>
            </div>
          </div>
        )}

        {/* Card 3: Inspección realizada */}
        {reporte.inspeccion_realizada && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepIcon}><Eye size={18} /></div>
              <span className={styles.stepLabel}>Inspección</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Inspección realizada</h2>
              <p className={styles.cardText}>{reporte.inspeccion_realizada}</p>
            </div>
          </div>
        )}

        {/* Card 4: Diagnóstico */}
        {reporte.diagnostico && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>4</span>
              <div className={styles.stepIcon}><AlertTriangle size={18} /></div>
              <span className={styles.stepLabel}>Diagnóstico</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Diagnóstico Técnico</h2>
              <p className={styles.cardText}>{reporte.diagnostico}</p>
            </div>
          </div>
        )}

        {/* Fotografías */}
        {reporte.fotografias && reporte.fotografias.length > 0 && (
          <div className={styles.galleryCard}>
            <div className={styles.galleryHeader}>
              <Image size={18} />
              <span>Registro Fotográfico</span>
            </div>
            <div className={styles.galleryGrid}>
              {reporte.fotografias.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.galleryItem}
                >
                  <img src={url} alt={`Evidencia ${i + 1}`} className={styles.galleryImg} />
                </a>
              ))}
            </div>
          </div>
        )}
        {/* Card 5: Recomendaciones */}
        {listRecomendaciones.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>5</span>
              <div className={styles.stepIcon}><CheckSquare size={18} /></div>
              <span className={styles.stepLabel}>Recomend.</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Recomendaciones</h2>
              <ul className={styles.footerBullets} style={{ marginTop: '0.25rem' }}>
                {listRecomendaciones.map((rec, i) => (
                  <li key={i} style={{ fontSize: '0.88rem', color: 'var(--rv-text)', lineHeight: 1.6 }}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER — solo ¿Necesita ayuda? ── */}
      <footer className={styles.footer}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', borderBottom: `1px solid var(--rv-border)` }}>
          <div className={styles.footerColTitle} style={{ marginBottom: '1rem' }}>
            <HelpCircle size={14} />
            ¿Necesita ayuda?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {reporte.telefono_soporte && (
              <div className={styles.contactRow}>
                <Phone size={14} className={styles.contactIcon} />
                <span>{reporte.telefono_soporte}</span>
              </div>
            )}
            {reporte.email_soporte && (
              <div className={styles.contactRow}>
                <Mail size={14} className={styles.contactIcon} />
                <span>{reporte.email_soporte}</span>
              </div>
            )}
            {reporte.horario_soporte && (
              <div className={styles.contactRow}>
                <Clock size={14} className={styles.contactIcon} />
                <span>{reporte.horario_soporte}</span>
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
              href={urlSitioWeb.startsWith('http') ? urlSitioWeb : `https://${urlSitioWeb}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bottomUrl}
            >
              {urlSitioWeb}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
