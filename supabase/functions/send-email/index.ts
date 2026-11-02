// SafeLink — Edge Function: send-email
// Envía correos a través de Resend.
// Maneja:
// 1. Consultas desde el formulario de la landing page (consultas_web)
// 2. Alertas de seguridad SLS (si están debidamente formateadas)
// NUNCA envía correos vacíos o ante eventos de login ordinarios.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // Manejo de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('[send-email] RESEND_API_KEY no está configurada en los secrets');
      return new Response(JSON.stringify({ error: 'Servicio de email no configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json().catch(() => ({}));

    // ── Caso 1: Alerta legítima de seguridad SafeLink Security (SLS) ──
    if (body._sls_alert === true && body.html) {
      const to = body.to || 'ml.safelink@gmail.com';
      const subject = body.subject || '🔐 SafeLink Security — Alerta de seguridad';

      const result = await resend.emails.send({
        from: 'SafeLink Security <onboarding@resend.dev>',
        to: [to],
        subject,
        html: body.html,
      });

      return new Response(JSON.stringify({ ok: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Caso 2: Consulta web del formulario de la landing page ────────
    const { nombre, whatsapp, servicio, descripcion, monto_cotizado } = body;

    // VALIDACIÓN ESTRICTA:
    // Si no contiene nombre, whatsapp ni descripción, NO es una consulta válida.
    // Evita falsos envíos producidos por logins, webhooks accidentales o payloads vacíos.
    if (!nombre && !whatsapp && !descripcion) {
      console.warn('[send-email] Solicitud ignorada: no contiene datos de consulta válidos.', body);
      return new Response(JSON.stringify({ ok: false, error: 'Petición ignorada: datos insuficientes para consulta web' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const servicioLabels: Record<string, string> = {
      camaras: 'Cámaras de seguridad',
      iluminacion: 'Iluminación LED',
      redes: 'Redes e infraestructura',
      otro: 'Otro servicio',
    };

    const servicioNombre = servicioLabels[servicio] || servicio || 'Consulta general';
    const recipient = 'ml.safelink@gmail.com';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
        <h2 style="color: #2563eb; margin-top: 0;">📩 Nueva consulta desde el sitio web</h2>
        <p style="font-size: 15px; color: #475569;">Un usuario completó el formulario de contacto en SafeLink.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b; width: 35%;">Nombre:</td>
            <td style="padding: 10px; font-weight: bold; color: #0f172a;">${nombre || 'No especificado'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #64748b;">WhatsApp:</td>
            <td style="padding: 10px; color: #0f172a;">${whatsapp || 'No especificado'}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Servicio:</td>
            <td style="padding: 10px; color: #2563eb; font-weight: bold;">${servicioNombre}</td>
          </tr>
          ${monto_cotizado ? `
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Monto aprox:</td>
            <td style="padding: 10px; color: #0f172a;">$${monto_cotizado}</td>
          </tr>
          ` : ''}
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Descripción:</td>
            <td style="padding: 10px; color: #0f172a; white-space: pre-wrap;">${descripcion || 'Sin descripción'}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Este mensaje fue generado automáticamente por la plataforma SafeLink.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: 'SafeLink Web <onboarding@resend.dev>',
      to: [recipient],
      subject: `📩 Nueva consulta web: ${nombre || 'Interesado'} (${servicioNombre})`,
      html: htmlBody,
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[send-email] Error enviando email:', err);
    return new Response(JSON.stringify({ error: 'Error interno al enviar el email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

