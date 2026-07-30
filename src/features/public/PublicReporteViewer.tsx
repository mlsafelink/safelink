import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reporteService } from '@/services/documentService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Calendar, Building, ClipboardList, Shield,
  FileText, Cpu, Eye, AlertTriangle, CheckSquare, Image,
} from 'lucide-react';
import styles from './ReporteViewer.module.css';

export function PublicReporteViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const { user } = useAuth();

  const { data: reporte, isLoading, isError } = useQuery({
    queryKey: ['public-reporte', publicId],
    queryFn: () => reporteService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const consorcioNombre = (reporte?.consorcios as any)?.nombre;
  const codigoDoc = reporte?.codigo || (reporte ? `RT-${reporte.id.slice(0, 8).toUpperCase()}` : 'RT');

  // Registro inteligente del evento "nuevo_reporte" / vista
  useEffect(() => {
    if (!reporte) return;

    // Si el usuario es el autor / admin autenticado, NO generar notificación
    if (user) {
      console.info('[SmartNotif] Omitiendo notificación de lectura porque el usuario autenticado (autor) está visualizando el reporte.');
      return;
    }
  }, [reporte?.id, user]);

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

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

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
              Reporte Técnico ({codigoDoc})
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
              <span className={styles.infoLabel}>Consorcio / Cliente</span>
              <span className={styles.infoValue}>{consorcioNombre || 'N/A'}</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Shield size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Código Único</span>
              <span className={styles.infoValue} style={{ color: '#d97706', fontWeight: 'bold' }}>{codigoDoc}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className={styles.mainContent}>

        {reporte.descripcion && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className={styles.sectionIcon} />
              <h2>Motivo y Descripción de la Situación</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporte.descripcion}</p>
            </div>
          </section>
        )}

        {reporte.equipo_relevado && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Cpu size={20} className={styles.sectionIcon} />
              <h2>Equipamiento Relevado</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporte.equipo_relevado}</p>
            </div>
          </section>
        )}

        {reporte.inspeccion_realizada && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Eye size={20} className={styles.sectionIcon} />
              <h2>Inspección Realizada</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporte.inspeccion_realizada}</p>
            </div>
          </section>
        )}

        {reporte.diagnostico && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <AlertTriangle size={20} className={styles.sectionIcon} />
              <h2>Diagnóstico Técnico</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{reporte.diagnostico}</p>
            </div>
          </section>
        )}

        {listRecomendaciones.length > 0 && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <CheckSquare size={20} className={styles.sectionIcon} />
              <h2>Recomendaciones Técnicas</h2>
            </div>
            <div className={styles.sectionBody}>
              <ul className={styles.recomList}>
                {listRecomendaciones.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {reporte.fotografias && reporte.fotografias.length > 0 && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Image size={20} className={styles.sectionIcon} />
              <h2>Evidencia Fotográfica</h2>
            </div>
            <div className={styles.photoGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {reporte.fotografias.map((url, idx) => (
                <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={url} alt={`Evidencia ${idx + 1}`} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className={styles.footer} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <p>SafeLink Cloud · Gestión Técnica de Consorcios y Seguridad</p>
      </footer>
    </div>
  );
}
