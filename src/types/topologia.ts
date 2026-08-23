// Tipos para el módulo de Topología de Red de SafeLink
import type { ElementoEstado, ElementoTipo, PropiedadesEquipo } from './infraestructura';

export type TipoConexionTopologia = 'datos' | 'poe' | 'inalambrico';

export interface TopologiaNodo {
  id: string;
  elemento_id?: string | null; // Referencia al ElementoPlano si existe
  tipo: ElementoTipo;
  codigo: string; // ej: "SW-01", "MODEM-01", "P3_1", "POE-24V-01"
  nombre: string;
  x: number; // Coordenada X en px dentro del canvas
  y: number; // Coordenada Y en px dentro del canvas
  puerto_canal?: string | null; // ej: "12" o "CH01"
  parent_element_id?: string | null;
  estado: ElementoEstado;
  propiedades: PropiedadesEquipo;
  custom_label?: string;
  is_intermediate_poe?: boolean; // True si es un nodo visual de inyector PoE
  poe_voltage?: '24V' | '48V';
}

export interface TopologiaConexion {
  id: string;
  source_id: string; // ID del nodo origen (ej: switch o modem o poe)
  target_id: string; // ID del nodo destino (ej: dispositivo o switch o poe)
  tipo_conexion: TipoConexionTopologia;
  puerto?: string | null; // ej: "Puerto 12"
  notas?: string | null;
}

export interface TopologiaRed {
  id: string;
  plan_id?: string | null;
  consorcio_id?: string | null;
  particular_id?: string | null;
  public_id: string;
  nombre: string;
  descripcion?: string;
  consorcio?: {
    id: string;
    nombre: string;
    direccion?: string | null;
  } | null;
  particular?: {
    id: string;
    nombre: string;
    direccion?: string | null;
  } | null;
  nodos: TopologiaNodo[];
  conexiones: TopologiaConexion[];
  created_at: string;
  updated_at: string;
}
