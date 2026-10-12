import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  generateScriptWithAI,
  startVeoVideo,
  checkVeoStatus,
  generateTTSAudio,
} from '../services/geminiService.js';
import { ai } from '../config.js';

export const aiRouter = Router();

// Health check
aiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Generar guión publicitario estructurado con Gemini
aiRouter.post('/generate-script', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { service, tone, objective, durationSeconds, businessName } = req.body;

    if (!service) {
      return res.status(400).json({ ok: false, error: 'El campo "service" es obligatorio.' });
    }

    const script = await generateScriptWithAI({
      service,
      tone: tone || 'profesional',
      objective: objective || 'captación de clientes',
      durationSeconds: Number(durationSeconds) || 15,
      businessName,
    });

    res.json({ ok: true, data: script });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al generar guión con IA';
    res.status(500).json({ ok: false, error: message });
  }
});

// Generar voz en off neuronal (TTS)
aiRouter.post('/generate-tts', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { text, voice } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: 'El campo "text" es obligatorio.' });
    }

    const audio = await generateTTSAudio(text, voice || 'Fenrir');
    res.json({ ok: true, data: audio });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al generar audio TTS';
    res.status(500).json({ ok: false, error: message });
  }
});

// Iniciar generación de video con Google Veo
aiRouter.post('/generate-video', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, aspectRatio, resolution, projectId } = req.body;

    if (!prompt) {
      return res.status(400).json({ ok: false, error: 'El prompt es obligatorio.' });
    }

    const result = await startVeoVideo({
      prompt,
      aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
      resolution: resolution === '1080p' ? '1080p' : '720p',
      userId: req.userId || 'anonymous',
      projectId,
    });

    res.json({ ok: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al iniciar generación de video';
    res.status(500).json({ ok: false, error: message });
  }
});

// Consultar estado de video Veo
aiRouter.post('/video-status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { operationName } = req.body;

    if (!operationName) {
      return res.status(400).json({ ok: false, error: 'operationName es obligatorio.' });
    }

    const status = await checkVeoStatus(operationName);
    res.json({ ok: true, data: status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar estado de video';
    res.status(500).json({ ok: false, error: message });
  }
});
