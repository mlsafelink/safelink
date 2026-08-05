import { supabase } from '@/lib/supabase';

export type Tema = 'oscuro' | 'claro' | 'sistema';
export type ColorPrincipal = 'purpura' | 'azul' | 'verde' | 'rojo' | 'naranja';
export type Tipografia = 'pequena' | 'normal' | 'grande';
export type ModoDashboard = 'confortable' | 'compacto';

export type Configuracion = {
  id?: string;
  user_id?: string | null;
  tema: Tema;
  color_principal: ColorPrincipal;
  mostrar_animaciones: boolean;
  modo_dashboard: ModoDashboard;
  tipografia: Tipografia;
  updated_at?: string;
};

export const DEFAULT_CONFIG: Configuracion = {
  tema: 'claro',
  color_principal: 'purpura',
  mostrar_animaciones: true,
  modo_dashboard: 'confortable',
  tipografia: 'normal',
};

const LOCAL_STORAGE_KEY = 'safelink_configuracion';

export const configuracionService = {
  /** Leer de LocalStorage (rápido) */
  getLocal(): Configuracion {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error al leer configuración local:', e);
    }
    return DEFAULT_CONFIG;
  },

  /** Guardar en LocalStorage (rápido) */
  saveLocal(config: Configuracion) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Error al guardar configuración local:', e);
    }
  },

  /** Obtener de Supabase con fallback a LocalStorage */
  async getRemote(): Promise<Configuracion> {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Supabase configuracion query error:', error.message);
        return configuracionService.getLocal();
      }

      if (data) {
        const remoteConfig: Configuracion = {
          id: data.id,
          user_id: data.user_id,
          tema: data.tema ?? DEFAULT_CONFIG.tema,
          color_principal: data.color_principal ?? DEFAULT_CONFIG.color_principal,
          mostrar_animaciones: data.mostrar_animaciones ?? DEFAULT_CONFIG.mostrar_animaciones,
          modo_dashboard: data.modo_dashboard ?? DEFAULT_CONFIG.modo_dashboard,
          tipografia: data.tipografia ?? DEFAULT_CONFIG.tipografia,
          updated_at: data.updated_at,
        };
        configuracionService.saveLocal(remoteConfig);
        return remoteConfig;
      }
    } catch (e) {
      console.warn('Error al obtener configuración remota:', e);
    }
    return configuracionService.getLocal();
  },

  /** Guardar en Supabase y LocalStorage */
  async saveRemote(config: Configuracion): Promise<Configuracion> {
    configuracionService.saveLocal(config);

    try {
      const payload = {
        tema: config.tema,
        color_principal: config.color_principal,
        mostrar_animaciones: config.mostrar_animaciones,
        modo_dashboard: config.modo_dashboard,
        tipografia: config.tipografia,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { data, error } = await supabase
          .from('configuracion')
          .update(payload)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        return data as Configuracion;
      } else {
        const { data, error } = await supabase
          .from('configuracion')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return data as Configuracion;
      }
    } catch (e) {
      console.warn('No se pudo guardar en Supabase (se mantiene local):', e);
      return config;
    }
  },
};
