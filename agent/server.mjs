/**
 * SafeLink Monitor Agent — v0.1 (Laboratorio)
 * Servicio independiente en Node.js que realiza pings ICMP reales en Windows.
 * Escucha únicamente en 127.0.0.1:8787 por razones de seguridad.
 */

import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8787;
const HOST = '127.0.0.1';

// ── Estado Interno del Monitoreo ──────────────────────────────────────────────

let isMonitoringActive = false;
let monitorIntervalId = null;
let offlineTimerId = null;

let currentConfig = {
  ip: '192.168.1.105',
  intervalSeconds: 5,
  consecutiveFailsThreshold: 3,
};

let estadoActual = 'sin_monitorear'; // 'online' | 'offline' | 'sin_monitorear'
let latenciaActual = null;
let latenciaLevelActual = null; // 'normal' | 'advertencia' | 'alta'
let ultimaComprobacion = null;
let ultimaRespuesta = null;
let fallosConsecutivos = 0;

let offlineDesde = null;
let tiempoOfflineSegundos = 0;
let ultimoEstuvoOfflineText = null;

let history = []; // Máximo 100 elementos
let events = [];  // Log de cambios de estado

// ── Validación de Seguridad de IP ─────────────────────────────────────────────

function isValidIpOrHostname(target) {
  if (!target || typeof target !== 'string') return false;
  const clean = target.trim();
  // Validar IPv4 estricta o hostname simple (sin caracteres de shell como ; & | > < ` $)
  const ipv4Regex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
  return ipv4Regex.test(clean) || hostnameRegex.test(clean);
}

// ── Ejecución de ICMP Ping Real en Windows ───────────────────────────────────

async function executeWindowsPing(targetIp) {
  const startTime = Date.now();
  const isWindows = process.platform === 'win32';

  const cmd = isWindows ? 'ping' : 'ping';
  const args = isWindows
    ? ['-n', '1', '-w', '2000', targetIp]  // 1 ping, timeout 2000ms en Windows
    : ['-c', '1', '-W', '2', targetIp];     // Linux/Mac fallback

  try {
    const { stdout } = await execFileAsync(cmd, args, { timeout: 3000 });
    const endTime = Date.now();

    // Detectar fallos conocidos en la salida de Windows/Linux
    const lower = stdout.toLowerCase();
    if (
      lower.includes('agotado') ||
      lower.includes('unreachable') ||
      lower.includes('inaccesible') ||
      lower.includes('100% loss') ||
      lower.includes('100% paquete') ||
      lower.includes('0 recibidos') ||
      lower.includes('error')
    ) {
      return { exito: false, latenciaMs: null };
    }

    // Extraer tiempo en milisegundos desde el output del ping
    // Español: "tiempo=64ms" o "tiempo<1ms"
    // Inglés: "time=64ms" o "time<1ms"
    let latenciaMs = null;
    const timeMatch = stdout.match(/(?:tiempo|time)[=<]\s*(\d+)ms/i);

    if (timeMatch && timeMatch[1]) {
      latenciaMs = parseInt(timeMatch[1], 10);
    } else {
      // Si el SO no devolvió el número explícito, calcular RTT por la diferencia de tiempo
      latenciaMs = Math.max(1, endTime - startTime);
    }

    return { exito: true, latenciaMs };
  } catch (err) {
    return { exito: false, latenciaMs: null };
  }
}

// ── Lógica del Loop de Monitoreo ─────────────────────────────────────────────

async function performPingCycle() {
  const now = new Date();
  const isoNow = now.toISOString();
  const timeFormatted = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  ultimaComprobacion = isoNow;

  const { exito, latenciaMs } = await executeWindowsPing(currentConfig.ip);

  let latenciaLevel = null;
  if (exito && latenciaMs !== null) {
    if (latenciaMs <= 100) latenciaLevel = 'normal';
    else if (latenciaMs <= 300) latenciaLevel = 'advertencia';
    else latenciaLevel = 'alta';
  }

  if (exito) {
    handleSuccess(latenciaMs, latenciaLevel, isoNow);
  } else {
    handleFailure(isoNow);
  }

  // Guardar en historial
  const resultItem = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: isoNow,
    timeFormatted,
    exito,
    latenciaMs: exito ? latenciaMs : null,
    latenciaLevel: exito ? latenciaLevel : null,
    estadoResultante: estadoActual,
  };

  history.unshift(resultItem);
  if (history.length > 100) history.pop();
}

