/**
 * googleDriveService.ts
 * Gestión de OAuth 2.0 con Google Identity Services (GIS) y Google Drive REST API v3.
 * No usa gapi — solo GIS para tokens y fetch para las llamadas a Drive.
 */

const DEFAULT_CLIENT_ID = '545141398782-okeuohc20m7rnuuc3v0s715gsn2slvbp.apps.googleusercontent.com';
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || DEFAULT_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

const LS_TOKEN_KEY = 'safelink_gdrive_token';
const LS_EXPIRY_KEY = 'safelink_gdrive_expiry';
const LS_FOLDER_KEY = 'safelink_gdrive_folder_id';
const LS_EMAIL_KEY = 'safelink_gdrive_email';

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
}

// ── Estado interno ────────────────────────────────────────────────────────────

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let resolveToken: ((token: string) => void) | null = null;
let rejectToken: ((e: Error) => void) | null = null;

// ── Utilidades ────────────────────────────────────────────────────────────────

function saveToken(token: string, expiresIn: number) {
  const expiry = Date.now() + expiresIn * 1000 - 60_000; // 1 min buffer
  localStorage.setItem(LS_TOKEN_KEY, token);
  localStorage.setItem(LS_EXPIRY_KEY, String(expiry));
}

function getStoredToken(): string | null {
  const token = localStorage.getItem(LS_TOKEN_KEY);
  const expiry = Number(localStorage.getItem(LS_EXPIRY_KEY) ?? '0');
  if (token && Date.now() < expiry) return token;
  return null;
}

function clearToken() {
  localStorage.removeItem(LS_TOKEN_KEY);
  localStorage.removeItem(LS_EXPIRY_KEY);
}

async function loadGisScript(): Promise<void> {
  if (typeof window.google !== 'undefined' && window.google.accounts) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
}

function initTokenClient(): google.accounts.oauth2.TokenClient {
  if (tokenClient) return tokenClient;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: (response: TokenResponse & { error?: string }) => {
      if (response.error) {
        rejectToken?.(new Error(response.error));
        return;
      }
      saveToken(response.access_token, response.expires_in);
      resolveToken?.(response.access_token);
    },
  });

  return tokenClient;
}

async function getAccessToken(): Promise<string> {
  const stored = getStoredToken();
  if (stored) return stored;

  await loadGisScript();
  const client = initTokenClient();

  return new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
    client.requestAccessToken({ prompt: 'consent' });
  });
}

async function driveRequest<T>(
  method: string,
  url: string,
  token: string,
  body?: object,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? `Drive API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── API pública ───────────────────────────────────────────────────────────────

export const googleDriveService = {

  /** ¿Hay un token válido guardado? */
  isConnected(): boolean {
    return getStoredToken() !== null;
  },

  /** Correo guardado del usuario conectado */
  getEmail(): string | null {
    return localStorage.getItem(LS_EMAIL_KEY);
  },

  /** Folder ID guardado */
  getFolderId(): string | null {
    return localStorage.getItem(LS_FOLDER_KEY);
  },

  /** Inicia el flujo OAuth. Devuelve el access_token. */
  async signIn(): Promise<string> {
    await loadGisScript();
    const token = await getAccessToken();

    // Obtener info del usuario conectado
    try {
      const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json());
      localStorage.setItem(LS_EMAIL_KEY, info.email ?? '');
    } catch {
      // no crítico
    }

    return token;
  },

  /** Cierra sesión y limpia el token guardado */
  signOut() {
    const token = getStoredToken();
    if (token && typeof window.google !== 'undefined') {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    clearToken();
    localStorage.removeItem(LS_EMAIL_KEY);
  },

  /**
   * Crea (o reutiliza) la carpeta "SafeLink Cloud > Backups" en Drive.
   * Retorna el folder ID de "Backups".
   */
  async getOrCreateBackupFolder(): Promise<string> {
    const savedFolderId = localStorage.getItem(LS_FOLDER_KEY);
    const token = await getAccessToken();

    // Verificar que la carpeta aún existe
    if (savedFolderId) {
      try {
        const check = await fetch(
          `${DRIVE_API}/files/${savedFolderId}?fields=id,trashed`,
          { headers: { Authorization: `Bearer ${token}` } },
        ).then(r => r.json()) as { id?: string; trashed?: boolean };

        if (check.id && !check.trashed) {
          return savedFolderId;
        }
      } catch {
        // Folder eliminada, continuar a crear una nueva
      }
    }

    // Crear carpeta raíz "SafeLink Cloud"
    const rootSearch = await driveRequest<{ files: DriveFile[] }>(
      'GET',
      `${DRIVE_API}/files?q=name%3D'SafeLink Cloud' and mimeType%3D'application/vnd.google-apps.folder' and trashed%3Dfalse&fields=files(id,name)`,
      token,
    );

    let parentId: string;
    if (rootSearch.files.length > 0) {
      parentId = rootSearch.files[0].id;
    } else {
      const rootFolder = await driveRequest<DriveFile>('POST', `${DRIVE_API}/files`, token, {
        name: 'SafeLink Cloud',
        mimeType: 'application/vnd.google-apps.folder',
      });
      parentId = rootFolder.id;
    }

    // Crear carpeta "Backups" dentro de "SafeLink Cloud"
    const backupsFolder = await driveRequest<DriveFile>('POST', `${DRIVE_API}/files`, token, {
      name: 'Backups',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    });

    localStorage.setItem(LS_FOLDER_KEY, backupsFolder.id);
    return backupsFolder.id;
  },

  /**
   * Sube un archivo .sbk a la carpeta de backups en Drive.
   * Retorna el file ID de Drive.
   */
  async uploadFile(blob: Blob, filename: string): Promise<string> {
    const token = await getAccessToken();
    const folderId = await this.getOrCreateBackupFolder();

    const metadata = {
      name: filename,
      mimeType: 'application/octet-stream',
      parents: [folderId],
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', blob);

    const res = await fetch(
      `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message: string } })?.error?.message ??
          `Error al subir archivo a Drive (${res.status})`,
      );
    }

    const file = (await res.json()) as DriveFile;
    return file.id;
  },

  /** Elimina un archivo de Drive por su ID */
  async deleteFile(fileId: string): Promise<void> {
    const token = await getAccessToken();
    await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** URL de acceso a la carpeta de backups en Drive */
  getFolderUrl(): string | null {
    const folderId = localStorage.getItem(LS_FOLDER_KEY);
    if (!folderId) return null;
    return `https://drive.google.com/drive/folders/${folderId}`;
  },
};

// ── Declaraciones de tipos globales para GIS ──────────────────────────────────
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse & { error?: string }) => void;
          }): google.accounts.oauth2.TokenClient;
          revoke(token: string, done: () => void): void;
        };
      };
    };
  }
  namespace google {
    namespace accounts {
      namespace oauth2 {
        interface TokenClient {
          requestAccessToken(config?: { prompt?: string }): void;
        }
      }
    }
  }
}
