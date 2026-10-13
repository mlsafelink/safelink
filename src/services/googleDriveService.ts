/**
 * googleDriveService.ts
 * Gestión de OAuth 2.0 con Google Identity Services (GIS) y Google Drive REST API v3.
 *
 * Soporta:
 *  - Cuenta primaria (ml.safelink@gmail.com) con login_hint automático
 *  - Cuenta secundaria opcional (cualquier Gmail)
 *  - Exportación masiva de la biblioteca a cualquiera de las dos cuentas
 */

const DEFAULT_CLIENT_ID = '545141398782-okeuohc20m7rnuuc3v0s715gsn2slvbp.apps.googleusercontent.com';
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || DEFAULT_CLIENT_ID;
const SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

/** Cuenta principal sugerida (login_hint) */
export const PRIMARY_DRIVE_EMAIL = 'ml.safelink@gmail.com';

// ── LocalStorage keys ─────────────────────────────────────────────────────────

const LS = {
  // Cuenta primaria
  TOKEN:        'safelink_gdrive_token',
  EXPIRY:       'safelink_gdrive_expiry',
  EMAIL:        'safelink_gdrive_email',
  FOLDER_MEDIA: 'safelink_gdrive_folder_media',
  FOLDER_BAK:   'safelink_gdrive_folder_bak',
  // Cuenta secundaria
  TOKEN2:       'safelink_gdrive_token2',
  EXPIRY2:      'safelink_gdrive_expiry2',
  EMAIL2:       'safelink_gdrive_email2',
  FOLDER2:      'safelink_gdrive_folder2',
};

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  token_type:   string;
  expires_in:   number;
  scope:        string;
  error?:       string;
}

interface DriveFile {
  id:           string;
  name:         string;
  mimeType:     string;
  webViewLink?: string;
  size?:        string;
}

export interface DriveAccount {
  slot:    'primary' | 'secondary';
  email:   string;
  token:   string;
  isValid: boolean;
}

// ── Estado interno ────────────────────────────────────────────────────────────

let tokenClient:    google.accounts.oauth2.TokenClient | null = null;
let resolveToken:   ((token: string) => void) | null = null;
let rejectToken:    ((e: Error) => void) | null = null;
let pendingSlot:    'primary' | 'secondary' = 'primary';

// ── Utilidades privadas ───────────────────────────────────────────────────────

function lsKey(slot: 'primary' | 'secondary', key: keyof typeof LS) {
  if (slot === 'secondary') {
    const map: Partial<Record<keyof typeof LS, keyof typeof LS>> = {
      TOKEN: 'TOKEN2', EXPIRY: 'EXPIRY2', EMAIL: 'EMAIL2', FOLDER_MEDIA: 'FOLDER2',
    };
    return LS[map[key] ?? key];
  }
  return LS[key];
}

function saveToken(slot: 'primary' | 'secondary', token: string, expiresIn: number) {
  const expiry = Date.now() + expiresIn * 1000 - 60_000;
  localStorage.setItem(lsKey(slot, 'TOKEN'), token);
  localStorage.setItem(lsKey(slot, 'EXPIRY'), String(expiry));
}

function getStoredToken(slot: 'primary' | 'secondary'): string | null {
  const token  = localStorage.getItem(lsKey(slot, 'TOKEN'));
  const expiry = Number(localStorage.getItem(lsKey(slot, 'EXPIRY')) ?? '0');
  if (token && Date.now() < expiry) return token;
  return null;
}

function clearSlot(slot: 'primary' | 'secondary') {
  const keys: (keyof typeof LS)[] = slot === 'primary'
    ? ['TOKEN', 'EXPIRY', 'EMAIL', 'FOLDER_MEDIA', 'FOLDER_BAK']
    : ['TOKEN2', 'EXPIRY2', 'EMAIL2', 'FOLDER2'];
  keys.forEach(k => localStorage.removeItem(LS[k]));
}

