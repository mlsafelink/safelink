-- ================================================================
-- SafeLink Note — Tabla de relevamientos técnicos
-- Fecha: 2026-09-22
-- ================================================================

CREATE TABLE IF NOT EXISTS public.relevamientos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Datos del cliente
  cliente         text,
  direccion       text,
  contacto        text,

  -- Tipo de trabajo (multi-selección guardada como array)
  tipos_trabajo   text[] NOT NULL DEFAULT '{}',

  -- Observaciones
  observaciones   text,

  -- Fotografías (base64 comprimidas, array de objetos JSON)
  fotos           jsonb NOT NULL DEFAULT '[]',

  -- Materiales / equipos
  materiales      jsonb NOT NULL DEFAULT '[]',

  -- Estado del relevamiento
  estado          text NOT NULL DEFAULT 'PENDIENTE'
                  CHECK (estado IN ('PENDIENTE', 'FINALIZADO')),

  -- Para futura generación de .sln
  sln_path        text DEFAULT NULL
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'relevamientos_updated_at'
      AND tgrelid = 'public.relevamientos'::regclass
  ) THEN
    CREATE TRIGGER relevamientos_updated_at
      BEFORE UPDATE ON public.relevamientos
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

-- RLS: habilitar y permitir acceso tanto a usuarios autenticados como anon (uso interno)
ALTER TABLE public.relevamientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "relevamientos_select" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_insert" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_update" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_delete" ON public.relevamientos;
DROP POLICY IF EXISTS "relevamientos_all_access" ON public.relevamientos;
DROP POLICY IF EXISTS "Admin All Relevamientos" ON public.relevamientos;
DROP POLICY IF EXISTS "Anon All Relevamientos" ON public.relevamientos;

CREATE POLICY "Admin All Relevamientos"
  ON public.relevamientos FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon All Relevamientos"
  ON public.relevamientos FOR ALL
  TO anon USING (true) WITH CHECK (true);

