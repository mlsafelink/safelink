import { supabase } from '@/lib/supabase';

// ── Tipos ───────────────────────────────────────────────────────────────────

export type VaultEntry = {
  id: string;
  nombre_consorcio: string;
  direccion: string | null;
  cantidad_canales: number | null;
  serial_number: string | null;
  qr_image: string | null;
  pattern_image: string | null;
  admin_user: string | null;
  admin_password: string | null;
  user1: string | null;
  password1: string | null;
  user2: string | null;
  password2: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
};

export type VaultInsert = Omit<VaultEntry, 'id' | 'created_at' | 'updated_at'>;

// ── Servicio ─────────────────────────────────────────────────────────────────

export const vaultService = {
  async getAll(): Promise<VaultEntry[]> {
    const { data, error } = await supabase
      .from('vault')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as VaultEntry[];
  },

  async getById(id: string): Promise<VaultEntry> {
    const { data, error } = await supabase
      .from('vault')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data as VaultEntry;
  },

  async create(entry: VaultInsert): Promise<VaultEntry> {
    const { data, error } = await supabase
      .from('vault')
      .insert({ ...entry, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as VaultEntry;
  },

  async update(id: string, entry: Partial<VaultInsert>): Promise<VaultEntry> {
    const { data, error } = await supabase
      .from('vault')
      .update({ ...entry, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as VaultEntry;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vault')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
