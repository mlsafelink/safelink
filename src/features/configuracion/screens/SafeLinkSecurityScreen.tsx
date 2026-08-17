import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, ShieldCheck, ShieldAlert,
  Activity, Bell, Lock, AlertTriangle, Clock,
  RefreshCw, ToggleLeft, ToggleRight, Unlock,
} from 'lucide-react';
import {
  securityService,
  type SLSSummary,
  type SLSProfile,
  type SLSSettings,
  type SLSEvent,
  type SLSRiskLevel,
} from '@/services/securityService';
import styles from './SafeLinkSecurityScreen.module.css';

// ── Helpers ──────────────────────────────────────────────────────

function formatFechaHora(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Sin eventos registrados';
  try {
    const d = new Date(isoDate);
    return (
      d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    );
  } catch { return isoDate; }
}

const RISK_LABEL: Record<SLSRiskLevel, string> = {
  NORMAL:    'Normal',
  UNUSUAL:   'Actividad inusual',
  SUSPICIOUS:'Actividad sospechosa',
  AUTOMATED: 'Potenc. automatizado',
};

const EVENT_LABEL: Record<string, string> = {
  LOGIN_SUCCESS:        'Login correcto',
  LOGIN_FAILED:         'Login rechazado',
  LOGOUT:               'Cierre de sesión',
  BLOCKED:              'Bloqueo temporal',
  UNBLOCKED:            'Desbloqueo',
  SUSPICIOUS_ACTIVITY:  'Actividad sospechosa',
  PASSWORD_RESET:       'Restablecimiento de contraseña',
  SESSION_REFRESH:      'Refresco de sesión',
};

// ── Subcomponentes ────────────────────────────────────────────────

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

function RiskBadge({ level }: { level: SLSRiskLevel }) {
  const cfg: Record<SLSRiskLevel, { emoji: string; cls: string }> = {
    NORMAL:    { emoji: '🟢', cls: styles.badgeNormal },
    UNUSUAL:   { emoji: '🟡', cls: styles.badgeInusual },
    SUSPICIOUS:{ emoji: '🟠', cls: styles.badgeSospechoso },
    AUTOMATED: { emoji: '🔴', cls: styles.badgeAutomatizado },
  };
  const { emoji, cls } = cfg[level] ?? cfg.NORMAL;
  return (
    <span className={`${styles.riskBadge} ${cls}`}>
      {emoji} {RISK_LABEL[level]}
    </span>
  );
}

function ToggleSwitch({
  value, onChange, disabled,
}: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      className={`${styles.toggleBtn} ${value ? styles.toggleOn : styles.toggleOff}`}
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      type="button"
    >
      {value
        ? <ToggleRight size={22} className={styles.toggleIcon} />
        : <ToggleLeft size={22} className={styles.toggleIcon} />
      }
    </button>
  );
}

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

// ── Componente principal ──────────────────────────────────────────

