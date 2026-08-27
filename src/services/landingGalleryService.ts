import { supabase } from '@/lib/supabase';

export type LandingGalleryCategory = 'iluminacion' | 'redes' | 'seguridad';
export type MediaType = 'image' | 'video';

export interface LandingGalleryMedia {
  id: string;
  gallery_id: string;
  media_type: MediaType;
  storage_path: string;
  media_url: string;
  sort_order: number;
  created_at: string;
}

export interface LandingGalleryItem {
  id: string;
  category: LandingGalleryCategory;
  title: string;
  caption?: string | null;
  description?: string | null;
  sort_order: number;
  active: boolean;
  featured: boolean;
  image_url?: string;
  image_path?: string;
  media: LandingGalleryMedia[];
  created_at: string;
  updated_at: string;
}

export interface WorkFormPayload {
  category: LandingGalleryCategory;
  title: string;
  caption?: string;
  sort_order?: number;
  active?: boolean;
  featured?: boolean;
}

export interface WorkUploadFiles {
  mainImage?: File;
  additionalImages?: File[];
  video?: File;
}

export interface CategoryInfo {
  id: LandingGalleryCategory;
  titulo: string;
  subtitulo: string;
  descripcionComercial: string;
  icon: string;
  tiposTrabajo: string[];
}

const BUCKET = 'landing-gallery';

export const CATEGORIES_INFO: Record<LandingGalleryCategory, CategoryInfo> = {
  iluminacion: {
    id: 'iluminacion',
    titulo: 'Iluminación LED',
    subtitulo: 'Diseño, calidez y eficiencia luminosa',
    descripcionComercial:
      'Diseñamos e instalamos soluciones de iluminación LED pensadas para mejorar la estética, funcionalidad y ambientación de cada espacio.',
    icon: '✦',
    tiposTrabajo: [
      'Iluminación de interiores',
      'Iluminación LED indirecta',
      'Iluminación de mobiliario',
      'Racks de TV',
      'Iluminación decorativa',
      'Iluminación de oficinas',
      'Iluminación comercial',
    ],
  },
  redes: {
    id: 'redes',
    titulo: 'Redes e infraestructura',
    subtitulo: 'Conectividad estable y cableado ordenado',
    descripcionComercial:
      'Desarrollamos infraestructura de red organizada y confiable para hogares, oficinas y empresas.',
    icon: '⌁',
    tiposTrabajo: [
      'Cableado estructurado',
      'Armado y organización de racks',
      'Patch panels',
      'Switches',
      'Puntos de red',
      'Wi-Fi 6 de alta cobertura',
      'Organización de infraestructura',
      'Conectividad empresarial',
    ],
  },
  seguridad: {
    id: 'seguridad',
    titulo: 'Seguridad inteligente',
    subtitulo: 'Monitoreo, control de accesos y tranquilidad',
    descripcionComercial:
      'Implementamos soluciones de seguridad adaptadas a cada espacio para ayudarte a proteger personas, instalaciones y bienes.',
    icon: '◉',
    tiposTrabajo: [
      'Cámaras de seguridad IP y HD',
      'DVR / NVR / Grabación continua',
      'Control de acceso biométrico',
      'Cerraduras inteligentes',
      'Monitoreo móvil 24/7',
      'Instalaciones residenciales',
      'Instalaciones comerciales',
    ],
  },
};

