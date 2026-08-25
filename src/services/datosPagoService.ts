import { supabase } from '@/lib/supabase';

export interface DatosPago {
  banco: string;
  titular: string;
  numero_cuenta: string;
  cbu: string;
  alias: string;
}

export const DEFAULT_DATOS_PAGO: DatosPago = {
  banco: '',
  titular: '',
  numero_cuenta: '',
  cbu: '',
  alias: '',
};

const LOCAL_STORAGE_KEY = 'safelink_datos_pago_v1';

export const datosPagoService = {
  /**
   * Obtiene los datos bancarios guardados en LocalStorage (fallback rápido)
   */
  getLocal(): DatosPago {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_DATOS_PAGO, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[DatosPagoService] Error leyendo LocalStorage:', e);
    }
    return DEFAULT_DATOS_PAGO;
  },

  /**
   * Guarda los datos en LocalStorage
   */
  saveLocal(datos: DatosPago) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(datos));
    } catch (e) {
      console.warn('[DatosPagoService] Error guardando LocalStorage:', e);
    }
  },

  /**
   * Obtiene los datos bancarios de Supabase con fallback a LocalStorage
   */
  async getDatosPago(): Promise<DatosPago> {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('id, banco, titular_cuenta, numero_cuenta, cbu, alias')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const remote: DatosPago = {
          banco: data.banco || '',
          titular: data.titular_cuenta || '',
          numero_cuenta: data.numero_cuenta || '',
          cbu: data.cbu || '',
          alias: data.alias || '',
        };
        datosPagoService.saveLocal(remote);
        return remote;
      }
    } catch (e) {
      console.warn('[DatosPagoService] Error obteniendo datos de Supabase, usando local:', e);
    }

    return datosPagoService.getLocal();
  },

  /**
   * Guarda los datos bancarios en Supabase y actualiza la caché local
   */
  async saveDatosPago(datos: DatosPago): Promise<DatosPago> {
    datosPagoService.saveLocal(datos);

    try {
      const { data: existing } = await supabase
        .from('configuracion')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const payload = {
        banco: datos.banco.trim(),
        titular_cuenta: datos.titular.trim(),
        numero_cuenta: datos.numero_cuenta.trim(),
        cbu: datos.cbu.trim(),
        alias: datos.alias.trim(),
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error } = await supabase
          .from('configuracion')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracion')
          .insert([payload]);

        if (error) throw error;
      }
    } catch (e) {
      console.warn('[DatosPagoService] Error guardando en Supabase (mantenido localmente):', e);
    }

    return datos;
  },

  /**
   * Verifica si los datos bancarios requeridos están completamente cargados
   */
  isConfigurado(datos?: DatosPago | null): boolean {
    if (!datos) return false;
    return Boolean(
      datos.banco?.trim() &&
      datos.titular?.trim() &&
      datos.numero_cuenta?.trim() &&
      datos.cbu?.trim() &&
      datos.alias?.trim()
    );
  },
};
