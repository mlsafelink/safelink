-- ==============================================================================
-- Migración: Módulo Desarrollo Comercial — SafeLink
-- Fecha: 18/11/2026
-- Descripción: Tablas, relaciones, índices y políticas RLS para gestión comercial
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE EMPRESAS PROSPECTADAS
CREATE TABLE IF NOT EXISTS commercial_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_comercial VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255),
  cuit VARCHAR(25),
  rubro VARCHAR(100),
  tipo_establecimiento VARCHAR(100),
  descripcion TEXT,
  direccion TEXT,
  localidad VARCHAR(150),
  provincia VARCHAR(150),
  pais VARCHAR(100) DEFAULT 'Argentina',
  coordenadas JSONB, -- { "lat": number, "lng": number }
  sitio_web VARCHAR(255),
  telefono VARCHAR(100),
  email VARCHAR(255),
  fuente VARCHAR(100),
  prioridad VARCHAR(20) DEFAULT 'Media', -- Alta, Media, Baja
  estado_investigacion VARCHAR(60) DEFAULT 'Identificada',
  servicios_potenciales TEXT[] DEFAULT '{}',
  observaciones TEXT,
  consorcio_id UUID REFERENCES consorcios(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda y filtros rápidos
CREATE INDEX IF NOT EXISTS idx_commercial_companies_activo ON commercial_companies(activo);
CREATE INDEX IF NOT EXISTS idx_commercial_companies_prioridad ON commercial_companies(prioridad);
CREATE INDEX IF NOT EXISTS idx_commercial_companies_estado ON commercial_companies(estado_investigacion);
CREATE INDEX IF NOT EXISTS idx_commercial_companies_rubro ON commercial_companies(rubro);
CREATE INDEX IF NOT EXISTS idx_commercial_companies_consorcio ON commercial_companies(consorcio_id);

-- 2. TABLA DE CONTACTOS
CREATE TABLE IF NOT EXISTS commercial_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES commercial_companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150),
  cargo VARCHAR(150),
  area VARCHAR(150),
  telefono VARCHAR(100),
  telefono_interno VARCHAR(50),
  email VARCHAR(255),
  horario_contacto VARCHAR(150),
  medio_preferido VARCHAR(50) DEFAULT 'WhatsApp',
  estado_verificacion VARCHAR(50) DEFAULT 'A confirmar', -- Confirmado, A confirmar, Desactualizado, Desvinculado
  fuente VARCHAR(100),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_contacts_company ON commercial_contacts(company_id);

-- 3. TABLA DE VISITAS
CREATE TABLE IF NOT EXISTS commercial_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES commercial_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES commercial_contacts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME,
  direccion TEXT,
  modalidad VARCHAR(50) DEFAULT 'Presencial',
  objetivo TEXT,
  estado VARCHAR(50) DEFAULT 'Planificada', -- Planificada, Confirmada, Realizada, Reprogramada, Cancelada
  resultado TEXT,
  necesidades_detectadas TEXT,
  sistemas_observados TEXT,
  proveedores_actuales TEXT,
  servicios_ofrecidos TEXT,
  proximo_paso TEXT,
  fecha_proximo_paso DATE,
  fotografias JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_visits_company ON commercial_visits(company_id);
CREATE INDEX IF NOT EXISTS idx_commercial_visits_fecha ON commercial_visits(fecha);
CREATE INDEX IF NOT EXISTS idx_commercial_visits_estado ON commercial_visits(estado);

-- 4. TABLA DE OPORTUNIDADES
CREATE TABLE IF NOT EXISTS commercial_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES commercial_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES commercial_contacts(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES commercial_visits(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre VARCHAR(255) NOT NULL,
  necesidad TEXT,
  alcance TEXT,
  servicios TEXT[] DEFAULT '{}',
  prioridad VARCHAR(20) DEFAULT 'Media', -- Alta, Media, Baja
  importe_estimado NUMERIC(14, 2) DEFAULT 0,
  fecha_deteccion DATE DEFAULT CURRENT_DATE,
  proxima_accion TEXT,
  fecha_proxima_accion DATE,
  estado VARCHAR(60) DEFAULT '1. Detectada',
  motivo_cierre TEXT,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE SET NULL,
  reporte_id UUID REFERENCES reportes(id) ON DELETE SET NULL,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_opps_company ON commercial_opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_commercial_opps_estado ON commercial_opportunities(estado);
CREATE INDEX IF NOT EXISTS idx_commercial_opps_presupuesto ON commercial_opportunities(presupuesto_id);

-- 5. HISTORIAL DE CAMBIOS DE ESTADO DE OPORTUNIDADES
CREATE TABLE IF NOT EXISTS commercial_opportunity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES commercial_opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  estado_anterior VARCHAR(60),
  estado_nuevo VARCHAR(60) NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_opp_hist_opp ON commercial_opportunity_history(opportunity_id);

-- 6. TABLA DE SEGUIMIENTOS Y TAREAS
CREATE TABLE IF NOT EXISTS commercial_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES commercial_companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES commercial_contacts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES commercial_opportunities(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(60) DEFAULT 'Llamada telefónica',
  fecha_programada DATE NOT NULL,
  hora_programada TIME,
  prioridad VARCHAR(20) DEFAULT 'Normal', -- Urgente, Alta, Normal, Baja
  estado VARCHAR(50) DEFAULT 'Pendiente', -- Pendiente, En curso, Realizada, Vencida, Cancelada
  resultado TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commercial_tasks_company ON commercial_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_fecha ON commercial_tasks(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_commercial_tasks_estado ON commercial_tasks(estado);

-- ==============================================================================
-- POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE commercial_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_opportunity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_tasks ENABLE ROW LEVEL SECURITY;

-- Limpieza preventiva de políticas
DO $$ 
BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Companies Access" ON commercial_companies';
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Contacts Access" ON commercial_contacts';
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Visits Access" ON commercial_visits';
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Opportunities Access" ON commercial_opportunities';
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Opp History Access" ON commercial_opportunity_history';
  EXECUTE 'DROP POLICY IF EXISTS "Commercial Tasks Access" ON commercial_tasks';
EXCEPTION WHEN OTHERS THEN 
  NULL;
END $$;

CREATE POLICY "Commercial Companies Access" ON commercial_companies
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "Commercial Contacts Access" ON commercial_contacts
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "Commercial Visits Access" ON commercial_visits
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "Commercial Opportunities Access" ON commercial_opportunities
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "Commercial Opp History Access" ON commercial_opportunity_history
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "Commercial Tasks Access" ON commercial_tasks
  FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
