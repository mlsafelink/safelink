import JSZip from 'jszip';
import { supabase } from '@/lib/supabase';
import {
  type BackupSeleccion,
  type BackupTipo,
  type BackupHistoryEntry,
  type BackupMetadata,
  type BackupProgress,
  type BackupDestino,
  SELECCION_COMPLETA,
} from '@/types/backup';
import { googleDriveService } from './googleDriveService';

const SAFELINK_VERSION = '1.0.0';

// ── Tabla → bucket de storage ─────────────────────────────────────────────────

// Mapeo de tablas a columnas que contienen URLs de Storage
const STORAGE_COLUMNS: Record<string, string[]> = {
  reportes: ['fotografias'],
  presupuestos: [],
  consorcios: ['logo_url', 'firma_url'],
  administraciones: ['logo_url'],
  facturas: [],
};

// ── Utilidades ────────────────────────────────────────────────────────────────

function formatFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `SafeLink_Backup_${y}-${m}-${d}_${h}-${min}.sbk`;
}

function getStoragePathFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/(.*?)(?:\?|$)/);
    if (match) return decodeURIComponent(match[1]);
    // URL directa de tipo /bucket/path
    const u = new URL(url);
    const parts = u.pathname.split('/storage/v1/object/');
    if (parts.length > 1) return parts[1].replace(/^(public|sign)\//, '');
    return null;
  } catch {
    return null;
  }
}

