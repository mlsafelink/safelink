// Tipos TypeScript para el módulo Infraestructura Técnica de SafeLink

export type PlanoTipo = 'redes' | 'camaras' | 'mixto';

export type ElementoTipo = 'switch' | 'boca' | 'ap' | 'dvr' | 'camara';

export type ElementoEstado = 'activo' | 'inactivo' | 'mantenimiento' | 'planificado';

export type PoeVoltage = '24V' | '48V';

export interface PoeInjectorProperties {
  use_poe_injector?: boolean;
  poe_voltage?: PoeVoltage | null;
  poe_brand?: string | null;
  poe_model?: string | null;
  poe_notes?: string | null;
}

// Propiedades específicas por tipo de equipo
export interface SwitchProperties {
  marca?: string;
  modelo?: string;
  ip?: string;
  ubicacion?: string;
  cantidadPuertos: number; // ej: 8, 16, 24, 48
  puertosOcupados?: number;
  observaciones?: string;
}

export interface BocaProperties extends PoeInjectorProperties {
  piso?: string;
  ubicacion?: string;
  tipoCable?: string; // Cat 5e, Cat 6, Cat 6A, Fibra
  switchId?: string; // ID del switch asociado
  puertoNumero?: string; // ej: "09"
  observaciones?: string;
}

export interface APProperties extends PoeInjectorProperties {
  marca?: string;
  modelo?: string;
  ssid?: string;
  ubicacion?: string;
  ip?: string;
  switchId?: string;
  puertoNumero?: string;
  frecuencia?: string; // 2.4GHz / 5GHz / WiFi 6
  observaciones?: string;
}

export interface DVRProperties {
  marca?: string;
  modelo?: string;
  tipo?: 'DVR' | 'NVR' | 'XVR';
  ip?: string;
  ubicacion?: string;
  cantidadCanales: number; // ej: 4, 8, 16, 32
  almacenamiento?: string;
  observaciones?: string;
}

export interface CamaraProperties {
  ubicacion?: string;
  tipo?: 'Domo' | 'Bullet' | 'PTZ' | 'Ojo de pez' | 'IP' | 'Térmica' | 'Analógica';
  marca?: string;
  modelo?: string;
  resolucion?: string; // 1080p, 2K, 4K, 5MP
  dvrId?: string; // ID del DVR/NVR asociado
  canalNumero?: string; // ej: "CH01"
  ip?: string;
  observaciones?: string;
}

export type PropiedadesEquipo =
  | SwitchProperties
  | BocaProperties
  | APProperties
  | DVRProperties
  | CamaraProperties
  | Record<string, unknown>;

export interface ElementoPlano {
  id: string;
  plan_id: string;
  tipo: ElementoTipo;
  codigo: string; // ej: "SW-01", "P2-09", "CAM-01", "DVR-01", "AP-01"
  nombre: string;
  pos_x: number; // porcentaje 0 - 100
  pos_y: number; // porcentaje 0 - 100
  parent_element_id?: string | null; // e.g. switch_id or dvr_id
  puerto_canal?: string | null; // e.g. "09" or "CH01"
  estado: ElementoEstado;
  propiedades: PropiedadesEquipo;
  created_at?: string;
  updated_at?: string;
}

export interface PlanoInfraestructura {
  id: string;
  consorcio_id?: string | null;
  particular_id?: string | null;
  public_id: string; // UUID único para compartir con el cliente
  nombre: string;
  tipo: PlanoTipo;
  archivo_url: string; // URL del PDF o imagen de fondo
  archivo_tipo: 'pdf' | 'imagen';
  archivo_nombre?: string;
  descripcion?: string;
  ancho_px?: number;
  alto_px?: number;
  elementos_count?: {
    switches: number;
    bocas: number;
    aps: number;
    dvrs: number;
    camaras: number;
    total: number;
  };
  // Relaciones
  consorcio?: {
    id: string;
    nombre: string;
    direccion?: string;
    administracion_nombre?: string;
  };
  particular?: {
    id: string;
    nombre: string;
    direccion?: string;
  };
  elementos?: ElementoPlano[];
  created_at: string;
  updated_at: string;
}

export interface ResumenInfraestructura {
  planosTotales: number;
  planosRedes: number;
  planosCamaras: number;
  dispositivosRed: number; // switches + bocas + APs
  camaras: number;
  dvrs: number;
}
