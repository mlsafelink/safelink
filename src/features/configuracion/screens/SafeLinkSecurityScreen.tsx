import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert,
  Activity, Bell, Lock, AlertTriangle, Clock,
} from 'lucide-react';
import { landingService, type ResumenActividad } from '@/services/landingService';
import styles from './SafeLinkSecurityScreen.module.css';

// ── Helpers ─────────────────────────────────────────────────────
function formatFechaHora(isoDate: string) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch { return isoDate; }
}

// ── Tarjetas de indicadores de actividad ─────────────────────────
type ActividadItem = {
  emoji: string;
  label: string;
  count: number;
  colorClass: string;
  borderClass: string;
};

function ActividadCard({ item }: { item: ActividadItem }) {
  return (
    <div className={`${styles.actividadCard} ${item.borderClass}`}>
      <div className={styles.actividadTop}>
        <span className={styles.actividadEmoji}>{item.emoji}</span>
        <span className={`${styles.actividadCount} ${item.colorClass}`}>{item.count}</span>
      </div>
      <span className={styles.actividadLabel}>{item.label}</span>
    </div>
  );
}

// ── Ítem de función de protección ───────────────────────────────
function ProteccionItem({ label, disponible }: { label: string; disponible?: boolean }) {
  return (
    <div className={styles.proteccionItem}>
      <div className={`${styles.proteccionDot} ${disponible ? styles.dotActivo : styles.dotProximo}`} />
      <span className={styles.proteccionLabel}>{label}</span>
      <span className={`${styles.proteccionBadge} ${disponible ? styles.badgeActivo : styles.badgeProximo}`}>
        {disponible ? 'Activo' : 'Próximamente'}
      </span>
    </div>
  );
}

