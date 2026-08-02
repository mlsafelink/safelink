-- =====================================================
-- MIGRACIÓN: Módulo Finanzas — Tabla Facturas
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Extension para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Asegurar que existe la tabla reportes_trabajo por si no fue creada previamente
CREATE TABLE IF NOT EXISTS reportes_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consorcio_id UUID NOT NULL REFERENCES consorcios(id),
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    codigo VARCHAR(30) UNIQUE,
    fecha DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tecnico_nombre TEXT,
    cliente_nombre TEXT,
    cliente_direccion TEXT,
    descripcion_trabajos TEXT,
    equipamiento_instalado TEXT,
    materiales_utilizados TEXT,
    configuraciones_realizadas TEXT,
    observaciones TEXT,
    fotografias JSONB DEFAULT '[]'::JSONB,
    garantia TEXT,
    firmas JSONB DEFAULT '[]'::JSONB,
    presupuesto_id UUID REFERENCES presupuestos(id),
    reporte_id UUID REFERENCES reportes(id),
    url_sitio_web TEXT DEFAULT 'www.safelink.com.ar',
    telefono_soporte TEXT,
    email_soporte TEXT,
    horario_soporte TEXT DEFAULT 'Lunes a Viernes de 9:00 a 18:00 hs.',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS & policies for reportes_trabajo
ALTER TABLE reportes_trabajo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin All ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Public Read ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Anon Insert ReportesTrabajo" ON reportes_trabajo;
DROP POLICY IF EXISTS "Anon Update ReportesTrabajo" ON reportes_trabajo;

CREATE POLICY "Admin All ReportesTrabajo" ON reportes_trabajo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public Read ReportesTrabajo" ON reportes_trabajo FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "Anon Insert ReportesTrabajo" ON reportes_trabajo FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon Update ReportesTrabajo" ON reportes_trabajo FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 1. Nueva tabla facturas
CREATE TABLE IF NOT EXISTS facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consorcio_id UUID NOT NULL REFERENCES consorcios(id),
    presupuesto_id UUID REFERENCES presupuestos(id),
    reporte_trabajo_id UUID REFERENCES reportes_trabajo(id),
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),

    numero_factura VARCHAR(100) NOT NULL,
    tipo_factura VARCHAR(1) NOT NULL CHECK (tipo_factura IN ('A', 'B', 'C')),
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    monto_total DECIMAL(14,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencida')),
    observaciones TEXT,
    fecha_pago DATE,

    -- PDF Storage
    pdf_url TEXT,
    pdf_nombre TEXT,
    pdf_cargado_at TIMESTAMPTZ,
    pdf_cargado_por TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Habilitar RLS
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS (limpiar si existían antes para evitar error de política duplicada)
DROP POLICY IF EXISTS "Admin All Facturas" ON facturas;
DROP POLICY IF EXISTS "Public Read Facturas" ON facturas;

CREATE POLICY "Admin All Facturas" ON facturas FOR ALL TO authenticated USING (true);
CREATE POLICY "Public Read Facturas" ON facturas FOR SELECT TO anon USING (deleted_at IS NULL);

-- 4. Bucket de Storage para PDFs de facturas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'facturas',
    'facturas',
    true,
    52428800, -- 50 MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (con sanitización)
DROP POLICY IF EXISTS "Authenticated users can upload facturas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update facturas" ON storage.objects;
DROP POLICY IF EXISTS "Public can read facturas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read facturas" ON storage.objects;

CREATE POLICY "Authenticated users can upload facturas"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'facturas');

CREATE POLICY "Authenticated users can update facturas"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'facturas');

CREATE POLICY "Public can read facturas"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'facturas');

CREATE POLICY "Authenticated can read facturas"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'facturas');

-- 5. Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_facturas_consorcio ON facturas(consorcio_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facturas_public_id ON facturas(public_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento) WHERE deleted_at IS NULL;
