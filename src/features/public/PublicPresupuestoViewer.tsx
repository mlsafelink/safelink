import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import { notificacionService } from '@/services/notificacionService';
import {
  Calendar, Building, FileText, Clock, HelpCircle, Shield,
  DollarSign, AlertCircle, Info, Phone, Mail, FileCheck,
  Share2, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import styles from './PresupuestoViewer.module.css';

export function PublicPresupuestoViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [checkReadDoc, setCheckReadDoc] = useState(false);
  const [checkAcceptTerms, setCheckAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: presupuesto, isLoading, isError } = useQuery({
    queryKey: ['public-presupuesto', publicId],
    queryFn: () => presupuestoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const consorcioNombre = (presupuesto?.consorcios as any)?.nombre;
  const clienteNombre = (presupuesto as any)?.cliente_nombre || consorcioNombre || 'Cliente';

  // 1. Registro automático del evento "presupuesto_visto" la primera vez
  useEffect(() => {
    if (!presupuesto) return;

    const recordView = async () => {
      try {
        const hasBeenSeen = await notificacionService.hasEvent('presupuesto_visto', presupuesto.id);
        if (!hasBeenSeen) {
          await notificacionService.create({
            tipo: 'presupuesto_visto',
            presupuesto_id: presupuesto.id,
            codigo_presupuesto: presupuesto.codigo || `#P-${presupuesto.id.slice(0, 4)}`,
            cliente_nombre: clienteNombre,
            consorcio_nombre: consorcioNombre,
          });

          if (presupuesto.estado !== 'aceptado') {
            await presupuestoService.update(presupuesto.id, { estado: 'visto' });
            queryClient.invalidateQueries({ queryKey: ['public-presupuesto', publicId] });
          }
        }
      } catch (err) {
        console.error('Error registrando visualización:', err);
      }
    };

    recordView();
  }, [presupuesto?.id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 2. Acción Compartir
  const handleShare = async () => {
    if (!presupuesto) return;
    const shareUrl = window.location.href;
    const shareTitle = `Presupuesto: ${presupuesto.titulo} - SafeLink`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `Presupuesto SafeLink: ${presupuesto.titulo}`,
          url: shareUrl,
        });
        showToast('Enlace compartido correctamente');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Enlace copiado al portapapeles');
      }

      // Registrar evento
      await notificacionService.create({
        tipo: 'presupuesto_compartido',
        presupuesto_id: presupuesto.id,
        codigo_presupuesto: presupuesto.codigo || `#P-${presupuesto.id.slice(0, 4)}`,
        cliente_nombre: clienteNombre,
        consorcio_nombre: consorcioNombre,
      });

      if (presupuesto.estado !== 'aceptado') {
        await presupuestoService.update(presupuesto.id, { estado: 'compartido' });
        queryClient.invalidateQueries({ queryKey: ['public-presupuesto', publicId] });
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  // 3. Acción Aceptar Presupuesto
  const handleConfirmAcceptance = async () => {
    if (!presupuesto || !checkReadDoc || !checkAcceptTerms) return;

    const confirm = window.confirm('¿Confirma que acepta este presupuesto?');
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      await presupuestoService.update(presupuesto.id, {
        estado: 'aceptado',
        aceptado_at: now,
      });

      await notificacionService.create({
        tipo: 'presupuesto_aceptado',
        presupuesto_id: presupuesto.id,
        codigo_presupuesto: presupuesto.codigo || `#P-${presupuesto.id.slice(0, 4)}`,
        cliente_nombre: clienteNombre,
        consorcio_nombre: consorcioNombre,
      });

      queryClient.invalidateQueries({ queryKey: ['public-presupuesto', publicId] });
      setShowAcceptModal(false);
      showToast('✅ Presupuesto aceptado correctamente.');
    } catch (err) {
      console.error('Error al aceptar el presupuesto:', err);
      showToast('Ocurrió un error al procesar la aceptación');
    } finally {
      setIsSubmitting(false);
    }
  };

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
  const isAceptado = presupuesto.estado === 'aceptado';

  return (
    <div className={styles.page}>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className={styles.toast}>
          <CheckCircle2 size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

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
              Presupuesto Comercial {presupuesto.codigo ? `(${presupuesto.codigo})` : ''}
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
              <span className={styles.infoLabel}>Cliente / Consorcio</span>
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
      <main className={styles.main} style={{ paddingBottom: '110px' }}>

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
            <h2 className={styles.cardHeading}>Propuesta de Inversión</h2>
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

        {/* ── CARD 5: TÉRMINOS Y CONDICIONES ── */}
        <div className={styles.termsCard}>
          <div className={styles.termsHeader}>
            <ShieldCheck size={18} />
            <span>Términos y Condiciones</span>
          </div>
          <div className={styles.termsList}>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Validez del presupuesto:</span>
              <span>El presente presupuesto tiene una validez de 15 días corridos desde su fecha de emisión, salvo indicación expresa de lo contrario.</span>
            </div>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Forma de pago:</span>
              <span>Para dar inicio a los trabajos podrá requerirse un anticipo del 50% destinado a la compra de materiales. El saldo restante deberá abonarse según las condiciones acordadas entre las partes.</span>
            </div>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Plazos de ejecución:</span>
              <span>Los tiempos estimados de ejecución podrán variar por condiciones climáticas, disponibilidad de materiales, acceso al lugar de trabajo u otros factores ajenos a SafeLink.</span>
            </div>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Alcance del trabajo:</span>
              <span>El presupuesto incluye únicamente las tareas, materiales y servicios expresamente detallados. Cualquier modificación o trabajo adicional será presupuestado por separado.</span>
            </div>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Garantía:</span>
              <span>Los trabajos realizados cuentan con garantía sobre la mano de obra ejecutada. La garantía no cubre daños ocasionados por terceros, manipulación indebida, vandalismo, fenómenos climáticos, fallas del suministro eléctrico ni desperfectos en equipos provistos por el cliente.</span>
            </div>
            <div className={styles.termItem}>
              <span className={styles.termTitle}>Aceptación:</span>
              <span>La aceptación del presente presupuesto implica la conformidad con las tareas detalladas y con los presentes términos y condiciones.</span>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
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

      {/* ── BARRA INFERIOR FIJA CON ACCIONES ── */}
      <div className={styles.fixedActionBar}>
        <div className={styles.fixedActionInner}>
          <div className={styles.fixedActionLeft}>
            {isAceptado && (
              <div className={`${styles.fixedActionBadge} ${styles.badgeAceptado}`}>
                <CheckCircle2 size={16} />
                <span>Presupuesto Aceptado</span>
              </div>
            )}
          </div>

          <div className={styles.actionBtns}>
            <button className={styles.btnShare} onClick={handleShare}>
              <Share2 size={16} />
              <span>Compartir</span>
            </button>

            {isAceptado ? (
              <div className={styles.btnAccepted}>
                <CheckCircle2 size={18} color="#16a34a" />
                <span>✅ Presupuesto aceptado correctamente.</span>
              </div>
            ) : (
              <button className={styles.btnAccept} onClick={() => setShowAcceptModal(true)}>
                <CheckCircle2 size={18} />
                <span>Aceptar presupuesto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL DE ACEPTACIÓN ── */}
      {showAcceptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAcceptModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>
              <CheckCircle2 size={20} color="#16a34a" />
              Aceptar Presupuesto
            </h3>
            <p className={styles.modalSub}>
              Por favor, confirme los siguientes puntos para procesar la aceptación de la propuesta.
            </p>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkInput}
                  checked={checkReadDoc}
                  onChange={(e) => setCheckReadDoc(e.target.checked)}
                />
                <span>☑ He leído el presupuesto completo.</span>
              </label>

              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkInput}
                  checked={checkAcceptTerms}
                  onChange={(e) => setCheckAcceptTerms(e.target.checked)}
                />
                <span>☑ Acepto los Términos y Condiciones.</span>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowAcceptModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                className={styles.btnAccept}
                disabled={!checkReadDoc || !checkAcceptTerms || isSubmitting}
                style={{
                  opacity: (!checkReadDoc || !checkAcceptTerms || isSubmitting) ? 0.5 : 1,
                  cursor: (!checkReadDoc || !checkAcceptTerms || isSubmitting) ? 'not-allowed' : 'pointer',
                }}
                onClick={handleConfirmAcceptance}
              >
                {isSubmitting ? 'Procesando...' : 'Aceptar Presupuesto'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
