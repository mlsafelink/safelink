// =====================================================
// SafeLink Vibe — Capa de abstracción de la API de generación
// 
// Esta capa define el contrato del backend de IA.
// En Fase 1 todas las operaciones de IA devuelven 'not_implemented'.
// En Fase 2 se conecta el servidor Express sin modificar esta interfaz.
// 
// NUNCA incluir GEMINI_API_KEY ni ninguna clave privada aquí.
// =====================================================
import type { ApiResult, VibeGenerationJob, JobType } from '../types';
import { supabase } from '@/lib/supabase';

/** URL base del servidor de generación multimedia (Fase 2) */
export const VIBE_API_URL = (import.meta.env.VITE_VIBE_API_URL as string) || 'http://localhost:3001';

/** Helper para obtener los headers con token JWT del usuario */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

/** Comprueba si el servidor de generación está activo y respondiendo */
export async function checkVibeServerHealth(): Promise<{ isOnline: boolean; aiConfigured?: boolean }> {
  try {
    const res = await fetch(`${VIBE_API_URL}/api/health`, { method: 'GET' });
    if (!res.ok) return { isOnline: false };
    const data = await res.json();
    return { isOnline: true, aiConfigured: Boolean(data.aiConfigured) };
  } catch {
    return { isOnline: false };
  }
}

/** Estado de disponibilidad del backend */
export function isVibeApiAvailable(): boolean {
  return true;
}

// =====================================================
// Generación de guión con IA
// Backend: POST /api/generate-script
// Fase 1: No implementado
// =====================================================
export interface GenerateScriptInput {
  services: string[];
  tone: string;
  durationSeconds: number;
}

export interface GenerateScriptOutput {
  title: string;
  headline?: string;
  voiceoverScript: string;
  ctaText: string;
  veoPrompt: string;
  scenes: Array<{
    time: string;
    title: string;
    visualDescription: string;
    audioLine: string;
    icon: string;
  }>;
  marketingTips: string[];
}

export async function generateScript(
  input: GenerateScriptInput
): Promise<ApiResult<GenerateScriptOutput>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${VIBE_API_URL}/api/generate-script`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        service: input.services[0] || 'Seguridad y Conectividad',
        tone: input.tone,
        durationSeconds: input.durationSeconds,
      }),
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      return { ok: false, error: json.error || 'Error al generar guión con IA', code: String(response.status) };
    }

    return { ok: true, data: json.data as GenerateScriptOutput };
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor de generación (puerto 3001).', code: 'NETWORK_ERROR' };
  }
}

// =====================================================
// Inicio de generación de video (Veo 3)
// Backend: POST /api/generate-video → { operationName, jobId }
// =====================================================
export interface GenerateVideoInput {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  projectId?: string;
}

export async function startVideoGeneration(
  input: GenerateVideoInput
): Promise<ApiResult<{ operationName: string; jobId?: string }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${VIBE_API_URL}/api/generate-video`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      return { ok: false, error: json.error || 'Error al iniciar generación de video', code: String(response.status) };
    }

    return { ok: true, data: json.data as { operationName: string; jobId?: string } };
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor de generación.', code: 'NETWORK_ERROR' };
  }
}

// =====================================================
// Polling del estado de una operación de video
// Backend: POST /api/video-status → { done, error, name }
// =====================================================
export async function pollVideoStatus(
  operationName: string
): Promise<ApiResult<{ done: boolean; error: unknown; name: string }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${VIBE_API_URL}/api/video-status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ operationName }),
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      return { ok: false, error: json.error || 'Error al consultar estado', code: String(response.status) };
    }

    return { ok: true, data: json.data as { done: boolean; error: unknown; name: string } };
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor.', code: 'NETWORK_ERROR' };
  }
}

// =====================================================
// Generación de voz en off (TTS)
// Backend: POST /api/generate-tts → { audioBase64, mimeType, voice }
// =====================================================
export interface GenerateTtsInput {
  text: string;
  voiceName?: string;
  style?: string;
}

export async function generateTts(
  input: GenerateTtsInput
): Promise<ApiResult<{ audioBase64: string; mimeType: string; voice: string }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${VIBE_API_URL}/api/generate-tts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: input.text,
        voice: input.voiceName || 'Fenrir',
      }),
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      return { ok: false, error: json.error || 'Error al generar audio', code: String(response.status) };
    }

    return { ok: true, data: json.data as { audioBase64: string; mimeType: string; voice: string } };
  } catch (err) {
    return { ok: false, error: 'No se pudo conectar con el servidor.', code: 'NETWORK_ERROR' };
  }
}

// =====================================================
// Verificación de salud del backend
// Backend: GET /api/health
// =====================================================
export interface VibeApiHealth {
  status: 'ok' | 'error';
  hasApiKey: boolean;
  supportedModels: {
    video: string;
    tts: string;
    script: string;
  };
}

export async function checkApiHealth(): Promise<ApiResult<VibeApiHealth>> {
  if (!isVibeApiAvailable()) {
    return {
      ok: false,
      error: 'El servidor de generación no está configurado en esta instalación.',
      code: 'NOT_CONFIGURED',
    };
  }

  try {
    const response = await fetch(`${VIBE_API_URL}/api/health`);

    if (!response.ok) {
      return { ok: false, error: 'El servidor no respondió correctamente.', code: String(response.status) };
    }

    const data = await response.json() as VibeApiHealth;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor de generación.', code: 'NETWORK_ERROR' };
  }
}

/** Tipos de job sin uso de IA (preparado para Fase 2) */
export type { VibeGenerationJob, JobType };
