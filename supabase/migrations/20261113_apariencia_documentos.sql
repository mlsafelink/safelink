-- =====================================================
-- APARIENCIA UNIFICADA DE DOCUMENTOS SAFELINK
-- Migración para personalización visual centralizada
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS configuracion_documentos (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  
  -- Encabezado y Banner
  usar_banner_personalizado BOOLEAN DEFAULT false,
  banner_url TEXT,
  banner_altura INTEGER DEFAULT 200, -- px (120 - 320)
  banner_ajuste VARCHAR(20) DEFAULT 'cover', -- 'cover' | 'contain' | 'fill'
  banner_posicion VARCHAR(20) DEFAULT 'center', -- 'center' | 'top' | 'bottom'
  
  -- Fondo del Documento
  fondo_tipo VARCHAR(20) DEFAULT 'blanco', -- 'blanco' | 'solido' | 'degradado' | 'imagen'
  fondo_color VARCHAR(50) DEFAULT '#ffffff',
  fondo_degradado TEXT DEFAULT 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  fondo_imagen_url TEXT,
  fondo_opacidad INTEGER DEFAULT 100, -- % (10 - 100)
  
  -- Paleta de Colores
  color_primario VARCHAR(50) DEFAULT '#1a365d',
  color_secundario VARCHAR(50) DEFAULT '#2b6cb0',
  color_titulos VARCHAR(50) DEFAULT '#0f172a',
  color_subtitulos VARCHAR(50) DEFAULT '#475569',
  color_textos VARCHAR(50) DEFAULT '#334155',
  color_lineas VARCHAR(50) DEFAULT '#e2e8f0',
  color_destacados VARCHAR(50) DEFAULT '#2563eb',
  
  -- Tipografía
  tipografia_familia VARCHAR(50) DEFAULT 'Inter', -- 'Inter' | 'Roboto' | 'Montserrat' | 'Arial' | 'Helvetica'
  tamano_titulos VARCHAR(20) DEFAULT 'normal', -- 'compacto' | 'normal' | 'grande'
  tamano_cuerpo VARCHAR(20) DEFAULT 'normal', -- 'compacto' | 'normal' | 'grande'
  interlineado VARCHAR(20) DEFAULT 'normal', -- 'normal' | 'relajado'
  
  -- Estructura y Márgenes
  margenes VARCHAR(20) DEFAULT 'normal', -- 'estrecho' | 'normal' | 'amplio'
  espaciado_secciones VARCHAR(20) DEFAULT 'normal', -- 'compacto' | 'normal' | 'amplio'
  
  -- Identidad Corporativa
  mostrar_logo BOOLEAN DEFAULT true,
  logo_tamano VARCHAR(20) DEFAULT 'normal', -- 'pequeno' | 'normal' | 'grande'
  mostrar_eslogan BOOLEAN DEFAULT true,
  pie_pagina_texto TEXT DEFAULT 'SafeLink · Sistemas de Seguridad e Infraestructura',
  mostrar_numeracion BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE configuracion_documentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- Lectura pública (anónima y autenticada) para que los documentos públicos puedan renderizar el diseño
DROP POLICY IF EXISTS "Anon Select Config Documentos" ON configuracion_documentos;
DROP POLICY IF EXISTS "Admin All Config Documentos" ON configuracion_documentos;

CREATE POLICY "Anon Select Config Documentos" 
  ON configuracion_documentos FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY "Admin All Config Documentos" 
  ON configuracion_documentos FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Permitir también INSERT/UPDATE a anon si la autenticación se maneja a nivel de aplicación
CREATE POLICY "Anon Update Config Documentos"
  ON configuracion_documentos FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insertar fila predeterminada única si no existe
INSERT INTO configuracion_documentos (
  id,
  usar_banner_personalizado,
  banner_url,
  banner_altura,
  banner_ajuste,
  banner_posicion,
  fondo_tipo,
  fondo_color,
  color_primario,
  color_secundario,
  color_titulos,
  color_subtitulos,
  color_textos,
  color_lineas,
  color_destacados,
  tipografia_familia,
  tamano_titulos,
  tamano_cuerpo,
  interlineado,
  margenes,
  espaciado_secciones,
  mostrar_logo,
  logo_tamano,
  mostrar_eslogan,
  pie_pagina_texto,
  mostrar_numeracion
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  false,
  '/banner-corporeo.png',
  200,
  'cover',
  'center',
  'blanco',
  '#ffffff',
  '#1a365d',
  '#2b6cb0',
  '#0f172a',
  '#475569',
  '#334155',
  '#e2e8f0',
  '#2563eb',
  'Inter',
  'normal',
  'normal',
  'normal',
  'normal',
  'normal',
  true,
  'normal',
  true,
  'SafeLink · Sistemas de Seguridad e Infraestructura',
  true
)
ON CONFLICT (id) DO NOTHING;

