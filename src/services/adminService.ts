import { supabase } from '@/lib/supabase';

export type Administracion = {
  id: string;
  nombre: string;
  cuit: string | null;
  direccion: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  observaciones: string | null;
  created_at: string;
};

export type AdminInsert = Omit<Administracion, 'id' | 'created_at'>;

export const adminService = {
  async getAll() {
    const { data, error } = await supabase
      .from('administraciones')
      .select('*')
      .is('deleted_at', null)
      .order('nombre');
    if (error) throw error;
    return data as Administracion[];
  },
  
  async getById(id: string) {
    const { data, error } = await supabase
      .from('administraciones')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as Administracion;
  },

  async create(admin: AdminInsert) {
    const { data, error } = await supabase
      .from('administraciones')
      .insert(admin)
      .select()
      .single();
    if (error) throw error;
    return data as Administracion;
  },

  async update(id: string, admin: AdminInsert) {
    const { data, error } = await supabase
      .from('administraciones')
      .update(admin)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Administracion;
  },

  async delete(id: string) {
    // Soft delete
    const { error } = await supabase
      .from('administraciones')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
};
