// =====================================================
// SafeLink Vibe — Servicio de Campañas Publicitarias (Fase 4A)
// Gestión con Supabase y respaldo automático local
// =====================================================
import { supabase } from '@/lib/supabase';
import type {
  VibeCampaign,
  CreateCampaignInput,
  CampaignSummaryStats,
  ApiResult,
} from '../types';

const TABLE = 'vibe_campaigns';
const STORAGE_KEY = 'safelink_vibe_campaigns_cache';

// Plantillas predeterminadas de SafeLink para iniciar rápido
const DEFAULT_CAMPAIGNS: VibeCampaign[] = [
  {
    id: 'camp-seguridad-q4',
    name: 'Cámaras de Seguridad 360° para Consorcios',
    description: 'Campaña orientada a administraciones de consorcios destacando vigilancia nocturna en alta definición y disuasión de intrusiones.',
    service_target: 'seguridad',
    objective: 'lead_generation',
    status: 'active',
    channels: ['instagram_reels', 'instagram_feed'],
    start_date: '2026-10-01',
    end_date: '2026-11-30',
    target_audience: 'Administradores de consorcios, propietarios y encargados de edificios',
    budget: 450,
    metrics: {
      targetLeads: 15,
      estimatedReach: 8500,
      targetPieces: 4,
      completedPieces: 2,
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'camp-redes-wifi6',
    name: 'Conectividad & Cableado Estructurado WiFi 6',
    description: 'Promoción de infraestructura de redes de alta velocidad, ordenamiento de racks y cobertura inalámbrica para empresas y oficinas.',
    service_target: 'redes',
    objective: 'brand_awareness',
    status: 'planned',
    channels: ['instagram_feed', 'instagram_stories', 'web'],
    start_date: '2026-11-01',
    end_date: '2026-12-15',
    target_audience: 'Gerentes de IT, pymes, estudios contables y oficinas corporativas',
    budget: 350,
    metrics: {
      targetLeads: 10,
      estimatedReach: 5200,
      targetPieces: 3,
      completedPieces: 1,
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'camp-iluminacion-inteligente',
    name: 'Domótica & Iluminación Inteligente Eficiente',
    description: 'Automatización lumínica programable para reducir costos de energía en espacios comunes y áreas residenciales.',
    service_target: 'iluminacion',
    objective: 'seasonal_promo',
    status: 'draft',
    channels: ['instagram_reels', 'instagram_stories'],
    start_date: '2026-12-01',
    end_date: '2026-12-31',
    target_audience: 'Particulares, barrios cerrados y consorcios modernos',
    budget: 200,
    metrics: {
      targetLeads: 8,
      estimatedReach: 4000,
      targetPieces: 2,
      completedPieces: 0,
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getCachedCampaigns(): VibeCampaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CAMPAIGNS));
      return DEFAULT_CAMPAIGNS;
    }
    return JSON.parse(raw) as VibeCampaign[];
  } catch {
    return DEFAULT_CAMPAIGNS;
  }
}

function saveCachedCampaigns(campaigns: VibeCampaign[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch {
    // Ignorar si el almacenamiento local está deshabilitado
  }
}

// --- Listar campañas ---
export async function listCampaigns(): Promise<ApiResult<VibeCampaign[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        saveCachedCampaigns(data as VibeCampaign[]);
        return { ok: true, data: data as VibeCampaign[] };
      }
    }

    // Respaldo local
    const cached = getCachedCampaigns();
    return { ok: true, data: cached };
  } catch {
    return { ok: true, data: getCachedCampaigns() };
  }
}

// --- Obtener campaña por ID ---
export async function getCampaignById(id: string): Promise<ApiResult<VibeCampaign>> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return { ok: true, data: data as VibeCampaign };
    }
  } catch {
    // Continuar a caché
  }

  const cached = getCachedCampaigns();
  const match = cached.find((c) => c.id === id);
  if (match) return { ok: true, data: match };
  return { ok: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' };
}

