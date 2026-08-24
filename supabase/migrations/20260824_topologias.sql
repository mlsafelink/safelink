-- =====================================================
-- SAFELINK — INFRAESTRUCTURA TÉCNICA Y TOPOLOGÍAS (ITM)
-- Migración Completa: Planos, Elementos y Topologías de Red
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- ── 1. Tabla de Planos de Infraestructura ───────────────────────
CREATE TABLE IF NOT EXISTS public.infrastructure_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consorcio_id    UUID REFERENCES public.consorcios(id) ON DELETE SET NULL,
  particular_id   UUID REFERENCES public.consorcios(id) ON DELETE SET NULL,
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

-- Índices de Planos
CREATE INDEX IF NOT EXISTS idx_infra_plans_consorcio ON public.infrastructure_plans(consorcio_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_particular ON public.infrastructure_plans(particular_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_public_id ON public.infrastructure_plans(public_id);
CREATE INDEX IF NOT EXISTS idx_infra_plans_tipo ON public.infrastructure_plans(tipo);

-- ── 2. Tabla de Elementos Técnicos sobre el Plano ───────────────
CREATE TABLE IF NOT EXISTS public.infrastructure_elements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES public.infrastructure_plans(id) ON DELETE CASCADE,
  tipo              TEXT NOT NULL,
  codigo            TEXT NOT NULL,
  nombre            TEXT NOT NULL,
  pos_x             NUMERIC NOT NULL DEFAULT 50,
  pos_y             NUMERIC NOT NULL DEFAULT 50,
  parent_element_id UUID REFERENCES public.infrastructure_elements(id) ON DELETE SET NULL,
  puerto_canal      TEXT,
  estado            TEXT NOT NULL DEFAULT 'activo',
  propiedades       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de Elementos
CREATE INDEX IF NOT EXISTS idx_infra_elements_plan ON public.infrastructure_elements(plan_id);
CREATE INDEX IF NOT EXISTS idx_infra_elements_parent ON public.infrastructure_elements(parent_element_id);
CREATE INDEX IF NOT EXISTS idx_infra_elements_tipo ON public.infrastructure_elements(tipo);

-- ── 3. Tabla de Topologías de Red ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.infrastructure_topologies (
  id              TEXT PRIMARY KEY,
  plan_id         UUID REFERENCES public.infrastructure_plans(id) ON DELETE SET NULL,
  consorcio_id    UUID REFERENCES public.consorcios(id) ON DELETE SET NULL,
  particular_id   UUID REFERENCES public.consorcios(id) ON DELETE SET NULL,
  public_id       UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  tipo            TEXT NOT NULL DEFAULT 'redes',
  nodos           JSONB NOT NULL DEFAULT '[]'::jsonb,
  conexiones      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Índices de Topologías
CREATE INDEX IF NOT EXISTS idx_infra_topologies_consorcio ON public.infrastructure_topologies(consorcio_id);
CREATE INDEX IF NOT EXISTS idx_infra_topologies_particular ON public.infrastructure_topologies(particular_id);
CREATE INDEX IF NOT EXISTS idx_infra_topologies_public_id ON public.infrastructure_topologies(public_id);
CREATE INDEX IF NOT EXISTS idx_infra_topologies_plan_id ON public.infrastructure_topologies(plan_id);

-- ── 4. Row Level Security (RLS) ─────────────────────────────────
ALTER TABLE public.infrastructure_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_topologies ENABLE ROW LEVEL SECURITY;

-- Planos
DROP POLICY IF EXISTS "Admin All Infra Plans" ON public.infrastructure_plans;
CREATE POLICY "Admin All Infra Plans"
  ON public.infrastructure_plans FOR ALL
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Public Read Infra Plan by public_id" ON public.infrastructure_plans;
CREATE POLICY "Public Read Infra Plan by public_id"
  ON public.infrastructure_plans FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Elementos
DROP POLICY IF EXISTS "Admin All Infra Elements" ON public.infrastructure_elements;
CREATE POLICY "Admin All Infra Elements"
  ON public.infrastructure_elements FOR ALL
  TO authenticated
  USING (true);

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

-- Topologías
DROP POLICY IF EXISTS "Admin All Infra Topologies" ON public.infrastructure_topologies;
CREATE POLICY "Admin All Infra Topologies"
  ON public.infrastructure_topologies FOR ALL
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Public Read Infra Topologies by public_id" ON public.infrastructure_topologies;
CREATE POLICY "Public Read Infra Topologies by public_id"
  ON public.infrastructure_topologies FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Consorcios (acceso público de lectura para vista de clientes)
DROP POLICY IF EXISTS "Public Read Consorcios for Topologies" ON public.consorcios;
CREATE POLICY "Public Read Consorcios for Topologies"
  ON public.consorcios FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- ── 5. Storage Bucket para Planos ───────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'infrastructure-plans',
  'infrastructure-plans',
  true,
  31457280,
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
