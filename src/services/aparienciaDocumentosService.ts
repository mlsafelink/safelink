import { supabase } from '@/lib/supabase';

export interface AparienciaDocumentosConfig {
  id: string;
  // Banner
  usar_banner_personalizado: boolean;
  banner_url: string;
  banner_altura: number; // 120 a 340 px
  banner_ajuste: 'cover' | 'contain' | 'fill';
  banner_posicion: 'center' | 'top' | 'bottom';
  
  // Fondo
  fondo_tipo: 'blanco' | 'solido' | 'degradado' | 'imagen';
  fondo_color: string;
  fondo_degradado: string;
  fondo_imagen_url: string | null;
  fondo_opacidad: number; // 10 a 100
  
  // Colores
  color_primario: string;
  color_secundario: string;
  color_titulos: string;
  color_subtitulos: string;
  color_textos: string;
  color_lineas: string;
  color_destacados: string;
  
  // Tipografía
  tipografia_familia: 'Inter' | 'Roboto' | 'Montserrat' | 'Arial' | 'Helvetica';
  tamano_titulos: 'compacto' | 'normal' | 'grande';
  tamano_cuerpo: 'compacto' | 'normal' | 'grande';
  interlineado: 'normal' | 'relajado';
  
  // Estructura
  margenes: 'estrecho' | 'normal' | 'amplio';
  espaciado_secciones: 'compacto' | 'normal' | 'amplio';
  
  // Identidad
  mostrar_logo: boolean;
  logo_tamano: 'pequeno' | 'normal' | 'grande';
  mostrar_eslogan: boolean;
  pie_pagina_texto: string;
  mostrar_numeracion: boolean;
  
  updated_at?: string;
}

export const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'safelink_apariencia_documentos';

// Por defecto usamos el Banner Corpóreo SafeLink como encabezado activo
export const DEFAULT_APARIENCIA_DOCUMENTOS: AparienciaDocumentosConfig = {
  id: CONFIG_ID,
  usar_banner_personalizado: true,
  banner_url: '/banner-corporeo.png',
  banner_altura: 200,
  banner_ajuste: 'cover',
  banner_posicion: 'center',
  
  fondo_tipo: 'blanco',
  fondo_color: '#ffffff',
  fondo_degradado: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  fondo_imagen_url: null,
  fondo_opacidad: 100,
  
  color_primario: '#1a365d',
  color_secundario: '#2b6cb0',
  color_titulos: '#0f172a',
  color_subtitulos: '#475569',
  color_textos: '#334155',
  color_lineas: '#e2e8f0',
  color_destacados: '#2563eb',
  
  tipografia_familia: 'Inter',
  tamano_titulos: 'normal',
  tamano_cuerpo: 'normal',
  interlineado: 'normal',
  
  margenes: 'normal',
  espaciado_secciones: 'normal',
  
  mostrar_logo: true,
  logo_tamano: 'normal',
  mostrar_eslogan: true,
  pie_pagina_texto: 'SafeLink · Sistemas de Seguridad e Infraestructura',
  mostrar_numeracion: true,
};

export const aparienciaDocumentosService = {
  async get(): Promise<AparienciaDocumentosConfig> {
    // 1. Intentar cargar desde Supabase (base de datos en la nube)
    try {
      const { data, error } = await supabase
        .from('configuracion_documentos')
        .select('*')
        .eq('id', CONFIG_ID)
        .maybeSingle();

      if (!error && data) {
        const merged: AparienciaDocumentosConfig = {
          ...DEFAULT_APARIENCIA_DOCUMENTOS,
          ...data,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        return merged;
      }
    } catch {
      // Continuar al fallback local
    }

    // 2. Fallback a LocalStorage persistente
    try {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        return {
          ...DEFAULT_APARIENCIA_DOCUMENTOS,
          ...parsed,
        };
      }
    } catch {}

    // 3. Fallback predeterminado con banner corpóreo activo
    return DEFAULT_APARIENCIA_DOCUMENTOS;
  },

  async save(newConfig: Partial<AparienciaDocumentosConfig>): Promise<AparienciaDocumentosConfig> {
    const payload: AparienciaDocumentosConfig = {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      ...newConfig,
      id: CONFIG_ID,
      updated_at: new Date().toISOString(),
    };

    // 1. Guardar de forma inmediata en LocalStorage para disponibilidad instantánea
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('safelink-apariencia-updated', { detail: payload }));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }

    // 2. Guardar en Supabase para sincronización entre dispositivos
    try {
      const { data, error } = await supabase
        .from('configuracion_documentos')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        return {
          ...payload,
          ...data,
        };
      }
      if (error) {
        console.warn('Aviso al guardar en Supabase (se mantiene persistencia local):', error.message);
      }
    } catch (err) {
      console.warn('Aviso de conexión con Supabase:', err);
    }

    return payload;
  },

  async reset(): Promise<AparienciaDocumentosConfig> {
    return this.save(DEFAULT_APARIENCIA_DOCUMENTOS);
  },

  /**
   * Sube una imagen al bucket persistente de Supabase Storage.
   * Utiliza el bucket 'documents' (carpeta 'branding/') que ya existe y es público en el proyecto.
   */
  async uploadBanner(file: File): Promise<string> {
    const cleanName = file.name.replace(/[^\w.-]/g, '_');
    const fileName = `branding/banner-${Date.now()}_${cleanName}`;

    // 1. Intentar subida al bucket 'documents' de Supabase
    try {
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          console.info('Banner subido con éxito al bucket documents de Supabase:', data.publicUrl);
          return data.publicUrl;
        }
      } else {
        console.warn('Error subiendo al bucket documents:', uploadError.message);
      }
    } catch (err) {
      console.warn('Error en conexión con Supabase Storage:', err);
    }

    // 2. Si falla Supabase Storage, convertir a Base64 / Data URL persistente en cliente
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('No se pudo leer la imagen'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};
