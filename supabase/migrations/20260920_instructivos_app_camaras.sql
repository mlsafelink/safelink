-- Migración: Incorporar selector de aplicación de cámaras a instructivos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE instructivos
  ADD COLUMN IF NOT EXISTS app_camaras TEXT;

COMMENT ON COLUMN instructivos.app_camaras IS 'Aplicación de cámaras seleccionada: imou, dmss, easy_viewer_pro o null';
