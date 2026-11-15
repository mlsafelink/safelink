-- =====================================================
-- SAFELINK — APARIENCIA DE DOCUMENTOS: PRESETS Y MEJORAS
-- Migración para guardar configuraciones con nombre
-- =====================================================

-- Añadir columna de nombre y presets a configuracion_documentos si no existen
ALTER TABLE configuracion_documentos 
  ADD COLUMN IF NOT EXISTS nombre VARCHAR(100) DEFAULT 'SafeLink Predeterminado',
  ADD COLUMN IF NOT EXISTS es_preset BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS es_activa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banner_tamano_porcentaje INTEGER DEFAULT 100;

-- Tabla dedicada para presets guardados de apariencia (por si se prefiere separar o tener histórico)
CREATE TABLE IF NOT EXISTS apariencia_documentos_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL,
  config JSONB NOT NULL,
  es_sistema BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE apariencia_documentos_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon Select Presets" ON apariencia_documentos_presets;
DROP POLICY IF EXISTS "Anon Insert Presets" ON apariencia_documentos_presets;
DROP POLICY IF EXISTS "Anon Update Presets" ON apariencia_documentos_presets;
DROP POLICY IF EXISTS "Anon Delete Presets" ON apariencia_documentos_presets;

CREATE POLICY "Anon Select Presets" ON apariencia_documentos_presets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon Insert Presets" ON apariencia_documentos_presets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anon Update Presets" ON apariencia_documentos_presets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon Delete Presets" ON apariencia_documentos_presets FOR DELETE TO anon, authenticated USING (true);

