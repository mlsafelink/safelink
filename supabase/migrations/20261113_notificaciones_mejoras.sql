-- ==============================================================================
-- Migración: Mejoras en notificaciones y solicitudes de modificación
-- SafeLink - 13/11/2026
-- ==============================================================================

-- 1. Soft-delete para notificaciones (eliminada = true las oculta de la bandeja,
--    pero no elimina los registros de auditoría relacionados)
ALTER TABLE IF EXISTS eventos_sistema
  ADD COLUMN IF NOT EXISTS eliminada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_eventos_sistema_eliminada
  ON eventos_sistema (eliminada) WHERE eliminada = FALSE;

-- 2. Marcar múltiples notificaciones como leídas (bulk)
CREATE OR REPLACE FUNCTION public.marcar_notificaciones_leidas(p_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE eventos_sistema
  SET leida = TRUE,
      detalles = COALESCE(detalles, '{}'::JSONB) || '{"leida": true}'::JSONB
  WHERE id = ANY(p_ids)
    AND (leida IS NULL OR leida = FALSE);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3. Soft-delete de notificaciones (bulk)
CREATE OR REPLACE FUNCTION public.eliminar_notificaciones(p_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Solo marca como eliminada la notificación (evento_sistema).
  -- NO toca reporte_versiones, reporte_aceptaciones,
  -- reporte_solicitudes_modificacion ni ningún otro registro de auditoría.
  UPDATE eventos_sistema
  SET eliminada = TRUE
  WHERE id = ANY(p_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 4. Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.marcar_notificaciones_leidas(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.eliminar_notificaciones(UUID[]) TO authenticated, service_role;

-- 5. RLS: los usuarios autenticados pueden ver/modificar eventos_sistema
--    La columna eliminada NO debe ser modificable por el rol anon
-- (las políticas existentes ya cubren esto; sólo verificamos que anon no pueda UPDATE)
-- No se modifica ninguna política existente — solo se añade la columna.

