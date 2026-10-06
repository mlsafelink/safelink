-- =====================================================
-- SAFELINK — Agregar columna 'codigo' a tabla reportes
-- Ejecutar en Supabase SQL Editor:
--   https://supabase.com/dashboard/project/aieqlypuyrgeticrshzg/sql
-- =====================================================

-- 1. Agregar la columna 'codigo' si no existe
ALTER TABLE public.reportes 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(30);

-- 2. Crear índice para optimizar búsquedas y ordenamientos por código
CREATE INDEX IF NOT EXISTS idx_reportes_codigo ON public.reportes(codigo);

-- 3. Asignar código correlativo a reportes históricos que no lo tengan
DO $$
DECLARE
  r RECORD;
  i INTEGER := 1;
BEGIN
  FOR r IN 
    SELECT id, created_at 
    FROM public.reportes 
    WHERE codigo IS NULL 
    ORDER BY created_at ASC 
  LOOP
    UPDATE public.reportes
    SET codigo = 'RT-' || TO_CHAR(r.created_at, 'YYYYMMDD') || '-' || LPAD(i::text, 4, '0')
    WHERE id = r.id;
    i := i + 1;
  END LOOP;
END $$;
