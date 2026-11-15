import { supabase } from '@/lib/supabase';

export interface AparienciaDocumentosConfig {
  id: string;
  // Banner
  usar_banner_personalizado: boolean;
  banner_url: string;
  banner_altura: number; // 100 a 340 px
  banner_tamano_porcentaje?: number; // 50 a 150 %
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

export interface AparienciaDocumentosPreset {
  id: string;
  nombre: string;
  config: AparienciaDocumentosConfig;
  es_sistema?: boolean;
  created_at: string;
  updated_at: string;
}

export const CONFIG_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'safelink_apariencia_documentos';
const PRESETS_STORAGE_KEY = 'safelink_apariencia_presets';
const ACTIVE_PRESET_KEY = 'safelink_active_preset_id';

// Por defecto usamos el Banner Corpóreo SafeLink como encabezado activo
export const DEFAULT_APARIENCIA_DOCUMENTOS: AparienciaDocumentosConfig = {
  id: CONFIG_ID,
  usar_banner_personalizado: true,
  banner_url: '/banner-corporeo.png',
  banner_altura: 180,
  banner_tamano_porcentaje: 100,
  banner_ajuste: 'contain',
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

// Presets sugeridos por defecto
export const DEFAULT_PRESETS: AparienciaDocumentosPreset[] = [
  {
    id: 'preset-safelink-corporativo',
    nombre: 'SafeLink Corporativo',
    config: {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      id: 'preset-safelink-corporativo',
      banner_altura: 180,
      banner_tamano_porcentaje: 100,
      banner_ajuste: 'contain',
      color_primario: '#1a365d',
      color_secundario: '#2b6cb0',
      color_destacados: '#2563eb',
      tipografia_familia: 'Inter',
    },
    es_sistema: true,
    created_at: '2026-11-15T00:00:00.000Z',
    updated_at: '2026-11-15T00:00:00.000Z',
  },
  {
    id: 'preset-propuesta-tecnica',
    nombre: 'Propuesta Técnica',
    config: {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      id: 'preset-propuesta-tecnica',
      banner_altura: 160,
      banner_tamano_porcentaje: 90,
      banner_ajuste: 'contain',
      color_primario: '#0f294a',
      color_secundario: '#1e40af',
      color_titulos: '#0b192c',
      color_subtitulos: '#334155',
      color_destacados: '#1d4ed8',
      tipografia_familia: 'Roboto',
    },
    es_sistema: true,
    created_at: '2026-11-15T00:00:00.000Z',
    updated_at: '2026-11-15T00:00:00.000Z',
  },
  {
    id: 'preset-presupuesto-comercial',
    nombre: 'Presupuesto Comercial',
    config: {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      id: 'preset-presupuesto-comercial',
      banner_altura: 170,
      banner_tamano_porcentaje: 95,
      banner_ajuste: 'contain',
      color_primario: '#1e1b4b',
      color_secundario: '#4338ca',
      color_destacados: '#4f46e5',
      tipografia_familia: 'Montserrat',
      tamano_titulos: 'grande',
    },
    es_sistema: true,
    created_at: '2026-11-15T00:00:00.000Z',
    updated_at: '2026-11-15T00:00:00.000Z',
  },
  {
    id: 'preset-informe-trabajos',
    nombre: 'Informe de Trabajos',
    config: {
      ...DEFAULT_APARIENCIA_DOCUMENTOS,
      id: 'preset-informe-trabajos',
      banner_altura: 150,
      banner_tamano_porcentaje: 85,
      banner_ajuste: 'contain',
      color_primario: '#064e3b',
      color_secundario: '#047857',
      color_destacados: '#059669',
      tipografia_familia: 'Inter',
      espaciado_secciones: 'compacto',
    },
    es_sistema: true,
    created_at: '2026-11-15T00:00:00.000Z',
    updated_at: '2026-11-15T00:00:00.000Z',
  },
];

export const aparienciaDocumentosService = {
  // ── OBTENER CONFIGURACIÓN ACTIVA ──
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

  // ── GUARDAR CONFIGURACIÓN ACTIVA ──
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

  // ── RESTAURAR PREDETERMINADO ──
  async reset(): Promise<AparienciaDocumentosConfig> {
    this.setActivePresetId('preset-safelink-corporativo');
    return this.save(DEFAULT_APARIENCIA_DOCUMENTOS);
  },

  // ── PRESETS: OBTENER LISTA DE CONFIGURACIONES GUARDADAS ──
  async getPresets(): Promise<AparienciaDocumentosPreset[]> {
    let presets: AparienciaDocumentosPreset[] = [];

    // 1. Intentar cargar desde tabla remota de Supabase si existe
    try {
      const { data, error } = await supabase
        .from('apariencia_documentos_presets')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        presets = data.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          config: typeof d.config === 'string' ? JSON.parse(d.config) : d.config,
          es_sistema: !!d.es_sistema,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }));
      }
    } catch (err) {
      console.warn('No se pudo consultar presets remotos en Supabase:', err);
    }

    // 2. Si no hay presets en Supabase o falló, recurrir al almacenamiento persistente local
    if (presets.length === 0) {
      try {
        const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (stored) {
          presets = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Error leyendo presets locales:', e);
      }
    }

    // 3. Si sigue vacío, inicializar con los presets del sistema
    if (presets.length === 0) {
      presets = [...DEFAULT_PRESETS];
      try {
        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
      } catch {}
    }

    return presets;
  },

  // ── PRESETS: GUARDAR NUEVA O ACTUALIZAR EXISTENTE ──
  async savePreset(
    nombre: string,
    config: AparienciaDocumentosConfig,
    existingId?: string
  ): Promise<AparienciaDocumentosPreset> {
    const trimmedName = nombre.trim();
    if (!trimmedName) {
      throw new Error('El nombre de la configuración no puede estar vacío');
    }

    const presets = await this.getPresets();
    const now = new Date().toISOString();
    const id = existingId || `preset-${Date.now()}`;

    const presetToSave: AparienciaDocumentosPreset = {
      id,
      nombre: trimmedName,
      config: {
        ...config,
        id,
        updated_at: now,
      },
      es_sistema: false,
      created_at: existingId ? (presets.find(p => p.id === existingId)?.created_at || now) : now,
      updated_at: now,
    };

    const existingIndex = presets.findIndex(p => p.id === id);
    let updatedPresets: AparienciaDocumentosPreset[];

    if (existingIndex >= 0) {
      updatedPresets = [...presets];
      updatedPresets[existingIndex] = presetToSave;
    } else {
      updatedPresets = [...presets, presetToSave];
    }

    // Guardar en Storage local
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    } catch (e) {
      console.warn('Error guardando presets en localStorage:', e);
    }

    // Intentar sincronizar en Supabase
    try {
      await supabase
        .from('apariencia_documentos_presets')
        .upsert({
          id: presetToSave.id,
          nombre: presetToSave.nombre,
          config: presetToSave.config,
          es_sistema: presetToSave.es_sistema,
          updated_at: now,
        }, { onConflict: 'id' });
    } catch (err) {
      console.warn('Aviso guardando preset en Supabase:', err);
    }

    window.dispatchEvent(new CustomEvent('safelink-presets-updated', { detail: updatedPresets }));
    return presetToSave;
  },

  // ── PRESETS: RENOMBRAR ──
  async renamePreset(id: string, nuevoNombre: string): Promise<void> {
    const trimmed = nuevoNombre.trim();
    if (!trimmed) throw new Error('El nombre no puede estar vacío');

    const presets = await this.getPresets();
    const target = presets.find(p => p.id === id);
    if (!target) throw new Error('Configuración no encontrada');

    target.nombre = trimmed;
    target.updated_at = new Date().toISOString();

    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch {}

    try {
      await supabase
        .from('apariencia_documentos_presets')
        .update({ nombre: trimmed, updated_at: target.updated_at })
        .eq('id', id);
    } catch {}

    window.dispatchEvent(new CustomEvent('safelink-presets-updated', { detail: presets }));
  },

  // ── PRESETS: ELIMINAR ──
  async deletePreset(id: string): Promise<void> {
    const presets = await this.getPresets();
    const updated = presets.filter(p => p.id !== id);

    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    try {
      await supabase
        .from('apariencia_documentos_presets')
        .delete()
        .eq('id', id);
    } catch {}

    // Si la eliminada era la activa, resetear el id activo
    if (this.getActivePresetId() === id) {
      this.setActivePresetId(null);
    }

    window.dispatchEvent(new CustomEvent('safelink-presets-updated', { detail: updated }));
  },

  // ── PRESET ACTIVO ──
  getActivePresetId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_PRESET_KEY);
    } catch {
      return null;
    }
  },

  setActivePresetId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_PRESET_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_PRESET_KEY);
      }
    } catch {}
  },

  // ── PRESETS: APLICAR PRESET A DOCUMENTOS ACTIVOS ──
  async applyPreset(presetId: string): Promise<AparienciaDocumentosConfig> {
    const presets = await this.getPresets();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
      throw new Error('Configuración no encontrada');
    }

    this.setActivePresetId(presetId);
    return this.save({
      ...preset.config,
      id: CONFIG_ID,
    });
  },

  // ── SUBIDA DE BANNER A SUPABASE STORAGE ──
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
