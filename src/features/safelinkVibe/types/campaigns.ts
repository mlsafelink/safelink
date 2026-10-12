// =====================================================
// SafeLink Vibe — Tipos de Campañas Publicitarias (Fase 4A)
// =====================================================

export type CampaignStatus = 'draft' | 'planned' | 'active' | 'paused' | 'completed';

export type CampaignObjective =
  | 'brand_awareness'
  | 'lead_generation'
  | 'seasonal_promo'
  | 'service_launch'
  | 'customer_retention';

export type CampaignChannel =
  | 'instagram_reels'
  | 'instagram_feed'
  | 'instagram_stories'
  | 'multichannel'
  | 'web';

export interface CampaignMetrics {
  targetLeads?: number;
  estimatedReach?: number;
  targetPieces?: number;
  completedPieces?: number;
}

export interface VibeCampaign {
  id: string;
  user_id?: string;
  name: string;
  description: string | null;
  service_target: 'seguridad' | 'redes' | 'iluminacion' | 'general';
  objective: CampaignObjective;
  status: CampaignStatus;
  channels: CampaignChannel[];
  start_date: string | null;
  end_date: string | null;
  target_audience: string | null;
  budget: number | null;
  metrics: CampaignMetrics;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  service_target: 'seguridad' | 'redes' | 'iluminacion' | 'general';
  objective: CampaignObjective;
  status?: CampaignStatus;
  channels?: CampaignChannel[];
  start_date?: string;
  end_date?: string;
  target_audience?: string;
  budget?: number;
  metrics?: CampaignMetrics;
}

export interface CampaignSummaryStats {
  total: number;
  active: number;
  planned: number;
  draft: number;
  completed: number;
  totalPieces: number;
}
