-- =====================================================
-- SAFELINK — INFRAESTRUCTURA TÉCNICA (ITM)
-- Migración de Tablas, RLS y Storage
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ── 1. Tabla de Planos de Infraestructura ───────────────────────
CREATE TABLE IF NOT EXISTS public.infrastructure_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id    UUID REFERENCES public.consorcios(id) ON DELETE SET NULL,
  particular_id   UUID REFERENCES public.particulares(id) ON DELETE SET NULL,
  public_id       UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'redes' CHECK (tipo IN ('redes', 'camaras', 'mixto')),
  archivo_url     TEXT NOT NULL,
  archivo_tipo    TEXT NOT NULL DEFAULT 'pdf' CHECK (archivo_tipo IN ('pdf', 'imagen')),
  archivo_nombre  TEXT,
  descripcion     TEXT,
  ancho_px        INTEGER,
  alto_px         INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_infra_plans_consorcio ON public.infrastructure_plans(consorcio_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_particular ON public.infrastructure_plans(particular_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_public_id ON public.infrastructure_plans(public_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_tipo ON public.infrastructure_plans(tipo);

-- ── 2. Tabla de Elementos Técnicos sobre el Plano ───────────────
CREATE TABLE IF NOT EXISTS public.infrastructure_elements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES public.infrastructure_plans(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL CHECK (tipo IN ('switch', 'boca', 'ap', 'dvr', 'camara')),
  codigo            TEXT NOT NULL, -- ej: "SW-01", "P2-09", "CAM-01"
  nombre            TEXT NOT NULL,
  pos_x             NUMERIC NOT NULL DEFAULT 50, -- 0% a 100%
  pos_y             NUMERIC NOT NULL DEFAULT 50, -- 0% a 100%
  parent_element_id UUID REFERENCES public.infrastructure_elements(id) ON DELETE SET NULL,
  puerto_canal      TEXT, -- ej: "09" o "CH01"
  estado            TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'mantenimiento', 'planificado')),
  propiedades       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de elementos
CREATE INDEX IF NOT EXISTS idx_infra_elements_plan ON public.infrastructure_elements(plan_id);
CREATE INDEX IF NOT EXISTS idx_infra_elements_parent ON public.infrastructure_elements(parent_element_id);
CREATE INDEX IF NOT EXISTS idx_infra_elements_tipo ON public.infrastructure_elements(tipo);

-- ── 3. Row Level Security (RLS) ─────────────────────────────────
ALTER TABLE public.infrastructure_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_elements ENABLE ROW LEVEL SECURITY;

-- Acceso total a usuarios administradores autenticados
DROP POLICY IF EXISTS "Admin All Infra Plans" ON public.infrastructure_plans;
CREATE POLICY "Admin All Infra Plans"
  ON public.infrastructure_plans FOR ALL
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Admin All Infra Elements" ON public.infrastructure_elements;
CREATE POLICY "Admin All Infra Elements"
  ON public.infrastructure_elements FOR ALL
  TO authenticated
  USING (true);

-- Acceso público de SOLO LECTURA para enlaces de clientes (public_id)
DROP POLICY IF EXISTS "Public Read Infra Plan by public_id" ON public.infrastructure_plans;
CREATE POLICY "Public Read Infra Plan by public_id"
  ON public.infrastructure_plans FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Public Read Infra Elements for Active Plans" ON public.infrastructure_elements;
CREATE POLICY "Public Read Infra Elements for Active Plans"
  ON public.infrastructure_elements FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.infrastructure_plans p
      WHERE p.id = infrastructure_elements.plan_id
      AND p.deleted_at IS NULL
    )
  );

-- ── 4. Bucket de Storage para Planos PDF / Imágenes ───────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'infrastructure-plans',
  'infrastructure-plans',
  true,
  31457280, -- 30 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Infra Plans Storage" ON storage.objects;
CREATE POLICY "Public Read Infra Plans Storage"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'infrastructure-plans');

DROP POLICY IF EXISTS "Auth All Infra Plans Storage" ON storage.objects;
CREATE POLICY "Auth All Infra Plans Storage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'infrastructure-plans');