async function downloadStorageFile(path: string): Promise<Blob | null> {
  try {
    const [bucket, ...rest] = path.split('/');
    const filePath = rest.join('/');
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Función principal: crear el archivo .sbk ─────────────────────────────────

async function buildZip(
  seleccion: BackupSeleccion,
  tipo: BackupTipo,
  onProgress: (p: BackupProgress) => void,
): Promise<{ zip: Blob; metadata: BackupMetadata }> {
  const zip = new JSZip();
  const dbFolder = zip.folder('database')!;
  const storageFolder = zip.folder('storage')!;

  const tablasIncluidas: string[] = [];
  let totalRegistros = 0;
  let totalArchivos = 0;
  const storageUrlsToDownload: Array<{ key: string; url: string }> = [];

  // ── Exportar tablas ──────────────────────────────────────────────────────

  const tablasMap: Array<{
    key: keyof BackupSeleccion;
    tabla: string;
    query?: () => Promise<{ data: unknown; error: unknown }>;
  }> = [
    { key: 'administraciones', tabla: 'administraciones' },
    { key: 'consorcios', tabla: 'consorcios' },
    { key: 'clientes', tabla: 'particulares' },
    { key: 'reportes', tabla: 'reportes' },
    { key: 'presupuestos', tabla: 'presupuestos' },
    { key: 'instructivos', tabla: 'instructivos' },
    { key: 'reportes_trabajo', tabla: 'reportes_trabajo' },
    { key: 'finanzas', tabla: 'reportes_ingreso' },
    { key: 'facturas', tabla: 'facturas' },
    { key: 'vault', tabla: 'vault' },
    { key: 'configuracion', tabla: 'configuracion' },
    { key: 'safelink_notes', tabla: 'safelink_notes' },
    { key: 'notificaciones', tabla: 'notificaciones' },
  ];

  const totalTablas = tablasMap.filter(t => seleccion[t.key]).length;
  let tablasProcesadas = 0;

  for (const { key, tabla } of tablasMap) {
    if (!seleccion[key]) continue;

    onProgress({
      fase: 'Exportando datos',
      progreso: Math.round((tablasProcesadas / totalTablas) * 40),
      detalle: `Exportando tabla: ${tabla}`,
    });

    try {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .is('deleted_at', null);

      if (!error && data) {
        const rows = data as Array<Record<string, unknown>>;
        dbFolder.file(`${tabla}.json`, JSON.stringify(rows, null, 2));
        tablasIncluidas.push(tabla);
        totalRegistros += rows.length;

        // Colectar URLs de storage para descargar luego
        if (seleccion.archivos_storage && STORAGE_COLUMNS[tabla]) {
          for (const row of rows) {
            for (const col of STORAGE_COLUMNS[tabla]) {
              const val = row[col];
              if (!val) continue;
              const urls = Array.isArray(val) ? val : [val];
              for (const url of urls) {
                if (typeof url === 'string' && url.startsWith('http')) {
                  const path = getStoragePathFromUrl(url);
                  if (path) {
                    storageUrlsToDownload.push({ key: `${tabla}/${path}`, url });
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Tabla inexistente o sin permisos: se omite silenciosamente
    }

    tablasProcesadas++;
  }

  // ── Descargar archivos de Storage ────────────────────────────────────────

  if (seleccion.archivos_storage && storageUrlsToDownload.length > 0) {
    let archivosDescargados = 0;

    for (const { key, url } of storageUrlsToDownload) {
      onProgress({
        fase: 'Descargando archivos',
        progreso: 40 + Math.round((archivosDescargados / storageUrlsToDownload.length) * 30),
        detalle: `Archivo ${archivosDescargados + 1} de ${storageUrlsToDownload.length}`,
      });

      const blob = await downloadStorageFile(url);
      if (blob) {
        const arrayBuf = await blob.arrayBuffer();
        storageFolder.file(key, arrayBuf);
        totalArchivos++;
      }

      archivosDescargados++;
    }
  }

  onProgress({ fase: 'Comprimiendo', progreso: 72, detalle: 'Generando archivo .sbk…' });

  // ── Generar metadata ─────────────────────────────────────────────────────

  const metadata: BackupMetadata = {
    version: '1.0',
    fecha: new Date().toISOString(),
    tipo,
    seleccion,
    cantidad_registros: totalRegistros,
    cantidad_archivos: totalArchivos,
    tablas_incluidas: tablasIncluidas,
    tamano_bytes: 0, // Se actualiza abajo
    safelink_version: SAFELINK_VERSION,
  };

  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  metadata.tamano_bytes = zipBlob.size;

  // Actualizar metadata con tamaño real
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  const finalBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  return { zip: finalBlob, metadata };
}

// ── Guardar historial en Supabase ─────────────────────────────────────────────

async function saveHistory(
  filename: string,
  tipo: BackupTipo,
  metadata: BackupMetadata,
  storagePath: string | null,
  driveFileId: string | null,
  destinos: BackupDestino[],
  estado: 'completado' | 'parcial' | 'error',
) {
  await supabase.from('backup_history').insert([{
    nombre_archivo: filename,
    tipo,
    tamano_bytes: metadata.tamano_bytes,
    cantidad_registros: metadata.cantidad_registros,
    cantidad_archivos: metadata.cantidad_archivos,
    destinos,
    storage_path: storagePath,
    drive_file_id: driveFileId,
    estado,
    metadata,
  }]);
}

// ── Servicio público ──────────────────────────────────────────────────────────

export const backupService = {

  /**
   * Crea un backup completo o personalizado, lo sube a Supabase y/o Drive.
   */
  async create(
    tipo: BackupTipo,
    seleccion: BackupSeleccion | undefined,
    destinos: BackupDestino[],
    onProgress: (p: BackupProgress) => void,
  ): Promise<void> {
    const sel = tipo === 'completo' ? SELECCION_COMPLETA : (seleccion ?? SELECCION_COMPLETA);
    const filename = formatFilename();

    onProgress({ fase: 'Iniciando', progreso: 0, detalle: 'Preparando backup…' });

    // 1. Construir el ZIP
    const { zip, metadata } = await buildZip(sel, tipo, onProgress);

    let storagePath: string | null = null;
    let driveFileId: string | null = null;
    const errores: string[] = [];

    // 2. Subir a Supabase Storage
    if (destinos.includes('supabase')) {
      onProgress({ fase: 'Subiendo a Supabase', progreso: 80, detalle: filename });
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        storagePath = `${year}/${month}/${filename}`;

        const { error } = await supabase.storage
          .from('backups')
          .upload(storagePath, zip, {
            contentType: 'application/octet-stream',
            upsert: false,
          });

        if (error) {
          storagePath = null;
          errores.push(`Supabase: ${error.message}`);
        }
      } catch (e) {
        storagePath = null;
        errores.push(`Supabase: ${(e as Error).message}`);
      }
    }

    // 3. Subir a Google Drive
    if (destinos.includes('drive')) {
      onProgress({ fase: 'Subiendo a Google Drive', progreso: 90, detalle: filename });
      try {
        driveFileId = await googleDriveService.uploadFile(zip, filename);
      } catch (e) {
        driveFileId = null;
        errores.push(`Drive: ${(e as Error).message}`);
      }
    }

    onProgress({ fase: 'Guardando historial', progreso: 96, detalle: '' });

    // 4. Guardar historial
    const destinosExitosos = destinos.filter(d =>
      (d === 'supabase' && storagePath !== null) ||
      (d === 'drive' && driveFileId !== null),
    );

    const estado =
      errores.length === 0 ? 'completado'
        : destinosExitosos.length === 0 ? 'error'
          : 'parcial';

    await saveHistory(filename, tipo, metadata, storagePath, driveFileId, destinosExitosos, estado);

    onProgress({ fase: 'Completado', progreso: 100, detalle: '' });

    if (errores.length > 0) {
      throw new Error(errores.join(' | '));
    }
  },

  /** Obtiene el historial de backups ordenado por fecha descendente */
  async getHistory(): Promise<BackupHistoryEntry[]> {
    const { data, error } = await supabase
      .from('backup_history')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) throw error;
    return data as BackupHistoryEntry[];
  },

  /** Descarga un backup de Supabase Storage */
  async downloadFromStorage(storagePath: string, filename: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from('backups')
      .download(storagePath);

    if (error || !data) throw new Error('No se pudo descargar el archivo');

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Elimina un backup del historial y del storage (si aplica) */
  async delete(
    entry: BackupHistoryEntry,
    alsoDeleteDrive: boolean = false,
  ): Promise<void> {
    // Eliminar de Supabase Storage
    if (entry.storage_path) {
      await supabase.storage.from('backups').remove([entry.storage_path]);
    }

    // Eliminar de Drive
    if (alsoDeleteDrive && entry.drive_file_id) {
      try {
        await googleDriveService.deleteFile(entry.drive_file_id);
      } catch {
        // No crítico si ya fue eliminado desde Drive
      }
    }

    // Eliminar del historial
    await supabase.from('backup_history').delete().eq('id', entry.id);
  },

  /**
   * Restaura desde un backup descargado de Supabase Storage.
   * Procesa el ZIP y restaura tabla por tabla usando upsert.
   */
  async restore(
    storagePath: string,
    onProgress: (p: BackupProgress) => void,
  ): Promise<BackupMetadata> {
    onProgress({ fase: 'Descargando backup', progreso: 0 });

    const { data, error } = await supabase.storage
      .from('backups')
      .download(storagePath);

    if (error || !data) throw new Error('No se pudo descargar el backup para restaurar');

    onProgress({ fase: 'Leyendo archivo', progreso: 15 });

    const JSZipLib = (await import('jszip')).default;
    const zip = await JSZipLib.loadAsync(data);

    // Leer metadata
    const metadataFile = zip.file('metadata.json');
    if (!metadataFile) throw new Error('El archivo de backup está corrupto (falta metadata.json)');
    const metadata = JSON.parse(await metadataFile.async('string')) as BackupMetadata;

    const tablas = metadata.tablas_incluidas;
    let procesadas = 0;

    for (const tabla of tablas) {
      onProgress({
        fase: 'Restaurando datos',
        progreso: 15 + Math.round((procesadas / tablas.length) * 80),
        detalle: `Restaurando tabla: ${tabla}`,
      });

      const file = zip.file(`database/${tabla}.json`);
      if (!file) { procesadas++; continue; }

      const rows = JSON.parse(await file.async('string')) as Array<Record<string, unknown>>;

      if (rows.length > 0) {
        await supabase.from(tabla).upsert(rows, { onConflict: 'id' });
      }

      procesadas++;
    }

    onProgress({ fase: 'Completado', progreso: 100 });
    return metadata;
  },
};
