import { supabase } from '@/lib/supabase';

// ── Tipos ───────────────────────────────────────────────────────────────────

export type FacturaEstado = 'pendiente' | 'parcial' | 'pagado' | 'vencida';
export type FacturaTipo = 'A' | 'B' | 'C';

export type Factura = {
  id: string;
  consorcio_id: string;
  presupuesto_id: string | null;
  reporte_trabajo_id: string | null;
  public_id: string;

  numero_factura: string;
  tipo_factura: FacturaTipo;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  estado: FacturaEstado;
  observaciones: string | null;
  fecha_pago: string | null;

  // PDF
  pdf_url: string | null;
  pdf_nombre: string | null;
  pdf_cargado_at: string | null;
  pdf_cargado_por: string | null;

  created_at: string;
  updated_at: string;

  // JOINs
  consorcios?: {
    nombre: string;
    tipo?: string;
    administracion_id?: string | null;
    administraciones?: { nombre: string } | null;
  };
  presupuestos?: { id: string; titulo: string; codigo?: string | null; public_id: string } | null;
  reportes_trabajo?: { id: string; titulo: string; codigo?: string | null; public_id: string } | null;
};

export type FacturaInsert = Omit<
  Factura,
  'id' | 'public_id' | 'created_at' | 'updated_at' | 'consorcios' | 'presupuestos' | 'reportes_trabajo'
>;

// ── SELECT base con JOINs ────────────────────────────────────────────────────

const SELECT_FULL = `
  *,
  consorcios (
    nombre,
    tipo,
    administracion_id,
    administraciones (nombre)
  ),
  presupuestos (id, titulo, codigo, public_id),
  reportes_trabajo (id, titulo, codigo, public_id)
`;

// ── Servicio ─────────────────────────────────────────────────────────────────

export const facturaService = {
  /** Todas las facturas activas */
  async getAll(): Promise<Factura[]> {
    const { data, error } = await supabase
      .from('facturas')
      .select(SELECT_FULL)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Factura[];
  },

  /** Por consorcio (Dashboard Cliente) */
  async getByConsorcioId(consorcioId: string): Promise<Factura[]> {
    const { data, error } = await supabase
      .from('facturas')
      .select(SELECT_FULL)
      .eq('consorcio_id', consorcioId)
      .is('deleted_at', null)
      .order('fecha_emision', { ascending: false });
    if (error) throw error;
    return data as Factura[];
  },

  /** Por public_id (vista pública cliente, sin autenticación) */
  async getByPublicId(publicId: string): Promise<Factura> {
    const { data, error } = await supabase
      .from('facturas')
      .select(SELECT_FULL)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Factura;
  },

  /** Por ID (admin) */
  async getById(id: string): Promise<Factura> {
    const { data, error } = await supabase
      .from('facturas')
      .select(SELECT_FULL)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Factura;
  },

  /** Crear nueva factura */
  async create(factura: FacturaInsert): Promise<Factura> {
    const { data, error } = await supabase
      .from('facturas')
      .insert({ ...factura, updated_at: new Date().toISOString() })
      .select(SELECT_FULL)
      .single();
    if (error) throw error;
    return data as Factura;
  },

  /** Actualizar factura (cualquier campo) */
  async update(id: string, factura: Partial<FacturaInsert>): Promise<Factura> {
    const { data, error } = await supabase
      .from('facturas')
      .update({ ...factura, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SELECT_FULL)
      .single();
    if (error) throw error;
    return data as Factura;
  },

  /** Soft delete */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('facturas')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Subir PDF al bucket 'facturas' y actualizar el registro.
   * Devuelve la URL pública del archivo.
   */
  async uploadPDF(
    file: File,
    facturaId: string,
    uploaderEmail: string
  ): Promise<{ pdf_url: string; pdf_nombre: string }> {
    const ext = file.name.split('.').pop() ?? 'pdf';
    const path = `${facturaId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('facturas')
      .upload(path, file, { upsert: true, contentType: 'application/pdf' });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('facturas').getPublicUrl(path);
    const pdf_url = urlData.publicUrl;
    const pdf_nombre = file.name;

    await facturaService.update(facturaId, {
      pdf_url,
      pdf_nombre,
      pdf_cargado_at: new Date().toISOString(),
      pdf_cargado_por: uploaderEmail,
    });

    return { pdf_url, pdf_nombre };
  },

  /**
   * Obtiene todos los documentos relacionados con un trabajo:
   * presupuesto, reporte técnico, instructivo, reporte de trabajo, factura.
   */
  async getHistorialTrabajo(params: {
    consorcioId: string;
    presupuestoId?: string | null;
    reporteTrabajoId?: string | null;
  }) {
    const { consorcioId, presupuestoId, reporteTrabajoId } = params;

    const [reportes, presupuestos, instructivos, reportesTrabajo, facturas] = await Promise.all([
      supabase
        .from('reportes')
        .select('id, titulo, codigo, public_id, created_at')
        .eq('consorcio_id', consorcioId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1),

      presupuestoId
        ? supabase
            .from('presupuestos')
            .select('id, titulo, codigo, public_id, created_at, estado, aceptado_at')
            .eq('id', presupuestoId)
            .is('deleted_at', null)
            .single()
        : supabase
            .from('presupuestos')
            .select('id, titulo, codigo, public_id, created_at, estado, aceptado_at')
            .eq('consorcio_id', consorcioId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1),

      supabase
        .from('instructivos')
        .select('id, titulo, public_id, created_at')
        .eq('consorcio_id', consorcioId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1),

      reporteTrabajoId
        ? supabase
            .from('reportes_trabajo')
            .select('id, titulo, codigo, public_id, created_at')
            .eq('id', reporteTrabajoId)
            .is('deleted_at', null)
            .single()
        : supabase
            .from('reportes_trabajo')
            .select('id, titulo, codigo, public_id, created_at')
            .eq('consorcio_id', consorcioId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1),

      supabase
        .from('facturas')
        .select('id, numero_factura, pdf_url, pdf_nombre, pdf_cargado_at, public_id, created_at, estado, monto_total')
        .eq('consorcio_id', consorcioId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const getFirst = (result: any) => {
      if (result.data && Array.isArray(result.data)) return result.data[0] ?? null;
      return result.data ?? null;
    };

    return {
      reporte: getFirst(reportes),
      presupuesto: getFirst(presupuestos),
      instructivo: getFirst(instructivos),
      reporteTrabajo: getFirst(reportesTrabajo),
      factura: getFirst(facturas),
    };
  },

  /** Facturas próximas a vencer (en los próximos 7 días) */
  async getProximasAVencer(): Promise<Factura[]> {
    const hoy = new Date();
    const en7Dias = new Date(hoy);
    en7Dias.setDate(hoy.getDate() + 7);

    const { data, error } = await supabase
      .from('facturas')
      .select(SELECT_FULL)
      .in('estado', ['pendiente', 'parcial'])
      .gte('fecha_vencimiento', hoy.toISOString().split('T')[0])
      .lte('fecha_vencimiento', en7Dias.toISOString().split('T')[0])
      .is('deleted_at', null)
      .order('fecha_vencimiento');
    if (error) throw error;
    return data as Factura[];
  },
};
