import type {
  MonitorDeviceConfig,
  MonitorEngineState,
  PingCheckResult,
  MonitorEvent,
  DeviceStatus,
  LatencyLevel,
} from '@/types/monitor';

const AGENT_BASE_URL = 'http://127.0.0.1:8787';

export const DEFAULT_DEVICE_CONFIG: MonitorDeviceConfig = {
  nombre: 'Notebook Laboratorio',
  ip: '192.168.1.105',
  metodo: 'ping',
  intervalo: 5,
  fallosConsecutivosLimite: 3,
};

type Listener = () => void;

class MonitorEngine {
  private config: MonitorDeviceConfig = { ...DEFAULT_DEVICE_CONFIG };
  private agentConectado: boolean = false;
  private activo: boolean = false;

  private estadoActual: DeviceStatus = 'sin_monitorear';
  private latenciaActual: number | null = null;
  private latenciaLevelActual: LatencyLevel | null = null;
  private ultimaComprobacion: string | null = null;
  private ultimaRespuesta: string | null = null;
  private fallosConsecutivos: number = 0;

  private offlineDesde: string | null = null;
  private tiempoOfflineSegundos: number = 0;
  private ultimoEstuvoOfflineText: string | null = null;

  private history: PingCheckResult[] = [];
  private events: MonitorEvent[] = [];
  private listeners: Set<Listener> = new Set();
  constructor() {
    if (typeof window !== 'undefined') {
      // Polling de salud del agente cada 2 segundos
      this.checkAgentHealth();
      setInterval(() => {
        this.checkAgentHealth();
      }, 2000);
    }
  }

  // ── Suscripción a Cambios ──────────────────────────────────────────────────

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  getState(): MonitorEngineState {
    return {
      agentConectado: this.agentConectado,
      activo: this.activo,
      config: { ...this.config },
      estadoActual: !this.agentConectado && this.activo ? 'monitor_no_disponible' : this.estadoActual,
      latenciaActual: this.latenciaActual,
      latenciaLevelActual: this.latenciaLevelActual,
      ultimaComprobacion: this.ultimaComprobacion,
      ultimaRespuesta: this.ultimaRespuesta,
      fallosConsecutivos: this.fallosConsecutivos,
      offlineDesde: this.offlineDesde,
      tiempoOfflineSegundos: this.tiempoOfflineSegundos,
      ultimoEstuvoOfflineText: this.ultimoEstuvoOfflineText,
    };
  }

  getHistory(): PingCheckResult[] {
    return [...this.history];
  }

  getEvents(): MonitorEvent[] {
    return [...this.events];
  }

  // ── Configuración ──────────────────────────────────────────────────────────

  updateConfig(newConfig: Partial<MonitorDeviceConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notify();

    if (this.activo && this.agentConectado) {
      this.startOnAgent();
    }
  }

  // ── Polling de Salud y Sincronización con el Agent Local ────────────────────

  private async checkAgentHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${AGENT_BASE_URL}/api/status`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const wasDisconnected = !this.agentConectado;
        this.agentConectado = true;

        if (wasDisconnected) {
          this.notify();
        }

        // Obtener resultados en tiempo real del agente
        await this.syncResultsFromAgent();
      } else {
        this.handleAgentDisconnected();
      }
    } catch {
      this.handleAgentDisconnected();
    }
  }

  private handleAgentDisconnected() {
    if (this.agentConectado) {
      this.agentConectado = false;
      this.notify();
    }
  }

  private async syncResultsFromAgent() {
    try {
      const res = await fetch(`${AGENT_BASE_URL}/api/monitor/results`);
      if (!res.ok) return;

      const data = await res.json();

      this.activo = Boolean(data.activo);
      this.estadoActual = data.estadoActual as DeviceStatus;
      this.latenciaActual = data.latenciaActual;
      this.latenciaLevelActual = data.latenciaLevelActual;
      this.ultimaComprobacion = data.ultimaComprobacion;
      this.ultimaRespuesta = data.ultimaRespuesta;
      this.fallosConsecutivos = data.fallosConsecutivos ?? 0;
      this.offlineDesde = data.offlineDesde;
      this.tiempoOfflineSegundos = data.tiempoOfflineSegundos ?? 0;
      this.ultimoEstuvoOfflineText = data.ultimoEstuvoOfflineText;

      if (Array.isArray(data.history)) {
        this.history = data.history;
      }
      if (Array.isArray(data.events)) {
        this.events = data.events;
      }

      this.notify();
    } catch {
      // Ignorar errores de sincronización puntuales
    }
  }

  // ── Controles Start / Stop invocando al Agente ──────────────────────────────

  async start() {
    this.activo = true;
    this.notify();
    await this.startOnAgent();
  }

  private async startOnAgent() {
    if (!this.agentConectado) return;

    try {
      await fetch(`${AGENT_BASE_URL}/api/monitor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.config.ip,
          intervalSeconds: this.config.intervalo,
          consecutiveFailsThreshold: this.config.fallosConsecutivosLimite,
        }),
      });
      await this.syncResultsFromAgent();
    } catch {
      // Ignorar si el agente no responde
    }
  }

  async stop() {
    this.activo = false;
    this.notify();

    if (this.agentConectado) {
      try {
        await fetch(`${AGENT_BASE_URL}/api/monitor/stop`, {
          method: 'POST',
        });
        await this.syncResultsFromAgent();
      } catch {
        // Ignorar
      }
    }
  }
}

export const monitorEngine = new MonitorEngine();
