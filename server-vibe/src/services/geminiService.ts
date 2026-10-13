import { ai, supabaseAdmin, config } from '../config.js';

export interface ScriptPromptInput {
  service: string;
  tone: string;
  objective: string;
  durationSeconds?: number;
  businessName?: string;
}

export interface GeneratedScript {
  title: string;
  headline: string;
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

export async function generateScriptWithAI(input: ScriptPromptInput): Promise<GeneratedScript> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY no está configurada en el servidor.');
  }

  const duration = input.durationSeconds || 15;
  const business = input.businessName || 'SafeLink';

  const systemInstruction = `
Sos el director creativo publicitario de "${business}".
Especialidad del negocio: Seguridad electrónica, videovigilancia profesional, infraestructura de redes y cableado estructurado, e iluminación para consorcios y empresas.
NO inventes precios, certificaciones falsas, promociones engañosas ni garantías que no sean factuales.
El tono debe ser: "${input.tone}".
El objetivo de la pieza es: "${input.objective}".
El servicio principal es: "${input.service}".
La duración objetivo de la pieza es de ${duration} segundos.
Generá un guión publicitario dinámico y persuasivo en formato JSON estricto.
`;

  const prompt = `
Generá una pieza publicitaria para Instagram / TikTok / Redes sobre: ${input.service}.
Devolvé un JSON con esta estructura exacta:
{
  "title": "Nombre corto de la campaña",
  "headline": "Gancho o titular principal de alto impacto",
  "voiceoverScript": "Guión continuo de locución de ${duration} segundos",
  "ctaText": "Llamada a la acción clara",
  "veoPrompt": "Prompt cinematográfico y detallado en inglés para generar video con Google Veo",
  "scenes": [
    {
      "time": "0:00 - 0:05",
      "title": "Apertura / Gancho",
      "visualDescription": "Descripción visual de la escena",
      "audioLine": "Frase que se escucha",
      "icon": "Camera"
    }
  ],
  "marketingTips": ["Consejo 1 para publicar", "Consejo 2"]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('La respuesta de Gemini fue vacía.');
  }

  return JSON.parse(text) as GeneratedScript;
}

export interface VideoGenerationInput {
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  userId: string;
  projectId?: string;
}

export async function startVeoVideo(input: VideoGenerationInput): Promise<{ operationName: string; jobId?: string }> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY no está configurada en el servidor.');
  }

  // Iniciar operación con Veo (nueva API: prompt va dentro de source)
  const operation = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    source: {
      prompt: input.prompt,
    },
    config: {
      aspectRatio: input.aspectRatio,
      numberOfVideos: 1,
    },
  });

  const operationName = operation.name ?? '';

  // Registrar el trabajo en vibe_generation_jobs en Supabase si está disponible
  let jobId: string | undefined;
  if (supabaseAdmin && input.userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('vibe_generation_jobs')
        .insert({
          user_id: input.userId,
          project_id: input.projectId || null,
          job_type: 'video',
          provider: 'google-veo',
          provider_model: 'veo-2.0-generate-001',
          provider_operation: operationName,
          status: 'processing',
          input_data: {
            prompt: input.prompt,
            aspectRatio: input.aspectRatio,
            resolution: input.resolution,
          },
        })
        .select('id')
        .single();

      if (!error && data) {
        jobId = data.id;
      }
    } catch (e) {
      console.warn('No se pudo registrar job en Supabase:', e);
    }
  }

  return { operationName, jobId };
}

export async function checkVeoStatus(operationName: string) {
  if (!ai) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  const updatedOperation = await ai.operations.getVideosOperation({
    operation: { name: operationName } as any,
  });

  return {
    done: Boolean(updatedOperation.done),
    error: updatedOperation.error,
    name: updatedOperation.name,
    metadata: updatedOperation.metadata,
  };
}

export async function generateTTSAudio(text: string, voiceName: string = 'Fenrir') {
  if (!ai) {
    throw new Error('GEMINI_API_KEY no está configurada.');
  }

  // Generación con Gemini Audio
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-live-001',
    contents: `Lee el siguiente texto publicitario con entonación profesional y natural: "${text}"`,
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  });

  const candidates = response.candidates;
  const parts = candidates?.[0]?.content?.parts;
  const audioPart = parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('audio/'));

  if (!audioPart || !audioPart.inlineData) {
    throw new Error('No se generó pista de audio.');
  }

  return {
    audioBase64: audioPart.inlineData.data,
    mimeType: audioPart.inlineData.mimeType,
    voice: voiceName,
  };
}
