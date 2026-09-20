-- Migración: Incorporar nombre de enlace amigable y código público a instructivos
ALTER TABLE instructivos
  ADD COLUMN IF NOT EXISTS nombre_enlace TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(10),
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

-- Índice único condicional para slugs públicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_instructivos_public_slug 
  ON instructivos (public_slug) 
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN instructivos.nombre_enlace IS 'Nombre personalizado asignado al enlace público del instructivo';
COMMENT ON COLUMN instructivos.codigo_publico IS 'Código aleatorio alfanumérico de 4 caracteres para el enlace';
COMMENT ON COLUMN instructivos.public_slug IS 'Identificador público completo formato {nombre_enlace}-{codigo_publico}';
