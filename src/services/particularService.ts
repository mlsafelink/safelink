import { supabase } from '@/lib/supabase';

// Un Particular se almacena en la tabla 'consorcios' con tipo='particular'
export type Particular = {
  id: string;
  tipo: 'particular';
  nombre: string;
  direccion: string | null;
  localidad: string | null;
  telefono_encargado: string | null; // reutilizamos este campo como "teléfono"
  administrador_responsable: string | null; // reutilizamos como "CUIT / email"
  observaciones: string | null;
  created_at: string;
};

export type ParticularInsert = {
  tipo: 'particular';
  administracion_id: null;
  nombre: string;
  direccion?: string | null;
  localidad?: string | null;
  telefono_encargado?: string | null;
  administrador_responsable?: string | null;
  observaciones?: string | null;
};

export const particularService = {
  async getAll() {
    const { data, error } = await supabase
      .from('consorcios')
      .select('*')
      .eq('tipo', 'particular')
      .is('deleted_at', null)
      .order('nombre');

    if (error) throw error;
    return data as Particular[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('consorcios')
      .select('*')
      .eq('id', id)
      .eq('tipo', 'particular')
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Particular;
  },

  async create(particular: Omit<ParticularInsert, 'tipo' | 'administracion_id'>) {
    const payload: ParticularInsert = {
      ...particular,
      tipo: 'particular',
      administracion_id: null,
    };
    const { data, error } = await supabase
      .from('consorcios')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Particular;
  },

  async update(id: string, particular: Omit<ParticularInsert, 'tipo' | 'administracion_id'>) {
    const { data, error } = await supabase
      .from('consorcios')
      .update({ ...particular })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Particular;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('consorcios')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
