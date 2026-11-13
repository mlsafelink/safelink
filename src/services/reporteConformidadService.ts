import { supabase } from '@/lib/supabase';

export type ReporteVersionEstado = 'pendiente' | 'aprobada' | 'modificada';

export type ReporteVersionHistorial = {
  id: string;
  reporte_id: string;
  version: number;
  sha256: string;
  estado: ReporteVersionEstado;
  created_at: string;
  accepted_at?: string | null;
  documento?: Record<string, any> | null;
};

export type ReporteSolicitudModificacion = {
  id: string;
  reporte_id: string;
  reporte_version_id?: string | null;
  descripcion: string;
  cliente_nombre?: string | null;
  created_at: string;
};

export type ReporteAceptacion = {
  id: string;
  reporte_id: string;
  reporte_version_id: string;
  sha256: string;
  cliente_nombre?: string | null;
  aceptado_at: string;
  created_at: string;
};

export type ReporteAceptacionResultado = {
  accepted: boolean;
  already_accepted: boolean;
  version: number;
  sha256: string;
  aceptado_at?: string | null;
  reporte_public_id?: string | null;
  reporte_id?: string;
};

export type ReporteModificacionResultado = {
  created: boolean;
  version: number;
  reporte_public_id?: string | null;
  reporte_id?: string;
};

/**
 * Resuelve el reporte a partir de su public_id, id o public_slug
 */
export async function resolveReporte(identifier: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase.from('reportes').select('id, version, titulo, cliente_nombre, public_id, public_slug').is('deleted_at', null);

  if (isUuid) {
    query = query.or(`public_id.eq.${identifier},id.eq.${identifier},public_slug.eq.${identifier}`);
  } else {
    query = query.eq('public_slug', identifier);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('[reporteConformidadService] Error buscando reporte:', error);
    return null;
  }
  return data;
}

/**
 * Obtiene el historial de versiones para un reporte (público o administrativo)
 */
export async function getReporteHistorial(identifier: string): Promise<ReporteVersionHistorial[]> {
  const reporte = await resolveReporte(identifier);
  if (!reporte) return [];

  const { data, error } = await supabase
    .from('reporte_versiones')
    .select('*')
    .eq('reporte_id', reporte.id)
    .order('version', { ascending: false });

  if (error) {
    // Si la tabla aún no existe en Supabase, retornar lista vacía sin romper la UI
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      console.warn('[reporteConformidadService] Tabla reporte_versiones pendiente de migración.');
      return [];
    }
    console.error('[reporteConformidadService] Error cargando versiones:', error);
    return [];
  }

  return (data || []) as ReporteVersionHistorial[];
}

/**
 * Obtiene las solicitudes de modificación recibidas para un reporte
 */
export async function getReporteSolicitudesModificacion(reporteId: string): Promise<ReporteSolicitudModificacion[]> {
  const { data, error } = await supabase
    .from('reporte_solicitudes_modificacion')
    .select('*')
    .eq('reporte_id', reporteId)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return [];
    }
    console.error('[reporteConformidadService] Error cargando solicitudes:', error);
    return [];
  }

  return (data || []) as ReporteSolicitudModificacion[];
}

/**
 * Obtiene las aceptaciones registradas para un reporte
 */
export async function getReporteAceptaciones(reporteId: string): Promise<ReporteAceptacion[]> {
  const { data, error } = await supabase
    .from('reporte_aceptaciones')
    .select('*')
    .eq('reporte_id', reporteId)
    .order('aceptado_at', { ascending: false });

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return [];
    }
    console.error('[reporteConformidadService] Error cargando aceptaciones:', error);
    return [];
  }

  return (data || []) as ReporteAceptacion[];
}

/**
 * Registra formalmente la conformidad del cliente con el reporte
 * Se ejecuta mediante RPC SECURITY DEFINER en el servidor.
 */
export async function aceptarReporte(identifier: string, clienteNombre?: string | null): Promise<ReporteAceptacionResultado> {
  const { data, error } = await supabase.rpc('register_reporte_aceptacion', {
    p_identifier: identifier,
    p_cliente_nombre: clienteNombre ?? null,
  });

  if (error) {
    if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
      throw new Error('La función de conformidad aún no ha sido aplicada en la base de datos Supabase. Ejecute la migración en Supabase SQL Editor.');
    }
    throw new Error(error.message || 'No se pudo registrar la aceptación.');
  }

  return data as ReporteAceptacionResultado;
}

/**
 * Registra una solicitud de modificación del cliente
 * Se ejecuta mediante RPC SECURITY DEFINER en el servidor.
 */
export async function solicitarModificacion(
  identifier: string,
  descripcion: string,
  clienteNombre?: string | null
): Promise<ReporteModificacionResultado> {
  const { data, error } = await supabase.rpc('register_reporte_modificacion', {
    p_identifier: identifier,
    p_descripcion: descripcion,
    p_cliente_nombre: clienteNombre ?? null,
  });

  if (error) {
    if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
      throw new Error('La función de modificación aún no ha sido aplicada en la base de datos Supabase. Ejecute la migración en Supabase SQL Editor.');
    }
    throw new Error(error.message || 'No se pudo enviar la solicitud.');
  }

  return data as ReporteModificacionResultado;
}

/**
 * Registra una respuesta de la administración asociada a la solicitud de modificación del reporte.
 * Se guarda en Supabase en `reporte_solicitudes_modificacion` vinculado al reporte.
 */
export async function responderSolicitudModificacion(
  reporteId: string,
  respuesta: string,
  emisor: string = 'SafeLink (Administración)'
): Promise<ReporteSolicitudModificacion | null> {
  const { data, error } = await supabase
    .from('reporte_solicitudes_modificacion')
    .insert({
      reporte_id: reporteId,
      descripcion: respuesta,
      cliente_nombre: emisor,
    })
    .select()
    .single();

  if (error) {
    console.error('[reporteConformidadService] Error respondiendo solicitud:', error);
    throw new Error(error.message || 'No se pudo enviar la respuesta.');
  }

  return data as ReporteSolicitudModificacion;
}
