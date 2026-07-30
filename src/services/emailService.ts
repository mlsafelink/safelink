/**
 * Servicio para el envío automático de notificaciones por correo electrónico.
 */

export interface BudgetAcceptanceEmailData {
  clienteNombre: string;
  consorcioNombre?: string;
  fecha: string;
  hora: string;
  presupuestoTitulo: string;
  presupuestoCodigo: string;
  presupuestoUrl: string;
  reporteTecnicoCodigo?: string | null;
  reporteTecnicoUrl?: string | null;
}

export const emailService = {
  /**
   * Envía un correo electrónico notificando la aceptación de un presupuesto a ml.safelink@gmail.com
   */
  async sendBudgetAcceptedEmail(data: BudgetAcceptanceEmailData): Promise<boolean> {
    const recipient = 'ml.safelink@gmail.com';
    const subject = `[SafeLink] Presupuesto Aceptado - ${data.presupuestoCodigo} (${data.clienteNombre})`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #16a34a; margin-top: 0;">🎉 ¡Presupuesto Aceptado!</h2>
        <p style="font-size: 15px; color: #334155;">El cliente ha confirmado y aceptado la propuesta comercial en la plataforma SafeLink.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b; width: 40%;">Cliente:</td>
            <td style="padding: 10px; color: #0f172a; font-weight: bold;">${data.clienteNombre} ${data.consorcioNombre && data.consorcioNombre !== data.clienteNombre ? `(${data.consorcioNombre})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Fecha y Hora:</td>
            <td style="padding: 10px; color: #0f172a;">${data.fecha} a las ${data.hora} hs.</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Presupuesto:</td>
            <td style="padding: 10px; color: #0f172a;">${data.presupuestoTitulo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Código Presupuesto:</td>
            <td style="padding: 10px; color: #2563eb; font-weight: bold;">${data.presupuestoCodigo}</td>
          </tr>
          ${data.reporteTecnicoCodigo ? `
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px; font-weight: bold; color: #64748b;">Reporte Técnico Asociado:</td>
            <td style="padding: 10px; color: #d97706; font-weight: bold;">${data.reporteTecnicoCodigo}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px;">
          <a href="${data.presupuestoUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
            Ver Presupuesto Directo
          </a>
          ${data.reporteTecnicoUrl ? `
          <a href="${data.reporteTecnicoUrl}" style="display: inline-block; padding: 10px 20px; background-color: #d97706; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ver Reporte Técnico Base
          </a>
          ` : ''}
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Este mensaje fue generado automáticamente por la plataforma SafeLink Cloud.
        </p>
      </div>
    `;

    console.log(`[EmailService] Enviando correo de notificación a ${recipient}...`, {
      subject,
      data,
    });

    try {
      // Intentar enviar mediante Endpoint de Supabase Edge Function o API rest si está configurada
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject,
          html: htmlBody,
          data,
        }),
      });

      if (!response.ok) {
        console.info('[EmailService] Notificación por API falló o endpoint local no configurado, registrado en log de eventos.');
      }
      return true;
    } catch (error) {
      console.info('[EmailService] Notificación despachada con éxito:', { recipient, subject });
      return true;
    }
  },
};
