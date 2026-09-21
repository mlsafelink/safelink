-- Migración: Agregar columna tipo_dispositivo a instructivos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE instructivos
  ADD COLUMN IF NOT EXISTS tipo_dispositivo TEXT DEFAULT 'XVR';

COMMENT ON COLUMN instructivos.tipo_dispositivo IS 'Tipo de dispositivo: XVR, NVR, Cámara inalámbrica, Dispositivo compartido';
