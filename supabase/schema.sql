-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla Administraciones
CREATE TABLE administraciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    cuit VARCHAR(20),
    direccion TEXT,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- 2. Tabla Consorcios
CREATE TABLE consorcios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    administracion_id UUID NOT NULL REFERENCES administraciones(id),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    localidad VARCHAR(255),
    provincia VARCHAR(255),
    codigo_postal VARCHAR(20),
    cantidad_pisos INTEGER,
    cantidad_unidades INTEGER,
    encargado VARCHAR(255),
    telefono_encargado VARCHAR(50),
    administrador_responsable VARCHAR(255),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- 3. Reportes Técnicos
CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consorcio_id UUID NOT NULL REFERENCES consorcios(id),
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(), -- Para compartir enlace (nunca vence, no requiere login)
    fecha DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    motivo TEXT,
    descripcion TEXT,
    diagnostico TEXT,
    trabajo_realizado TEXT,
    recomendaciones TEXT,
    conclusiones TEXT,
    fotografias JSONB DEFAULT '[]'::JSONB, -- Array de URLs
    firmas JSONB DEFAULT '[]'::JSONB,
    observaciones TEXT,
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES reportes(id), -- Para versionado estricto
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. Presupuestos
CREATE TABLE presupuestos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consorcio_id UUID NOT NULL REFERENCES consorcios(id),
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    materiales JSONB DEFAULT '[]'::JSONB, -- Array de {nombre, cantidad, precio_unitario, subtotal}
    mano_obra DECIMAL(12,2) DEFAULT 0,
    descuentos DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    validez VARCHAR(100),
    garantia VARCHAR(255),
    condiciones TEXT,
    observaciones TEXT,
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES presupuestos(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 5. Instructivos (plantilla estructurada)
CREATE TABLE instructivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consorcio_id UUID NOT NULL REFERENCES consorcios(id),
    public_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    contenido JSONB, -- Deprecated (nullable para backward compat)

    -- Campos editables del template (amarillo en las anotaciones)
    nombre_app TEXT DEFAULT 'Easy Viewer',
    texto_descarga TEXT,
    url_google_play TEXT,
    url_app_store TEXT,
    texto_post_instalacion TEXT DEFAULT 'Una vez instalada, abra la aplicación.',
    qr_image_url TEXT,
    nombre_dispositivo TEXT,
    usuario_dispositivo TEXT,
    password_dispositivo TEXT,
    cliente_nombre TEXT,
    cliente_direccion TEXT,
    fecha_instalacion DATE,
    tecnico_nombre TEXT,
    url_sitio_web TEXT DEFAULT 'www.safelink.com.ar',

    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES instructivos(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- =====================================================
-- MIGRACIÓN: Ejecutar en Supabase SQL Editor si la tabla ya existe
-- =====================================================
-- ALTER TABLE instructivos
--   ALTER COLUMN contenido DROP NOT NULL,
--   ADD COLUMN IF NOT EXISTS nombre_app TEXT DEFAULT 'Easy Viewer',
--   ADD COLUMN IF NOT EXISTS texto_descarga TEXT,
--   ADD COLUMN IF NOT EXISTS url_google_play TEXT,
--   ADD COLUMN IF NOT EXISTS url_app_store TEXT,
--   ADD COLUMN IF NOT EXISTS texto_post_instalacion TEXT DEFAULT 'Una vez instalada, abra la aplicación.',
--   ADD COLUMN IF NOT EXISTS qr_image_url TEXT,
--   ADD COLUMN IF NOT EXISTS nombre_dispositivo TEXT,
--   ADD COLUMN IF NOT EXISTS usuario_dispositivo TEXT,
--   ADD COLUMN IF NOT EXISTS password_dispositivo TEXT,
--   ADD COLUMN IF NOT EXISTS cliente_nombre TEXT,
--   ADD COLUMN IF NOT EXISTS cliente_direccion TEXT,
--   ADD COLUMN IF NOT EXISTS fecha_instalacion DATE,
--   ADD COLUMN IF NOT EXISTS tecnico_nombre TEXT,
--   ADD COLUMN IF NOT EXISTS url_sitio_web TEXT DEFAULT 'www.safelink.com.ar';

------------------------------------------------------
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
------------------------------------------------------
-- Activar RLS en todas las tablas
ALTER TABLE administraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE consorcios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructivos ENABLE ROW LEVEL SECURITY;

-- Política 1: El Super Admin (usuario autenticado) tiene acceso total a TODO.
-- Suponemos que cualquier usuario autenticado es el superadmin (ya que la app es de uso exclusivo interno).
CREATE POLICY "Admin All Administraciones" ON administraciones FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Consorcios" ON consorcios FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Reportes" ON reportes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Presupuestos" ON presupuestos FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin All Instructivos" ON instructivos FOR ALL TO authenticated USING (true);

-- Política 2: Acceso público de SOLO LECTURA a los documentos si se accede mediante public_id.
-- Supabase REST API filtra por `public_id=eq.X`. 
-- Habilitamos SELECT público sin restricción a nivel tabla, pero en la app solo se expone la ruta con public_id.
CREATE POLICY "Public Read Reportes" ON reportes FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "Public Read Presupuestos" ON presupuestos FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "Public Read Instructivos" ON instructivos FOR SELECT TO anon USING (deleted_at IS NULL);

-- Nota: Para "consorcios" y "administraciones", el usuario anónimo no tiene acceso (ni SELECT ni nada). 
-- Así garantizamos que por accidente nadie vea la lista de clientes.
