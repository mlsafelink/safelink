import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import { notificacionService } from '@/services/notificacionService';
import { emailService } from '@/services/emailService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Calendar, Building, FileText, Clock, Shield,
  AlertCircle, FileCheck,
  Share2, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import styles from './PresupuestoViewer.module.css';

export function PublicPresupuestoViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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

  // 1. Registro inteligente de la notificación "presupuesto_visto"
  useEffect(() => {
    if (!presupuesto) return;

    // SI EL USUARIO ES EL AUTOR / ADMIN AUTENTICADO: NO GENERAR NOTIFICACIÓN
    if (user) {
      console.info('[SmartNotif] Omitiendo notificación de vista ya que el usuario autenticado (autor) está visualizando el documento.');
      return;
    }

    const recordView = async () => {
      try {
        const hasBeenSeen = await notificacionService.hasEvent('presupuesto_visto', presupuesto.id);
        if (!hasBeenSeen) {
          await notificacionService.create({
            tipo: 'presupuesto_visto',
            presupuesto_id: presupuesto.id,
            codigo_presupuesto: presupuesto.codigo || `PRES-${presupuesto.id.slice(0, 4)}`,
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
  }, [presupuesto?.id, user]);

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

      // Notificación inteligente: Omitir si es el autor autenticado
      if (!user) {
        await notificacionService.create({
          tipo: 'presupuesto_compartido',
          presupuesto_id: presupuesto.id,
          codigo_presupuesto: presupuesto.codigo || `PRES-${presupuesto.id.slice(0, 4)}`,
          cliente_nombre: clienteNombre,
          consorcio_nombre: consorcioNombre,
        });

        if (presupuesto.estado !== 'aceptado') {
          await presupuestoService.update(presupuesto.id, { estado: 'compartido' });
          queryClient.invalidateQueries({ queryKey: ['public-presupuesto', publicId] });
        }
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
      const now = new Date();
      const isoDateStr = now.toISOString();
      const fechaStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      await presupuestoService.update(presupuesto.id, {
        estado: 'aceptado',
        aceptado_at: isoDateStr,
      });

      // Crear evento en sistema
      await notificacionService.create({
        tipo: 'presupuesto_aceptado',
        presupuesto_id: presupuesto.id,
        codigo_presupuesto: presupuesto.codigo || `PRES-${presupuesto.id.slice(0, 4)}`,
        cliente_nombre: clienteNombre,
        consorcio_nombre: consorcioNombre,
      });

      // Enviar correo automático a ml.safelink@gmail.com
      await emailService.sendBudgetAcceptedEmail({
        clienteNombre,
        consorcioNombre,
        fecha: fechaStr,
        hora: horaStr,
        presupuestoTitulo: presupuesto.titulo,
        presupuestoCodigo: presupuesto.codigo || `PRES-${presupuesto.id.slice(0, 4)}`,
        presupuestoUrl: window.location.href,
        reporteTecnicoCodigo: presupuesto.reportes?.codigo || null,
        reporteTecnicoUrl: presupuesto.reportes ? `${window.location.origin}/p/reporte/${presupuesto.reportes.public_id}` : null,
      });

      queryClient.invalidateQueries({ queryKey: ['public-presupuesto', publicId] });
      setShowAcceptModal(false);
      showToast('✅ Presupuesto aceptado correctamente y notificación enviada.');
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

        {/* BLOQUE REQUERIDO 6: REPORTE TÉCNICO BASE CON ENLACE DIRECTO */}
        {presupuesto.reportes && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(245, 158, 11, 0.05))',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}>
            <FileText size={22} style={{ color: '#d97706', flexShrink: 0 }} />
            <div style={{ fontSize: '0.92rem', color: '#334155' }}>
              <strong>Este presupuesto fue elaborado tomando como base el Reporte Técnico:</strong>{' '}
              <Link
                to={`/p/reporte/${presupuesto.reportes.public_id}`}
                style={{ color: '#d97706', fontWeight: 800, textDecoration: 'underline' }}
              >
                {presupuesto.reportes.codigo || 'RT-0001'}
              </Link>
              {presupuesto.reportes.titulo ? ` (${presupuesto.reportes.titulo})` : ''}
            </div>
          </div>
        )}

        {/* 1. Descripción de los Trabajos */}
        {presupuesto.descripcion && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className={styles.sectionIcon} />
              <h2>Descripción de la Propuesta</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{presupuesto.descripcion}</p>
            </div>
          </section>
        )}

        {/* 2. Condiciones Comerciales */}
        {presupuesto.condiciones && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <AlertCircle size={20} className={styles.sectionIcon} />
              <h2>Condiciones de Pago y Ejecución</h2>
            </div>
            <div className={styles.sectionBody}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{presupuesto.condiciones}</p>
            </div>
          </section>
        )}

        {/* 3. Resumen Económico / Total */}
        <section className={styles.sectionCard} style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <div className={styles.sectionHeader}>
            <FileCheck size={20} className={styles.sectionIcon} style={{ color: '#2563eb' }} />
            <h2>Resumen Económico</h2>
          </div>
          <div className={styles.sectionBody}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
              <span>Monto Total de la Propuesta:</span>
              <span style={{ color: '#2563eb', fontSize: '1.5rem' }}>{fmtPrice(presupuesto.total)}</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── BARRA INFERIOR DE ACCIONES ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <button onClick={handleShare} className={styles.shareBtn}>
            <Share2 size={16} />
            <span>Compartir</span>
          </button>

          {isAceptado ? (
            <div className={styles.aceptadoBadge}>
              <ShieldCheck size={18} />
              <span>Presupuesto Aceptado</span>
            </div>
          ) : (
            <button onClick={() => setShowAcceptModal(true)} className={styles.acceptBtn}>
              <CheckCircle2 size={18} />
              <span>Aceptar Presupuesto</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL ACEPTACIÓN ── */}
      {showAcceptModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAcceptModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3>Aceptar Presupuesto Comercial</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Por favor revise y confirme su conformidad con la propuesta expuesta.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checkReadDoc}
                  onChange={e => setCheckReadDoc(e.target.checked)}
                />
                Confirmo que he leído y comprendido los detalles del presupuesto.
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checkAcceptTerms}
                  onChange={e => setCheckAcceptTerms(e.target.checked)}
                />
                Acepto los términos, condiciones y presupuesto total por {fmtPrice(presupuesto.total)}.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowAcceptModal(false)} className={styles.cancelBtn}>
                Cancelar
              </button>
              <button
                disabled={!checkReadDoc || !checkAcceptTerms || isSubmitting}
                onClick={handleConfirmAcceptance}
                className={styles.modalSubmitBtn}
              >
                {isSubmitting ? 'Procesando...' : 'Confirmar y Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
