# 📡 SafeLink Monitor Agent (Windows — v0.1 Laboratorio)

Servidor local ejecutable para **SafeLink Cloud** que realiza comprobaciones reales de red (ICMP PING) en Windows.

---

## 🚀 Cómo ejecutar el Agente en Windows

### Paso 1: Abrir la terminal de PowerShell o CMD en la carpeta `agent/`

```bash
cd agent
```

### Paso 2: Iniciar el servidor del Agente

```bash
node server.mjs
```

O si preferís:

```bash
npm start
```

Verás una salida confirmatoria en la terminal:

```
====================================================
  📡 SafeLink Monitor Agent v0.1 (Windows)
====================================================
  Servidor iniciado en: http://127.0.0.1:8787
  Estado: Listo para recibir peticiones de SafeLink
====================================================
```

---

## 🌐 Endpoints REST expuestos (`http://127.0.0.1:8787`)

- **`GET /api/status`**: Comprueba la conexión y salud del agente.
- **`POST /api/monitor/start`**: Inicia el loop de pings con `{ ip, intervalSeconds, consecutiveFailsThreshold }`.
- **`POST /api/monitor/stop`**: Detiene el monitoreo del dispositivo.
- **`GET /api/monitor/results`**: Retorna el estado en tiempo real (latencia ms, 3-fallos status, historial de 100 pings y log de eventos).
