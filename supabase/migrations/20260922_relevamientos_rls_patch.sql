-- ================================================================
-- PARCHE: Corrige RLS de relevamientos para permitir acceso
-- a usuarios autenticados y anónimos (uso interno del equipo)
-- Ejecutar en Supabase SQL Editor
-- ================================================================

ALTER TABLE public.relevamientos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "relevamientos_select" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_insert" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_update" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_delete" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_all_access" ON public.relevamientos;
DROP POLICY IF EXISTS "Admin All Relevamientos" ON public.relevamientos;
DROP POLICY IF EXISTS "Anon All Relevamientos" ON public.relevamientos;

-- Políticas de acceso completo para authenticated y anon
CREATE POLICY "Admin All Relevamientos"
  ON public.relevamientos FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon All Relevamientos"
  ON public.relevamientos FOR ALL
  TO anon USING (true) WITH CHECK (true);
