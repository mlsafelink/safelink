// =====================================================
// SafeLink Vibe — Tipos principales del módulo
// =====================================================
import type { ContentFormat } from '../constants/formats';

// --- Proyectos ---

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export interface ProjectStats {
  total: number;
  drafts: number;
  inProgress: number;
  completed: number;
  archived: number;
}

export interface VibeProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  format: ContentFormat;
  status: ProjectStatus;
  thumbnail_url: string | null;
  project_data: VibeProjectData;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface VibeProjectData {
  prompt?: string;
  voiceoverScript?: string;
  scenes?: VibeScene[];
  brandingSnapshot?: Partial<VibeBrandConfig>;
  aspectRatio?: string;
  resolution?: '720p' | '1080p';
  /** Referencia al último job completado */
  latestVideoJobId?: string;
  latestAudioJobId?: string;
}

export interface VibeScene {
  id: string;
  order: number;
  title: string;
  visualDescription: string;
  audioLine: string;
  durationSec: number;
}

// --- Configuración de marca ---

export interface VibeBrandConfig {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  services: string[];
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  logo_url: string | null;
  brand_color: string;
  accent_color: string;
  communication_style: 'profesional' | 'cercano' | 'urgente' | 'informativo';
  cta_options: string[];
  created_at: string;
  updated_at: string;
}

/** Datos que el usuario puede editar (sin campos de sistema) */
export type VibeBrandConfigInput = Omit<VibeBrandConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// --- Trabajos de generación ---

export type JobType = 'video' | 'tts' | 'script' | 'image';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface VibeGenerationJob {
  id: string;
  project_id: string;
  user_id: string;
  job_type: JobType;
  provider: string;
  provider_model: string | null;
  provider_operation: string | null;
  status: JobStatus;
  input_data: JobInputData;
  output_url: string | null;
  output_metadata: JobOutputMetadata;
  error_message: string | null;
  error_code: string | null;
  attempt_count: number;
  max_attempts: number;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobInputData {
  prompt?: string;
  aspectRatio?: string;
  resolution?: string;
  text?: string;
  voiceName?: string;
  style?: string;
  services?: string[];
  tone?: string;
  durationSeconds?: number;
  [key: string]: unknown;
}

export interface JobOutputMetadata {
  durationSec?: number;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  sampleRate?: number;
  [key: string]: unknown;
}

// --- Respuestas de la API ---

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Capacidades del módulo Vibe en esta fase */
export interface VibeCapabilities {
  /** Gestión de proyectos (crear, editar, eliminar) */
  projects: 'available';
  /** Configuración de marca */
  brand: 'available';
  /** Biblioteca de recursos multimedia */
  library: 'available';
  /** Generación de video con Veo */
  videoGeneration: 'pending';
  /** Generación de voz en off */
  ttsGeneration: 'pending';
  /** Generación de guión con IA */
  scriptGeneration: 'pending';
  /** Integración con Instagram API */
  instagram: 'pending';
  /** Exportación de contenido */
  export: 'pending';
  /** Campañas publicitarias multiformato */
  campaigns: 'available';
}

export const VIBE_CAPABILITIES: VibeCapabilities = {
  projects: 'available',
  brand: 'available',
  library: 'available',
  campaigns: 'available',
  videoGeneration: 'pending',
  ttsGeneration: 'pending',
  scriptGeneration: 'pending',
  instagram: 'pending',
  export: 'pending',
};

export * from './campaigns';

