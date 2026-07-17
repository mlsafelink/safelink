import { supabase } from '@/lib/supabase';

/**
 * Convierte un enlace de compartir de Google Drive en una URL directa de imagen.
 * Soporta formatos:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/edit
 * Retorna: https://lh3.googleusercontent.com/d/FILE_ID
 */
export function convertGoogleDriveLink(url: string): string {
  const driveRegex = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

/**
 * Sube un archivo a Supabase Storage en el bucket 'documents'.
 * Retorna la URL pública final del archivo subido.
 */
export async function uploadImageToStorage(file: File): Promise<string> {
  // Limpiar nombre de archivo para evitar caracteres problemáticos
  const cleanName = file.name.replace(/[^\w.-]/g, '_');
  const path = `public/${Date.now()}_${cleanName}`;

  const { error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Error de almacenamiento: ${error.message}`);
  }

  // Obtener URL pública
  const { data } = supabase.storage.from('documents').getPublicUrl(path);
  
  if (!data?.publicUrl) {
    throw new Error('No se pudo generar la URL pública del archivo.');
  }

  return data.publicUrl;
}
