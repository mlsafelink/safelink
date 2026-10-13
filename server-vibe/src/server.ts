import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { aiRouter } from './routes/aiRoutes.js';

const app = express();

// CORS habilitado para el frontend de SafeLink
// En desarrollo se acepta cualquier puerto localhost (Vite puede variar: 5173, 5174, 5175...)
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Permitir requests sin origin (curl, Postman, server-to-server)
  if (!origin) return callback(null, true);
  // Permitir cualquier localhost o 127.0.0.1 en cualquier puerto
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
  // Permitir el frontendUrl configurado (producción)
  if (origin === config.frontendUrl) return callback(null, true);
  callback(new Error(`CORS: origen no permitido → ${origin}`));
};

app.use(cors({
  origin: corsOrigin,
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
