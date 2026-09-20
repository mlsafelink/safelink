export type AppCamaras = 'imou' | 'dmss' | 'easy_viewer_pro';

export interface AppCamarasOption {
  label: string;
  value: AppCamaras;
}

export const APP_CAMARAS_OPTIONS: AppCamarasOption[] = [
  { label: 'Imou', value: 'imou' },
  { label: 'DMSS', value: 'dmss' },
  { label: 'Easy Viewer Pro', value: 'easy_viewer_pro' },
];

export const APP_CAMARAS_LABELS: Record<AppCamaras, string> = {
  imou: 'Imou',
  dmss: 'DMSS',
  easy_viewer_pro: 'Easy Viewer Pro',
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
      password: instructivo.password_dispositivo || '',
    },
  ];
}


