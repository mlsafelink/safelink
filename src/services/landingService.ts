import { supabase } from '@/lib/supabase';

// ────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────
export type ServicioTipo = 'camaras' | 'iluminacion' | 'redes' | 'otro';
export type ConsultaEstado = 'pendiente' | 'atendida';

export type ConsultaWeb = {
  id: string;
  nombre: string;
  whatsapp: string;
  servicio: ServicioTipo;
  descripcion: string;
  monto_cotizado?: number | null;
  estado: ConsultaEstado;
  origen: string;
  created_at: string;
  updated_at: string;
};

export type ConsultaInsert = Omit<ConsultaWeb, 'id' | 'estado' | 'origen' | 'created_at' | 'updated_at'>;

export type EstadisticasSitio = {
  visitas_total: number;
  visitas_hoy: number;
  visitas_semana: number;
  visitas_mes: number;
  consultas_total: number;
  consultas_pendientes: number;
  consultas_atendidas: number;
  consultas_por_servicio: {
    camaras: number;
    iluminacion: number;
    redes: number;
    otro: number;
  };
  conversion: number;
};

export type VisitaDetalle = {
  id: string;
  session_id: string;
  created_at: string;
  dispositivo?: 'PC' | 'Notebook' | 'Móvil' | 'Tablet' | string | null;
  zona?: string | null;
};

export type ResumenDispositivos = {
  pc: number;
  notebook: number;
  movil: number;
  tablet: number;
};

export type ResumenGeograficoItem = {
  zona: string;
  visitas: number;
};

// Clave de sessionStorage para evitar doble conteo
const SESSION_VISIT_KEY = 'sl_visit_registered';
const VISIT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutos

// ── Helpers para detección de dispositivo y zona ──────────────
function detectDeviceType(): 'PC' | 'Notebook' | 'Móvil' | 'Tablet' {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (navigator.maxTouchPoints > 0 && /Macintosh/i.test(ua) && screen.width <= 1024);

  if (isTablet) return 'Tablet';
  if (isMobile) return 'Móvil';

  const isNotebookScreen = window.screen.width <= 1536 && window.screen.height <= 900;
  const hasBattery = 'getBattery' in navigator;
  const hasTouch = navigator.maxTouchPoints > 0;

  if (hasBattery || (isNotebookScreen && hasTouch)) {
    return 'Notebook';
  }
  return isNotebookScreen ? 'Notebook' : 'PC';
}

async function getZonaAproximada(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const parts = [data.city, data.region, data.country].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }
  } catch {
    // Fallback
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        const parts = [data.city, data.region, data.country_name].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    }
  } catch {
    // Fallback
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Buenos_Aires') || tz.includes('Argentina')) {
      return 'Buenos Aires, Argentina';
    }
    return tz.replace(/_/g, ' ');
  } catch {
    return 'Desconocida';
  }
}

