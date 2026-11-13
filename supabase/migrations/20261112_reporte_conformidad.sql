-- ==============================================================================
-- Migración: Conformidad, versionado y trazabilidad de reportes públicos
-- SafeLink - 12/11/2026
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLA: Versiones de reportes (snapshots inalterables)
CREATE TABLE IF NOT EXISTS reporte_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  sha256 VARCHAR(64) NOT NULL,
  documento JSONB NOT NULL DEFAULT '{}'::JSONB,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'modificada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (reporte_id, version)
);

-- 2. TABLA: Aceptaciones de reportes por parte del cliente
CREATE TABLE IF NOT EXISTS reporte_aceptaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  reporte_version_id UUID NOT NULL REFERENCES reporte_versiones(id) ON DELETE RESTRICT,
  sha256 VARCHAR(64) NOT NULL,
  cliente_nombre TEXT,
  aceptado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reporte_id, reporte_version_id)
);

-- 3. TABLA: Solicitudes de modificación enviadas por el cliente
CREATE TABLE IF NOT EXISTS reporte_solicitudes_modificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id UUID NOT NULL REFERENCES reportes(id) ON DELETE CASCADE,
  reporte_version_id UUID REFERENCES reporte_versiones(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cliente_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Extender tabla de eventos del sistema para notificaciones
ALTER TABLE IF EXISTS eventos_sistema
  ADD COLUMN IF NOT EXISTS reporte_id UUID REFERENCES reportes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reporte_version INTEGER,
  ADD COLUMN IF NOT EXISTS reporte_public_id TEXT,
  ADD COLUMN IF NOT EXISTS leida BOOLEAN DEFAULT FALSE;

-- Índices de consulta y rendimiento
CREATE INDEX IF NOT EXISTS idx_reporte_versiones_reporte_id
  ON reporte_versiones (reporte_id, version);

CREATE INDEX IF NOT EXISTS idx_reporte_aceptaciones_reporte_id
  ON reporte_aceptaciones (reporte_id);

CREATE INDEX IF NOT EXISTS idx_reporte_solicitudes_modificacion_reporte_id
  ON reporte_solicitudes_modificacion (reporte_id);

CREATE INDEX IF NOT EXISTS idx_eventos_sistema_reporte_id
  ON eventos_sistema (reporte_id);

-- 5. FUNCIÓN: Generación canónica y reproducible del snapshot documental
CREATE OR REPLACE FUNCTION public.reportes_snapshot_document(p_reporte_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT jsonb_build_object(
    'id', r.id,
    'consorcio_id', r.consorcio_id,
    'fecha', r.fecha::TEXT,
    'titulo', COALESCE(r.titulo, ''),
    'motivo', COALESCE(r.motivo, ''),
    'descripcion', COALESCE(r.descripcion, ''),
    'diagnostico', COALESCE(r.diagnostico, ''),
    'trabajo_realizado', COALESCE(r.trabajo_realizado, ''),
    'recomendaciones', COALESCE(r.recomendaciones, ''),
    'conclusiones', COALESCE(r.conclusiones, ''),
    'fotografias', COALESCE(r.fotografias, '[]'::JSONB),
    'observaciones', COALESCE(r.observaciones, ''),
    'equipo_relevado', COALESCE(r.equipo_relevado, ''),
    'inspeccion_realizada', COALESCE(r.inspeccion_realizada, ''),
    'cliente_nombre', COALESCE(r.cliente_nombre, ''),
    'cliente_direccion', COALESCE(r.cliente_direccion, ''),
    'fecha_instalacion', COALESCE(r.fecha_instalacion::TEXT, ''),
    'tecnico_nombre', COALESCE(r.tecnico_nombre, ''),
    'url_sitio_web', COALESCE(r.url_sitio_web, ''),
    'telefono_soporte', COALESCE(r.telefono_soporte, ''),
    'email_soporte', COALESCE(r.email_soporte, ''),
    'horario_soporte', COALESCE(r.horario_soporte, ''),
    'version', COALESCE(r.version, 1)
  )
  FROM reportes r
  WHERE r.id = p_reporte_id;
$$;

-- 6. FUNCIÓN: Cálculo de huella digital SHA-256 canónica
CREATE OR REPLACE FUNCTION public.reportes_snapshot_hash(p_reporte_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT encode(digest(convert_to(public.reportes_snapshot_document(p_reporte_id)::text, 'UTF8'), 'sha256'), 'hex');
$$;

-- 7. TRIGGER: Incremento automático de versión antes de actualizar si cambia el contenido
CREATE OR REPLACE FUNCTION public.trigger_reporte_before_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Si es un soft delete (cambio de deleted_at), no cambiar la versión
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Comprobar si hubo cambios sustanciales en el contenido del documento
  IF (
    OLD.titulo IS DISTINCT FROM NEW.titulo OR
    OLD.fecha IS DISTINCT FROM NEW.fecha OR
    OLD.motivo IS DISTINCT FROM NEW.motivo OR
    OLD.descripcion IS DISTINCT FROM NEW.descripcion OR
    OLD.diagnostico IS DISTINCT FROM NEW.diagnostico OR
    OLD.trabajo_realizado IS DISTINCT FROM NEW.trabajo_realizado OR
    OLD.recomendaciones IS DISTINCT FROM NEW.recomendaciones OR
    OLD.conclusiones IS DISTINCT FROM NEW.conclusiones OR
    OLD.fotografias IS DISTINCT FROM NEW.fotografias OR
    OLD.observaciones IS DISTINCT FROM NEW.observaciones OR
    OLD.equipo_relevado IS DISTINCT FROM NEW.equipo_relevado OR
    OLD.inspeccion_realizada IS DISTINCT FROM NEW.inspeccion_realizada OR
    OLD.cliente_nombre IS DISTINCT FROM NEW.cliente_nombre OR
    OLD.cliente_direccion IS DISTINCT FROM NEW.cliente_direccion
  ) THEN
    NEW.version := COALESCE(OLD.version, 1) + 1;
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reporte_before_update ON reportes;
CREATE TRIGGER trg_reporte_before_update
BEFORE UPDATE ON reportes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_reporte_before_update();

-- 8. TRIGGER: Creación y guardado inalterable del snapshot de versión
CREATE OR REPLACE FUNCTION public.trigger_reporte_after_save()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_version INTEGER;
  v_document JSONB;
  v_hash TEXT;
BEGIN
  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_version := COALESCE(NEW.version, 1);
  v_document := public.reportes_snapshot_document(NEW.id);
  v_hash := public.reportes_snapshot_hash(NEW.id);

  INSERT INTO reporte_versiones (reporte_id, version, documento, sha256, estado, created_at)
  VALUES (NEW.id, v_version, v_document, v_hash, 'pendiente', NOW())
  ON CONFLICT (reporte_id, version) DO UPDATE
  SET documento = EXCLUDED.documento,
      sha256 = EXCLUDED.sha256
  WHERE reporte_versiones.estado != 'aprobada'; -- Nunca sobrescribir si ya está aprobada!

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reporte_after_save ON reportes;
CREATE TRIGGER trg_reporte_after_save
AFTER INSERT OR UPDATE ON reportes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_reporte_after_save();

-- 9. FUNCIÓN RPC: Registro de Aceptación (servidor seguro, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.register_reporte_aceptacion(
  p_identifier TEXT,
  p_cliente_nombre TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reporte RECORD;
  v_version RECORD;
  v_existente RECORD;
  v_is_uuid BOOLEAN;
  v_consorcio_nombre TEXT;
  v_public_id TEXT;
BEGIN
  -- Soporta tanto UUID (id o public_id) como public_slug (nombre-enlace-codigo)
  v_is_uuid := p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  IF v_is_uuid THEN
    SELECT * INTO v_reporte
    FROM reportes
    WHERE (public_id = p_identifier::UUID OR id = p_identifier::UUID OR public_slug = p_identifier)
      AND deleted_at IS NULL
    LIMIT 1;
  ELSE
    SELECT * INTO v_reporte
    FROM reportes
    WHERE public_slug = p_identifier
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_reporte IS NULL THEN
    RAISE EXCEPTION 'Reporte no encontrado';
  END IF;

  v_public_id := COALESCE(v_reporte.public_slug, v_reporte.public_id::TEXT);

  -- Obtener nombre del consorcio para la notificación
  SELECT c.nombre INTO v_consorcio_nombre
  FROM consorcios c
  WHERE c.id = v_reporte.consorcio_id;

  -- Buscar o inicializar la versión correspondiente
  SELECT * INTO v_version
  FROM reporte_versiones
  WHERE reporte_id = v_reporte.id AND version = v_reporte.version
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_version IS NULL THEN
    INSERT INTO reporte_versiones (reporte_id, version, documento, sha256, estado, created_at)
    VALUES (
      v_reporte.id,
      v_reporte.version,
      public.reportes_snapshot_document(v_reporte.id),
      public.reportes_snapshot_hash(v_reporte.id),
      'pendiente',
      NOW()
    )
    RETURNING * INTO v_version;
  END IF;

  -- Evitar aceptaciones duplicadas accidentales
  SELECT * INTO v_existente
  FROM reporte_aceptaciones
  WHERE reporte_id = v_reporte.id AND reporte_version_id = v_version.id
  LIMIT 1;

  IF v_existente IS NOT NULL THEN
    UPDATE reporte_versiones
    SET estado = 'aprobada', accepted_at = v_existente.aceptado_at
    WHERE id = v_version.id;

    RETURN jsonb_build_object(
      'accepted', false,
      'already_accepted', true,
      'version', v_version.version,
      'sha256', v_version.sha256,
      'aceptado_at', v_existente.aceptado_at,
      'reporte_public_id', v_public_id,
      'reporte_id', v_reporte.id
    );
  END IF;

  -- Registrar la aceptación con fecha y hora exacta del servidor
  INSERT INTO reporte_aceptaciones (reporte_id, reporte_version_id, sha256, cliente_nombre, aceptado_at)
  VALUES (v_reporte.id, v_version.id, v_version.sha256, COALESCE(p_cliente_nombre, v_reporte.cliente_nombre), NOW())
  RETURNING * INTO v_existente;

  -- Actualizar estado inalterable de la versión aprobada
  UPDATE reporte_versiones
  SET estado = 'aprobada', accepted_at = v_existente.aceptado_at
  WHERE id = v_version.id;

  -- Generar notificación en el sistema administrativo existente (eventos_sistema)
  INSERT INTO eventos_sistema (
    tipo,
    reporte_id,
    reporte_version,
    reporte_public_id,
    cliente_nombre,
    consorcio_nombre,
    detalles
  )
  VALUES (
    'reporte_aceptado',
    v_reporte.id,
    v_version.version,
    v_public_id,
    COALESCE(p_cliente_nombre, v_reporte.cliente_nombre),
    v_consorcio_nombre,
    jsonb_build_object(
      'reporte_id', v_reporte.id,
      'reporte_public_id', v_public_id,
      'version', v_version.version,
      'sha256', v_version.sha256,
      'titulo', v_reporte.titulo,
      'cliente_nombre', COALESCE(p_cliente_nombre, v_reporte.cliente_nombre),
      'consorcio_nombre', v_consorcio_nombre,
      'mensaje', 'Reporte aprobado por el cliente',
      'leida', false
    )
  );

  RETURN jsonb_build_object(
    'accepted', true,
    'already_accepted', false,
    'version', v_version.version,
    'sha256', v_version.sha256,
    'aceptado_at', v_existente.aceptado_at,
    'reporte_public_id', v_public_id,
    'reporte_id', v_reporte.id
  );
END;
$$;

-- 10. FUNCIÓN RPC: Registro de Solicitud de Modificación (servidor seguro, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.register_reporte_modificacion(
  p_identifier TEXT,
  p_descripcion TEXT,
  p_cliente_nombre TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_reporte RECORD;
  v_version RECORD;
  v_solicitud RECORD;
  v_is_uuid BOOLEAN;
  v_consorcio_nombre TEXT;
  v_public_id TEXT;
BEGIN
  v_is_uuid := p_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  IF v_is_uuid THEN
    SELECT * INTO v_reporte
    FROM reportes
    WHERE (public_id = p_identifier::UUID OR id = p_identifier::UUID OR public_slug = p_identifier)
      AND deleted_at IS NULL
    LIMIT 1;
  ELSE
    SELECT * INTO v_reporte
    FROM reportes
    WHERE public_slug = p_identifier
      AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_reporte IS NULL THEN
    RAISE EXCEPTION 'Reporte no encontrado';
  END IF;

  v_public_id := COALESCE(v_reporte.public_slug, v_reporte.public_id::TEXT);

  SELECT c.nombre INTO v_consorcio_nombre
  FROM consorcios c
  WHERE c.id = v_reporte.consorcio_id;

  SELECT * INTO v_version
  FROM reporte_versiones
  WHERE reporte_id = v_reporte.id AND version = v_reporte.version
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_version IS NULL THEN
    INSERT INTO reporte_versiones (reporte_id, version, documento, sha256, estado, created_at)
    VALUES (
      v_reporte.id,
      v_reporte.version,
      public.reportes_snapshot_document(v_reporte.id),
      public.reportes_snapshot_hash(v_reporte.id),
      'pendiente',
      NOW()
    )
    RETURNING * INTO v_version;
  END IF;

  -- Guardar la solicitud vinculada al reporte y a la versión
  INSERT INTO reporte_solicitudes_modificacion (
    reporte_id,
    reporte_version_id,
    descripcion,
    cliente_nombre,
    created_at
  )
  VALUES (
    v_reporte.id,
    v_version.id,
    p_descripcion,
    COALESCE(p_cliente_nombre, v_reporte.cliente_nombre),
    NOW()
  )
  RETURNING * INTO v_solicitud;

  -- Actualizar estado de la versión si estaba pendiente
  IF v_version.estado = 'pendiente' THEN
    UPDATE reporte_versiones
    SET estado = 'modificada'
    WHERE id = v_version.id;
  END IF;

  -- Generar notificación en el sistema administrativo con el texto completo
  INSERT INTO eventos_sistema (
    tipo,
    reporte_id,
    reporte_version,
    reporte_public_id,
    cliente_nombre,
    consorcio_nombre,
    detalles
  )
  VALUES (
    'reporte_modificacion_solicitada',
    v_reporte.id,
    v_version.version,
    v_public_id,
    COALESCE(p_cliente_nombre, v_reporte.cliente_nombre),
    v_consorcio_nombre,
    jsonb_build_object(
      'reporte_id', v_reporte.id,
      'reporte_public_id', v_public_id,
      'version', v_version.version,
      'descripcion', p_descripcion,
      'titulo', v_reporte.titulo,
      'cliente_nombre', COALESCE(p_cliente_nombre, v_reporte.cliente_nombre),
      'consorcio_nombre', v_consorcio_nombre,
      'mensaje', 'Solicitud de modificación de reporte',
      'leida', false
    )
  );

  RETURN jsonb_build_object(
    'created', true,
    'version', v_version.version,
    'reporte_public_id', v_public_id,
    'reporte_id', v_reporte.id
  );
END;
$$;

-- Permisos de ejecución para llamadas anónimas y autenticadas
GRANT EXECUTE ON FUNCTION public.reportes_snapshot_document(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reportes_snapshot_hash(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_reporte_aceptacion(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_reporte_modificacion(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 11. POLÍTICAS DE SEGURIDAD RLS
ALTER TABLE reporte_versiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporte_aceptaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporte_solicitudes_modificacion ENABLE ROW LEVEL SECURITY;

-- Admins (autenticados): acceso total
CREATE POLICY "Admin All ReporteVersiones" ON reporte_versiones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin All ReporteAceptaciones" ON reporte_aceptaciones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin All SolicitudesModificacion" ON reporte_solicitudes_modificacion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Público (anónimo): únicamente LECTURA (SELECT) de reportes activos
CREATE POLICY "Public Read ReporteVersiones" ON reporte_versiones
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM reportes r
      WHERE r.id = reporte_versiones.reporte_id
        AND r.deleted_at IS NULL
    )
  );

CREATE POLICY "Public Read ReporteAceptaciones" ON reporte_aceptaciones
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM reportes r
      WHERE r.id = reporte_aceptaciones.reporte_id
        AND r.deleted_at IS NULL
    )
  );

CREATE POLICY "Public Read SolicitudesModificacion" ON reporte_solicitudes_modificacion
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM reportes r
      WHERE r.id = reporte_solicitudes_modificacion.reporte_id
        AND r.deleted_at IS NULL
    )
  );

-- 12. BACKFILL: Asegurar que los reportes existentes tengan su versión 1 creada
INSERT INTO reporte_versiones (reporte_id, version, documento, sha256, estado, created_at)
SELECT 
  r.id,
  COALESCE(r.version, 1),
  public.reportes_snapshot_document(r.id),
  public.reportes_snapshot_hash(r.id),
  'pendiente',
  COALESCE(r.created_at, NOW())
FROM reportes r
WHERE r.deleted_at IS NULL
ON CONFLICT (reporte_id, version) DO NOTHING;
