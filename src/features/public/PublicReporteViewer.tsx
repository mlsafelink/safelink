import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reporteService, trackDocumentAccess, normalizeFoto } from '@/services/documentService';
import { getReporteHistorial, aceptarReporte, solicitarModificacion } from '@/services/reporteConformidadService';
import { useAparienciaDocumentos } from '@/hooks/useAparienciaDocumentos';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  Calendar, Building, ClipboardList, Clock, HelpCircle, Shield,
  FileText, Cpu, AlertTriangle, Phone, Mail, Image, CheckCircle2,
  ShieldCheck, Share2, Copy, Check, MessageCircle, X
} from 'lucide-react';
import styles from './ReporteViewer.module.css';

export function PublicReporteViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { config: apariencia, cssVariables } = useAparienciaDocumentos();
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [solicitudTexto, setSolicitudTexto] = useState('');
  const [solicitudNombre, setSolicitudNombre] = useState('');
  const [submitting, setSubmitting] = useState<'accept' | 'modify' | null>(null);
  const [confirmModal, setConfirmModal] = useState<'accept' | 'modify' | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (publicId) {
      trackDocumentAccess('reportes', publicId);
    }
  }, [publicId]);

  const { data: reporte, isLoading, isError } = useQuery({
    queryKey: ['public-reporte', publicId],
    queryFn: () => reporteService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const { data: historial = [] } = useQuery({
    queryKey: ['public-reporte-historial', publicId],
    queryFn: () => getReporteHistorial(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando propuesta técnica...</span>
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

  const currentVersionNum = reporte.version ?? 1;
  const currentVersionRecord = historial.find(v => v.version === currentVersionNum);
  const isCurrentVersionApproved = currentVersionRecord?.estado === 'aprobada' || !!currentVersionRecord?.accepted_at;

  const handleEjecutarAceptacion = async () => {
    if (!publicId) return;
    setConfirmModal(null);

    try {
      setSubmitting('accept');
      const result = await aceptarReporte(publicId, reporte.cliente_nombre ?? undefined);

      queryClient.invalidateQueries({ queryKey: ['public-reporte', publicId] });
      queryClient.invalidateQueries({ queryKey: ['public-reporte-historial', publicId] });

      if (result?.already_accepted) {
        showToast('Esta versión ya se encontraba previamente aprobada.', 'info');
        setSuccessBanner(`Esta versión (v${result.version}) ya se encuentra formalmente aprobada.`);
      } else {
        const msg = `¡Conformidad registrada con éxito! Versión v${result?.version ?? currentVersionNum} aprobada.`;
        showToast(msg, 'success');
        setSuccessBanner(msg);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo registrar la aceptación.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(null);
    }
  };

  const handleEjecutarModificacion = async () => {
    if (!publicId) return;
    const nombre = solicitudNombre.trim();
    const texto = solicitudTexto.trim();
    if (!nombre) {
      showToast('Ingresá tu nombre y apellido antes de enviar.', 'warning');
      return;
    }
    if (!texto) {
      showToast('Describí los cambios que querés solicitar.', 'warning');
      return;
    }
    setConfirmModal(null);

    try {
      setSubmitting('modify');
      await solicitarModificacion(publicId, texto, nombre);

      queryClient.invalidateQueries({ queryKey: ['public-reporte-historial', publicId] });

      const msg = 'Tu solicitud de modificación ha sido enviada al equipo técnico de SafeLink.';
      showToast(msg, 'success');
      setSuccessBanner(msg);
      setSolicitudTexto('');
      setSolicitudNombre('');
      setShowModifyForm(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo enviar la solicitud.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(null);
    }
  };

  const handleCopiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      showToast('Enlace copiado al portapapeles', 'success');
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

  const listRecomendaciones = reporte.recomendaciones
    ? reporte.recomendaciones.split('\n').map(r => r.replace(/^\u2022\s*/, '').trim()).filter(Boolean)
    : [];

  return (
    <div
      className={styles.page}
      style={{
        ...cssVariables,
        ...(apariencia.fondo_tipo === 'solido' ? { backgroundColor: apariencia.fondo_color } : {}),
        ...(apariencia.fondo_tipo === 'degradado' ? { background: apariencia.fondo_degradado } : {}),
      }}
    >
      
      {/* ── HEADER PERSONALIZADO O CORPORATIVO ── */}
      {apariencia.usar_banner_personalizado && apariencia.banner_url ? (
        <>
          <header className={styles.corporeoHeader} style={{ height: `${apariencia.banner_altura}px` }}>
            <div className={styles.bannerContainer} style={{ height: '100%' }}>
              <img
                src={apariencia.banner_url}
                alt="SafeLink"
                className={styles.bannerImg}
                style={{
                  objectFit: apariencia.banner_ajuste,
                  objectPosition: apariencia.banner_posicion,
                  height: '100%',
                  maxHeight: `${apariencia.banner_altura}px`
                }}
              />
            </div>
          </header>
          <div className={styles.titleSection}>
            <div className={styles.titleSectionInner}>
              <div className={styles.reporteBadge} style={{ background: `${apariencia.color_destacados}18`, color: apariencia.color_destacados }}>
                <ClipboardList size={13} />
                Propuesta Técnica
              </div>
              <h1 className={styles.docTitle} style={{ color: apariencia.color_titulos }}>{reporte.titulo}</h1>
              <p className={styles.docSubtitle} style={{ color: apariencia.color_subtitulos }}>
                Propuesta detallada de relevamiento técnico, equipos, diagnóstico y recomendaciones realizada por SafeLink.
              </p>
            </div>
          </div>
        </>
      ) : (
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.brandSide}>
              {apariencia.mostrar_logo && (
                <div className={styles.brandLogo}>SafeLink</div>
              )}
              {apariencia.mostrar_eslogan && (
                <div className={styles.brandTagline}>Soluciones inteligentes para tu seguridad</div>
              )}
            </div>
            <div className={styles.titleSide}>
              <div className={styles.reporteBadge} style={{ background: `${apariencia.color_destacados}18`, color: apariencia.color_destacados }}>
                <ClipboardList size={12} />
                Propuesta Técnica
              </div>
              <h1 className={styles.docTitle} style={{ color: apariencia.color_titulos }}>{reporte.titulo}</h1>
              <p className={styles.docSubtitle} style={{ color: apariencia.color_subtitulos }}>
                Propuesta detallada de relevamiento técnico, equipos, diagnóstico y recomendaciones realizada por SafeLink.
              </p>
            </div>
          </div>
        </header>
      )}

      {/* ── HEADER ORIGINAL (GUARDADO PARA RESTAURAR SI ES NECESARIO) ──
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
      ── FIN HEADER ORIGINAL ── */}

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
              <span className={styles.infoValue}>
                v{reporte.version} {isCurrentVersionApproved ? '(Aprobado)' : '(Vigente)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL (CARDS) ── */}
      <main className={styles.main}>

        {/* Card 1: Situación y alcance */}
        {reporte.descripcion && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>1</span>
              <div className={styles.stepIcon}><FileText size={18} /></div>
              <span className={styles.stepLabel}>Situación</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Situación y alcance</h2>
              <p className={styles.cardText}>{reporte.descripcion}</p>
            </div>
          </div>
        )}

        {/* Card 2: Relevamiento técnico */}
        {(reporte.equipo_relevado || reporte.inspeccion_realizada) && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>2</span>
              <div className={styles.stepIcon}><Cpu size={18} /></div>
              <span className={styles.stepLabel}>Relevam.</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Relevamiento técnico</h2>
              {reporte.equipo_relevado && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--rv-text-secondary)', marginBottom: '0.25rem' }}>Equipo relevado</p>
                  <p className={styles.cardText}>{reporte.equipo_relevado}</p>
                </div>
              )}
              {reporte.inspeccion_realizada && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--rv-text-secondary)', marginBottom: '0.25rem' }}>Inspección realizada</p>
                  <p className={styles.cardText}>{reporte.inspeccion_realizada}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card 3: Diagnóstico y recomendaciones */}
        {(reporte.diagnostico || listRecomendaciones.length > 0) && (
          <div className={styles.card}>
            <div className={styles.cardLeft}>
              <span className={styles.stepNum}>Sección</span>
              <span className={styles.stepNumber}>3</span>
              <div className={styles.stepIcon}><AlertTriangle size={18} /></div>
              <span className={styles.stepLabel}>Diagnóst.</span>
            </div>
            <div className={styles.cardRight}>
              <h2 className={styles.cardHeading}>Diagnóstico y recomendaciones</h2>
              {reporte.diagnostico && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--rv-text-secondary)', marginBottom: '0.25rem' }}>Diagnóstico</p>
                  <p className={styles.cardText}>{reporte.diagnostico}</p>
                </div>
              )}
              {listRecomendaciones.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--rv-text-secondary)', marginBottom: '0.25rem' }}>Recomendaciones</p>
                  <ul className={styles.footerBullets} style={{ marginTop: '0.25rem' }}>
                    {listRecomendaciones.map((rec, i) => (
                      <li key={i} style={{ fontSize: '0.88rem', color: 'var(--rv-text)', lineHeight: 1.6 }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card 4: Registro fotográfico */}
        {reporte.incluir_fotografias !== false && reporte.fotografias && reporte.fotografias.length > 0 && (
          <div className={styles.galleryCard}>
            <div className={styles.galleryHeader}>
              <Image size={18} />
              <span>Registro Fotográfico</span>
            </div>
            <div className={styles.galleryGrid}>
              {reporte.fotografias.map((item, i) => {
                const foto = normalizeFoto(item);
                return (
                  <div key={i} className={styles.galleryCardItem}>
                    <a
                      href={foto.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.galleryItem}
                    >
                      <img
                        src={foto.url}
                        alt={foto.descripcion || `Evidencia ${i + 1}`}
                        className={styles.galleryImg}
                      />
                    </a>
                    {foto.descripcion && (
                      <p className={styles.galleryCaption}>{foto.descripcion}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* ── SECCIÓN DE CONFORMIDAD Y BOTONES AL FINAL DEL REPORTE ── */}
      <div className={styles.actionsWrap}>
        <div className={styles.actionsHeader}>Conformidad y trazabilidad</div>

        {isCurrentVersionApproved && (
          <div className={styles.approvedBanner}>
            <div className={styles.approvedHeader}>
              <ShieldCheck size={20} />
              <span>Reporte técnico formalmente aprobado</span>
            </div>
            <div className={styles.approvedMeta}>
              <span>
                Versión <strong>v{currentVersionNum}</strong> aceptada
                {currentVersionRecord?.accepted_at && ` el ${new Date(currentVersionRecord.accepted_at).toLocaleString('es-AR')}`}
                {reporte.cliente_nombre && ` por ${reporte.cliente_nombre}`}.
              </span>
              {currentVersionRecord?.sha256 && (
                <div className={styles.approvedHash}>
                  Huella SHA-256: {currentVersionRecord.sha256}
                </div>
              )}
            </div>
          </div>
        )}

        {successBanner && (
          <div className={styles.successAlert}>
            <CheckCircle2 size={18} />
            <span>{successBanner}</span>
          </div>
        )}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setConfirmModal('accept')}
            disabled={submitting !== null || isCurrentVersionApproved}
          >
            {isCurrentVersionApproved
              ? `Aprobado (v${currentVersionNum}) ✓`
              : submitting === 'accept'
              ? 'Registrando...'
              : 'Estoy de acuerdo'}
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setShowModifyForm(!showModifyForm)}
            disabled={submitting !== null}
          >
            Quiero modificar algo
          </button>
          <button
            type="button"
            className={styles.shareButton}
            onClick={() => setShowShareModal(true)}
            title="Compartir enlace de este reporte por WhatsApp, Email o copiar dirección"
          >
            <Share2 size={16} />
            <span>Compartir</span>
          </button>
        </div>

        {showModifyForm && (
          <div className={styles.modificationCard}>
            <label className={styles.modificationLabel}>
              Tu nombre y apellido <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className={styles.modificationInput}
              value={solicitudNombre}
              onChange={(event) => setSolicitudNombre(event.target.value)}
              placeholder="Ej: María González"
              style={{ marginBottom: '0.75rem' }}
            />
            <label className={styles.modificationLabel}>
              Descripción de los cambios solicitados <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              className={styles.modificationInput}
              value={solicitudTexto}
              onChange={(event) => setSolicitudTexto(event.target.value)}
              rows={4}
              placeholder="Detallá los cambios, consultas o correcciones que necesitás sobre este reporte..."
            />
            <div className={styles.modificationActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => {
                  if (!solicitudNombre.trim()) {
                    showToast('Ingresá tu nombre y apellido.', 'warning');
                    return;
                  }
                  if (!solicitudTexto.trim()) {
                    showToast('Escribí los cambios que querés solicitar antes de enviar.', 'warning');
                    return;
                  }
                  setConfirmModal('modify');
                }}
                disabled={submitting !== null}
              >
                {submitting === 'modify' ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowModifyForm(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DE CONFIRMACIÓN: ESTOY DE ACUERDO ── */}
      {confirmModal === 'accept' && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirmar aceptación del reporte</h3>
            <p className={styles.modalText}>
              ¿Confirmás tu conformidad con este reporte técnico?
            </p>
            <p className={styles.modalText} style={{ fontSize: '0.82rem', color: 'var(--rv-muted)' }}>
              Al aceptar, se registrará la fecha y hora oficial del servidor, la versión exacta (v{currentVersionNum}) y la huella digital SHA-256 del documento como copia inalterable.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setConfirmModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleEjecutarAceptacion}
                disabled={submitting !== null}
              >
                {submitting === 'accept' ? 'Registrando...' : 'Sí, confirmar aceptación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE CONFIRMACIÓN: SOLICITAR MODIFICACIÓN ── */}
      {confirmModal === 'modify' && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirmar envío de modificaciones</h3>
            <p className={styles.modalText}>
              ¿Deseás enviar esta solicitud de modificación al equipo técnico de SafeLink?
            </p>
            <p className={styles.modalText} style={{ fontSize: '0.82rem', color: 'var(--rv-muted)' }}>
              Esta acción no alterará el contenido del reporte original ni registrará una aceptación.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setConfirmModal(null)}
              >
                Volver a revisar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleEjecutarModificacion}
                disabled={submitting !== null}
              >
                {submitting === 'modify' ? 'Enviando...' : 'Enviar modificaciones'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: COMPARTIR REPORTE TÉCNICO ── */}
      {showShareModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowShareModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Share2 size={20} style={{ color: 'var(--rv-blue)' }} />
                Compartir Propuesta Técnica
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rv-muted)', padding: '0.2rem' }}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalText} style={{ fontSize: '0.85rem', color: 'var(--rv-muted)', margin: '0' }}>
              {reporte.titulo}
            </p>

            <div className={styles.shareOptionsList}>
              {/* Opción 1: Copiar dirección / URL */}
              <div className={styles.shareOptionCard}>
                <div className={styles.shareOptionInfo}>
                  <Copy size={20} className={styles.shareOptionIcon} />
                  <div>
                    <span className={styles.shareOptionTitle}>Copiar dirección</span>
                    <span className={styles.shareOptionDesc}>Copia el enlace de la propuesta técnica al portapapeles</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.shareActionBtn}
                  onClick={handleCopiarEnlace}
                >
                  {copiado ? (
                    <>
                      <Check size={14} style={{ color: '#16a34a' }} />
                      <span style={{ color: '#16a34a' }}>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opción 2: Enviar por WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hola, te comparto la Propuesta Técnica "${reporte.titulo}" de SafeLink:\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.shareOptionCard}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className={styles.shareOptionInfo}>
                  <MessageCircle size={20} style={{ color: '#25D366' }} />
                  <div>
                    <span className={styles.shareOptionTitle}>Enviar por WhatsApp</span>
                    <span className={styles.shareOptionDesc}>Compartir directamente por chat de WhatsApp</span>
                  </div>
                </div>
                <span className={styles.shareActionBtnWa}>
                  WhatsApp ↗
                </span>
              </a>

              {/* Opción 3: Enviar por Email */}
              <a
                href={`mailto:?subject=${encodeURIComponent(`Propuesta Técnica SafeLink - ${reporte.titulo}`)}&body=${encodeURIComponent(`Hola,\n\nTe comparto la Propuesta Técnica "${reporte.titulo}" elaborada por SafeLink.\n\nPuedes consultarla en el siguiente enlace:\n${window.location.href}\n\nSaludos cordiales,\nSafeLink`)}`}
                className={styles.shareOptionCard}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className={styles.shareOptionInfo}>
                  <Mail size={20} style={{ color: '#2563eb' }} />
                  <div>
                    <span className={styles.shareOptionTitle}>Enviar por Email</span>
                    <span className={styles.shareOptionDesc}>Abrir cliente de correo con el enlace preparado</span>
                  </div>
                </div>
                <span className={styles.shareActionBtnMail}>
                  Redactar ↗
                </span>
              </a>
            </div>

            <div className={styles.modalActions} style={{ marginTop: '0.25rem' }}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowShareModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
