import { supabase } from '@/lib/supabase';

// ---- Tipos base ----
export type DocumentStatus = 'draft' | 'published';

export type Reporte = {
  id: string;
  consorcio_id: string;
  public_id: string;
  codigo?: string | null;
  fecha: string;
  titulo: string;
  motivo: string | null;
  descripcion: string | null;
  diagnostico: string | null;
  trabajo_realizado: string | null;
  recomendaciones: string | null;
  conclusiones: string | null;
  fotografias: string[];
  observaciones: string | null;

  // Campos de plantilla y soporte
  equipo_relevado: string | null;
  inspeccion_realizada: string | null;
  cliente_nombre: string | null;
  cliente_direccion: string | null;
  fecha_instalacion: string | null;
  tecnico_nombre: string | null;
  url_sitio_web: string | null;
  telefono_soporte: string | null;
  email_soporte: string | null;
  horario_soporte: string | null;

  version: number;
  created_at: string;
  // JOIN
  consorcios?: { nombre: string; direccion?: string; administraciones?: { nombre: string } };
};

export type PresupuestoEstado = 'enviado' | 'visto' | 'compartido' | 'aceptado';

export type Presupuesto = {
  id: string;
  consorcio_id: string;
  public_id: string;
  reporte_id?: string | null;
  codigo?: string | null;
  titulo: string;
  fecha: string;
  materiales: MaterialItem[];
  mano_obra: number;
  descuentos: number;
  total: number;
  validez: string | null;
  garantia: string | null;
  condiciones: string | null;
  observaciones: string | null;
  descripcion: string | null;
  telefono_soporte: string | null;
  email_soporte: string | null;
  horario_soporte: string | null;
  url_sitio_web: string | null;
  estado?: PresupuestoEstado;
  aceptado_at?: string | null;
  version: number;
  created_at: string;
  consorcios?: { nombre: string; direccion?: string; administraciones?: { nombre: string } };
  reportes?: Reporte | null;
};

export type MaterialItem = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type ReporteTrabajo = {
  id: string;
  consorcio_id: string;
  public_id: string;
  codigo?: string | null;
  fecha: string;
  titulo: string;
  tecnico_nombre: string | null;
  cliente_nombre: string | null;
  cliente_direccion: string | null;
  descripcion_trabajos: string | null;
  equipamiento_instalado: string | null;
  materiales_utilizados: string | null;
  configuraciones_realizadas: string | null;
  observaciones: string | null;
  fotografias: string[];
  garantia: string | null;
  firmas: any[];
  presupuesto_id?: string | null;
  reporte_id?: string | null;
  url_sitio_web: string | null;
  telefono_soporte: string | null;
  email_soporte: string | null;
  horario_soporte: string | null;
  version: number;
  created_at: string;
  consorcios?: { nombre: string; direccion?: string; administraciones?: { nombre: string } };
  presupuestos?: Presupuesto | null;
  reportes?: Reporte | null;
};

export type Instructivo = {
  id: string;
  consorcio_id: string;
  public_id: string;
  titulo: string;
  contenido?: InstructivoBloque[] | null;

  nombre_app: string | null;
  texto_descarga: string | null;
  url_google_play: string | null;
  url_app_store: string | null;
  texto_post_instalacion: string | null;
  qr_image_url: string | null;
  nombre_dispositivo: string | null;
  usuario_dispositivo: string | null;
  password_dispositivo: string | null;
  cliente_nombre: string | null;
  cliente_direccion: string | null;
  fecha_instalacion: string | null;
  tecnico_nombre: string | null;
  url_sitio_web: string | null;
  telefono_soporte: string | null;
  email_soporte: string | null;
  horario_soporte: string | null;
  numero_serie: string | null;

  version: number;
  created_at: string;
  consorcios?: { nombre: string; administraciones?: { nombre: string } };
};

export type InstructivoBloque = {
  tipo: 'texto' | 'imagen' | 'titulo';
  contenido: string;
};

