import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { facturaService } from '@/services/facturaService';
import { datosPagoService } from '@/services/datosPagoService';
import { notificacionService } from '@/services/notificacionService';
import { useAuth } from '@/features/auth/AuthContext';
import {
  Shield, Download, DollarSign,
  CheckCircle2, XCircle, MinusCircle, AlertCircle, Calendar, Hash,
  Landmark, Copy, Check,
} from 'lucide-react';
import styles from './PublicFacturaViewer.module.css';

function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(monto);
}

function formatFecha(fecha: string | null) {
  if (!fecha) return '—';
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

const ESTADO_CONFIG = {
  pagado:   { label: 'Pagado',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)',    icon: CheckCircle2 },
  parcial:  { label: 'Parcial',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: MinusCircle  },
  pendiente:{ label: 'Pendiente',color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    icon: XCircle      },
  vencida:  { label: 'Vencida', color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: AlertCircle  },
};

export function PublicFacturaViewer() {
  const { publicId } = useParams<{ publicId: string }>();
  const { user } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: factura, isLoading, isError } = useQuery({
    queryKey: ['public-factura', publicId],
    queryFn: () => facturaService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  const { data: datosPago } = useQuery({
    queryKey: ['public-datos-pago'],
    queryFn: () => datosPagoService.getDatosPago(),
  });

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Registrar evento de descarga solo si no es el admin
  useEffect(() => {
    if (!factura || user) return;

    notificacionService.create({
      tipo: 'factura_descargada',
      cliente_nombre: (factura.consorcios as any)?.nombre ?? null,
      consorcio_nombre: (factura.consorcios as any)?.nombre ?? null,
      detalles: { numero_factura: factura.numero_factura },
    }).catch(console.error);
  }, [factura?.id, user]);

  // ── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={styles.fullScreen}>
        <div className={styles.spinner} />
        <span>Cargando factura...</span>
      </div>
    );
  }

  if (isError || !factura) {
    return (
      <div className={styles.fullScreen}>
        <Shield size={56} className={styles.errorIcon} />
        <h2>Documento no encontrado</h2>
        <p>El enlace puede ser incorrecto o la factura fue removida.</p>
      </div>
    );
  }

  const isVencida = factura.fecha_vencimiento
    && factura.estado !== 'pagado'
    && new Date(factura.fecha_vencimiento) < new Date();

  const estadoKey = (isVencida ? 'vencida' : factura.estado) as keyof typeof ESTADO_CONFIG;
  const est = ESTADO_CONFIG[estadoKey] ?? ESTADO_CONFIG.pendiente;
  const EstIcon = est.icon;

  const consorcioNombre = (factura.consorcios as any)?.nombre ?? '—';
  const isDatosPagoConfigurado = datosPagoService.isConfigurado(datosPago);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <DollarSign size={22} className={styles.brandIcon} />
          <span className={styles.brandName}>SafeLink · Finanzas</span>
        </div>
      </header>

      {/* Contenido */}
      <main className={styles.main}>
        <div className={styles.card}>
          {/* Badge de estado */}
          <div
            className={styles.estadoBadge}
            style={{ color: est.color, background: est.bg }}
          >
            <EstIcon size={16} />
            <span>{est.label}</span>
          </div>

          {/* Número */}
          <h1 className={styles.titulo}>Factura</h1>
          <div className={styles.numero}>
            <Hash size={18} />
            {factura.numero_factura}
            <span className={styles.tipoBadge}>Tipo {factura.tipo_factura}</span>
          </div>

          {/* Cliente */}
          <p className={styles.clienteNombre}>{consorcioNombre}</p>

          {/* Datos en grid */}
          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <Calendar size={14} />
              <div>
                <span className={styles.dataLabel}>Fecha de Emisión</span>
                <span className={styles.dataValor}>{formatFecha(factura.fecha_emision)}</span>
              </div>
            </div>

            {factura.fecha_vencimiento && (
              <div className={styles.dataItem}>
                <Calendar size={14} />
                <div>
                  <span className={styles.dataLabel}>Vencimiento</span>
                  <span className={`${styles.dataValor} ${isVencida ? styles.vencidaText : ''}`}>
                    {formatFecha(factura.fecha_vencimiento)}
                  </span>
                </div>
              </div>
            )}

            <div className={`${styles.dataItem} ${styles.dataItemMonto}`}>
              <DollarSign size={14} />
              <div>
                <span className={styles.dataLabel}>Monto Total</span>
                <span className={styles.dataValorMonto}>{formatMonto(factura.monto_total)}</span>
              </div>
            </div>
          </div>

          {/* PDF / Descarga */}
          {factura.pdf_url ? (
            <a
              href={factura.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.downloadBtn}
              onClick={() => {
                if (!user) {
                  notificacionService.create({
                    tipo: 'factura_descargada',
                    cliente_nombre: consorcioNombre,
                    consorcio_nombre: consorcioNombre,
                    detalles: { numero_factura: factura.numero_factura },
                  }).catch(console.error);
                }
              }}
            >
              <Download size={18} />
              Descargar Factura PDF
            </a>
          ) : (
            <div className={styles.noPdfMsg}>
              <AlertCircle size={16} />
              <span>El PDF de esta factura aún no está disponible.</span>
            </div>
          )}

          {factura.observaciones && (
            <div className={styles.observaciones}>
              <p>{factura.observaciones}</p>
            </div>
          )}

          {/* ── DATOS PARA REALIZAR EL PAGO ── */}
          {isDatosPagoConfigurado && datosPago && (
            <div className={styles.pagoSection}>
              <div className={styles.pagoHeader}>
                <div className={styles.pagoIconWrap}>
                  <Landmark size={18} />
                </div>
                <div>
                  <h2 className={styles.pagoTitle}>Datos para realizar el pago</h2>
                  <p className={styles.pagoSubtitle}>
                    Transferencia bancaria para la acreditación de esta factura.
                  </p>
                </div>
              </div>

              <div className={styles.pagoGrid}>
                {/* Entidad Bancaria */}
                <div className={styles.pagoItem}>
                  <span className={styles.pagoLabel}>Entidad bancaria</span>
                  <span className={styles.pagoValor}>{datosPago.banco}</span>
                </div>

                {/* Titular */}
                <div className={styles.pagoItem}>
                  <span className={styles.pagoLabel}>Titular de la cuenta</span>
                  <span className={styles.pagoValor}>{datosPago.titular}</span>
                </div>

                {/* Número de cuenta */}
                <div className={styles.pagoItem}>
                  <span className={styles.pagoLabel}>Número de cuenta</span>
                  <div className={styles.pagoCopyRow}>
                    <span className={`${styles.pagoValor} ${styles.pagoMono}`}>
                      {datosPago.numero_cuenta}
                    </span>
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copiedKey === 'cuenta' ? styles.copyBtnSuccess : ''}`}
                      onClick={() => handleCopy(datosPago.numero_cuenta, 'cuenta')}
                    >
                      {copiedKey === 'cuenta' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'cuenta' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* CBU */}
                <div className={styles.pagoItem}>
                  <span className={styles.pagoLabel}>CBU</span>
                  <div className={styles.pagoCopyRow}>
                    <span className={`${styles.pagoValor} ${styles.pagoMono}`}>
                      {datosPago.cbu}
                    </span>
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copiedKey === 'cbu' ? styles.copyBtnSuccess : ''}`}
                      onClick={() => handleCopy(datosPago.cbu, 'cbu')}
                    >
                      {copiedKey === 'cbu' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'cbu' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Alias */}
                <div className={styles.pagoItem}>
                  <span className={styles.pagoLabel}>Alias</span>
                  <div className={styles.pagoCopyRow}>
                    <span className={`${styles.pagoValor} ${styles.pagoMono} ${styles.pagoAlias}`}>
                      {datosPago.alias}
                    </span>
                    <button
                      type="button"
                      className={`${styles.copyBtn} ${copiedKey === 'alias' ? styles.copyBtnSuccess : ''}`}
                      onClick={() => handleCopy(datosPago.alias, 'alias')}
                    >
                      {copiedKey === 'alias' ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedKey === 'alias' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>SafeLink · Plataforma de Gestión Técnica</p>
        <p>Este enlace es de solo lectura y fue generado para consulta exclusiva del destinatario.</p>
      </footer>
    </div>
  );
}
