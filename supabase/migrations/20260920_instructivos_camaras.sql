-- Migración: Agregar columna camaras a instructivos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE instructivos
  ADD COLUMN IF NOT EXISTS camaras JSONB DEFAULT '[]'::JSONB;

COMMENT ON COLUMN instructivos.camaras IS 'Lista dinámica de cámaras: [{id, nombre, qr_image_url, usuario, password}]';
