import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { safeLinkNoteService, type SlnFile } from '@/services/safeLinkNoteService';

const SEEN_KEY = 'safelink_note_seen_files';
export const LAST_VISIT_KEY = 'safelink_note_last_visit';
const POLL_INTERVAL = 45_000; // 45 segundos

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
  const isFirstLoadRef = useRef(true);
  const knownFilesRef = useRef<Set<string>>(new Set());

  const fetchFiles = useCallback(async () => {
    try {
      const fetchedFiles = await safeLinkNoteService.listSlnFiles();
      setFiles(fetchedFiles);

      const fileNames = new Set(fetchedFiles.map(f => f.name));
      currentFilesRef.current = fileNames;

      const seenFiles = getStoredSet(SEEN_KEY);

      if (isFirstLoadRef.current) {
        // En la primera carga, registrar los archivos existentes como conocidos en la sesión.
        // Los archivos históricos que ya están en el storage NUNCA deben encender el punto rojo
        // ni crear notificaciones espurias en el sistema.
        knownFilesRef.current = new Set([...seenFiles, ...fileNames]);
        saveSet(SEEN_KEY, knownFilesRef.current);
        isFirstLoadRef.current = false;
      } else {
        // Solo en sondeos posteriores durante la sesión activa:
        // si se recibe o genera un archivo .sln nuevo que antes no existía, marcar como no leído.
        const newlyArrived = fetchedFiles.filter(f => !knownFilesRef.current.has(f.name));
        if (newlyArrived.length > 0) {
          setHasUnread(true);
          newlyArrived.forEach(f => knownFilesRef.current.add(f.name));
        }
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
