import { supabase } from '@/lib/supabase';

// ---- Tipos base ----
export type DocumentStatus = 'draft' | 'published';

export type Reporte = {
  id: string;
  consorcio_id: string;
  public_id: string;
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
  version: number;
  created_at: string;
  // JOIN
  consorcios?: { nombre: string; administraciones?: { nombre: string } };
};

export type Presupuesto = {
  id: string;
  consorcio_id: string;
  public_id: string;
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
  version: number;
  created_at: string;
  consorcios?: { nombre: string; administraciones?: { nombre: string } };
};

export type MaterialItem = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

export type Instructivo = {
  id: string;
  consorcio_id: string;
  public_id: string;
  titulo: string;
  contenido?: InstructivoBloque[] | null; // deprecated, backward compat

  // Campos del template (editables por instructivo)
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

  version: number;
  created_at: string;
  consorcios?: { nombre: string; administraciones?: { nombre: string } };
};

export type InstructivoBloque = {
  tipo: 'texto' | 'imagen' | 'titulo';
  contenido: string;
};

// ---- Servicios ----
export const reporteService = {
  async getAll() {
    const { data, error } = await supabase
      .from('reportes')
      .select(`*, consorcios (nombre, administraciones (nombre))`)
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
};

export const presupuestoService = {
  async getAll() {
    const { data, error } = await supabase
      .from('presupuestos')
      .select(`*, consorcios (nombre, administraciones (nombre))`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Presupuesto[];
  },

  async getByPublicId(publicId: string) {
    const { data, error } = await supabase
      .from('presupuestos')
      .select(`*, consorcios (nombre, direccion, administraciones (nombre))`)
      .eq('public_id', publicId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Presupuesto & { consorcios: { nombre: string; direccion?: string; administraciones: { nombre: string } } };
  },

  async create(presupuesto: Partial<Presupuesto>) {
    const { data, error } = await supabase
      .from('presupuestos')
      .insert(presupuesto)
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
};
