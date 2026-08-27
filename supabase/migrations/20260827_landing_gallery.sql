-- =====================================================
-- MIGRACIÓN: Galería interactiva de trabajos realizados
-- Tabla: landing_gallery y Bucket: landing-gallery
-- =====================================================

-- 1. Tabla de Galería de Landing
CREATE TABLE IF NOT EXISTS landing_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('iluminacion', 'redes', 'seguridad')),
    title TEXT NOT NULL,
    description TEXT,
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar consultas de la landing
CREATE INDEX IF NOT EXISTS idx_landing_gallery_category_active 
ON landing_gallery (category, active, sort_order ASC);

-- 2. Habilitar RLS
ALTER TABLE landing_gallery ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para la tabla
-- Lectura pública para elementos activos
CREATE POLICY "Public Read Landing Gallery" ON landing_gallery
    FOR SELECT TO anon
    USING (active = true);

-- Acceso total para administradores autenticados
CREATE POLICY "Admin All Landing Gallery" ON landing_gallery
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Storage Bucket: landing-gallery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'landing-gallery',
    'landing-gallery',
    true,
    15728640, -- 15 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para el Storage Bucket
CREATE POLICY "Public Read Landing Gallery Storage" ON storage.objects
    FOR SELECT TO anon
    USING (bucket_id = 'landing-gallery');

CREATE POLICY "Admin All Landing Gallery Storage" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'landing-gallery')
    WITH CHECK (bucket_id = 'landing-gallery');

-- 4. Datos de prueba iniciales (Seeds)
-- Estos registros proporcionan demostración inmediata y serán administrables desde el dashboard.
INSERT INTO landing_gallery (category, title, description, image_path, image_url, sort_order, active, featured)
VALUES
    -- ILUMINACIÓN LED
    ('iluminacion', 'Iluminación lineal suspendida en oficinas', 'Perfilería de aluminio negro con tira LED continua de alta eficiencia y luz neutra 4000K.', 'iluminacion/demo1.jpg', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80', 1, true, true),
    ('iluminacion', 'Gargantas de luz indirecta y calidez en living', 'Diseño de cielo raso suspendido con efecto halo cálido regulable.', 'iluminacion/demo2.jpg', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80', 2, true, false),
    ('iluminacion', 'Mobiliario a medida y retroiluminación TV', 'Integración oculta de tiras COB en panel ranurado y estanterías flotantes.', 'iluminacion/demo3.jpg', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80', 3, true, true),
    ('iluminacion', 'Iluminación perimetral y decorativa en salón comercial', 'Spots embutidos orientables combinados con artefactos industriales vintage.', 'iluminacion/demo4.jpg', 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1200&q=80', 4, true, false),

    -- REDES E INFRAESTRUCTURA
    ('redes', 'Armado y peinado de Rack corporativo 42U', 'Ordenamiento integral de patch panels Cat6A, patch cords rotulados y switches Gigabit.', 'redes/demo1.jpg', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80', 1, true, true),
    ('redes', 'Cableado estructurado y canalización en bandeja', 'Tendido prolijo bajo piso técnico y bandejas portacables con certificación.', 'redes/demo2.jpg', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80', 2, true, false),
    ('redes', 'Implementación de red Wi-Fi 6 de alta densidad', 'Access points empresariales de techo con roaming continuo y gestión unificada.', 'redes/demo3.jpg', 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=1200&q=80', 3, true, true),
    ('redes', 'Puestos de trabajo y puestos de red dobles', 'Cajas de conexión embutidas y tomas RJ45 blindados para oficinas comerciales.', 'redes/demo4.jpg', 'https://images.unsplash.com/photo-1520869562399-e772f179f041?auto=format&fit=crop&w=1200&q=80', 4, true, false),

    -- SEGURIDAD INTELIGENTE
    ('seguridad', 'Sistema de videovigilancia IP 4K perimetral', 'Cámaras domo antivandálicas con visión nocturna infrarroja y análisis de movimiento.', 'seguridad/demo1.jpg', 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80', 1, true, true),
    ('seguridad', 'Control de acceso biométrico y cerradura smart', 'Lector facial y huella dactilar para ingreso seguro a áreas restringidas.', 'seguridad/demo2.jpg', 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80', 2, true, false),
    ('seguridad', 'Centro de monitoreo y NVR 32 canales', 'Grabación redundante continua con acceso remoto encriptado desde app móvil.', 'seguridad/demo3.jpg', 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80', 3, true, true),
    ('seguridad', 'Instalación de cámaras varifocales en accesos vehiculares', 'Reconocimiento de patentes y cobertura completa en accesos y portones.', 'seguridad/demo4.jpg', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=1200&q=80', 4, true, false)
ON CONFLICT DO NOTHING;
