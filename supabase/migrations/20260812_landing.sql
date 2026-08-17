-- =====================================================
-- MIGRACIÓN: Landing Pública y Panel Sitio Web
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Tabla: Consultas del sitio web
CREATE TABLE IF NOT EXISTS consultas_web (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    servicio TEXT NOT NULL CHECK (servicio IN ('camaras', 'iluminacion', 'redes', 'otro')),
    descripcion TEXT NOT NULL,
    monto_cotizado DECIMAL(12,2),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida')),
    origen TEXT NOT NULL DEFAULT 'sitio_web',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Visitas al sitio público
CREATE TABLE IF NOT EXISTS visitas_web (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: Galería de trabajos realizados
CREATE TABLE IF NOT EXISTS galeria_trabajos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imagen_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEGURIDAD: RLS
-- =====================================================
ALTER TABLE consultas_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas_web ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_trabajos ENABLE ROW LEVEL SECURITY;

-- Acceso total para usuarios autenticados
CREATE POLICY "Admin All ConsultasWeb" ON consultas_web FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All VisitasWeb" ON visitas_web FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All GaleriaTrab" ON galeria_trabajos FOR ALL TO authenticated USING (true);

-- Inserción pública para consultas y visitas
CREATE POLICY "Public Insert ConsultasWeb" ON consultas_web FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public Insert VisitasWeb" ON visitas_web FOR INSERT TO anon WITH CHECK (true);

-- Lectura pública para galería (solo visibles)
CREATE POLICY "Public Read Galeria" ON galeria_trabajos FOR SELECT TO anon USING (visible = true);

-- =====================================================
-- STORAGE BUCKET: galeria-trabajos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'galeria-trabajos',
  'galeria-trabajos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública en el bucket
CREATE POLICY "Public Read Galeria Storage" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'galeria-trabajos');

-- Acceso total del bucket para autenticados
CREATE POLICY "Auth All Galeria Storage" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'galeria-trabajos');

-- =====================================================
-- DETALLE DE VISITANTES: Ampliar visitas_web
-- =====================================================
ALTER TABLE visitas_web ADD COLUMN IF NOT EXISTS dispositivo TEXT;
ALTER TABLE visitas_web ADD COLUMN IF NOT EXISTS zona TEXT;

