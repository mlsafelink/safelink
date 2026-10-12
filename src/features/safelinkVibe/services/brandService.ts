// =====================================================
// SafeLink Vibe — Servicio de configuración de marca
// =====================================================
import { supabase } from '@/lib/supabase';
import type { VibeBrandConfig, VibeBrandConfigInput, ApiResult } from '../types';

const TABLE = 'vibe_brand_config';

/** Obtiene la configuración de marca del usuario actual */
export async function getBrandConfig(): Promise<ApiResult<VibeBrandConfig | null>> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: data as VibeBrandConfig | null };
}

/** Crea o actualiza la configuración de marca (upsert) */
export async function saveBrandConfig(
  input: Partial<VibeBrandConfigInput>
): Promise<ApiResult<VibeBrandConfig>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'No autenticado.', code: 'AUTH_REQUIRED' };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      { ...input, user_id: user.id },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }

  return { ok: true, data: data as VibeBrandConfig };
}

/** Sube el logo de marca a Supabase Storage */
export async function uploadBrandLogo(file: File): Promise<ApiResult<string>> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'No autenticado.', code: 'AUTH_REQUIRED' };
  }

  // Validar tipo y tamaño
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      ok: false,
      error: 'Formato no permitido. Usá JPG, PNG, WebP o SVG.',
      code: 'INVALID_FILE_TYPE',
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      error: 'El logo no puede superar 5 MB.',
      code: 'FILE_TOO_LARGE',
    };
  }

  const ext = file.name.split('.').pop();
  const path = `${user.id}/brand/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('vibe-media')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage
    .from('vibe-media')
    .getPublicUrl(path);

  return { ok: true, data: urlData.publicUrl };
}
