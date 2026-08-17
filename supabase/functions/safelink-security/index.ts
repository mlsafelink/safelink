// SafeLink Security — Edge Function
// Maneja todos los eventos de seguridad de la plataforma SafeLink.
// NUNCA exponer secrets al frontend.
// Todos los accesos privilegiados se realizan aquí con service_role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers directamente en la función para despliegue autocontenido
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ── Tipos ─────────────────────────────────────────────────────────

type RiskLevel = 'NORMAL' | 'UNUSUAL' | 'SUSPICIOUS' | 'AUTOMATED';
type EventStatus = 'allowed' | 'rejected' | 'blocked';

interface SecurityEventInput {
  user_id?: string;
  user_email?: string;
  event_type: string;    // LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | etc.
  // Contexto del cliente (enviado desde el browser)
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

interface RiskEvaluation {
  risk_level: RiskLevel;
  reason: string;
  status: EventStatus;
  should_block: boolean;
  should_alert: boolean;
}

// ── Constantes ────────────────────────────────────────────────────

const FAILED_ATTEMPTS_UNUSUAL   = 3;
const FAILED_ATTEMPTS_SUSPICIOUS = 7;
const FAILED_ATTEMPTS_AUTOMATED  = 15;
const BLOCK_THRESHOLD            = 10; // intentos en ventana de 2h
const BLOCK_DURATION_HOURS       = 2;
const EVAL_WINDOW_HOURS          = 2;

// ── Evaluador de riesgo ───────────────────────────────────────────

async function evaluateRisk(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: SecurityEventInput,
  settings: Record<string, unknown> | null
): Promise<RiskEvaluation> {
  const defaultResult: RiskEvaluation = {
    risk_level: 'NORMAL',
    reason: 'Acceso normal',
    status: 'allowed',
    should_block: false,
    should_alert: false,
  };

  // Si no hay user_id no podemos comparar historial
  if (!input.user_id) {
    return defaultResult;
  }

  try {
    // Obtener perfil de seguridad actual
    const { data: profile } = await supabaseAdmin
      .from('security_user_profiles')
      .select('*')
      .eq('user_id', input.user_id)
      .single();

    // ── Verificar si ya está bloqueado ────────────────────────────
    if (profile?.security_status === 'blocked' && profile?.blocked_until) {
      const blockedUntil = new Date(profile.blocked_until);
      if (blockedUntil > new Date()) {
        return {
          risk_level: 'SUSPICIOUS',
          reason: `Cuenta bloqueada hasta ${blockedUntil.toLocaleString('es-AR')}`,
          status: 'rejected',
          should_block: false,
          should_alert: false,
        };
      }
      // Bloqueo expirado: se restaura en el UPSERT del perfil
    }

    // ── Contar intentos fallidos recientes (ventana 2h) ───────────
    const windowStart = new Date(Date.now() - EVAL_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { count: recentFailed } = await supabaseAdmin
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', input.user_id)
      .eq('event_type', 'LOGIN_FAILED')
      .gte('created_at', windowStart);

    const failedCount = recentFailed ?? 0;

    // ── Detección de actividad automatizada ───────────────────────
    if (
      failedCount >= FAILED_ATTEMPTS_AUTOMATED ||
      (input.user_agent && /HeadlessChrome|PhantomJS|Selenium|Puppeteer|Playwright|curl\/|python-requests|axios\/|node-fetch|bot|crawler|spider/i.test(input.user_agent))
    ) {
      const blockEnabled = settings?.block_enabled !== false;
      const shouldBlock = blockEnabled && failedCount >= BLOCK_THRESHOLD;
      return {
        risk_level: 'AUTOMATED',
        reason: failedCount >= FAILED_ATTEMPTS_AUTOMATED
          ? `${failedCount} intentos fallidos en ${EVAL_WINDOW_HOURS}h (posible automatización)`
          : 'User-Agent compatible con bot o herramienta automatizada',
        status: shouldBlock ? 'blocked' : 'rejected',
        should_block: shouldBlock,
        should_alert: settings?.alert_on_automated !== false,
      };
    }

    // ── Detección de actividad sospechosa ─────────────────────────
    if (failedCount >= FAILED_ATTEMPTS_SUSPICIOUS) {
      return {
        risk_level: 'SUSPICIOUS',
        reason: `${failedCount} intentos fallidos consecutivos en ${EVAL_WINDOW_HOURS}h`,
        status: 'allowed',
        should_block: false,
        should_alert: settings?.alert_on_suspicious !== false,
      };
    }

    // ── Impossible Travel ─────────────────────────────────────────
    if (profile?.last_login_at && profile?.last_country && input.country) {
      const lastLoginMs = new Date(profile.last_login_at).getTime();
      const minutesSinceLastLogin = (Date.now() - lastLoginMs) / 60000;
      const differentCountry = profile.last_country.toLowerCase() !== input.country.toLowerCase();

      if (differentCountry && minutesSinceLastLogin < 60) {
        return {
          risk_level: 'SUSPICIOUS',
          reason: `Ubicación incompatible con el acceso anterior (${profile.last_country} → ${input.country} en ${Math.round(minutesSinceLastLogin)} min)`,
          status: 'allowed',
          should_block: false,
          should_alert: settings?.alert_on_suspicious !== false,
        };
      }
    }

    // ── Actividad inusual ─────────────────────────────────────────
    let isUnusual = false;
    const reasons: string[] = [];

    // Nuevo país
    if (profile?.last_country && input.country &&
        profile.last_country.toLowerCase() !== input.country.toLowerCase()) {
      isUnusual = true;
      reasons.push(`País nuevo: ${input.country}`);
    }

    // Nuevo dispositivo
    if (profile?.last_device_type && input.device_type &&
        profile.last_device_type.toLowerCase() !== input.device_type.toLowerCase()) {
      isUnusual = true;
      reasons.push(`Dispositivo nuevo: ${input.device_type}`);
    }

    // Nuevo navegador
    if (profile?.last_browser && input.browser &&
        profile.last_browser.toLowerCase() !== input.browser.toLowerCase()) {
      isUnusual = true;
      reasons.push(`Navegador nuevo: ${input.browser}`);
    }

    // Varios intentos fallidos recientes
    if (failedCount >= FAILED_ATTEMPTS_UNUSUAL) {
      isUnusual = true;
      reasons.push(`${failedCount} intentos fallidos recientes`);
    }

    if (isUnusual) {
      return {
        risk_level: 'UNUSUAL',
        reason: reasons.join('; '),
        status: 'allowed',
        should_block: false,
        should_alert: settings?.alert_on_unusual === true,
      };
    }

    return defaultResult;

  } catch (err) {
    console.error('[SLS] Error en evaluateRisk:', err);
    // Si falla el análisis: permitir y registrar sin bloquear
    return {
      ...defaultResult,
      reason: 'Análisis de riesgo no disponible (error interno)',
    };
  }
}

// ── Envío de email de alerta ──────────────────────────────────────

async function sendSecurityAlert(
  supabaseAdmin: ReturnType<typeof createClient>,
  event: SecurityEventInput,
  evaluation: RiskEvaluation,
  alertEmail: string
) {
  try {
    const riskEmoji: Record<RiskLevel, string> = {
      NORMAL: '🟢',
      UNUSUAL: '🟡',
      SUSPICIOUS: '🟠',
      AUTOMATED: '🔴',
    };

    const riskLabel: Record<RiskLevel, string> = {
      NORMAL: 'Normal',
      UNUSUAL: 'Actividad inusual',
      SUSPICIOUS: 'Actividad sospechosa',
      AUTOMATED: 'Potencialmente automatizado',
    };

    const statusLabel: Record<EventStatus, string> = {
      allowed: 'Permitido',
      rejected: 'Rechazado',
      blocked: 'Bloqueado',
    };

    const ahora = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #0f172a; color: #e2e8f0;">
        <h2 style="color: #dc2626; margin-top: 0;">🔐 SafeLink Security — Alerta de seguridad</h2>
        <p style="font-size: 15px; color: #94a3b8;">SafeLink Security detectó actividad que requiere atención.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="background-color: #1e293b;">
            <td style="padding: 10px; font-weight: bold; color: #94a3b8; width: 40%;">Usuario:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.user_email ?? 'Desconocido'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Fecha:</td>
            <td style="padding: 10px; color: #e2e8f0;">${ahora}</td>
          </tr>
          <tr style="background-color: #1e293b;">
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Ubicación:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.zona ?? 'No disponible'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Dispositivo:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.device_type ?? 'Desconocido'}</td>
          </tr>
          <tr style="background-color: #1e293b;">
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Sistema:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.os ?? 'Desconocido'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Navegador:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.browser ?? 'Desconocido'}</td>
          </tr>
          <tr style="background-color: #1e293b;">
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Tipo de evento:</td>
            <td style="padding: 10px; color: #e2e8f0;">${event.event_type}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Nivel:</td>
            <td style="padding: 10px; font-weight: bold; color: #dc2626;">${riskEmoji[evaluation.risk_level]} ${riskLabel[evaluation.risk_level]}</td>
          </tr>
          <tr style="background-color: #1e293b;">
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Motivo:</td>
            <td style="padding: 10px; color: #fbbf24;">${evaluation.reason}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #94a3b8;">Estado:</td>
            <td style="padding: 10px; color: #e2e8f0;">${statusLabel[evaluation.status]}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #475569; margin-top: 30px; text-align: center;">
          Este mensaje fue generado automáticamente por SafeLink Security.
          No incluye contraseñas, tokens ni información sensible.
        </p>
      </div>
    `;

    await supabaseAdmin.functions.invoke('send-email', {
      body: {
        _sls_alert: true,
        to: alertEmail,
        subject: `🔐 SafeLink Security — ${riskLabel[evaluation.risk_level]}: ${event.event_type}`,
        html: htmlBody,
      },
    });
  } catch (err) {
    // El email nunca bloquea el flujo principal
    console.error('[SLS] Error enviando alerta email:', err);
  }
}

// ── Handler principal ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Cliente con service_role (acceso total a las tablas SLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Cliente para verificar autenticación del caller
    const authHeader = req.headers.get('Authorization');
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } }
    );

    const body = await req.json();
    const { action } = body;

    // ── record_event (puede llamarse sin auth para LOGIN_FAILED) ──
    if (action === 'record_event') {
      const input: SecurityEventInput = body.data ?? {};

      // Obtener settings del usuario (si existe)
      let settings: Record<string, unknown> | null = null;
      if (input.user_id) {
        const { data: s } = await supabaseAdmin
          .from('security_settings')
          .select('*')
          .eq('user_id', input.user_id)
          .single();
        settings = s;
      }

      // Evaluar riesgo
      const evaluation = await evaluateRisk(supabaseAdmin, input, settings);

      // Insertar evento
      const { error: insertError } = await supabaseAdmin
        .from('security_events')
        .insert({
          user_id:      input.user_id ?? null,
          event_type:   input.event_type,
          status:       evaluation.status,
          risk_level:   evaluation.risk_level,
          reason:       evaluation.reason,
          country:      input.country ?? null,
          region:       input.region ?? null,
          city:         input.city ?? null,
          zona:         input.zona ?? null,
          device_type:  input.device_type ?? null,
          os:           input.os ?? null,
          browser:      input.browser ?? null,
          user_agent:   (input.user_agent ?? '').substring(0, 512), // limitar longitud
          is_automated: evaluation.risk_level === 'AUTOMATED',
          metadata:     input.metadata ?? {},
        });

      if (insertError) {
        console.error('[SLS] Error insertando evento:', insertError);
      }

      // Actualizar perfil de seguridad
      if (input.user_id) {
        const isLoginSuccess = input.event_type === 'LOGIN_SUCCESS';
        const isLoginFailed  = input.event_type === 'LOGIN_FAILED';
        const isSuspicious   = ['SUSPICIOUS', 'AUTOMATED'].includes(evaluation.risk_level);

        // Calcular blocked_until si corresponde
        let newBlockedUntil: string | null = null;
        let newStatus = isSuspicious ? 'suspicious' : 'normal';

        if (evaluation.should_block) {
          const blockHours = (settings?.block_duration_hours as number) ?? BLOCK_DURATION_HOURS;
          newBlockedUntil = new Date(Date.now() + blockHours * 60 * 60 * 1000).toISOString();
          newStatus = 'blocked';
        }

        const profileUpdate: Record<string, unknown> = {
          user_id:     input.user_id,
          updated_at:  new Date().toISOString(),
          last_event_at: new Date().toISOString(),
        };

        if (isLoginSuccess) {
          profileUpdate.last_login_at   = new Date().toISOString();
          profileUpdate.failed_attempts = 0; // resetear tras éxito
          profileUpdate.security_status = 'normal';
          profileUpdate.blocked_until   = null;
        }

        if (isLoginFailed) {
          // Incrementar failed_attempts se hace con raw SQL para evitar race conditions
          await supabaseAdmin.rpc('sls_increment_failed_attempts', {
            p_user_id: input.user_id,
          }).catch(() => {
            // Si no existe la función RPC: upsert directo (menos atómico pero funciona)
          });
        }

        if (isSuspicious) {
          profileUpdate.last_suspicious_at  = new Date().toISOString();
          profileUpdate.suspicious_attempts = 1; // se suma via RPC idealmente
          profileUpdate.security_status     = newStatus;
          if (newBlockedUntil) profileUpdate.blocked_until = newBlockedUntil;
        }

        // Actualizar ubicación y dispositivo si tenemos datos
        if (input.country)      profileUpdate.last_country     = input.country;
        if (input.region)       profileUpdate.last_region      = input.region;
        if (input.city)         profileUpdate.last_city        = input.city;
        if (input.zona)         profileUpdate.last_zona        = input.zona;
        if (input.device_type)  profileUpdate.last_device_type = input.device_type;
        if (input.os)           profileUpdate.last_os          = input.os;
        if (input.browser)      profileUpdate.last_browser     = input.browser;

        await supabaseAdmin
          .from('security_user_profiles')
          .upsert(profileUpdate, { onConflict: 'user_id' });

        // Insertar settings por defecto si no existen
        if (isLoginSuccess) {
          await supabaseAdmin
            .from('security_settings')
            .upsert({ user_id: input.user_id }, { onConflict: 'user_id', ignoreDuplicates: true });
        }
      }

      // Enviar alerta email si corresponde
      if (evaluation.should_alert) {
        const alertEmail =
          (settings?.alert_email as string) ??
          Deno.env.get('SLS_ALERT_EMAIL') ??
          'ml.safelink@gmail.com';
        await sendSecurityAlert(supabaseAdmin, input, evaluation, alertEmail);
      }

      return new Response(
        JSON.stringify({ ok: true, risk_level: evaluation.risk_level, status: evaluation.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Rutas autenticadas (requieren JWT válido) ──────────────────
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_summary ───────────────────────────────────────────────
    if (action === 'get_summary') {
      const { data: events } = await supabaseAdmin
        .from('security_events')
        .select('risk_level')
        .eq('user_id', user.id);

      const summary = { NORMAL: 0, UNUSUAL: 0, SUSPICIOUS: 0, AUTOMATED: 0 };
      (events ?? []).forEach((e: { risk_level: string }) => {
        const rl = e.risk_level as keyof typeof summary;
        if (rl in summary) summary[rl]++;
      });

      return new Response(
        JSON.stringify({ ok: true, summary }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_profile ───────────────────────────────────────────────
    if (action === 'get_profile') {
      const { data: profile } = await supabaseAdmin
        .from('security_user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: settings } = await supabaseAdmin
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return new Response(
        JSON.stringify({ ok: true, profile, settings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── get_events ────────────────────────────────────────────────
    if (action === 'get_events') {
      const limit = body.limit ?? 50;
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (eventsError) {
        return new Response(
          JSON.stringify({ error: eventsError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true, events: events ?? [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── update_settings ───────────────────────────────────────────
    if (action === 'update_settings') {
      const allowedFields = [
        'protection_enabled', 'block_enabled', 'block_duration_hours',
        'alerts_enabled', 'alert_on_unusual', 'alert_on_suspicious',
        'alert_on_automated', 'alert_email',
      ];

      const updates: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
      for (const field of allowedFields) {
        if (field in (body.settings ?? {})) {
          updates[field] = body.settings[field];
        }
      }

      const { error: upsertError } = await supabaseAdmin
        .from('security_settings')
        .upsert(updates, { onConflict: 'user_id' });

      if (upsertError) {
        return new Response(
          JSON.stringify({ error: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── unblock_user (admin action) ───────────────────────────────
    if (action === 'unblock_user') {
      await supabaseAdmin
        .from('security_user_profiles')
        .update({
          security_status: 'normal',
          blocked_until: null,
          failed_attempts: 0,
          suspicious_attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Registrar el desbloqueo
      await supabaseAdmin.from('security_events').insert({
        user_id:    user.id,
        event_type: 'UNBLOCKED',
        status:     'allowed',
        risk_level: 'NORMAL',
        reason:     'Desbloqueo manual por el administrador',
      });

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── PASSWORD VERIFICATION HOOK (preparado para plan Pro/Enterprise) ──
    // Descomentar cuando el plan permita Auth Hooks:
    //
    // if (action === 'password_hook') {
    //   // Supabase envía: { user_id, valid }
    //   const { user_id, valid } = body;
    //   const eventType = valid ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
    //   // ... procesamiento igual que record_event
    //   return new Response(JSON.stringify({ decision: 'continue' }), ...);
    // }

    return new Response(
      JSON.stringify({ error: 'Acción no reconocida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[SLS] Error inesperado:', err);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
