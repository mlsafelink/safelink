-- =====================================================
-- SAFELINK — FIX RLS Topologías para acceso anon
-- Permite que la app (sin Supabase Auth) guarde y lea topologías.
-- Ejecutar en Supabase SQL Editor:
--   https://supabase.com/dashboard/project/aieqlypuyrgeticrshzg/sql
-- =====================================================

-- 1. Permitir que anon pueda INSERTAR nuevas topologías
DROP POLICY IF EXISTS "Anon Insert Infra Topologies" ON public.infrastructure_topologies;
CREATE POLICY "Anon Insert Infra Topologies"
  ON public.infrastructure_topologies FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. Permitir que anon pueda ACTUALIZAR topologías existentes (upsert)
DROP POLICY IF EXISTS "Anon Update Infra Topologies" ON public.infrastructure_topologies;
CREATE POLICY "Anon Update Infra Topologies"
  ON public.infrastructure_topologies FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- 3. Asegurar que la lectura pública funciona (ya debería existir)
DROP POLICY IF EXISTS "Public Read Infra Topologies by public_id" ON public.infrastructure_topologies;
CREATE POLICY "Public Read Infra Topologies by public_id"
  ON public.infrastructure_topologies FOR SELECT
  TO anon
  USING (deleted_at IS NULL);

-- Verificación: listar políticas activas de la tabla
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'infrastructure_topologies';
