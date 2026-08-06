// ── Tipos del sistema de Backup ─────────────────────────────────────────────

export type BackupTipo = 'completo' | 'personalizado';
export type BackupEstado = 'completado' | 'parcial' | 'error' | 'procesando';
export type BackupDestino = 'supabase' | 'drive';

export type BackupSeleccion = {
  clientes: boolean;
  consorcios: boolean;
  administraciones: boolean;
  reportes: boolean;
  presupuestos: boolean;
  instructivos: boolean;
  reportes_trabajo: boolean;
  finanzas: boolean;
  facturas: boolean;
  vault: boolean;
  configuracion: boolean;
  safelink_notes: boolean;
  notificaciones: boolean;
  archivos_storage: boolean;
};

export const SELECCION_COMPLETA: BackupSeleccion = {
  clientes: true,
  consorcios: true,
  administraciones: true,
  reportes: true,
  presupuestos: true,
  instructivos: true,
  reportes_trabajo: true,
  finanzas: true,
  facturas: true,
  vault: true,
  configuracion: true,
  safelink_notes: true,
  notificaciones: true,
  archivos_storage: true,
};

export const SELECCION_VACIA: BackupSeleccion = {
  clientes: false,
  consorcios: false,
  administraciones: false,
  reportes: false,
  presupuestos: false,
  instructivos: false,
  reportes_trabajo: false,
  finanzas: false,
  facturas: false,
  vault: false,
  configuracion: false,
  safelink_notes: false,
  notificaciones: false,
  archivos_storage: false,
};

export const SELECCION_LABELS: Record<keyof BackupSeleccion, string> = {
  clientes: 'Clientes Privados',
  consorcios: 'Consorcios',
  administraciones: 'Administraciones',
  reportes: 'Reportes',
  presupuestos: 'Presupuestos',
  instructivos: 'Instructivos',
  reportes_trabajo: 'Reportes de Trabajo',
  finanzas: 'Finanzas',
  facturas: 'Facturas',
  vault: 'Bóveda Segura',
  configuracion: 'Configuración',
  safelink_notes: 'SafeLink Note',
  notificaciones: 'Notificaciones',
  archivos_storage: 'Archivos (Storage)',
};

export type BackupMetadata = {
  version: string;
  fecha: string;
  tipo: BackupTipo;
  seleccion: BackupSeleccion;
  cantidad_registros: number;
  cantidad_archivos: number;
  tablas_incluidas: string[];
  tamano_bytes: number;
  safelink_version: string;
};

export type BackupHistoryEntry = {
  id: string;
  nombre_archivo: string;
  tipo: BackupTipo;
  fecha: string;
  tamano_bytes: number | null;
  cantidad_registros: number | null;
  cantidad_archivos: number | null;
  destinos: BackupDestino[];
  storage_path: string | null;
  drive_file_id: string | null;
  estado: BackupEstado;
  metadata: BackupMetadata | null;
  created_at: string;
};

export type BackupProgress = {
  fase: string;
  progreso: number;   // 0-100
  detalle?: string;
};
