/**
 * SafeLink Security Service
 *
 * Wrapper frontend para la Edge Function safelink-security.
 * Reutiliza el cliente Supabase existente (src/lib/supabase.ts).
 *
 * IMPORTANTE:
 * - Todas las operaciones privilegiadas se delegan a la Edge Function.
 * - Ningún secret se expone en este archivo.
 * - recordEvent() es SIEMPRE fire-and-forget: nunca interrumpe el login.
 */

import { supabase } from '@/lib/supabase';

// ── Tipos exportados ─────────────────────────────────────────────

export type SLSRiskLevel = 'NORMAL' | 'UNUSUAL' | 'SUSPICIOUS' | 'AUTOMATED';
export type SLSEventStatus = 'allowed' | 'rejected' | 'blocked';

export interface SLSEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  status: SLSEventStatus;
  risk_level: SLSRiskLevel;
  reason: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  zona: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  is_automated: boolean;
  created_at: string;
}

export interface SLSProfile {
  user_id: string;
  security_status: 'normal' | 'blocked' | 'suspicious';
  blocked_until: string | null;
  last_login_at: string | null;
  last_event_at: string | null;
  last_suspicious_at: string | null;
  last_country: string | null;
  last_region: string | null;
  last_city: string | null;
  last_zona: string | null;
  last_device_type: string | null;
  last_os: string | null;
  last_browser: string | null;
  failed_attempts: number;
  suspicious_attempts: number;
  updated_at: string;
}

export interface SLSSettings {
  user_id: string;
  protection_enabled: boolean;
  block_enabled: boolean;
  block_duration_hours: number;
  alerts_enabled: boolean;
  alert_on_unusual: boolean;
  alert_on_suspicious: boolean;
  alert_on_automated: boolean;
  alert_email: string | null;
}

export interface SLSSummary {
  NORMAL: number;
  UNUSUAL: number;
  SUSPICIOUS: number;
  AUTOMATED: number;
}

export interface SLSEventInput {
  user_id?: string;
  user_email?: string;
  event_type: string;
  zona?: string;
  country?: string;
  region?: string;
  city?: string;
  device_type?: string;
  os?: string;
  browser?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
}

// ── Helpers de detección del cliente ─────────────────────────────
// Reutilizados del sistema existente de visitas_web (landingService.ts)

function detectDeviceType(): string {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua) && screen.width <= 1024);
  if (isTablet) return 'Tablet';
  if (isMobile) return 'Móvil';
  const isNotebook = window.screen.width <= 1536 && window.screen.height <= 900;
  const hasBattery = 'getBattery' in navigator;
  if (hasBattery || isNotebook) return 'Notebook';
  return 'PC';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) { const m = ua.match(/Android ([\d.]+)/); return m ? `Android ${m[1]}` : 'Android'; }
  if (/iPhone|iPad|iPod/.test(ua)) { const m = ua.match(/OS ([\d_]+)/); return m ? `iOS ${m[1].replace(/_/g, '.')}` : 'iOS'; }
  if (/Linux/.test(ua)) return 'Linux';
  return 'Desconocido';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/SamsungBrowser/.test(ua)) return 'Samsung Internet';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  return 'Desconocido';
}

async function getGeoContext(): Promise<{
  zona: string; country: string; region: string; city: string;
}> {
  // Intento 1: ipwho.is (misma lógica que landingService)
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
    clearTimeout(tid);
    if (res.ok) {
      const d = await res.json();
      if (d && d.success !== false) {
        return {
          zona: [d.city, d.region, d.country].filter(Boolean).join(', ') || 'Desconocida',
          country: d.country ?? 'Desconocido',
          region:  d.region  ?? 'Desconocido',
          city:    d.city    ?? 'Desconocida',
        };
      }
    }
  } catch { /* continuar */ }

  // Intento 2: ipapi.co
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
    clearTimeout(tid);
    if (res.ok) {
      const d = await res.json();
      if (d && !d.error) {
        return {
          zona: [d.city, d.region, d.country_name].filter(Boolean).join(', ') || 'Desconocida',
          country: d.country_name ?? 'Desconocido',
          region:  d.region       ?? 'Desconocido',
          city:    d.city         ?? 'Desconocida',
        };
      }
    }
  } catch { /* continuar */ }

  // Fallback
  return { zona: 'Ubicación no disponible', country: 'Desconocido', region: 'Desconocido', city: 'Desconocida' };
}

