-- =====================================================
-- SAFELINK SECURITY (SLS) — Migración de tablas
-- Ejecutar en Supabase SQL Editor
-- Proyecto: aieqlypuyrgeticrshzg
-- =====================================================

-- ── 1. Tabla: Eventos de seguridad ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type      TEXT        NOT NULL,
  -- Tipos: LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | SESSION_REFRESH
  --        BLOCKED | UNBLOCKED | SUSPICIOUS_ACTIVITY | PASSWORD_RESET
  status          TEXT        NOT NULL DEFAULT 'allowed',
  -- allowed | rejected | blocked
  risk_level      TEXT        NOT NULL DEFAULT 'NORMAL',
  -- NORMAL | UNUSUAL | SUSPICIOUS | AUTOMATED
  reason          TEXT,
  country         TEXT,
  region          TEXT,
  city            TEXT,
  zona            TEXT,       -- "Ciudad, Región, País" (display friendly)
  device_type     TEXT,       -- PC | Notebook | Móvil | Tablet
  os              TEXT,
  browser         TEXT,
  user_agent      TEXT,
  is_automated    BOOLEAN     NOT NULL DEFAULT false,
  metadata        JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_events_user_id    ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_level ON public.security_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON public.security_events(event_type);

-- ── 2. Tabla: Perfil de seguridad por usuario ─────────────────────
CREATE TABLE IF NOT EXISTS public.security_user_profiles (
  user_id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  security_status      TEXT        NOT NULL DEFAULT 'normal',
  -- normal | blocked | suspicious
  blocked_until        TIMESTAMPTZ,
  last_login_at        TIMESTAMPTZ,
  last_event_at        TIMESTAMPTZ,
  last_suspicious_at   TIMESTAMPTZ,
  last_country         TEXT,
  last_region          TEXT,
  last_city            TEXT,
  last_zona            TEXT,
  last_device_type     TEXT,
  last_os              TEXT,
  last_browser         TEXT,
  failed_attempts      INTEGER     NOT NULL DEFAULT 0,
  suspicious_attempts  INTEGER     NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Tabla: Configuración SLS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.security_settings (
  user_id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  protection_enabled        BOOLEAN     NOT NULL DEFAULT true,
  block_enabled             BOOLEAN     NOT NULL DEFAULT true,
  block_duration_hours      INTEGER     NOT NULL DEFAULT 2,
  alerts_enabled            BOOLEAN     NOT NULL DEFAULT true,
  alert_on_unusual          BOOLEAN     NOT NULL DEFAULT false,
  alert_on_suspicious       BOOLEAN     NOT NULL DEFAULT true,
  alert_on_automated        BOOLEAN     NOT NULL DEFAULT true,
  alert_email               TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Row Level Security ─────────────────────────────────────────

-- security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados ven SOLO sus propios eventos
CREATE POLICY "SLS events: user reads own"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- security_user_profiles
ALTER TABLE public.security_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SLS profile: user reads own"
  ON public.security_user_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- security_settings
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SLS settings: user reads own"
  ON public.security_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- El usuario SÍ puede actualizar su propia configuración
CREATE POLICY "SLS settings: user updates own"
  ON public.security_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- El usuario puede insertar su propia configuración (primera vez)
CREATE POLICY "SLS settings: user inserts own"
  ON public.security_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── 5. Comentarios ────────────────────────────────────────────────
COMMENT ON TABLE public.security_events IS
  'SafeLink Security: log inmutable de eventos de autenticación y actividad anómala.';

COMMENT ON TABLE public.security_user_profiles IS
  'SafeLink Security: estado de seguridad actual por usuario. Actualizado por Edge Function safelink-security.';

COMMENT ON TABLE public.security_settings IS
  'SafeLink Security: configuración de alertas y bloqueos por usuario.';

-- ── 6. NOTA: Password Verification Hook ──────────────────────────
-- NO disponible en plan Free.
-- Cuando el plan lo permita, activar en:
--   Supabase Dashboard → Authentication → Hooks → Password Verification Hook
--   Apuntar a Edge Function: safelink-security (action = password_hook)
-- La Edge Function ya tiene la lógica preparada.
