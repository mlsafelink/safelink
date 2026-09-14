-- =====================================================
-- SAFELINK — INFRAESTRUCTURA TÉCNICA
-- Soporte para Alarmas, nuevos elementos de Redes y Descripción opcional
-- =====================================================

-- 1. Agregar columna description (opcional) a infrastructure_elements
ALTER TABLE public.infrastructure_elements 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Asegurar que la restricción check en tipo no bloquee los nuevos tipos si existía
ALTER TABLE public.infrastructure_elements 
DROP CONSTRAINT IF EXISTS infrastructure_elements_tipo_check;