function handleSuccess(latenciaMs, latenciaLevel, isoNow) {
  latenciaActual = latenciaMs;
  latenciaLevelActual = latenciaLevel;
  ultimaRespuesta = isoNow;
  fallosConsecutivos = 0;

  if (estadoActual === 'offline') {
    let estuvotext = '';
    if (offlineDesde) {
      const diffMs = new Date(isoNow).getTime() - new Date(offlineDesde).getTime();
      const segs = Math.floor(diffMs / 1000);
      const mins = Math.floor(segs / 60);
      const segsRest = segs % 60;
      estuvotext = mins > 0 ? `${mins} min ${segsRest} seg` : `${segsRest} seg`;
      ultimoEstuvoOfflineText = estuvotext;
    }

    estadoActual = 'online';
    offlineDesde = null;
    tiempoOfflineSegundos = 0;

    if (offlineTimerId) {
      clearInterval(offlineTimerId);
      offlineTimerId = null;
    }

    addEvent({
      tipo: 'online',
      mensaje: `🟢 El dispositivo volvió ONLINE. ${estuvotext ? `(Estuvo offline: ${estuvotext})` : ''}`,
      duracionOfflineText: estuvotext,
    });
  } else if (estadoActual === 'sin_monitorear') {
    estadoActual = 'online';
  }
}

function handleFailure(isoNow) {
  fallosConsecutivos++;

  if (fallosConsecutivos >= currentConfig.consecutiveFailsThreshold && estadoActual !== 'offline') {
    estadoActual = 'offline';
    latenciaActual = null;
    latenciaLevelActual = null;
    offlineDesde = isoNow;
    tiempoOfflineSegundos = 0;

    if (offlineTimerId) clearInterval(offlineTimerId);
    offlineTimerId = setInterval(() => {
      if (offlineDesde && estadoActual === 'offline') {
        const diffMs = Date.now() - new Date(offlineDesde).getTime();
        tiempoOfflineSegundos = Math.floor(diffMs / 1000);
      }
    }, 1000);

    addEvent({
      tipo: 'offline',
      mensaje: '🔴 El dispositivo pasó a OFFLINE.',
    });
  }
}

function addEvent(evtData) {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const evt = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: now.toISOString(),
    timeFormatted,
    ...evtData,
  };

  events.unshift(evt);
  if (events.length > 50) events.pop();
}

function startMonitoring() {
  if (isMonitoringActive) return;
  isMonitoringActive = true;
  fallosConsecutivos = 0;
  performPingCycle();

  const ms = (currentConfig.intervalSeconds || 5) * 1000;
  monitorIntervalId = setInterval(() => {
    performPingCycle();
  }, ms);
}

function stopMonitoring() {
  isMonitoringActive = false;
  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
    monitorIntervalId = null;
  }
  if (offlineTimerId) {
    clearInterval(offlineTimerId);
    offlineTimerId = null;
  }
}

// ── Servidor HTTP REST ───────────────────────────────────────────────────────

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function jsonResponse(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // GET /api/status -> Salud del agente
  if (req.method === 'GET' && url.pathname === '/api/status') {
    return jsonResponse(res, 200, {
      online: true,
      agent: 'SafeLink Monitor Agent',
      version: '0.1.0',
      platform: process.platform,
      active: isMonitoringActive,
      port: PORT,
    });
  }

  // GET /api/monitor/results -> Resultados del monitoreo
  if (req.method === 'GET' && url.pathname === '/api/monitor/results') {
    return jsonResponse(res, 200, {
      activo: isMonitoringActive,
      config: currentConfig,
      estadoActual,
      latenciaActual,
      latenciaLevelActual,
      ultimaComprobacion,
      ultimaRespuesta,
      fallosConsecutivos,
      offlineDesde,
      tiempoOfflineSegundos,
      ultimoEstuvoOfflineText,
      history,
      events,
    });
  }

  // POST /api/monitor/start -> Iniciar monitoreo
  if (req.method === 'POST' && url.pathname === '/api/monitor/start') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        if (data.ip) {
          if (!isValidIpOrHostname(data.ip)) {
            return jsonResponse(res, 400, { error: 'Dirección IP o Host inválido' });
          }
          currentConfig.ip = data.ip.trim();
        }
        if (data.intervalSeconds) {
          currentConfig.intervalSeconds = parseInt(data.intervalSeconds, 10) || 5;
        }
        if (data.consecutiveFailsThreshold) {
          currentConfig.consecutiveFailsThreshold = parseInt(data.consecutiveFailsThreshold, 10) || 3;
        }

        stopMonitoring();
        startMonitoring();

        return jsonResponse(res, 200, {
          success: true,
          message: `Monitoreo iniciado para IP ${currentConfig.ip}`,
          config: currentConfig,
        });
      } catch (err) {
        return jsonResponse(res, 400, { error: 'Payload JSON inválido' });
      }
    });
    return;
  }

  // POST /api/monitor/stop -> Detener monitoreo
  if (req.method === 'POST' && url.pathname === '/api/monitor/stop') {
    stopMonitoring();
    return jsonResponse(res, 200, {
      success: true,
      message: 'Monitoreo detenido',
    });
  }

  // 404 por defecto
  return jsonResponse(res, 404, { error: 'Endpoint no encontrado' });
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log('  📡 SafeLink Monitor Agent v0.1 (Windows)');
  console.log('====================================================');
  console.log(`  Servidor iniciado en: http://${HOST}:${PORT}`);
  console.log(`  Estado: Listo para recibir peticiones de SafeLink`);
  console.log('====================================================');
});
