-- =====================================================
-- SafeLink Vibe — Migración Fase 4A: Campañas Publicitarias
-- Archivo: 20261012_safelink_vibe_campaigns.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS vibe_campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 250),
  description      TEXT,
  service_target   TEXT NOT NULL DEFAULT 'general' CHECK (
                     service_target IN ('seguridad', 'redes', 'iluminacion', 'general')
                   ),
  objective        TEXT NOT NULL DEFAULT 'lead_generation' CHECK (
                     objective IN (
                       'brand_awareness',
                       'lead_generation',
                       'seasonal_promo',
                       'service_launch',
                       'customer_retention'
                     )
                   ),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (
                     status IN ('draft', 'planned', 'active', 'paused', 'completed')
                   ),
  channels         TEXT[] DEFAULT ARRAY['instagram_reels', 'instagram_feed']::TEXT[],
  start_date       DATE,
  end_date         DATE,
  target_audience  TEXT,
  budget           NUMERIC(10, 2),
  metrics          JSONB NOT NULL DEFAULT '{"targetLeads": 0, "estimatedReach": 0, "targetPieces": 3, "completedPieces": 0}'::JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vibe_campaigns_user_id ON vibe_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_campaigns_status ON vibe_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_vibe_campaigns_service ON vibe_campaigns(service_target);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS set_vibe_campaigns_updated_at ON vibe_campaigns;
CREATE TRIGGER set_vibe_campaigns_updated_at
  BEFORE UPDATE ON vibe_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Relacionar vibe_projects con vibe_campaigns
ALTER TABLE vibe_projects
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES vibe_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vibe_projects_campaign_id ON vibe_projects(campaign_id);

-- RLS
ALTER TABLE vibe_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vibe_campaigns_select_own"
  ON vibe_campaigns FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vibe_campaigns_insert_own"
  ON vibe_campaigns FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vibe_campaigns_update_own"
  ON vibe_campaigns FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vibe_campaigns_delete_own"
  ON vibe_campaigns FOR DELETE TO authenticated
  USING (user_id = auth.uid());
