-- Migración: Agregar campo incluir_fotografias a la tabla reportes
-- Fecha: 2026-11-02
-- Propósito: Permite habilitar/deshabilitar el registro fotográfico en cada reporte técnico.
-- Compatibilidad: Los reportes históricos (NULL) son tratados como true (comportamiento anterior).

ALTER TABLE reportes
  ADD COLUMN IF NOT EXISTS incluir_fotografias BOOLEAN DEFAULT true;

-- Los registros existentes con NULL heredarán el valor DEFAULT true al ejecutar la migración.
-- Sin embargo, en la app, NULL se trata como true (incluir_fotografias !== false).

