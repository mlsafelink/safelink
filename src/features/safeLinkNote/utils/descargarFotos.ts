import JSZip from 'jszip';
import type { RelevamientoFoto } from '@/services/relevamientoService';

/**
 * Sanitiza un texto para que sea seguro como nombre de archivo.
 */
function sanitizarNombre(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40) || 'relevamiento';
}

/**
 * Descarga una sola fotografía a la computadora o dispositivo del usuario.
 */
export async function descargarFotoIndividual(
  foto: RelevamientoFoto,
  clienteNombre = 'relevamiento',
  indice = 1
) {
  const clienteSanitizado = sanitizarNombre(clienteNombre);
  const extension = foto.dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
  const nombreArchivo = `${clienteSanitizado}_foto_${indice}.${extension}`;

  if (foto.dataUrl.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = foto.dataUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Si es URL remota (ej: Storage de Supabase)
  try {
    const res = await fetch(foto.dataUrl);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
  } catch (err) {
    console.warn('Error descargando imagen directa, abriendo enlace:', err);
    window.open(foto.dataUrl, '_blank');
  }
}

/**
 * Descarga todas las fotos de un relevamiento.
 * Si es una sola foto, la descarga directamente como imagen.
 * Si son múltiples fotos, las empaqueta en un archivo .ZIP con JSZip.
 */
export async function descargarTodasLasFotosRelevamiento(
  fotos: RelevamientoFoto[],
  clienteNombre = 'relevamiento'
): Promise<void> {
  if (!fotos || fotos.length === 0) return;

  const clienteSanitizado = sanitizarNombre(clienteNombre);

  // Si es solo una foto, descargar directamente
  if (fotos.length === 1) {
    await descargarFotoIndividual(fotos[0], clienteNombre, 1);
    return;
  }

  const zip = new JSZip();

  for (let i = 0; i < fotos.length; i++) {
    const f = fotos[i];
    const dataUrl = f.dataUrl;
    const extension = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const filename = `${clienteSanitizado}_foto_${i + 1}.${extension}`;

    if (dataUrl.startsWith('data:')) {
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      zip.file(filename, base64Data, { base64: true });
    } else {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        zip.file(filename, blob);
      } catch (e) {
        console.warn(`No se pudo agregar foto ${i + 1} al ZIP:`, e);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = `${clienteSanitizado}_fotos.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}
