-- =====================================================
-- Migración: Contador de accesos públicos para documentos
-- Tablas afectadas: reportes, presupuestos, reportes_trabajo, instructivos
-- Copiar y ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. Agregar columna access_count con valor por defecto 0 a cada tabla
ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE reportes_trabajo
  ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE instructivos
  ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

-- 2. Asegurar que registros preexistentes no tengan NULL
UPDATE reportes SET access_count = 0 WHERE access_count IS NULL;
UPDATE presupuestos SET access_count = 0 WHERE access_count IS NULL;
UPDATE reportes_trabajo SET access_count = 0 WHERE access_count IS NULL;
UPDATE instructivos SET access_count = 0 WHERE access_count IS NULL;

-- 3. Comentarios de columnas
COMMENT ON COLUMN reportes.access_count IS 'Cantidad total de visitas al enlace público del reporte';
COMMENT ON COLUMN presupuestos.access_count IS 'Cantidad total de visitas al enlace público del presupuesto';
COMMENT ON COLUMN reportes_trabajo.access_count IS 'Cantidad total de visitas al enlace público del reporte de trabajo';
COMMENT ON COLUMN instructivos.access_count IS 'Cantidad total de visitas al enlace público del instructivo';

-- 4. Función RPC atómica y segura para incrementar el contador
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

  -- Instructivos: soporta tanto public_slug amigable, public_id (UUID) como id
  IF p_table_name = 'instructivos' THEN
    EXECUTE format('
      UPDATE %I
      SET access_count = COALESCE(access_count, 0) + 1
      WHERE (public_slug = $1 OR public_id::text = $1 OR id::text = $1)
        AND deleted_at IS NULL
      RETURNING access_count
    ', p_table_name)
    INTO v_new_count
    USING p_identifier;
  ELSE
    -- Reportes, Presupuestos y Reportes de Trabajo: buscan por public_id o id
    EXECUTE format('
      UPDATE %I
      SET access_count = COALESCE(access_count, 0) + 1
      WHERE (public_id::text = $1 OR id::text = $1)
        AND deleted_at IS NULL
      RETURNING access_count
    ', p_table_name)
    INTO v_new_count
    USING p_identifier;
  END IF;

  RETURN COALESCE(v_new_count, 0);
END;
$$;

-- 5. Otorgar permisos de ejecución para usuarios anónimos (visitantes públicos) y autenticados
GRANT EXECUTE ON FUNCTION increment_document_access(TEXT, TEXT) TO anon, authenticated, service_role;
