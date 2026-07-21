import { supabase } from '@/lib/supabase';

export type Consorcio = {
  id: string;
  administracion_id: string | null;
  tipo: 'consorcio' | 'particular';
  nombre: string;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  cantidad_pisos: number | null;
  cantidad_unidades: number | null;
  encargado: string | null;
  telefono_encargado: string | null;
  administrador_responsable: string | null;
  observaciones: string | null;
  created_at: string;
  // Propiedad extendida (JOIN)
  administraciones?: { nombre: string } | null;
};

export type ConsorcioInsert = Omit<Consorcio, 'id' | 'created_at' | 'administraciones'>;

export const consorcioService = {
  async getAll() {
    const { data, error } = await supabase
      .from('consorcios')
      .select(`
        *,
        administraciones (nombre)
      `)
      .eq('tipo', 'consorcio')
      .is('deleted_at', null)
      .order('nombre');
      
    if (error) throw error;
    return data as Consorcio[];
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('consorcios')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Consorcio;
  },

  async create(consorcio: ConsorcioInsert) {
    const { data, error } = await supabase
      .from('consorcios')
      .insert(consorcio)
      .select()
      .single();
    if (error) throw error;
    return data as Consorcio;
  },

  async update(id: string, consorcio: ConsorcioInsert) {
    const { data, error } = await supabase
      .from('consorcios')
      .update(consorcio)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Consorcio;
  },

  async delete(id: string) {
    // Soft delete
    const { error } = await supabase
      .from('consorcios')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
};
