import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface DrawerContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

const STORAGE_KEY = 'safelink_drawer_open';

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Default abierto en desktop, cerrado en mobile
      if (saved !== null) return saved === 'true';
      return window.innerWidth >= 768;
    } catch {
      return true;
    }
  });

  // Persiste el estado en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen));
    } catch {
      /* ignore */
    }
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(v => !v), []);
  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);

  return (
    <DrawerContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used within DrawerProvider');
  return ctx;
}
