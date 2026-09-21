export type AppCamaras = 'imou' | 'dmss' | 'easy_viewer_pro' | 'guard_live';

export interface AppCamarasOption {
  label: string;
  value: AppCamaras;
}

export const APP_CAMARAS_OPTIONS: AppCamarasOption[] = [
  { label: 'Imou', value: 'imou' },
  { label: 'DMSS', value: 'dmss' },
  { label: 'Easy Viewer Pro', value: 'easy_viewer_pro' },
  { label: 'Guard Live', value: 'guard_live' },
];

export const APP_CAMARAS_LABELS: Record<AppCamaras, string> = {
  imou: 'Imou',
  dmss: 'DMSS',
  easy_viewer_pro: 'Easy Viewer Pro',
  guard_live: 'Guard Live',
};

export type TipoDispositivo = 'XVR' | 'NVR' | 'Cámara inalámbrica';

export interface TipoDispositivoOption {
  label: string;
  value: TipoDispositivo;
}

export const TIPO_DISPOSITIVO_OPTIONS: TipoDispositivoOption[] = [
  { label: 'XVR', value: 'XVR' },
  { label: 'NVR', value: 'NVR' },
  { label: 'Cámara inalámbrica', value: 'Cámara inalámbrica' },
];

export interface CamaraItem {
  id: string;
  nombre: string;
  qr_image_url: string | null;
  usuario: string;
  password?: string;
}

/**
 * Obtiene la lista de cámaras de un instructivo garantizando retrocompatibilidad
 * con instructivos creados previamente con la estructura de una única cámara.
 */
export function getInstructivoCamaras(instructivo: {
  camaras?: CamaraItem[] | null;
  nombre_dispositivo?: string | null;
  qr_image_url?: string | null;
  usuario_dispositivo?: string | null;
  password_dispositivo?: string | null;
}): CamaraItem[] {
  if (instructivo.camaras && Array.isArray(instructivo.camaras) && instructivo.camaras.length > 0) {
    return instructivo.camaras;
  }
  return [
    {
      id: 'cam-1',
      nombre: instructivo.nombre_dispositivo || 'Cámara 1',
      qr_image_url: instructivo.qr_image_url || null,
      usuario: instructivo.usuario_dispositivo || 'admin',
    },
  ];
}

/**
 * Genera un código aleatorio alfanumérico de 4 caracteres (letras mayúsculas y números).
 */
export function generatePublicCode(length = 4): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Normaliza el nombre del enlace para garantizar que sea seguro y limpio en una URL.
 * Elimina acentos, reemplaza espacios y caracteres conflictivos por guiones, y remueve caracteres prohibidos.
 */
export function normalizeNombreEnlace(raw: string): string {
  if (!raw) return '';
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes/acentos
    .replace(/[^a-zA-Z0-9_-]+/g, '-') // Reemplaza espacios, barras, puntos, signos por guiones
    .replace(/-+/g, '-')             // Evita guiones múltiples consecutivos
    .replace(/^-+|-+$/g, '');        // Quita guiones al inicio o final
}

/**
 * Construye el slug público combinando el nombre normalizado y el código aleatorio.
 */
export function buildPublicSlug(nombreEnlace: string, codigo: string): string {
  const norm = normalizeNombreEnlace(nombreEnlace);
  if (!norm) return '';
  return `${norm}-${codigo}`;
}



