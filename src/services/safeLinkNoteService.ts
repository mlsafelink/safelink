import { supabase } from '@/lib/supabase';

const BUCKET = 'exports';

export type SlnFile = {
  name: string;
  id: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_accessed_at: string | null;
  metadata: Record<string, unknown> | null;
};

export const safeLinkNoteService = {
  async listSlnFiles(): Promise<SlnFile[]> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        limit: 200,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('[SafeLinkNote] Error listando archivos:', error);
      return [];
    }

    return ((data || []) as SlnFile[]).filter(f =>
      f.name.toLowerCase().endsWith('.sln')
    );
  },

  async getDownloadUrl(fileName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(fileName, 3600); // válida 1 hora

      if (!error && data?.signedUrl) {
        return data.signedUrl;
      }
    } catch {
      // Fallback a URL pública
    }

    const { data: pub } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return pub?.publicUrl || null;
  },
};
