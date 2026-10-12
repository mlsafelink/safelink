-- =====================================================
-- SafeLink Vibe — Migración inicial del módulo de contenido publicitario
-- Archivo: 20261012_safelink_vibe.sql
-- Convenciones: mismas que el resto del proyecto SafeLink
--   - UUIDs con gen_random_uuid()
--   - updated_at con trigger reutilizando update_updated_at_column()
--   - RLS habilitado en todas las tablas
--   - Sin datos de prueba ni datos hardcodeados
-- =====================================================

-- =====================================================
-- FUNCIÓN update_updated_at_column (crear si no existe)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABLA: vibe_projects
-- Almacena proyectos de contenido publicitario
-- Nunca guarda binarios: usa URLs de Storage
-- =====================================================
CREATE TABLE IF NOT EXISTS vibe_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description     TEXT,
  format          TEXT NOT NULL CHECK (
                    format IN (
                      'video_16_9',   -- Video horizontal (YouTube, web)
                      'video_9_16',   -- Video vertical (Reels, TikTok)
                      'image_1_1',    -- Imagen cuadrada (Instagram feed)
                      'image_4_5',    -- Imagen vertical (Instagram feed)
                      'image_16_9',   -- Imagen horizontal (banner)
                      'story_9_16',   -- Historia vertical
                      'carousel',     -- Carrusel de imágenes
                      'reel'          -- Reel (alias de video_9_16 con duración corta)
                    )
                  ),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (
                    status IN ('draft', 'in_progress', 'completed', 'archived')
                  ),
  thumbnail_url   TEXT,         -- URL en Supabase Storage (nunca datos binarios)
  project_data    JSONB NOT NULL DEFAULT '{}',
  -- project_data contiene: { prompt, voiceoverScript, scenes, brandingSnapshot, aspectRatio, resolution }
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_vibe_projects_user_id
  ON vibe_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_projects_user_status
  ON vibe_projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vibe_projects_format
  ON vibe_projects(format);
CREATE INDEX IF NOT EXISTS idx_vibe_projects_created_at
  ON vibe_projects(created_at DESC);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS set_vibe_projects_updated_at ON vibe_projects;
CREATE TRIGGER set_vibe_projects_updated_at
  BEFORE UPDATE ON vibe_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: vibe_generation_jobs
-- Registra trabajos de generación IA (video, TTS, script)
-- Diseñada para operaciones asíncronas con polling
-- =====================================================
CREATE TABLE IF NOT EXISTS vibe_generation_jobs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES vibe_projects(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo y proveedor
  job_type             TEXT NOT NULL CHECK (
                         job_type IN ('video', 'tts', 'script', 'image')
                       ),
  provider             TEXT NOT NULL DEFAULT 'google_ai',
  provider_model       TEXT,           -- Nombre exacto del modelo en el proveedor
  provider_operation   TEXT,           -- ID de operación devuelto por el proveedor (para polling)

  -- Estados del ciclo de vida
  status               TEXT NOT NULL DEFAULT 'queued' CHECK (
                         status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')
                       ),

  -- Datos de entrada y salida
  input_data           JSONB NOT NULL DEFAULT '{}',
  -- input_data: { prompt, aspectRatio, resolution, text, voiceName, etc. }
  output_url           TEXT,           -- URL en Supabase Storage cuando status='completed'
  output_metadata      JSONB DEFAULT '{}',
  -- output_metadata: { durationSec, mimeType, sizeBytes, width, height, sampleRate }

  -- Control de errores
  error_message        TEXT,
  error_code           TEXT,

  -- Control de reintentos
  attempt_count        INTEGER DEFAULT 0,
  max_attempts         INTEGER DEFAULT 3,

  -- Timestamps de ciclo de vida
  started_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,    -- Cuándo expira la operación en el proveedor

  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vibe_jobs_project_id
  ON vibe_generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_vibe_jobs_user_id
  ON vibe_generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_jobs_status
  ON vibe_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vibe_jobs_user_status
  ON vibe_generation_jobs(user_id, status);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS set_vibe_generation_jobs_updated_at ON vibe_generation_jobs;
CREATE TRIGGER set_vibe_generation_jobs_updated_at
  BEFORE UPDATE ON vibe_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: vibe_brand_config
-- Configuración de marca de SafeLink para Vibe
-- Un registro por usuario (UNIQUE en user_id)
-- =====================================================
CREATE TABLE IF NOT EXISTS vibe_brand_config (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identidad del negocio
  business_name         TEXT NOT NULL DEFAULT 'SafeLink',
  description           TEXT,
  services              TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Contacto
  phone                 TEXT,
  whatsapp              TEXT,
  email                 TEXT,
  instagram_handle      TEXT,
  website_url           TEXT,

  -- Visual
  logo_url              TEXT,           -- URL en Supabase Storage
  brand_color           TEXT DEFAULT '#3b82f6',
  accent_color          TEXT DEFAULT '#8b5cf6',

  -- Comunicación
  communication_style   TEXT DEFAULT 'profesional' CHECK (
                          communication_style IN ('profesional', 'cercano', 'urgente', 'informativo')
                        ),
  cta_options           TEXT[] DEFAULT ARRAY[]::TEXT[],

  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id)
);

DROP TRIGGER IF EXISTS set_vibe_brand_config_updated_at ON vibe_brand_config;
CREATE TRIGGER set_vibe_brand_config_updated_at
  BEFORE UPDATE ON vibe_brand_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY — vibe_projects
-- =====================================================
ALTER TABLE vibe_projects ENABLE ROW LEVEL SECURITY;

-- SELECT: solo los propios proyectos
CREATE POLICY "vibe_projects_select_own"
  ON vibe_projects FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: solo con user_id propio
CREATE POLICY "vibe_projects_insert_own"
  ON vibe_projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: solo proyectos propios
CREATE POLICY "vibe_projects_update_own"
  ON vibe_projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: solo proyectos propios
CREATE POLICY "vibe_projects_delete_own"
  ON vibe_projects FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- ROW LEVEL SECURITY — vibe_generation_jobs
-- =====================================================
ALTER TABLE vibe_generation_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: solo los propios jobs
CREATE POLICY "vibe_jobs_select_own"
  ON vibe_generation_jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- INSERT: solo con user_id propio
CREATE POLICY "vibe_jobs_insert_own"
  ON vibe_generation_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: solo el backend con service_role puede cambiar el status
-- El cliente solo puede cancelar su propio job (status → 'cancelled')
CREATE POLICY "vibe_jobs_cancel_own"
  ON vibe_generation_jobs FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status IN ('queued', 'processing'))
  WITH CHECK (status = 'cancelled');

-- DELETE: no permitido (auditoría)
CREATE POLICY "vibe_jobs_no_delete"
  ON vibe_generation_jobs FOR DELETE TO authenticated
  USING (false);

-- =====================================================
-- ROW LEVEL SECURITY — vibe_brand_config
-- =====================================================
ALTER TABLE vibe_brand_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vibe_brand_all_own"
  ON vibe_brand_config FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- SUPABASE STORAGE — bucket vibe-media
-- Ejecutar manualmente en Supabase SQL Editor UNA SOLA VEZ
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'vibe-media',
--   'vibe-media',
--   false,
--   209715200,
--   ARRAY['video/mp4', 'audio/wav', 'audio/mpeg', 'image/jpeg', 'image/png', 'image/webp']
-- ) ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "vibe_storage_select_own" ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "vibe_storage_insert_own" ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "vibe_storage_delete_own" ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'vibe-media' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "vibe_storage_service_all" ON storage.objects FOR ALL TO service_role
--   USING (bucket_id = 'vibe-media');