// ---- Función de generación de Códigos Únicos ----
export async function generateUniqueDocCode(
  prefix: 'RT' | 'PRES' | 'RTE',
  tableName: 'reportes' | 'presupuestos' | 'reportes_trabajo'
): Promise<string> {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const searchPattern = `${prefix}-${todayStr}-%`;

  let maxSeq = 0;
  try {
    const { data } = await supabase
      .from(tableName)
      .select('codigo')
      .like('codigo', searchPattern)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      for (const item of data) {
        if (item.codigo) {
          const parts = item.codigo.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error al verificar código secuencial:', e);
  }

  if (maxSeq === 0) {
    try {
      const { count } = await supabase
        .from(tableName)
        .select('id', { count: 'exact', head: true });
      maxSeq = count || 0;
    } catch {
      maxSeq = 0;
    }
  }

  const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
  return `${prefix}-${todayStr}-${nextSeq}`;
}

// ---- Servicios ----
export const reporteService = {
  async getAll() {
    const { data, error } = await supabase
      .from('reportes')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Reporte[];
  },

  async getByPublicId(publicId: string) {
    const { data, error } = await supabase
      .from('reportes')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Reporte & { consorcios: { nombre: string; direccion?: string; administraciones: { nombre: string } } };
  },

  async create(reporte: Partial<Reporte>) {
    if (!reporte.codigo) {
      reporte.codigo = await generateUniqueDocCode('RT', 'reportes');
    }
    const { data, error } = await supabase
      .from('reportes')
      .insert(reporte)
      .select()
      .single();
    if (error) throw error;
    return data as Reporte;
  },

  async update(id: string, reporte: Partial<Reporte>) {
    const { data, error } = await supabase
      .from('reportes')
      .update(reporte)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Reporte;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('reportes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};

export const presupuestoService = {
  async getAll() {
    let { data, error } = await supabase
      .from('presupuestos')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre)), reportes (id, codigo, titulo, public_id)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback if 'reportes' FK relationship does not exist in PostgREST schema cache
      const res = await supabase
        .from('presupuestos')
        .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      data = res.data;
    }
    return data as Presupuesto[];
  },

  async getByPublicId(publicId: string) {
    let { data, error } = await supabase
      .from('presupuestos')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre)), reportes (id, codigo, titulo, public_id)`)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      const res = await supabase
        .from('presupuestos')
        .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
        .eq('public_id', publicId)
        .is('deleted_at', null)
        .single();
      if (res.error) throw res.error;
      data = res.data;
    }
    return data as Presupuesto & {
      consorcios: { nombre: string; direccion?: string; administraciones: { nombre: string } };
      reportes?: { id: string; codigo?: string; titulo: string; public_id: string } | null;
    };
  },

  async create(presupuesto: Partial<Presupuesto>) {
    const codigo = presupuesto.codigo || (await generateUniqueDocCode('PRES', 'presupuestos'));
    const payload = {
      estado: 'enviado' as PresupuestoEstado,
      codigo,
      ...presupuesto,
    };
    const { data, error } = await supabase
      .from('presupuestos')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Presupuesto;
  },

  async update(id: string, presupuesto: Partial<Presupuesto>) {
    const { data, error } = await supabase
      .from('presupuestos')
      .update(presupuesto)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Presupuesto;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('presupuestos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};

export const reporteTrabajoService = {
  async getAll() {
    let { data, error } = await supabase
      .from('reportes_trabajo')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre)), presupuestos (id, codigo, titulo, public_id), reportes (id, codigo, titulo, public_id)`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      const res = await supabase
        .from('reportes_trabajo')
        .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (res.error) return (res.data || []) as ReporteTrabajo[];
      data = res.data;
    }
    return data as ReporteTrabajo[];
  },

  async getByPublicId(publicId: string) {
    let { data, error } = await supabase
      .from('reportes_trabajo')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre)), presupuestos (id, codigo, titulo, public_id), reportes (id, codigo, titulo, public_id)`)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      const res = await supabase
        .from('reportes_trabajo')
        .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
        .eq('public_id', publicId)
        .is('deleted_at', null)
        .single();
      if (res.error) throw res.error;
      data = res.data;
    }
    return data as ReporteTrabajo & {
      consorcios: { nombre: string; direccion?: string; administraciones: { nombre: string } };
      presupuestos?: { id: string; codigo?: string; titulo: string; public_id: string } | null;
      reportes?: { id: string; codigo?: string; titulo: string; public_id: string } | null;
    };
  },

  async create(reporteTrabajo: Partial<ReporteTrabajo>) {
    if (!reporteTrabajo.codigo) {
      reporteTrabajo.codigo = await generateUniqueDocCode('RTE', 'reportes_trabajo');
    }
    const { data, error } = await supabase
      .from('reportes_trabajo')
      .insert(reporteTrabajo)
      .select()
      .single();
    if (error) throw error;
    return data as ReporteTrabajo;
  },

  async update(id: string, reporteTrabajo: Partial<ReporteTrabajo>) {
    const { data, error } = await supabase
      .from('reportes_trabajo')
      .update(reporteTrabajo)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ReporteTrabajo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('reportes_trabajo')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};

export const instructivoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('instructivos')
      .select(`*, consorcios (nombre, administraciones (nombre))`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Instructivo[];
  },

  async getByPublicId(publicId: string) {
    const { data, error } = await supabase
      .from('instructivos')
      .select(`*, consorcios (nombre, administraciones (nombre))`)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Instructivo & { consorcios: { nombre: string; administraciones: { nombre: string } } };
  },

  async create(instructivo: Partial<Instructivo>) {
    const { data, error } = await supabase
      .from('instructivos')
      .insert(instructivo)
      .select()
      .single();
    if (error) throw error;
    return data as Instructivo;
  },

  async update(id: string, instructivo: Partial<Instructivo>) {
    const { data, error } = await supabase
      .from('instructivos')
      .update(instructivo)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Instructivo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('instructivos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
