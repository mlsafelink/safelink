import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  configuracionService,
  DEFAULT_CONFIG,
  type Configuracion,
  type Tema,
  type ColorPrincipal,
  type Tipografia,
  type ModoDashboard
} from '@/services/configuracionService';

interface ConfiguracionContextValue {
  config: Configuracion;
  updateConfig: (updates: Partial<Configuracion>) => Promise<void>;
  resetConfig: () => Promise<void>;
  isLoading: boolean;
}

const ConfiguracionContext = createContext<ConfiguracionContextValue | null>(null);

function applyDOMConfig(config: Configuracion) {
  const root = document.documentElement;

  // Tema (claro/oscuro/sistema)
  let resolvedTheme = config.tema;
  if (config.tema === 'sistema') {
    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  root.setAttribute('data-theme', resolvedTheme === 'oscuro' ? 'dark' : 'light');

  // Color principal
  root.setAttribute('data-color', config.color_principal);

  // Tipografía
  root.setAttribute('data-font-size', config.tipografia);

  // Animaciones
  root.setAttribute('data-animations', config.mostrar_animaciones ? 'true' : 'false');

  // Modo Dashboard
  root.setAttribute('data-modo-dashboard', config.modo_dashboard);
}

export function ConfiguracionProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Configuracion>(() => {
    const local = configuracionService.getLocal();
    applyDOMConfig(local);
    return local;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sincronizar con Supabase al cargar
  useEffect(() => {
    configuracionService.getRemote().then(remoteConfig => {
      setConfig(remoteConfig);
      applyDOMConfig(remoteConfig);
      setIsLoading(false);
    });
  }, []);

  // Escuchar cambios de preferencia del sistema si está en modo "sistema"
  useEffect(() => {
    if (config.tema !== 'sistema') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => applyDOMConfig(config);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [config]);

  const updateConfig = useCallback(async (updates: Partial<Configuracion>) => {
    setConfig(prev => {
      const updated = { ...prev, ...updates };
      applyDOMConfig(updated);
      configuracionService.saveRemote(updated);
      return updated;
    });
  }, []);

  const resetConfig = useCallback(async () => {
    setConfig(DEFAULT_CONFIG);
    applyDOMConfig(DEFAULT_CONFIG);
    await configuracionService.saveRemote(DEFAULT_CONFIG);
  }, []);

  return (
    <ConfiguracionContext.Provider value={{ config, updateConfig, resetConfig, isLoading }}>
      {children}
    </ConfiguracionContext.Provider>
  );
}

export function useConfiguracion(): ConfiguracionContextValue {
  const ctx = useContext(ConfiguracionContext);
  if (!ctx) {
    throw new Error('useConfiguracion debe ser usado dentro de ConfiguracionProvider');
  }
  return ctx;
}