// Fallbacks demostrativos con soporte multimedia
const FALLBACK_ITEMS: Record<LandingGalleryCategory, LandingGalleryItem[]> = {
  iluminacion: [
    {
      id: 'fb-ilum-1',
      category: 'iluminacion',
      title: 'Rack TV con iluminación indirecta',
      caption: 'Diseño e instalación de iluminación LED cálida integrada al mobiliario.',
      description: 'Diseño e instalación de iluminación LED cálida integrada al mobiliario.',
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
      sort_order: 1,
      active: true,
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-ilum-1-m1',
          gallery_id: 'fb-ilum-1',
          media_type: 'image',
          storage_path: 'iluminacion/demo1.jpg',
          media_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
        {
          id: 'fb-ilum-1-m2',
          gallery_id: 'fb-ilum-1',
          media_type: 'image',
          storage_path: 'iluminacion/demo1-b.jpg',
          media_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80',
          sort_order: 1,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'fb-ilum-2',
      category: 'iluminacion',
      title: 'Gargantas de luz indirecta y calidez en living',
      caption: 'Cielo raso suspendido con efecto halo cálido regulable.',
      description: 'Cielo raso suspendido con efecto halo cálido regulable.',
      image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80',
      sort_order: 2,
      active: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-ilum-2-m1',
          gallery_id: 'fb-ilum-2',
          media_type: 'image',
          storage_path: 'iluminacion/demo2.jpg',
          media_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'fb-ilum-3',
      category: 'iluminacion',
      title: 'Iluminación lineal en oficinas comerciales',
      caption: 'Perfilería suspendida con luz neutra para puestos de trabajo.',
      description: 'Perfilería suspendida con luz neutra para puestos de trabajo.',
      image_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
      sort_order: 3,
      active: true,
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-ilum-3-m1',
          gallery_id: 'fb-ilum-3',
          media_type: 'image',
          storage_path: 'iluminacion/demo3.jpg',
          media_url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ],
  redes: [
    {
      id: 'fb-red-1',
      category: 'redes',
      title: 'Armado y peinado de Rack corporativo 42U',
      caption: 'Ordenamiento integral de patch panels Cat6A y switches Gigabit.',
      description: 'Ordenamiento integral de patch panels Cat6A y switches Gigabit.',
      image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
      sort_order: 1,
      active: true,
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-red-1-m1',
          gallery_id: 'fb-red-1',
          media_type: 'image',
          storage_path: 'redes/demo1.jpg',
          media_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'fb-red-2',
      category: 'redes',
      title: 'Implementación de red Wi-Fi 6 empresarial',
      caption: 'Access points de techo con roaming continuo para alta densidad.',
      description: 'Access points de techo con roaming continuo para alta densidad.',
      image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      sort_order: 2,
      active: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-red-2-m1',
          gallery_id: 'fb-red-2',
          media_type: 'image',
          storage_path: 'redes/demo2.jpg',
          media_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ],
  seguridad: [
    {
      id: 'fb-seg-1',
      category: 'seguridad',
      title: 'Sistema de videovigilancia IP 4K perimetral',
      caption: 'Cámaras domo antivandálicas con visión nocturna y detección.',
      description: 'Cámaras domo antivandálicas con visión nocturna y detección.',
      image_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
      sort_order: 1,
      active: true,
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-seg-1-m1',
          gallery_id: 'fb-seg-1',
          media_type: 'image',
          storage_path: 'seguridad/demo1.jpg',
          media_url: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'fb-seg-2',
      category: 'seguridad',
      title: 'Control de acceso biométrico y cerradura smart',
      caption: 'Lector facial y huella para acceso seguro y auditoría.',
      description: 'Lector facial y huella para acceso seguro y auditoría.',
      image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
      sort_order: 2,
      active: true,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media: [
        {
          id: 'fb-seg-2-m1',
          gallery_id: 'fb-seg-2',
          media_type: 'image',
          storage_path: 'seguridad/demo2.jpg',
          media_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80',
          sort_order: 0,
          created_at: new Date().toISOString(),
        },
      ],
    },
  ],
};

function normalizeWork(raw: any): LandingGalleryItem {
  const mediaList: LandingGalleryMedia[] = (raw.landing_gallery_media || raw.media || []).sort(
    (a: LandingGalleryMedia, b: LandingGalleryMedia) => a.sort_order - b.sort_order
  );

  // Si no tiene elementos en landing_gallery_media pero tiene image_url directo, construir un media fallback
  if (mediaList.length === 0 && raw.image_url) {
    mediaList.push({
      id: `${raw.id}-legacy`,
      gallery_id: raw.id,
      media_type: 'image',
      storage_path: raw.image_path || 'legacy.jpg',
      media_url: raw.image_url,
      sort_order: 0,
      created_at: raw.created_at || new Date().toISOString(),
    });
  }

  const primaryImage = mediaList.find(m => m.media_type === 'image')?.media_url || raw.image_url || '';

  return {
    id: raw.id,
    category: raw.category,
    title: raw.title,
    caption: raw.caption || raw.description || '',
    description: raw.caption || raw.description || '',
    sort_order: raw.sort_order ?? 0,
    active: raw.active ?? true,
    featured: raw.featured ?? false,
    image_url: primaryImage,
    image_path: raw.image_path || '',
    media: mediaList,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export const landingGalleryService = {
  /**
   * Obtiene todos los trabajos para el Administrador del Dashboard
   */
  async getAllAdmin(filter?: { category?: string; active?: boolean }): Promise<LandingGalleryItem[]> {
    try {
      let query = supabase
        .from('landing_gallery')
        .select('*, landing_gallery_media (*)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (filter?.category && filter.category !== 'todas') {
        query = query.eq('category', filter.category);
      }
      if (filter?.active !== undefined) {
        query = query.eq('active', filter.active);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error consultando landing_gallery admin:', error.message);
        // Retornar todos los fallbacks combinados
        return Object.values(FALLBACK_ITEMS).flat();
      }

      if (!data || data.length === 0) {
        return Object.values(FALLBACK_ITEMS).flat();
      }

      return data.map(normalizeWork);
    } catch (err) {
      console.warn('Excepción consultando landing_gallery admin:', err);
      return Object.values(FALLBACK_ITEMS).flat();
    }
  },

  /**
   * Obtiene los trabajos activos para la landing pública por categoría
   */
  async getByCategory(category: LandingGalleryCategory): Promise<LandingGalleryItem[]> {
    try {
      const { data, error } = await supabase
        .from('landing_gallery')
        .select('*, landing_gallery_media (*)')
        .eq('category', category)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Error consultando landing_gallery, usando fallbacks:', error.message);
        return FALLBACK_ITEMS[category] ?? [];
      }

      if (!data || data.length === 0) {
        return FALLBACK_ITEMS[category] ?? [];
      }

      return data.map(normalizeWork);
    } catch (err) {
      console.warn('Excepción al consultar landing_gallery:', err);
      return FALLBACK_ITEMS[category] ?? [];
    }
  },

  /**
   * Sube un archivo a Supabase Storage y retorna su URL pública
   */
  async uploadFile(file: File, category: LandingGalleryCategory, workId: string, prefix = 'media'): Promise<{ path: string; url: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const randomId = crypto.randomUUID().slice(0, 8);
    const storagePath = `${category}/${workId}/${prefix}-${randomId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Error subiendo archivo a Storage:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    return { path: storagePath, url: urlData.publicUrl };
  },

  /**
   * Crea un nuevo trabajo con sus archivos multimedia en Supabase
   */
  async createWork(payload: WorkFormPayload, files: WorkUploadFiles): Promise<LandingGalleryItem> {
    const workId = crypto.randomUUID();

    // 1. Subir imagen principal (obligatoria)
    let mainImageUrl = '';
    let mainImagePath = '';

    if (files.mainImage) {
      const uploaded = await this.uploadFile(files.mainImage, payload.category, workId, 'main');
      mainImageUrl = uploaded.url;
      mainImagePath = uploaded.path;
    }

    // 2. Insertar registro en landing_gallery
    const { data: workData, error: workError } = await supabase
      .from('landing_gallery')
      .insert({
        id: workId,
        category: payload.category,
        title: payload.title.trim(),
        caption: payload.caption?.trim() || null,
        description: payload.caption?.trim() || null,
        image_url: mainImageUrl,
        image_path: mainImagePath,
        sort_order: payload.sort_order ?? 0,
        active: payload.active ?? true,
        featured: payload.featured ?? false,
      })
      .select()
      .single();

    if (workError) {
      console.error('Error insertando trabajo en landing_gallery:', workError);
      throw workError;
    }

    // 3. Crear los registros en landing_gallery_media
    const mediaToInsert: {
      gallery_id: string;
      media_type: MediaType;
      storage_path: string;
      media_url: string;
      sort_order: number;
    }[] = [];

    // Media 0: Foto principal
    if (mainImageUrl) {
      mediaToInsert.push({
        gallery_id: workId,
        media_type: 'image',
        storage_path: mainImagePath,
        media_url: mainImageUrl,
        sort_order: 0,
      });
    }

    // Media adicionales: Fotos
    if (files.additionalImages && files.additionalImages.length > 0) {
      for (let i = 0; i < files.additionalImages.length; i++) {
        const file = files.additionalImages[i];
        const uploaded = await this.uploadFile(file, payload.category, workId, `extra-${i + 1}`);
        mediaToInsert.push({
          gallery_id: workId,
          media_type: 'image',
          storage_path: uploaded.path,
          media_url: uploaded.url,
          sort_order: i + 1,
        });
      }
    }

    // Media: Video (opcional)
    if (files.video) {
      const uploadedVideo = await this.uploadFile(files.video, payload.category, workId, 'video');
      mediaToInsert.push({
        gallery_id: workId,
        media_type: 'video',
        storage_path: uploadedVideo.path,
        media_url: uploadedVideo.url,
        sort_order: mediaToInsert.length,
      });
    }

    if (mediaToInsert.length > 0) {
      const { error: mediaError } = await supabase
        .from('landing_gallery_media')
        .insert(mediaToInsert);

      if (mediaError) {
        console.warn('Error insertando media en landing_gallery_media:', mediaError);
      }
    }

    return normalizeWork({
      ...workData,
      landing_gallery_media: mediaToInsert,
    });
  },

  /**
   * Actualiza un trabajo existente
   */
  async updateWork(
    id: string,
    payload: WorkFormPayload,
    newFiles?: WorkUploadFiles,
    deletedMediaIds?: string[]
  ): Promise<void> {
    // 1. Actualizar metadata del trabajo
    const { error: updateError } = await supabase
      .from('landing_gallery')
      .update({
        category: payload.category,
        title: payload.title.trim(),
        caption: payload.caption?.trim() || null,
        description: payload.caption?.trim() || null,
        sort_order: payload.sort_order ?? 0,
        active: payload.active ?? true,
        featured: payload.featured ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error actualizando trabajo:', updateError);
      throw updateError;
    }

    // 2. Eliminar medios marcados para remoción
    if (deletedMediaIds && deletedMediaIds.length > 0) {
      const { data: mediaToDelete } = await supabase
        .from('landing_gallery_media')
        .select('storage_path')
        .in('id', deletedMediaIds);

      if (mediaToDelete && mediaToDelete.length > 0) {
        const paths = mediaToDelete.map(m => m.storage_path).filter(Boolean);
        if (paths.length > 0) {
          await supabase.storage.from(BUCKET).remove(paths);
        }
      }

      await supabase
        .from('landing_gallery_media')
        .delete()
        .in('id', deletedMediaIds);
    }

    // 3. Subir nuevos medios si existen
    const mediaToInsert: {
      gallery_id: string;
      media_type: MediaType;
      storage_path: string;
      media_url: string;
      sort_order: number;
    }[] = [];

    if (newFiles?.mainImage) {
      const uploaded = await this.uploadFile(newFiles.mainImage, payload.category, id, 'main-updated');
      mediaToInsert.push({
        gallery_id: id,
        media_type: 'image',
        storage_path: uploaded.path,
        media_url: uploaded.url,
        sort_order: 0,
      });

      // Actualizar también la imagen principal en la tabla
      await supabase
        .from('landing_gallery')
        .update({
          image_url: uploaded.url,
          image_path: uploaded.path,
        })
        .eq('id', id);
    }

    if (newFiles?.additionalImages && newFiles.additionalImages.length > 0) {
      for (let i = 0; i < newFiles.additionalImages.length; i++) {
        const file = newFiles.additionalImages[i];
        const uploaded = await this.uploadFile(file, payload.category, id, `extra-${Date.now()}-${i}`);
        mediaToInsert.push({
          gallery_id: id,
          media_type: 'image',
          storage_path: uploaded.path,
          media_url: uploaded.url,
          sort_order: 10 + i,
        });
      }
    }

    if (newFiles?.video) {
      const uploaded = await this.uploadFile(newFiles.video, payload.category, id, `video-${Date.now()}`);
      mediaToInsert.push({
        gallery_id: id,
        media_type: 'video',
        storage_path: uploaded.path,
        media_url: uploaded.url,
        sort_order: 99,
      });
    }

    if (mediaToInsert.length > 0) {
      await supabase.from('landing_gallery_media').insert(mediaToInsert);
    }
  },

  /**
   * Elimina un trabajo y todos sus archivos multimedia asociados
   */
  async deleteWork(id: string): Promise<void> {
    // 1. Obtener los paths de almacenamiento para eliminarlos del bucket
    const { data: mediaItems } = await supabase
      .from('landing_gallery_media')
      .select('storage_path')
      .eq('gallery_id', id);

    if (mediaItems && mediaItems.length > 0) {
      const paths = mediaItems.map(m => m.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
    }

    // 2. Eliminar de la base de datos (por cascade se borran los registros de media)
    const { error } = await supabase
      .from('landing_gallery')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando trabajo:', error);
      throw error;
    }
  },

  /**
   * Alterna el estado de visibilidad en la landing
   */
  async toggleActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase
      .from('landing_gallery')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Alterna el estado de trabajo destacado
   */
  async toggleFeatured(id: string, featured: boolean): Promise<void> {
    const { error } = await supabase
      .from('landing_gallery')
      .update({ featured, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Actualiza el orden de múltiples trabajos
   */
  async updateSortOrder(items: { id: string; sort_order: number }[]): Promise<void> {
    const updates = items.map(item =>
      supabase
        .from('landing_gallery')
        .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );
    await Promise.all(updates);
  },
};
