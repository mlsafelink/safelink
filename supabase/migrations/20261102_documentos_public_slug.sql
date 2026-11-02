-- ==============================================================================
-- Migración: Incorporar nombre de enlace amigable y código público a:
-- - reportes
-- - presupuestos
-- - reportes_trabajo
-- Unificando la estructura con el modelo de instructivos.
-- ==============================================================================

-- 1. REPORTES TÉCNICOS
ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS nombre_enlace TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(10),
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reportes_public_slug 
  ON reportes (public_slug) 
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN reportes.nombre_enlace IS 'Nombre personalizado asignado al enlace público del reporte';
COMMENT ON COLUMN reportes.codigo_publico IS 'Código aleatorio alfanumérico de 4 caracteres para el enlace';
COMMENT ON COLUMN reportes.public_slug IS 'Identificador público completo formato {nombre_enlace}-{codigo_publico}';

-- 2. PRESUPUESTOS
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS nombre_enlace TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(10),
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_presupuestos_public_slug 
  ON presupuestos (public_slug) 
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN presupuestos.nombre_enlace IS 'Nombre personalizado asignado al enlace público del presupuesto';
COMMENT ON COLUMN presupuestos.codigo_publico IS 'Código aleatorio alfanumérico de 4 caracteres para el enlace';
COMMENT ON COLUMN presupuestos.public_slug IS 'Identificador público completo formato {nombre_enlace}-{codigo_publico}';

-- 3. REPORTES DE TRABAJO
ALTER TABLE reportes_trabajo
  ADD COLUMN IF NOT EXISTS nombre_enlace TEXT,
  ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(10),
  ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reportes_trabajo_public_slug 
  ON reportes_trabajo (public_slug) 
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN reportes_trabajo.nombre_enlace IS 'Nombre personalizado asignado al enlace público del reporte de trabajo';
COMMENT ON COLUMN reportes_trabajo.codigo_publico IS 'Código aleatorio alfanumérico de 4 caracteres para el enlace';
COMMENT ON COLUMN reportes_trabajo.public_slug IS 'Identificador público completo formato {nombre_enlace}-{codigo_publico}';

-- 4. Actualizar función RPC atómica increment_document_access para soportar public_slug en todas las tablas
CREATE OR REPLACE FUNCTION increment_document_access(
  p_table_name TEXT,
  p_identifier TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- Lista blanca estricta para evitar accesos a tablas no autorizadas
  IF p_table_name NOT IN ('reportes', 'presupuestos', 'reportes_trabajo', 'instructivos') THEN
    RAISE EXCEPTION 'Tabla no autorizada para conteo de accesos';
  END IF;

  -- Soporta public_slug amigable, public_id (UUID) o id en todas las tablas
  EXECUTE format('
    UPDATE %I
    SET access_count = COALESCE(access_count, 0) + 1
    WHERE (public_slug = $1 OR public_id::text = $1 OR id::text = $1)
      AND deleted_at IS NULL
    RETURNING access_count
  ', p_table_name)
  INTO v_new_count
  USING p_identifier;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_document_access(TEXT, TEXT) TO anon, authenticated, service_role;