// ── Ítem de alerta ───────────────────────────────────────────────
function AlertaItem({ label }: { label: string }) {
  return (
    <div className={styles.alertaItem}>
      <Bell size={14} className={styles.alertaIcon} />
      <span>{label}</span>
      <span className={styles.proteccionBadge + ' ' + styles.badgeProximo}>Próximamente</span>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export function SafeLinkSecurityScreen() {
  const navigate = useNavigate();
  const [resumenActividad, setResumenActividad] = useState<ResumenActividad | null>(null);
  const [ultimaVisita, setUltimaVisita] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    landingService.getDetalleVisitantes().then(({ visitas, resumenActividad: ra }) => {
      setResumenActividad(ra);
      if (visitas.length > 0) {
        setUltimaVisita(visitas[0].created_at);
      }
      setIsLoading(false);
    });
  }, []);

  const actividadItems: ActividadItem[] = [
    {
      emoji: '🟢',
      label: 'Normal',
      count: resumenActividad?.normal ?? 0,
      colorClass: styles.countNormal,
      borderClass: styles.cardBorderNormal,
    },
    {
      emoji: '🟡',
      label: 'Actividad inusual',
      count: resumenActividad?.inusual ?? 0,
      colorClass: styles.countInusual,
      borderClass: styles.cardBorderInusual,
    },
    {
      emoji: '🟠',
      label: 'Actividad sospechosa',
      count: resumenActividad?.sospechoso ?? 0,
      colorClass: styles.countSospechoso,
      borderClass: styles.cardBorderSospechoso,
    },
    {
      emoji: '🔴',
      label: 'Potencialmente automatizado',
      count: resumenActividad?.automatizado ?? 0,
      colorClass: styles.countAutomatizado,
      borderClass: styles.cardBorderAutomatizado,
    },
  ];

  const hayAlertas = (resumenActividad?.sospechoso ?? 0) > 0 || (resumenActividad?.automatizado ?? 0) > 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <Shield size={24} />
          </div>
          <div>
            <h1>SafeLink Security</h1>
            <p>Centro de seguridad y monitoreo de accesos de SafeLink</p>
          </div>
        </div>
      </div>

      {/* Estado de seguridad */}
      <div className={styles.estadoCard}>
        <div className={styles.estadoHeader}>
          <div className={styles.estadoIconWrap}>
            {hayAlertas
              ? <ShieldAlert size={28} className={styles.iconAlerta} />
              : <ShieldCheck size={28} className={styles.iconOk} />
            }
          </div>
          <div className={styles.estadoInfo}>
            <h2 className={styles.estadoTitle}>Estado de seguridad</h2>
            <div className={`${styles.estadoBadge} ${hayAlertas ? styles.estadoBadgeAlerta : styles.estadoBadgeOk}`}>
              {hayAlertas ? '🟠 Requiere revisión' : '🟢 Protección activa'}
            </div>
          </div>
        </div>

        <div className={styles.estadoMeta}>
          <div className={styles.estadoMetaItem}>
            <Clock size={14} />
            <span className={styles.estadoMetaLabel}>Última actividad</span>
            <span className={styles.estadoMetaValor}>
              {isLoading ? '…' : ultimaVisita ? formatFechaHora(ultimaVisita) : 'Sin eventos registrados'}
            </span>
          </div>
          <div className={styles.estadoMetaItem}>
            <Activity size={14} />
            <span className={styles.estadoMetaLabel}>Último evento</span>
            <span className={styles.estadoMetaValor}>Sin eventos registrados</span>
          </div>
          <div className={styles.estadoMetaItem}>
            <AlertTriangle size={14} />
            <span className={styles.estadoMetaLabel}>Última actividad sospechosa</span>
            <span className={styles.estadoMetaValor}>Sin eventos registrados</span>
          </div>
        </div>
      </div>

      {/* Indicadores de actividad */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Activity size={18} />
          Indicadores de actividad
        </h3>
        {isLoading ? (
          <p className={styles.loading}>Cargando datos…</p>
        ) : (
          <div className={styles.actividadGrid}>
            {actividadItems.map(item => (
              <ActividadCard key={item.label} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Eventos de seguridad */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <AlertTriangle size={18} />
          Eventos de seguridad
        </h3>
        <div className={styles.eventosCard}>
          <div className={styles.eventosProximamente}>
            <Lock size={32} className={styles.eventosIcon} />
            <p className={styles.eventosProximamenteTitle}>Próximamente: eventos de seguridad</p>
            <p className={styles.eventosProximamenteSub}>
              Aquí se registrarán intentos de login, logins correctos y rechazados,
              ubicaciones inusuales, actividad sospechosa y bloqueos temporales.
            </p>
          </div>
          <div className={styles.eventosTipos}>
            {[
              'Intento de login',
              'Login correcto',
              'Login rechazado',
              'Ubicación no habitual',
              'Actividad inusual',
              'Actividad sospechosa',
              'Actividad potencialmente automatizada',
              'Bloqueo temporal',
            ].map(tipo => (
              <div key={tipo} className={styles.eventoTipo}>
                <div className={styles.eventoTipoDot} />
                <span>{tipo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protección de cuenta */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <ShieldCheck size={18} />
          Protección de cuenta
        </h3>
        <div className={styles.proteccionCard}>
          <ProteccionItem label="Detección de ubicación anómala" />
          <ProteccionItem label="Detección de actividad automatizada" />
          <ProteccionItem label="Bloqueo temporal" />
          <ProteccionItem label="Alertas de seguridad por email" />
          <ProteccionItem label="Cuenta de recuperación" />
        </div>
      </section>

      {/* Alertas de seguridad */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Bell size={18} />
          Alertas de seguridad
        </h3>
        <div className={styles.alertasCard}>
          <AlertaItem label="Intento de login" />
          <AlertaItem label="Login desde ubicación inusual" />
          <AlertaItem label="Actividad sospechosa" />
          <AlertaItem label="Cuenta bloqueada" />
        </div>
      </section>
    </div>
  );
}