async function loadGisScript(): Promise<void> {
  if (typeof window.google !== 'undefined' && window.google.accounts) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src     = 'https://accounts.google.com/gsi/client';
    script.async   = true;
    script.defer   = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services'));
    document.head.appendChild(script);
  });
}

function initTokenClient(hint?: string): google.accounts.oauth2.TokenClient {
  // Recrear si cambia el hint
  if (!tokenClient || hint) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id:  CLIENT_ID,
      scope:      SCOPE,
      login_hint: hint,
      callback:   (response: TokenResponse) => {
        if (response.error) {
          rejectToken?.(new Error(response.error));
          return;
        }
        saveToken(pendingSlot, response.access_token, response.expires_in);
        resolveToken?.(response.access_token);
      },
    });
  }
  return tokenClient;
}

async function getAccessToken(slot: 'primary' | 'secondary' = 'primary', hint?: string): Promise<string> {
  const stored = getStoredToken(slot);
  if (stored) return stored;

  await loadGisScript();
  pendingSlot = slot;
  const client = initTokenClient(hint);

  return new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken  = reject;
    client.requestAccessToken({ prompt: hint ? '' : 'consent' });
  });
}

async function driveRequest<T>(method: string, url: string, token: string, body?: object): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error((err as { error?: { message: string } })?.error?.message ?? `Drive API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function getUserEmail(token: string): Promise<string> {
  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json()) as { email?: string };
  return info.email ?? '';
}

async function getOrCreateFolder(token: string, folderName: string, parentId?: string): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : '';
  const search = await driveRequest<{ files: DriveFile[] }>(
    'GET',
    `${DRIVE_API}/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder'${parentClause} and trashed=false&fields=files(id,name)`,
    token,
  );
  if (search.files.length > 0) return search.files[0].id;
  const folder = await driveRequest<DriveFile>('POST', `${DRIVE_API}/files`, token, {
    name:     folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  });
  return folder.id;
}

async function uploadBlob(token: string, blob: Blob, filename: string, mimeType: string, folderId: string): Promise<DriveFile> {
  const metadata = { name: filename, mimeType, parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message: string } })?.error?.message ?? `Drive upload error ${res.status}`);
  }
  return res.json() as Promise<DriveFile>;
}

// ── API pública ───────────────────────────────────────────────────────────────