// ────────────────────────────────────────────────────────────
// SERVICIO
// ────────────────────────────────────────────────────────────
export const landingService = {
  /**
   * Registra una visita evitando contar múltiples recargas
   * consecutivas del mismo navegador en 30 minutos.
   */
  async registrarVisita(): Promise<void> {
    try {
      const now = Date.now();
      const lastVisit = sessionStorage.getItem(SESSION_VISIT_KEY);

      if (lastVisit) {
        const elapsed = now - parseInt(lastVisit, 10);
        if (elapsed < VISIT_COOLDOWN_MS) return; // cooldown activo
      }

      // Generar o recuperar sessionId persistente en sessionStorage
      let sessionId = sessionStorage.getItem('sl_session_id');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem('sl_session_id', sessionId);
      }

      const dispositivo = detectDeviceType();
      const zona = await getZonaAproximada();

      const { error } = await supabase
        .from('visitas_web')
        .insert({
          session_id: sessionId,
          dispositivo,
          zona,
        });

      if (!error) {
        sessionStorage.setItem(SESSION_VISIT_KEY, now.toString());
      }
    } catch (e) {
      // No bloqueamos la landing si falla el tracking
      console.warn('Error al registrar visita:', e);
    }
  },

  /**
   * Guarda una consulta del formulario público y crea
   * una notificación en eventos_sistema.
   */
  async createConsulta(data: ConsultaInsert): Promise<ConsultaWeb> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('consultas_web')
      .insert({
        id,
        nombre: data.nombre,
        whatsapp: data.whatsapp,
        servicio: data.servicio,
        descripcion: data.descripcion,
        monto_cotizado: data.monto_cotizado ?? null,
      });

    if (error) {
      console.error('Error creando consulta:', error);
      throw error;
    }

    const consulta: ConsultaWeb = {
      id,
      nombre: data.nombre,
      whatsapp: data.whatsapp,
      servicio: data.servicio,
      descripcion: data.descripcion,
      monto_cotizado: data.monto_cotizado ?? null,
      estado: 'pendiente',
      origen: 'sitio_web',
      created_at: now,
      updated_at: now,
    };

    // Crear notificación en el sistema existente
    try {
      await supabase.from('eventos_sistema').insert({
        tipo: 'consulta_web',
        cliente_nombre: data.nombre,
        detalles: {
          whatsapp: data.whatsapp,
          servicio: data.servicio,
          descripcion: data.descripcion,
          monto_cotizado: data.monto_cotizado ?? null,
          consulta_id: id,
          origen: 'sitio_web',
          estado: 'pendiente',
        },
      });
    } catch (e) {
      // La consulta ya se guardó; no propagamos el error de la notificación
      console.warn('Error creando evento de notificación:', e);
    }

    // Enviar notificación por email mediante Edge Function (send-email)
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          nombre: data.nombre,
          whatsapp: data.whatsapp,
          servicio: data.servicio,
          descripcion: data.descripcion,
          monto_cotizado: data.monto_cotizado ?? null,
          consulta_id: id,
        },
      });
    } catch (e) {
      console.warn('Error al invocar Edge Function send-email:', e);
    }

    return consulta;
  },

  /**
   * Marca una consulta como atendida.
   */
  async marcarAtendida(consultaId: string): Promise<void> {
    const { error } = await supabase
      .from('consultas_web')
      .update({ estado: 'atendida', updated_at: new Date().toISOString() })
      .eq('id', consultaId);

    if (error) throw error;
  },

  /**
   * Obtiene estadísticas del sitio para el dashboard admin.
   */
  async getEstadisticas(): Promise<EstadisticasSitio> {
    const ahora = new Date();
    const inicioDia = new Date(ahora);
    inicioDia.setHours(0, 0, 0, 0);
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - 7);
    const inicioMes = new Date(ahora);
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const [
      { count: visitasTotal },
      { count: visitasHoy },
      { count: visitasSemana },
      { count: visitasMes },
      { data: consultas },
    ] = await Promise.all([
      supabase.from('visitas_web').select('*', { count: 'exact', head: true }),
      supabase.from('visitas_web').select('*', { count: 'exact', head: true }).gte('created_at', inicioDia.toISOString()),
      supabase.from('visitas_web').select('*', { count: 'exact', head: true }).gte('created_at', inicioSemana.toISOString()),
      supabase.from('visitas_web').select('*', { count: 'exact', head: true }).gte('created_at', inicioMes.toISOString()),
      supabase.from('consultas_web').select('servicio, estado'),
    ]);

    const consultasArr = (consultas ?? []) as { servicio: string; estado: string }[];
    const total = consultasArr.length;
    const pendientes = consultasArr.filter(c => c.estado === 'pendiente').length;
    const atendidas = consultasArr.filter(c => c.estado === 'atendida').length;

    const por_servicio = {
      camaras: consultasArr.filter(c => c.servicio === 'camaras').length,
      iluminacion: consultasArr.filter(c => c.servicio === 'iluminacion').length,
      redes: consultasArr.filter(c => c.servicio === 'redes').length,
      otro: consultasArr.filter(c => c.servicio === 'otro').length,
    };

    const vTotal = visitasTotal ?? 0;
    const conversion = vTotal > 0 ? Math.round((total / vTotal) * 100 * 10) / 10 : 0;

    return {
      visitas_total: vTotal,
      visitas_hoy: visitasHoy ?? 0,
      visitas_semana: visitasSemana ?? 0,
      visitas_mes: visitasMes ?? 0,
      consultas_total: total,
      consultas_pendientes: pendientes,
      consultas_atendidas: atendidas,
      consultas_por_servicio: por_servicio,
      conversion,
    };
  },

  /**
   * Lista todas las consultas para el admin.
   */
  async getConsultas(): Promise<ConsultaWeb[]> {
    const { data, error } = await supabase
      .from('consultas_web')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo consultas:', error);
      return [];
    }
    return data as ConsultaWeb[];
  },

  /**
   * Obtiene el detalle de visitantes (dispositivo, zona, fecha) para el admin.
   */
  async getDetalleVisitantes(): Promise<{
    visitas: VisitaDetalle[];
    resumenDispositivos: ResumenDispositivos;
    resumenGeografico: ResumenGeograficoItem[];
  }> {
    const { data, error } = await supabase
      .from('visitas_web')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error al obtener detalle de visitantes:', error);
      return {
        visitas: [],
        resumenDispositivos: { pc: 0, notebook: 0, movil: 0, tablet: 0 },
        resumenGeografico: [],
      };
    }

    const visitas = (data as VisitaDetalle[]) || [];

    const resumenDispositivos: ResumenDispositivos = {
      pc: 0,
      notebook: 0,
      movil: 0,
      tablet: 0,
    };

    const geoMap: Record<string, number> = {};

    visitas.forEach(v => {
      const disp = (v.dispositivo || '').toLowerCase();
      if (disp === 'pc') resumenDispositivos.pc++;
      else if (disp === 'notebook') resumenDispositivos.notebook++;
      else if (disp === 'móvil' || disp === 'movil') resumenDispositivos.movil++;
      else if (disp === 'tablet') resumenDispositivos.tablet++;

      const z = v.zona || 'Desconocida';
      geoMap[z] = (geoMap[z] || 0) + 1;
    });

    const resumenGeografico: ResumenGeograficoItem[] = Object.entries(geoMap)
      .map(([zona, count]) => ({ zona, visitas: count }))
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);

    return {
      visitas,
      resumenDispositivos,
      resumenGeografico,
    };
  },
};
