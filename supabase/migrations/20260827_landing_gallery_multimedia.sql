-- =====================================================
-- MIGRACIÓN: Galería de trabajos multimedia (Fotos + Videos)
-- Tablas: landing_gallery, landing_gallery_media y Bucket: landing-gallery
-- =====================================================

-- 1. Tabla principal de Trabajos
CREATE TABLE IF NOT EXISTS landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('iluminacion', 'redes', 'seguridad')),
    title TEXT NOT NULL,
    caption TEXT,
    description TEXT,
    image_path TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que la columna caption exista si la tabla ya había sido creada
ALTER TABLE landing_gallery ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE landing_gallery ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE landing_gallery ADD COLUMN IF NOT EXISTS image_path TEXT;
ALTER TABLE landing_gallery ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Sincronizar caption con description en registros previos si fuera necesario
UPDATE landing_gallery SET caption = description WHERE caption IS NULL AND description IS NOT NULL;
UPDATE landing_gallery SET description = caption WHERE description IS NULL AND caption IS NOT NULL;

-- 2. Tabla de Archivos Multimedia asociados a cada Trabajo
CREATE TABLE IF NOT EXISTS landing_gallery_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES landing_gallery(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    storage_path TEXT NOT NULL,
    media_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_landing_gallery_media_gallery_id 
ON landing_gallery_media (gallery_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_landing_gallery_cat_active_sort 
ON landing_gallery (category, active, sort_order ASC);

-- 3. Habilitar RLS
ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_gallery_media ENABLE ROW LEVEL SECURITY;

-- Políticas para landing_gallery
DROP POLICY IF EXISTS "Public Read Landing Gallery" ON landing_gallery;
CREATE POLICY "Public Read Landing Gallery" ON landing_gallery
    FOR SELECT TO anon
    USING (active = true);

DROP POLICY IF EXISTS "Admin All Landing Gallery" ON landing_gallery;
CREATE POLICY "Admin All Landing Gallery" ON landing_gallery
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para landing_gallery_media
DROP POLICY IF EXISTS "Public Read Landing Gallery Media" ON landing_gallery_media;
CREATE POLICY "Public Read Landing Gallery Media" ON landing_gallery_media
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Admin All Landing Gallery Media" ON landing_gallery_media;
CREATE POLICY "Admin All Landing Gallery Media" ON landing_gallery_media
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Storage Bucket: landing-gallery con soporte para Video (50MB) e Imágenes (10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-gallery',
    'landing-gallery',
    true,
    52428800, -- 50 MB
    ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm', 'video/quicktime'
    ];

-- Políticas del Bucket
DROP POLICY IF EXISTS "Public Read Landing Gallery Storage" ON storage.objects;
CREATE POLICY "Public Read Landing Gallery Storage" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'landing-gallery');

DROP POLICY IF EXISTS "Admin All Landing Gallery Storage" ON storage.objects;
CREATE POLICY "Admin All Landing Gallery Storage" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'landing-gallery')
    WITH CHECK (bucket_id = 'landing-gallery');

-- 5. Migrar automáticamente imágenes existentes de landing_gallery a landing_gallery_media
INSERT INTO landing_gallery_media (gallery_id, media_type, storage_path, media_url, sort_order)
SELECT id, 'image', COALESCE(image_path, 'default.jpg'), image_url, 0
FROM landing_gallery
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM landing_gallery_media WHERE landing_gallery_media.gallery_id = landing_gallery.id
  );