export const googleDriveService = {

  // ── Estado ──────────────────────────────────────────────────────────────────

  isConnected(slot: 'primary' | 'secondary' = 'primary'): boolean {
    return getStoredToken(slot) !== null;
  },

  getEmail(slot: 'primary' | 'secondary' = 'primary'): string | null {
    return localStorage.getItem(lsKey(slot, 'EMAIL'));
  },

  /** Lista las cuentas conectadas actualmente */
  getConnectedAccounts(): DriveAccount[] {
    const accounts: DriveAccount[] = [];
    (['primary', 'secondary'] as const).forEach(slot => {
      const token = getStoredToken(slot);
      const email = localStorage.getItem(lsKey(slot, 'EMAIL'));
      if (email) {
        accounts.push({ slot, email, token: token ?? '', isValid: !!token });
      }
    });
    return accounts;
  },

  // ── Auth ────────────────────────────────────────────────────────────────────

  /**
   * Conecta una cuenta de Drive.
   * - slot='primary' → sugiere ml.safelink@gmail.com con login_hint
   * - slot='secondary' → abre selector libre de cuenta
   */
  async signIn(slot: 'primary' | 'secondary' = 'primary'): Promise<string> {
    await loadGisScript();
    const hint = slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined;
    const token = await getAccessToken(slot, hint);

    try {
      const email = await getUserEmail(token);
      localStorage.setItem(lsKey(slot, 'EMAIL'), email);
    } catch { /* no crítico */ }

    return token;
  },

  signOut(slot: 'primary' | 'secondary' = 'primary') {
    const token = getStoredToken(slot);
    if (token && typeof window.google !== 'undefined') {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
    clearSlot(slot);
    // Reinicia el cliente para el próximo login
    tokenClient = null;
  },

  // ── Carpetas ────────────────────────────────────────────────────────────────

  async getOrCreateMediaFolder(slot: 'primary' | 'secondary' = 'primary'): Promise<string> {
    const token    = await getAccessToken(slot, slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined);
    const rootId   = await getOrCreateFolder(token, 'SafeLink Cloud');
    const mediaId  = await getOrCreateFolder(token, 'Publicidad Vibe', rootId);
    return mediaId;
  },

  async getOrCreateBackupFolder(slot: 'primary' | 'secondary' = 'primary'): Promise<string> {
    const savedKey = slot === 'primary' ? LS.FOLDER_BAK : LS.FOLDER2;
    const saved    = localStorage.getItem(savedKey);
    const token    = await getAccessToken(slot, slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined);

    if (saved) {
      try {
        const check = await fetch(`${DRIVE_API}/files/${saved}?fields=id,trashed`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()) as { id?: string; trashed?: boolean };
        if (check.id && !check.trashed) return saved;
      } catch { /* carpeta eliminada */ }
    }

    const rootId = await getOrCreateFolder(token, 'SafeLink Cloud');
    const bakId  = await getOrCreateFolder(token, 'Backups', rootId);
    localStorage.setItem(savedKey, bakId);
    return bakId;
  },

  // ── Uploads ─────────────────────────────────────────────────────────────────

  /** Sube un archivo multimedia a "SafeLink Cloud > Publicidad Vibe" */
  async uploadMedia(
    blob: Blob,
    filename: string,
    mimeType: string = 'video/mp4',
    slot: 'primary' | 'secondary' = 'primary',
  ): Promise<string> {
    const token    = await getAccessToken(slot, slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined);
    const folderId = await this.getOrCreateMediaFolder(slot);
    const file     = await uploadBlob(token, blob, filename, mimeType, folderId);
    return file.id;
  },

  /** Sube un archivo de backup (.sbk) a "SafeLink Cloud > Backups" */
  async uploadFile(
    blob: Blob,
    filename: string,
    slot: 'primary' | 'secondary' = 'primary',
  ): Promise<string> {
    const token    = await getAccessToken(slot, slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined);
    const folderId = await this.getOrCreateBackupFolder(slot);
    const file     = await uploadBlob(token, blob, filename, 'application/octet-stream', folderId);
    return file.id;
  },

  /**
   * Exporta toda la biblioteca (lista de URLs) a Google Drive.
   * Descarga cada URL y la sube a "Publicidad Vibe".
   * Llama a onProgress(done, total) en cada archivo completado.
   */
  async exportLibrary(
    files: Array<{ name: string; url: string; mimeType: string }>,
    slot: 'primary' | 'secondary' = 'primary',
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ uploaded: number; errors: string[] }> {
    const token    = await getAccessToken(slot, slot === 'primary' ? PRIMARY_DRIVE_EMAIL : undefined);
    const folderId = await this.getOrCreateMediaFolder(slot);

    let uploaded = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const { name, url, mimeType } = files[i];
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        await uploadBlob(token, blob, name, mimeType || blob.type || 'application/octet-stream', folderId);
        uploaded++;
      } catch (err) {
        errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
      onProgress?.(i + 1, files.length);
    }

    return { uploaded, errors };
  },

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async deleteFile(fileId: string, slot: 'primary' | 'secondary' = 'primary'): Promise<void> {
    const token = await getAccessToken(slot);
    await fetch(`${DRIVE_API}/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getFolderUrl(slot: 'primary' | 'secondary' = 'primary'): string | null {
    const key = slot === 'primary' ? LS.FOLDER_BAK : LS.FOLDER2;
    const id  = localStorage.getItem(key);
    return id ? `https://drive.google.com/drive/folders/${id}` : null;
  },
};

// ── Tipos globales GIS ────────────────────────────────────────────────────────
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id:   string;
            scope:       string;
            login_hint?: string;
            callback:    (response: TokenResponse) => void;
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
