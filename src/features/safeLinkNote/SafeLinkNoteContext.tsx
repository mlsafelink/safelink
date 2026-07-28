import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { safeLinkNoteService, type SlnFile } from '@/services/safeLinkNoteService';
import { notificacionService } from '@/services/notificacionService';

const SEEN_KEY     = 'safelink_note_seen_files';
const NOTIFIED_KEY = 'safelink_note_notified_files';
export const LAST_VISIT_KEY = 'safelink_note_last_visit';
const POLL_INTERVAL = 30_000; // 30 segundos

type SafeLinkNoteContextType = {
  files: SlnFile[];
  isLoading: boolean;
  hasUnread: boolean;
  markAsRead: () => void;
  refetch: () => Promise<void>;
};

const SafeLinkNoteContext = createContext<SafeLinkNoteContextType>({
  files: [],
  isLoading: true,
  hasUnread: false,
  markAsRead: () => {},
  refetch: async () => {},
});

function getStoredSet(key: string): Set<string> {
  try {
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function SafeLinkNoteProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<SlnFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnread, setHasUnread] = useState(false);
  const currentFilesRef = useRef<Set<string>>(new Set());

  const fetchFiles = useCallback(async () => {
    try {
      const fetchedFiles = await safeLinkNoteService.listSlnFiles();
      setFiles(fetchedFiles);

      const fileNames = new Set(fetchedFiles.map(f => f.name));
      currentFilesRef.current = fileNames;

      const seenFiles     = getStoredSet(SEEN_KEY);
      const notifiedFiles = getStoredSet(NOTIFIED_KEY);

      // Evaluar si existen archivos no vistos por el usuario
      const newFiles = fetchedFiles.filter(f => !seenFiles.has(f.name));
      if (newFiles.length > 0) {
        setHasUnread(true);
      }

      // Notificar archivos que no hayan sido notificados previamente
      const toNotify = fetchedFiles.filter(f => !notifiedFiles.has(f.name));
      for (const file of toNotify) {
        try {
          await notificacionService.create({
            tipo: 'nuevo_sln',
            detalles: {
              archivo:    file.name,
              created_at: file.created_at,
            },
          });
          notifiedFiles.add(file.name);
        } catch (err) {
          console.error('[SafeLinkNote] Error creando notificación:', err);
        }
      }

      if (toNotify.length > 0) {
        saveSet(NOTIFIED_KEY, notifiedFiles);
      }
    } catch (err) {
      console.error('[SafeLinkNote] Error buscando archivos .sln:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(() => {
    saveSet(SEEN_KEY, currentFilesRef.current);
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    setHasUnread(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await fetchFiles();
    };

    run();
    const interval = setInterval(run, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchFiles]);

  return (
    <SafeLinkNoteContext.Provider
      value={{
        files,
        isLoading,
        hasUnread,
        markAsRead,
        refetch: fetchFiles,
      }}
    >
      {children}
    </SafeLinkNoteContext.Provider>
  );
}

export function useSafeLinkNote() {
  return useContext(SafeLinkNoteContext);
}