export function SafeLinkSecurityScreen() {
  const navigate = useNavigate();

  const [summary, setSummary]     = useState<SLSSummary | null>(null);
  const [profile, setProfile]     = useState<SLSProfile | null>(null);
  const [settings, setSettings]   = useState<SLSSettings | null>(null);
  const [events, setEvents]       = useState<SLSEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sum, { profile: p, settings: s }, evts] = await Promise.all([
        securityService.getSummary(),
        securityService.getProfile(),
        securityService.getEvents(30),
      ]);
      setSummary(sum);
      setProfile(p);
      setSettings(s);
      setEvents(evts);
    } catch (err) {
      console.warn('[SLS] Error cargando datos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Indicadores ───────────────────────────────────────────────
  const actividadItems: ActividadItem[] = [
    { emoji: '🟢', label: 'Normal',                     count: summary?.NORMAL     ?? 0, colorClass: styles.countNormal,       borderClass: styles.cardBorderNormal },
    { emoji: '🟡', label: 'Actividad inusual',           count: summary?.UNUSUAL    ?? 0, colorClass: styles.countInusual,      borderClass: styles.cardBorderInusual },
    { emoji: '🟠', label: 'Actividad sospechosa',        count: summary?.SUSPICIOUS ?? 0, colorClass: styles.countSospechoso,   borderClass: styles.cardBorderSospechoso },
    { emoji: '🔴', label: 'Potencialmente automatizado', count: summary?.AUTOMATED  ?? 0, colorClass: styles.countAutomatizado, borderClass: styles.cardBorderAutomatizado },
  ];

  const hayAlertas = (summary?.SUSPICIOUS ?? 0) > 0 || (summary?.AUTOMATED ?? 0) > 0;
  const isBlocked  = profile?.security_status === 'blocked';

  // ── Guardar setting ───────────────────────────────────────────
  async function handleToggle(field: keyof Omit<SLSSettings, 'user_id' | 'alert_email' | 'block_duration_hours'>, value: boolean) {
    if (!settings) return;
    const updated = { ...settings, [field]: value };
    setSettings(updated as SLSSettings);
    setIsSaving(true);
    await securityService.updateSettings({ [field]: value });
    setIsSaving(false);
  }

  // ── Desbloquear ───────────────────────────────────────────────
  async function handleUnblock() {
    setIsUnblocking(true);
    await securityService.unblockUser();
    await loadData();
    setIsUnblocking(false);
  }

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
          <button
            className={styles.refreshBtn}
            onClick={loadData}
            disabled={isLoading}
            title="Actualizar datos"
          >
            <RefreshCw size={16} className={isLoading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {/* Estado de seguridad */}
      <div className={styles.estadoCard}>
        <div className={styles.estadoHeader}>
          <div className={styles.estadoIconWrap}>
            {isBlocked
              ? <ShieldAlert size={28} className={styles.iconAlerta} />
              : hayAlertas
                ? <ShieldAlert size={28} className={styles.iconAlerta} />
                : <ShieldCheck size={28} className={styles.iconOk} />
            }
          </div>
          <div className={styles.estadoInfo}>
            <h2 className={styles.estadoTitle}>Estado de seguridad</h2>
            <div className={`${styles.estadoBadge} ${
              isBlocked ? styles.estadoBadgeAlerta
              : hayAlertas ? styles.estadoBadgeAlerta
              : styles.estadoBadgeOk
            }`}>
              {isBlocked
                ? '🔴 Cuenta bloqueada'
                : hayAlertas
                  ? '🟠 Requiere revisión'
                  : '🟢 Protección activa'
              }
            </div>
          </div>
          {isBlocked && (
            <button
              className={styles.unblockBtn}
              onClick={handleUnblock}
              disabled={isUnblocking}
            >
              <Unlock size={14} />
              {isUnblocking ? 'Desbloqueando…' : 'Desbloquear'}
            </button>
          )}
        </div>

        <div className={styles.estadoMeta}>
          <div className={styles.estadoMetaItem}>
            <Clock size={14} />
            <span className={styles.estadoMetaLabel}>Último acceso</span>
            <span className={styles.estadoMetaValor}>
              {isLoading ? '…' : formatFechaHora(profile?.last_login_at)}
            </span>
          </div>
          <div className={styles.estadoMetaItem}>
            <Activity size={14} />
            <span className={styles.estadoMetaLabel}>Último evento</span>
            <span className={styles.estadoMetaValor}>
              {isLoading ? '…' : formatFechaHora(profile?.last_event_at)}
            </span>
          </div>
          <div className={styles.estadoMetaItem}>
            <AlertTriangle size={14} />
            <span className={styles.estadoMetaLabel}>Última actividad sospechosa</span>
            <span className={styles.estadoMetaValor}>
              {isLoading ? '…' : formatFechaHora(profile?.last_suspicious_at)}
            </span>
          </div>
          {isBlocked && profile?.blocked_until && (
            <div className={styles.estadoMetaItem}>
              <Lock size={14} />
              <span className={styles.estadoMetaLabel}>Bloqueada hasta</span>
              <span className={`${styles.estadoMetaValor} ${styles.textAlerta}`}>
                {formatFechaHora(profile.blocked_until)}
              </span>
            </div>
          )}
        </div>

        {/* Última ubicación conocida */}
        {profile?.last_zona && (
          <div className={styles.estadoZona}>
            <span className={styles.estadoMetaLabel}>Última ubicación:</span>
            <span className={styles.estadoMetaValor}>{profile.last_zona}</span>
            {profile.last_device_type && (
              <span className={styles.estadoMetaValor}>· {profile.last_device_type}</span>
            )}
            {profile.last_browser && (
              <span className={styles.estadoMetaValor}>· {profile.last_browser}</span>
            )}
          </div>
        )}
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

      {/* Historial de eventos */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <AlertTriangle size={18} />
          Historial de seguridad
        </h3>

        {isLoading ? (
          <p className={styles.loading}>Cargando eventos…</p>
        ) : events.length === 0 ? (
          <div className={styles.eventosCard}>
            <div className={styles.eventosProximamente}>
              <Lock size={32} className={styles.eventosIcon} />
              <p className={styles.eventosProximamenteTitle}>Sin eventos registrados</p>
              <p className={styles.eventosProximamenteSub}>
                Los eventos de seguridad aparecerán aquí a partir del próximo acceso.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.historialTable}>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Evento</th>
                  <th>Zona</th>
                  <th className={styles.thHideSm}>Dispositivo</th>
                  <th>Nivel</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.id}>
                    <td className={styles.tdFecha}>{formatFechaHora(ev.created_at)}</td>
                    <td>{EVENT_LABEL[ev.event_type] ?? ev.event_type}</td>
                    <td className={styles.tdZona}>{ev.zona ?? ev.city ?? 'No disponible'}</td>
                    <td className={`${styles.thHideSm} ${styles.tdDevice}`}>
                      {[ev.device_type, ev.browser].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td><RiskBadge level={ev.risk_level} /></td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        ev.status === 'blocked'  ? styles.statusBlocked
                        : ev.status === 'rejected' ? styles.statusRejected
                        : styles.statusAllowed
                      }`}>
                        {ev.status === 'blocked' ? 'Bloqueado'
                          : ev.status === 'rejected' ? 'Rechazado'
                          : 'Permitido'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Protección de cuenta */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <ShieldCheck size={18} />
          Protección de cuenta
        </h3>
        <div className={styles.proteccionCard}>
          <ProteccionItem label="Registro de eventos de acceso"           disponible />
          <ProteccionItem label="Clasificación de riesgo (4 niveles)"     disponible />
          <ProteccionItem label="Bloqueo temporal por intentos excesivos"  disponible />
          <ProteccionItem label="Alertas por email (sospechoso/automatizado)" disponible />
          <ProteccionItem label="Detección de ubicación anómala"          disponible />
          <ProteccionItem label="Detección de actividad automatizada"     disponible />
          <ProteccionItem label="Detección de viaje imposible"            disponible />
          <ProteccionItem label="MFA (Autenticación multifactor)" />
          <ProteccionItem label="Cuenta de recuperación" />
          <ProteccionItem label="Password Verification Hook (plan Pro)" />
        </div>
      </section>

      {/* Configuración de seguridad */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Lock size={18} />
          Configuración de seguridad
          {isSaving && <span className={styles.savingIndicator}>Guardando…</span>}
        </h3>
        <div className={styles.configCard}>
          {!settings && !isLoading && (
            <p className={styles.loading}>
              Realizá el próximo login para inicializar la configuración.
            </p>
          )}
          {settings && ([
            { label: 'Protección activa',           field: 'protection_enabled' as const, desc: 'Activa el módulo de seguridad SLS' },
            { label: 'Bloqueo temporal',             field: 'block_enabled'      as const, desc: `Bloquea la cuenta tras ${settings.block_duration_hours}h de intentos excesivos` },
            { label: 'Alertas por email',            field: 'alerts_enabled'     as const, desc: 'Habilita el envío de alertas' },
            { label: 'Alertar actividad inusual',    field: 'alert_on_unusual'   as const, desc: 'Email cuando hay actividad inusual' },
            { label: 'Alertar actividad sospechosa', field: 'alert_on_suspicious'as const, desc: 'Email en actividad sospechosa (recomendado)' },
            { label: 'Alertar automatización',       field: 'alert_on_automated' as const, desc: 'Email en actividad potencialmente automatizada' },
          ].map(({ label, field, desc }) => (
            <div key={field} className={styles.configItem}>
              <div className={styles.configItemText}>
                <span className={styles.configItemLabel}>{label}</span>
                <span className={styles.configItemDesc}>{desc}</span>
              </div>
              <ToggleSwitch
                value={settings[field] as boolean}
                onChange={(v) => handleToggle(field, v)}
                disabled={isSaving}
              />
            </div>
          )))}
        </div>
      </section>

      {/* Alertas de seguridad */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Bell size={18} />
          Alertas de seguridad
        </h3>
        <div className={styles.alertasCard}>
          {[
            { label: 'Intento de login',                activo: settings?.alerts_enabled },
            { label: 'Login desde ubicación inusual',   activo: settings?.alert_on_unusual },
            { label: 'Actividad sospechosa',            activo: settings?.alert_on_suspicious },
            { label: 'Actividad potencialmente automatizada', activo: settings?.alert_on_automated },
            { label: 'Cuenta bloqueada',                activo: settings?.block_enabled },
          ].map(({ label, activo }) => (
            <div key={label} className={styles.alertaItem}>
              <Bell size={14} className={styles.alertaIcon} />
              <span>{label}</span>
              <span className={`${styles.proteccionBadge} ${activo ? styles.badgeActivo : styles.badgeProximo}`}>
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