// ── Servicio ──────────────────────────────────────────────────────

export const securityService = {

  /**
   * Registra un evento de seguridad.
   * SIEMPRE fire-and-forget: nunca lanza error al caller.
   * Se llama desde Login.tsx post-signIn, sin interferir con el flujo de auth.
   */
  async recordEvent(input: SLSEventInput): Promise<void> {
    try {
      // Enriquecer con datos del dispositivo
      const geo = await getGeoContext();
      const enriched: SLSEventInput = {
        ...input,
        device_type: input.device_type ?? detectDeviceType(),
        os:          input.os          ?? detectOS(),
        browser:     input.browser     ?? detectBrowser(),
        user_agent:  input.user_agent  ?? navigator.userAgent.substring(0, 512),
        zona:        input.zona        ?? geo.zona,
        country:     input.country     ?? geo.country,
        region:      input.region      ?? geo.region,
        city:        input.city        ?? geo.city,
      };

      await supabase.functions.invoke('safelink-security', {
        body: { action: 'record_event', data: enriched },
      });
    } catch (err) {
      // Silenciar: SLS nunca bloquea el login
      console.warn('[SLS] recordEvent falló (no crítico):', err);
    }
  },

  /**
   * Obtiene el resumen de conteos por nivel de riesgo.
   * Para los indicadores del panel SLS.
   */
  async getSummary(): Promise<SLSSummary> {
    const empty: SLSSummary = { NORMAL: 0, UNUSUAL: 0, SUSPICIOUS: 0, AUTOMATED: 0 };
    try {
      const { data, error } = await supabase.functions.invoke('safelink-security', {
        body: { action: 'get_summary' },
      });
      if (error) throw error;
      return (data as { summary: SLSSummary }).summary ?? empty;
    } catch (err) {
      console.warn('[SLS] getSummary falló:', err);
      return empty;
    }
  },

  /**
   * Obtiene el perfil de seguridad del usuario actual y sus settings.
   */
  async getProfile(): Promise<{ profile: SLSProfile | null; settings: SLSSettings | null }> {
    try {
      const { data, error } = await supabase.functions.invoke('safelink-security', {
        body: { action: 'get_profile' },
      });
      if (error) throw error;
      return {
        profile:  (data as { profile: SLSProfile | null }).profile  ?? null,
        settings: (data as { settings: SLSSettings | null }).settings ?? null,
      };
    } catch (err) {
      console.warn('[SLS] getProfile falló:', err);
      return { profile: null, settings: null };
    }
  },

  /**
   * Obtiene el historial de eventos de seguridad.
   */
  async getEvents(limit = 50): Promise<SLSEvent[]> {
    try {
      const { data, error } = await supabase.functions.invoke('safelink-security', {
        body: { action: 'get_events', limit },
      });
      if (error) throw error;
      return (data as { events: SLSEvent[] }).events ?? [];
    } catch (err) {
      console.warn('[SLS] getEvents falló:', err);
      return [];
    }
  },

  /**
   * Actualiza la configuración SLS del usuario.
   */
  async updateSettings(settings: Partial<Omit<SLSSettings, 'user_id'>>): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('safelink-security', {
        body: { action: 'update_settings', settings },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[SLS] updateSettings falló:', err);
      return false;
    }
  },

  /**
   * Desbloquea manualmente la cuenta del usuario autenticado.
   */
  async unblockUser(): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('safelink-security', {
        body: { action: 'unblock_user' },
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[SLS] unblockUser falló:', err);
      return false;
    }
  },
};
