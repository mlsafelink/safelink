import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { aiRouter } from './routes/aiRoutes.js';

const app = express();

// CORS habilitado para el frontend de SafeLink
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apikey'],
}));

app.use(express.json({ limit: '10mb' }));

// Rutas de API multimedia
app.use('/api', aiRouter);

// Manejo de errores global
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  res.status(500).json({ ok: false, error: message });
});

app.listen(config.port, () => {
  console.log(`[SafeLink Vibe Server] Escuchando en http://localhost:${config.port}`);
  console.log(`[SafeLink Vibe Server] CORS habilitado para ${config.frontendUrl}`);
});
