-- =====================================================
-- FIX RLS: Permisos e Inserción para reportes_trabajo
-- Copiar y ejecutar en Supabase SQL Editor
-- =====================================================

ALTER TABLE reportes_trabajo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin All ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Public Read ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Anon Insert ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Anon Update ReportesTrabajo" ON reportes_trabajo;

CREATE POLICY "Admin All ReportesTrabajo" ON reportes_trabajo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Read ReportesTrabajo" ON reportes_trabajo FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "Anon Insert ReportesTrabajo" ON reportes_trabajo FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon Update ReportesTrabajo" ON reportes_trabajo FOR UPDATE TO anon USING (true) WITH CHECK (true);
