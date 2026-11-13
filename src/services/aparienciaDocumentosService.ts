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

export const DEFAULT_APARIENCIA_DOCUMENTOS: AparienciaDocumentosConfig = {
  id: CONFIG_ID,
  usar_banner_personalizado: false,
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
    try {
      const { data, error } = await supabase
        .from('configuracion_documentos')
        .select('*')
        .eq('id', CONFIG_ID)
        .maybeSingle();

      if (error || !data) {
        // Fallback al valor por defecto
        return DEFAULT_APARIENCIA_DOCUMENTOS;
      }

      return {
        ...DEFAULT_APARIENCIA_DOCUMENTOS,
        ...data,
      };
    } catch {
      return DEFAULT_APARIENCIA_DOCUMENTOS;
    }
  },

  async save(newConfig: Partial<AparienciaDocumentosConfig>): Promise<AparienciaDocumentosConfig> {
    const payload = {
      ...newConfig,
      id: CONFIG_ID,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('configuracion_documentos')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Error al guardar apariencia de documentos:', error.message);
      // Retornar al menos lo intentado con defaults
      return {
        ...DEFAULT_APARIENCIA_DOCUMENTOS,
        ...newConfig,
      };
    }

    return {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      ...data,
    };
  },

  async reset(): Promise<AparienciaDocumentosConfig> {
    return this.save(DEFAULT_APARIENCIA_DOCUMENTOS);
  },

  async uploadBanner(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `banner-${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentos-branding')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data } = supabase.storage
          .from('documentos-branding')
          .getPublicUrl(filePath);
        if (data?.publicUrl) return data.publicUrl;
      }
    } catch (err) {
      console.warn('Storage upload error, falling back to data URL:', err);
    }

    // Fallback: leer como Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

