// ── Tipos para SafeLink Mónitor (v0.1) ───────────────────────────────────────

export type DeviceStatus = 'sin_monitorear' | 'online' | 'offline' | 'monitor_no_disponible';

export type MetodoComprobacion = 'ping'; // Extensible a: 'tcp' | 'http' | 'onvif' | 'dahua'

export type IntervaloSegundo = 5 | 10 | 30 | 60;

export type LatencyLevel = 'normal' | 'advertencia' | 'alta';

export type PingCheckResult = {
  id: string;
  timestamp: string;      // ISO
  timeFormatted: string;  // e.g. "18:42:15"
  exito: boolean;
  latenciaMs: number | null;
  latenciaLevel: LatencyLevel | null;
  estadoResultante: DeviceStatus;
};

export type MonitorEvent = {
  id: string;
  timestamp: string;      // ISO
  timeFormatted: string;  // e.g. "18:42:15"
  tipo: 'online' | 'offline';
  mensaje: string;
  duracionOfflineText?: string;
};

export type MonitorDeviceConfig = {
  nombre: string;
  ip: string;
  metodo: MetodoComprobacion;
  intervalo: IntervaloSegundo;
  fallosConsecutivosLimite: number;
};

export type MonitorEngineState = {
  agentConectado: boolean;
  activo: boolean;
  config: MonitorDeviceConfig;
  estadoActual: DeviceStatus;
  latenciaActual: number | null;
  latenciaLevelActual: LatencyLevel | null;
  ultimaComprobacion: string | null;       // ISO
  ultimaRespuesta: string | null;          // ISO
  fallosConsecutivos: number;
  offlineDesde: string | null;             // ISO
  tiempoOfflineSegundos: number;           // Segundos acumulados sin respuesta
  ultimoEstuvoOfflineText: string | null;   // e.g. "2 min 35 seg"
};
