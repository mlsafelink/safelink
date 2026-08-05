-- =====================================================
-- CENTRO DE CONFIGURACIÓN — Tabla configuracion
-- Copiar y ejecutar en Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  tema VARCHAR(50) DEFAULT 'oscuro',
  color_principal VARCHAR(50) DEFAULT 'purpura',
  mostrar_animaciones BOOLEAN DEFAULT true,
  modo_dashboard VARCHAR(50) DEFAULT 'confortable',
  tipografia VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DROP POLICY IF EXISTS "Admin All Configuracion" ON configuracion;
DROP POLICY IF EXISTS "Anon Select Configuracion" ON configuracion;
DROP POLICY IF EXISTS "Anon Insert Configuracion" ON configuracion;
DROP POLICY IF EXISTS "Anon Update Configuracion" ON configuracion;

CREATE POLICY "Admin All Configuracion" ON configuracion FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon Select Configuracion" ON configuracion FOR SELECT TO anon USING (true);
CREATE POLICY "Anon Insert Configuracion" ON configuracion FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon Update Configuracion" ON configuracion FOR UPDATE TO anon USING (true) WITH CHECK (true);
