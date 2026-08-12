-- =====================================================
-- BÓVEDA SEGURA — Tabla vault
-- Copiar y ejecutar en Supabase SQL Editor
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_consorcio VARCHAR(255) NOT NULL,
  direccion TEXT,
  cantidad_canales INTEGER,
  serial_number VARCHAR(255),
  qr_image TEXT,
  pattern_image TEXT,
  admin_user VARCHAR(255),
  admin_password VARCHAR(255),
  user1 VARCHAR(255),
  password1 VARCHAR(255),
  user2 VARCHAR(255),
  password2 VARCHAR(255),
  observaciones TEXT,
  fecha_instalacion DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Asegurar que las columnas nuevas existen si la tabla ya había sido creada antes
ALTER TABLE vault ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE vault ADD COLUMN IF NOT EXISTS pattern_image TEXT;
ALTER TABLE vault ADD COLUMN IF NOT EXISTS fecha_instalacion DATE;

-- Habilitar RLS
ALTER TABLE vault ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DROP POLICY IF EXISTS "Admin All Vault" ON vault;
DROP POLICY IF EXISTS "Anon Select Vault" ON vault;
DROP POLICY IF EXISTS "Anon Insert Vault" ON vault;
DROP POLICY IF EXISTS "Anon Update Vault" ON vault;

CREATE POLICY "Admin All Vault" ON vault FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon Select Vault" ON vault FOR SELECT TO anon USING (deleted_at IS NULL);
CREATE POLICY "Anon Insert Vault" ON vault FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon Update Vault" ON vault FOR UPDATE TO anon USING (true) WITH CHECK (true);
