import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { safeLinkNoteService } from '@/services/safeLinkNoteService';
import { notificacionService } from '@/services/notificacionService';

const SEEN_KEY     = 'safelink_note_seen_files';
const NOTIFIED_KEY = 'safelink_note_notified_files';
export const LAST_VISIT_KEY = 'safelink_note_last_visit';
const POLL_INTERVAL = 30_000; // 30 segundos

type SafeLinkNoteContextType = {
  hasUnread: boolean;
  markAsRead: () => void;
};

const SafeLinkNoteContext = createContext<SafeLinkNoteContextType>({
  hasUnread: false,
  markAsRead: () => {},
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
  const [hasUnread, setHasUnread] = useState(false);
  const currentFilesRef = useRef<Set<string>>(new Set());

  const markAsRead = () => {
    saveSet(SEEN_KEY, currentFilesRef.current);
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    setHasUnread(false);
  };

  useEffect(() => {
    let mounted = true;

    const doCheck = async () => {
      const files = await safeLinkNoteService.listSlnFiles();
      if (!mounted) return;

      const fileNames = new Set(files.map(f => f.name));
      currentFilesRef.current = fileNames;

      const seenFiles     = getStoredSet(SEEN_KEY);
      const notifiedFiles = getStoredSet(NOTIFIED_KEY);

      // Evaluar archivos no vistos y notificar si corresponde
      const newFiles = files.filter(f => !seenFiles.has(f.name));
      if (newFiles.length > 0) {
        setHasUnread(true);
      }

      // Archivos sin notificación creada → crear notificación (evitar duplicados)
      const toNotify = files.filter(f => !notifiedFiles.has(f.name));
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
    };

    doCheck();
    const interval = setInterval(doCheck, POLL_INTERVAL);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <SafeLinkNoteContext.Provider value={{ hasUnread, markAsRead }}>
      {children}
    </SafeLinkNoteContext.Provider>
  );
}

export function useSafeLinkNote() {
  return useContext(SafeLinkNoteContext);
}
