import { supabase } from '@/lib/supabase';

// ── Tipos ──────────────────────────────────────────────────────────

export interface RelevamientoFoto {
  id: string;
  dataUrl: string;
  descripcion: string;
}

export interface RelevamientoMaterial {
  id: string;
  nombre: string;
  cantidad: string;
  costo: string;
  observacion: string;
}

export type RelevamientoEstado = 'PENDIENTE' | 'FINALIZADO';

export interface Relevamiento {
  id: string;
  created_at: string;
  updated_at: string;
  cliente: string | null;
  direccion: string | null;
  contacto: string | null;
  tipos_trabajo: string[];
  observaciones: string | null;
  fotos: RelevamientoFoto[];
  materiales: RelevamientoMaterial[];
  estado: RelevamientoEstado;
  sln_path: string | null;
}

export interface RelevamientoInput {
  cliente: string;
  direccion: string;
  contacto: string;
  tipos_trabajo: string[];
  observaciones: string;
  fotos: RelevamientoFoto[];
  materiales: RelevamientoMaterial[];
  estado: RelevamientoEstado;
  sln_path?: string | null;
}

// ── Servicio ───────────────────────────────────────────────────────

export const relevamientoService = {

  /** Crea un nuevo relevamiento en Supabase. Devuelve el registro creado. */
  async crear(input: RelevamientoInput): Promise<Relevamiento> {
    const { data, error } = await supabase
      .from('relevamientos')
      .insert([{
        cliente:       input.cliente       || null,
        direccion:     input.direccion     || null,
        contacto:      input.contacto      || null,
        tipos_trabajo: input.tipos_trabajo,
        observaciones: input.observaciones || null,
        fotos:         input.fotos,
        materiales:    input.materiales,
        estado:        input.estado,
        sln_path:      input.sln_path      || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Relevamiento;
  },

  /** Actualiza un relevamiento existente por ID. */
  async actualizar(id: string, input: Partial<RelevamientoInput>): Promise<Relevamiento> {
    const { data, error } = await supabase
      .from('relevamientos')
      .update({
        ...(input.cliente       !== undefined && { cliente:       input.cliente       || null }),
        ...(input.direccion     !== undefined && { direccion:     input.direccion     || null }),
        ...(input.contacto      !== undefined && { contacto:      input.contacto      || null }),
        ...(input.tipos_trabajo !== undefined && { tipos_trabajo: input.tipos_trabajo }),
        ...(input.observaciones !== undefined && { observaciones: input.observaciones || null }),
        ...(input.fotos         !== undefined && { fotos:         input.fotos }),
        ...(input.materiales    !== undefined && { materiales:    input.materiales }),
        ...(input.estado        !== undefined && { estado:        input.estado }),
        ...(input.sln_path      !== undefined && { sln_path:      input.sln_path      || null }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Relevamiento;
  },

  /** Cuenta el total de relevamientos existentes en Supabase de forma rápida. */
  async contarTotal(): Promise<number> {
    const { count, error } = await supabase
      .from('relevamientos')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count ?? 0;
  },

  /** Lista todos los relevamientos, ordenados por fecha de creación desc. */
  async listar(): Promise<Relevamiento[]> {
    const { data, error } = await supabase
      .from('relevamientos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[relevamientoService] Error listando:', error);
      return [];
    }
    return (data || []) as Relevamiento[];
  },

  /** Lista solo los relevamientos con estado PENDIENTE. */
  async listarPendientes(): Promise<Relevamiento[]> {
    const { data, error } = await supabase
      .from('relevamientos')
      .select('*')
      .eq('estado', 'PENDIENTE')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[relevamientoService] Error listando pendientes:', error);
      return [];
    }
    return (data || []) as Relevamiento[];
  },

  /** Obtiene un relevamiento por ID. */
  async obtener(id: string): Promise<Relevamiento | null> {
    const { data, error } = await supabase
      .from('relevamientos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as Relevamiento;
  },

  /** Elimina un relevamiento por ID. */
  async eliminar(id: string): Promise<void> {
    const { error } = await supabase
      .from('relevamientos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