// --- Crear nueva campaña ---
export async function createCampaign(
  input: CreateCampaignInput
): Promise<ApiResult<VibeCampaign>> {
  const { data: { user } } = await supabase.auth.getUser();

  const newCampaign: VibeCampaign = {
    id: crypto.randomUUID ? crypto.randomUUID() : `camp-${Date.now()}`,
    user_id: user?.id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    service_target: input.service_target,
    objective: input.objective,
    status: input.status || 'draft',
    channels: input.channels || ['instagram_reels', 'instagram_feed'],
    start_date: input.start_date || null,
    end_date: input.end_date || null,
    target_audience: input.target_audience?.trim() || null,
    budget: input.budget ?? null,
    metrics: input.metrics || {
      targetLeads: 0,
      estimatedReach: 0,
      targetPieces: 3,
      completedPieces: 0,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (user) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          name: newCampaign.name,
          description: newCampaign.description,
          service_target: newCampaign.service_target,
          objective: newCampaign.objective,
          status: newCampaign.status,
          channels: newCampaign.channels,
          start_date: newCampaign.start_date,
          end_date: newCampaign.end_date,
          target_audience: newCampaign.target_audience,
          budget: newCampaign.budget,
          metrics: newCampaign.metrics,
        })
        .select()
        .single();

      if (!error && data) {
        const created = data as VibeCampaign;
        const cached = getCachedCampaigns();
        saveCachedCampaigns([created, ...cached]);
        return { ok: true, data: created };
      }
    } catch {
      // Continuar con guardado local
    }
  }

  // Guardado local
  const cached = getCachedCampaigns();
  const updated = [newCampaign, ...cached];
  saveCachedCampaigns(updated);
  return { ok: true, data: newCampaign };
}

// --- Actualizar campaña ---
export async function updateCampaign(
  id: string,
  changes: Partial<VibeCampaign>
): Promise<ApiResult<VibeCampaign>> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        ...changes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      const updated = data as VibeCampaign;
      const cached = getCachedCampaigns();
      saveCachedCampaigns(cached.map((c) => (c.id === id ? updated : c)));
      return { ok: true, data: updated };
    }
  } catch {
    // Continuar a caché
  }

  const cached = getCachedCampaigns();
  const index = cached.findIndex((c) => c.id === id);
  if (index === -1) {
    return { ok: false, error: 'Campaña no encontrada', code: 'NOT_FOUND' };
  }

  const updatedItem: VibeCampaign = {
    ...cached[index],
    ...changes,
    updated_at: new Date().toISOString(),
  };
  cached[index] = updatedItem;
  saveCachedCampaigns([...cached]);
  return { ok: true, data: updatedItem };
}

// --- Eliminar campaña ---
export async function deleteCampaign(id: string): Promise<ApiResult<{ deleted: boolean }>> {
  try {
    await supabase.from(TABLE).delete().eq('id', id);
  } catch {
    // Continuar
  }

  const cached = getCachedCampaigns();
  saveCachedCampaigns(cached.filter((c) => c.id !== id));
  return { ok: true, data: { deleted: true } };
}

// --- Resumen y Estadísticas ---
export async function getCampaignStats(): Promise<ApiResult<CampaignSummaryStats>> {
  const result = await listCampaigns();
  if (!result.ok) {
    return {
      ok: true,
      data: { total: 0, active: 0, planned: 0, draft: 0, completed: 0, totalPieces: 0 },
    };
  }

  const campaigns = result.data;
  const stats: CampaignSummaryStats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === 'active').length,
    planned: campaigns.filter((c) => c.status === 'planned').length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    completed: campaigns.filter((c) => c.status === 'completed').length,
    totalPieces: campaigns.reduce((acc, c) => acc + (c.metrics.targetPieces || 0), 0),
  };

  return { ok: true, data: stats };
}
