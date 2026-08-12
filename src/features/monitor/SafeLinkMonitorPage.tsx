import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { monitorEngine } from '@/services/monitorEngine';
import type { IntervaloSegundo, PingCheckResult, MonitorEvent } from '@/types/monitor';
import {
  Radio, Play, Square, Server, CheckCircle2, XCircle,
  AlertTriangle, Clock, Activity, Wifi, ShieldAlert,
  History, AlertCircle, HardDrive, Terminal
} from 'lucide-react';
import styles from './SafeLinkMonitorPage.module.css';

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'Sin comprobar';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 2) return 'hace un instante';
  if (diffSec < 60) return `hace ${diffSec} segundos`;
  const diffMin = Math.floor(diffSec / 60);
  return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
}

function formatSecondsToHMS(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function formatTimeOnly(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function SafeLinkMonitorPage() {
  const [engineState, setEngineState] = useState(() => monitorEngine.getState());
  const [history, setHistory] = useState<PingCheckResult[]>(() => monitorEngine.getHistory());
  const [events, setEvents] = useState<MonitorEvent[]>(() => monitorEngine.getEvents());

  // Estado local del formulario
  const [nombre, setNombre] = useState(engineState.config.nombre);
  const [ip, setIp] = useState(engineState.config.ip);
  const [intervalo, setIntervalo] = useState<IntervaloSegundo>(engineState.config.intervalo);
  const [fallosLimite, setFallosLimite] = useState<number>(engineState.config.fallosConsecutivosLimite || 3);

  // Sincronizar estado en tiempo real
  useEffect(() => {
    const unsubscribe = monitorEngine.subscribe(() => {
      setEngineState(monitorEngine.getState());
      setHistory(monitorEngine.getHistory());
      setEvents(monitorEngine.getEvents());
    });

    return () => unsubscribe();
  }, []);

  const handleToggleMonitoring = async () => {
    if (engineState.activo) {
      await monitorEngine.stop();
    } else {
      monitorEngine.updateConfig({
        nombre,
        ip,
        intervalo,
        fallosConsecutivosLimite: fallosLimite,
      });
      await monitorEngine.start();
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    monitorEngine.updateConfig({
      nombre,
      ip,
      intervalo,
      fallosConsecutivosLimite: fallosLimite,
    });
  };

  // Métricas del Dashboard
  const totalMonitoreados = 1;
  const isAgentOk = engineState.agentConectado;
  const countOnline = isAgentOk && engineState.estadoActual === 'online' ? 1 : 0;
  const countOffline = isAgentOk && engineState.estadoActual === 'offline' ? 1 : 0;
  const countProblemas = isAgentOk && (engineState.latenciaLevelActual === 'alta' || engineState.latenciaLevelActual === 'advertencia') ? 1 : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div className={styles.headerIcon}>
            <Radio size={26} />
          </div>
          <div>
            <h1>SafeLink Mónitor</h1>
            <p>Monitoreo de equipos en tiempo real (Versión 0.1 — Laboratorio)</p>
          </div>
        </div>

        {/* Status Badge del Agente */}
        <div className={`${styles.agentStatusBadge} ${isAgentOk ? styles.agentConnected : styles.agentDisconnected}`}>
          <HardDrive size={16} />
          <span>Agent: <strong>{isAgentOk ? '🟢 CONECTADO (127.0.0.1:8787)' : '🔴 NO CONECTADO'}</strong></span>
        </div>
      </div>

      {/* Banner de Advertencia si el Agente está Desconectado */}
      {!isAgentOk && (
        <Card variant="glass" className={styles.agentWarningBanner}>
          <div className={styles.agentWarningHeader}>
            <AlertCircle size={20} color="#ef4444" />
            <div>
              <h3>SafeLink Monitor Agent no detectado</h3>
              <p>
                Para ejecutar comprobaciones de red ICMP/PING reales en Windows, iniciá el agente ejecutable local.
              </p>
            </div>
          </div>
          <div className={styles.agentCmdBox}>
            <Terminal size={14} />
            <code>cd agent && node server.mjs</code>
          </div>
        </Card>
      )}

      {/* 1. Indicadores / Contadores Dashboard */}
      <div className={styles.metricsGrid}>
        <Card variant="glass" className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Equipos Monitoreados</span>
            <Server size={18} className={styles.metricIcon} />
          </div>
          <span className={styles.metricValue}>{totalMonitoreados}</span>
        </Card>

        <Card variant="glass" className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Online</span>
            <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
          </div>
          <span className={`${styles.metricValue} ${styles.onlineText}`}>{countOnline}</span>
        </Card>

        <Card variant="glass" className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Offline</span>
            <XCircle size={18} style={{ color: '#ef4444' }} />
          </div>
          <span className={`${styles.metricValue} ${styles.offlineText}`}>{countOffline}</span>
        </Card>

        <Card variant="glass" className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Con problemas</span>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <span className={`${styles.metricValue} ${styles.warningText}`}>{countProblemas}</span>
        </Card>
      </div>

      {/* Grid Principal: Configuración de Laboratorio + Tarjeta Estado Real */}
      <div className={styles.mainGrid}>
        {/* 2. Equipo de Laboratorio (Configuración) */}
        <Card variant="glass" className={styles.sectionCard}>
          <div className={styles.cardTitleRow}>
            <Wifi size={20} className={styles.sectionIcon} />
            <h2>Nuevo Dispositivo (Laboratorio)</h2>
          </div>
          <p className={styles.cardDesc}>
            Configurá la dirección IP y frecuencia de comprobación para monitorear el dispositivo.
          </p>

          <form onSubmit={handleConfigSubmit} className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Nombre del Dispositivo</label>
              <input
                className={styles.input}
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                disabled={engineState.activo}
                placeholder="Ej: Notebook Laboratorio"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Dirección IP</label>
              <input
                className={styles.input}
                type="text"
                value={ip}
                onChange={e => setIp(e.target.value)}
                disabled={engineState.activo}
                placeholder="Ej: 192.168.100.xxx"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Método de Comprobación</label>
              <select className={styles.select} disabled>
                <option value="ping">PING (ICMP Echo Probe)</option>
              </select>
            </div>

            <div className={styles.formRowTwoCols}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Intervalo</label>
                <select
                  className={styles.select}
                  value={intervalo}
                  onChange={e => setIntervalo(Number(e.target.value) as IntervaloSegundo)}
                  disabled={engineState.activo}
                >
                  <option value={5}>5 segundos (Predeterminado)</option>
                  <option value={10}>10 segundos</option>
                  <option value={30}>30 segundos</option>
                  <option value={60}>60 segundos (1 min)</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fallos para Offline</label>
                <select
                  className={styles.select}
                  value={fallosLimite}
                  onChange={e => setFallosLimite(Number(e.target.value))}
                  disabled={engineState.activo}
                >
                  <option value={3}>3 fallos consecutivos</option>
                  <option value={2}>2 fallos consecutivos</option>
                  <option value={5}>5 fallos consecutivos</option>
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <Button
                type="button"
                variant={engineState.activo ? 'secondary' : 'primary'}
                leftIcon={engineState.activo ? <Square size={16} /> : <Play size={16} />}
                onClick={handleToggleMonitoring}
                disabled={!isAgentOk}
              >
                {engineState.activo ? '⏹ Detener monitoreo' : '▶ Iniciar monitoreo'}
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Estado del Dispositivo en Tiempo Real */}
        <Card variant="neumorphic" className={styles.statusCard}>
          <div className={styles.cardTitleRow}>
            <Activity size={20} className={styles.sectionIcon} />
            <h2>Estado del Equipo</h2>
          </div>

          <div className={styles.statusBoxMain}>
            {/* Status Badge */}
            <div className={styles.statusBadgeWrapper}>
              {!isAgentOk ? (
                <div className={`${styles.statusBadge} ${styles.badgeDisabled}`}>
                  <span className={styles.pingDotGray} />
                  <span>⚪ MONITOR NO DISPONIBLE</span>
                </div>
              ) : engineState.estadoActual === 'online' ? (
                <div className={`${styles.statusBadge} ${styles.badgeOnline}`}>
                  <span className={styles.pingDotGreen} />
                  <span>🟢 ONLINE</span>
                </div>
              ) : engineState.estadoActual === 'offline' ? (
                <div className={`${styles.statusBadge} ${styles.badgeOffline}`}>
                  <span className={styles.pingDotRed} />
                  <span>🔴 OFFLINE</span>
                </div>
              ) : (
                <div className={`${styles.statusBadge} ${styles.badgeStandby}`}>
                  <span className={styles.pingDotGray} />
                  <span>⚪ SIN MONITOREAR</span>
                </div>
              )}
            </div>

            {/* Latencia */}
            {isAgentOk && engineState.estadoActual === 'online' && engineState.latenciaActual !== null && (
              <div className={styles.latencyBadgeRow}>
                <span className={styles.latencyLabel}>Latencia:</span>
                <span className={`${styles.latencyValue} ${styles[`latency_${engineState.latenciaLevelActual}`]}`}>
                  {engineState.latenciaActual} ms
                </span>
              </div>
            )}
          </div>

          {/* Información Detallada */}
          <div className={styles.infoFieldsList}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Dispositivo / IP:</span>
              <span className={styles.infoVal}>{engineState.config.nombre} ({engineState.config.ip})</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Última comprobación:</span>
              <span className={styles.infoVal}>
                {formatRelativeTime(engineState.ultimaComprobacion)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Última respuesta:</span>
              <span className={styles.infoVal}>
                {formatTimeOnly(engineState.ultimaRespuesta)}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fallos consecutivos:</span>
              <span className={styles.infoVal}>
                {engineState.fallosConsecutivos > 0 ? (
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>
                    {engineState.fallosConsecutivos} / {engineState.config.fallosConsecutivosLimite || 3}
                  </span>
                ) : (
                  '0'
                )}
              </span>
            </div>

            {/* Tiempo Offline */}
            {isAgentOk && engineState.estadoActual === 'offline' && (
              <div className={styles.offlineBox}>
                <div className={styles.offlineHeader}>
                  <AlertCircle size={15} color="#ef4444" />
                  <span>Sin respuesta desde: {formatTimeOnly(engineState.offlineDesde)}</span>
                </div>
                <div className={styles.offlineTimeRow}>
                  <Clock size={15} />
                  <span>Tiempo offline: <strong>{formatSecondsToHMS(engineState.tiempoOfflineSegundos)}</strong></span>
                </div>
              </div>
            )}

            {/* Última duración Offline registrada */}
            {isAgentOk && engineState.estadoActual === 'online' && engineState.ultimoEstuvoOfflineText && (
              <div className={styles.previousOfflineBox}>
                <CheckCircle2 size={15} color="#16a34a" />
                <span>Estuvo offline: <strong>{engineState.ultimoEstuvoOfflineText}</strong></span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Grid Secundario: Historial + Eventos */}
      <div className={styles.historyGrid}>
        {/* 4. Historial Simple (Últimas 100 comprobaciones) */}
        <Card variant="glass" className={styles.historyCard}>
          <div className={styles.cardTitleRow}>
            <History size={18} className={styles.sectionIcon} />
            <h2>Historial de Comprobaciones</h2>
            <span className={styles.historyCountBadge}>Últimas {history.length}</span>
          </div>

          <div className={styles.tableWrapper}>
            {history.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={28} opacity={0.4} />
                <p>No hay comprobaciones aún. Iniciá el monitoreo con el Agent para registrar respuestas.</p>
              </div>
            ) : (
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Estado</th>
                    <th>Latencia</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id}>
                      <td className={styles.monoCell}>{item.timeFormatted}</td>
                      <td>
                        {item.exito ? (
                          <span className={styles.tagSuccess}>🟢 Online</span>
                        ) : (
                          <span className={styles.tagDanger}>🔴 Falló</span>
                        )}
                      </td>
                      <td className={styles.monoCell}>
                        {item.exito && item.latenciaMs !== null ? `${item.latenciaMs} ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* 5. Eventos de Cambio de Estado */}
        <Card variant="glass" className={styles.eventsCard}>
          <div className={styles.cardTitleRow}>
            <ShieldAlert size={18} className={styles.sectionIcon} />
            <h2>Eventos Recientes</h2>
          </div>

          <div className={styles.eventsWrapper}>
            {events.length === 0 ? (
              <div className={styles.emptyState}>
                <Activity size={28} opacity={0.4} />
                <p>Sin eventos de cambio de estado registrados.</p>
              </div>
            ) : (
              <div className={styles.eventsList}>
                {events.map(evt => (
                  <div key={evt.id} className={styles.eventItem}>
                    <span className={styles.eventTime}>{evt.timeFormatted}</span>
                    <span className={styles.eventMsg}>{evt.mensaje}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
