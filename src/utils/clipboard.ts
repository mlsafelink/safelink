/**
 * Copia texto al portapapeles de manera segura con soporte para fallbacks
 * cuando `navigator.clipboard` no está disponible o rechaza permisos.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Intentar con Clipboard API moderna si el contexto lo permite
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] Error con navigator.clipboard.writeText, intentando fallback execCommand:', err);
    }
  }

  // 2. Fallback universal usando textarea temporal
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Evitar zoom y scroll en móviles
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999); // Para móviles

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    return successful;
  } catch (err) {
    console.error('[Clipboard] Fallback execCommand también falló:', err);
    return false;
  }
}
