-- =====================================================
-- SAFELINK — CONFIGURACIÓN DE DATOS BANCARIOS / PAGOS
-- Migración: Columnas en tabla configuracion y políticas RLS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tema VARCHAR(50) DEFAULT 'oscuro',
  color_principal VARCHAR(50) DEFAULT 'purpura',
  mostrar_animaciones BOOLEAN DEFAULT true,
  modo_dashboard VARCHAR(50) DEFAULT 'confortable',
  tipografia VARCHAR(50) DEFAULT 'normal',
  banco TEXT,
  titular_cuenta TEXT,
  numero_cuenta TEXT,
  cbu VARCHAR(30),
  alias TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Si la tabla ya existe, agregar las columnas bancarias
ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS banco TEXT,
  ADD COLUMN IF NOT EXISTS titular_cuenta TEXT,
  ADD COLUMN IF NOT EXISTS numero_cuenta TEXT,
  ADD COLUMN IF NOT EXISTS cbu VARCHAR(30),
  ADD COLUMN IF NOT EXISTS alias TEXT;

-- Habilitar RLS
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Admin All Configuracion" ON public.configuracion;
CREATE POLICY "Admin All Configuracion"
  ON public.configuracion FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon Select Configuracion" ON public.configuracion;
CREATE POLICY "Anon Select Configuracion"
  ON public.configuracion FOR SELECT
  TO anon
  USING (true);
