import { supabase } from '@/lib/supabase';

// ────────────────────────────────────────────────────────────
// TIPOS
// ────────────────────────────────────────────────────────────
export type GaleriaItem = {
  id: string;
  imagen_url: string;
  storage_path: string;
  descripcion?: string | null;
  orden: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
};

export type GaleriaInsert = {
  descripcion?: string;
  orden?: number;
};

const BUCKET = 'galeria-trabajos';

// ────────────────────────────────────────────────────────────
// SERVICIO
// ────────────────────────────────────────────────────────────
export const galeriaService = {
  /** Obtiene todas las imágenes (para admin — incluyendo ocultas) */
  async getAll(): Promise<GaleriaItem[]> {
    const { data, error } = await supabase
      .from('galeria_trabajos')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error obteniendo galería:', error);
      return [];
    }
    return data as GaleriaItem[];
  },

  /** Obtiene imágenes visibles para la landing pública */
  async getPublicImages(): Promise<GaleriaItem[]> {
    const { data, error } = await supabase
      .from('galeria_trabajos')
      .select('*')
      .eq('visible', true)
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error obteniendo galería pública:', error);
      return [];
    }
    return data as GaleriaItem[];
  },

  /** Sube una imagen y crea el registro en la tabla */
  async upload(file: File, meta: GaleriaInsert): Promise<GaleriaItem> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const storagePath = `${crypto.randomUUID()}.${ext}`;

    // Upload al bucket
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      throw uploadError;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const imagen_url = urlData.publicUrl;

    // Obtener el mayor orden actual
    const { data: maxOrderRow } = await supabase
      .from('galeria_trabajos')
      .select('orden')
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle();

    const orden = meta.orden ?? ((maxOrderRow?.orden ?? -1) + 1);

    // Insertar registro
    const { data, error: insertError } = await supabase
      .from('galeria_trabajos')
      .insert({
        imagen_url,
        storage_path: storagePath,
        descripcion: meta.descripcion ?? null,
        orden,
        visible: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando registro de galería:', insertError);
      throw insertError;
    }

    return data as GaleriaItem;
  },

  /** Elimina una imagen del bucket y de la tabla */
  async delete(item: GaleriaItem): Promise<void> {
    // Borrar de Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([item.storage_path]);

    if (storageError) {
      console.warn('Error borrando imagen del bucket:', storageError);
    }

    // Borrar registro
    const { error } = await supabase
      .from('galeria_trabajos')
      .delete()
      .eq('id', item.id);

    if (error) throw error;
  },

  /** Alterna visibilidad de un item */
  async toggleVisible(id: string, visible: boolean): Promise<void> {
    const { error } = await supabase
      .from('galeria_trabajos')
      .update({ visible, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /** Actualiza descripción y/o visibilidad */
  async update(id: string, updates: { descripcion?: string; visible?: boolean }): Promise<void> {
    const { error } = await supabase
      .from('galeria_trabajos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /** Actualiza el orden de múltiples items en batch */
  async updateOrden(items: { id: string; orden: number }[]): Promise<void> {
    const updates = items.map(item =>
      supabase
        .from('galeria_trabajos')
        .update({ orden: item.orden, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );
    await Promise.all(updates);
  },
};
