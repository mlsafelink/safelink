// =====================================================
// SafeLink Vibe — Tipos de formatos de contenido
// Fuente única de verdad para aspectRatios y formatos
// =====================================================

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';
export type Resolution = '720p' | '1080p';

export type ContentFormat =
  | 'video_16_9'
  | 'video_9_16'
  | 'image_1_1'
  | 'image_4_5'
  | 'image_16_9'
  | 'story_9_16'
  | 'carousel'
  | 'reel';

export type ContentCategory = 'video' | 'image' | 'story' | 'carousel' | 'reel';

export interface FormatDefinition {
  id: ContentFormat;
  label: string;
  description: string;
  aspectRatio: AspectRatio;
  category: ContentCategory;
  /** Dimensiones en píxeles de referencia */
  dimensions: { width: number; height: number };
  /** Duración recomendada en segundos (si aplica) */
  durationRange?: { min: number; max: number };
  /** Plataformas objetivo */
  platforms: string[];
  /** Icono de lucide-react a usar */
  icon: string;
}

export const CONTENT_FORMATS: Record<ContentFormat, FormatDefinition> = {
  video_16_9: {
    id: 'video_16_9',
    label: 'Video Horizontal',
    description: 'Ideal para YouTube, sitio web y campañas de display.',
    aspectRatio: '16:9',
    category: 'video',
    dimensions: { width: 1920, height: 1080 },
    durationRange: { min: 10, max: 60 },
    platforms: ['YouTube', 'Sitio web', 'LinkedIn'],
    icon: 'Monitor',
  },
  video_9_16: {
    id: 'video_9_16',
    label: 'Video Vertical',
    description: 'Formato completo para Instagram Reels, TikTok y Stories.',
    aspectRatio: '9:16',
    category: 'video',
    dimensions: { width: 1080, height: 1920 },
    durationRange: { min: 7, max: 60 },
    platforms: ['Instagram Reels', 'TikTok', 'YouTube Shorts'],
    icon: 'Smartphone',
  },
  image_1_1: {
    id: 'image_1_1',
    label: 'Publicación Cuadrada',
    description: 'Publicación cuadrada clásica para el feed de Instagram.',
    aspectRatio: '1:1',
    category: 'image',
    dimensions: { width: 1080, height: 1080 },
    platforms: ['Instagram', 'Facebook'],
    icon: 'Square',
  },
  image_4_5: {
    id: 'image_4_5',
    label: 'Publicación Vertical',
    description: 'Ocupa más espacio en el feed. Ideal para servicios.',
    aspectRatio: '4:5',
    category: 'image',
    dimensions: { width: 1080, height: 1350 },
    platforms: ['Instagram', 'Facebook'],
    icon: 'RectangleVertical',
  },
  image_16_9: {
    id: 'image_16_9',
    label: 'Banner Horizontal',
    description: 'Imagen panorámica para encabezados y anuncios de display.',
    aspectRatio: '16:9',
    category: 'image',
    dimensions: { width: 1200, height: 675 },
    platforms: ['Facebook', 'Google Ads', 'LinkedIn'],
    icon: 'RectangleHorizontal',
  },
  story_9_16: {
    id: 'story_9_16',
    label: 'Historia / Story',
    description: 'Formato vertical para historias de 24 horas.',
    aspectRatio: '9:16',
    category: 'story',
    dimensions: { width: 1080, height: 1920 },
    durationRange: { min: 3, max: 15 },
    platforms: ['Instagram Stories', 'Facebook Stories', 'WhatsApp Status'],
    icon: 'GalleryVertical',
  },
  carousel: {
    id: 'carousel',
    label: 'Carrusel',
    description: 'Hasta 10 imágenes deslizables. Perfecto para mostrar servicios.',
    aspectRatio: '1:1',
    category: 'carousel',
    dimensions: { width: 1080, height: 1080 },
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    icon: 'LayoutGrid',
  },
  reel: {
    id: 'reel',
    label: 'Reel',
    description: 'Video corto de alta retención para descubrimiento.',
    aspectRatio: '9:16',
    category: 'reel',
    dimensions: { width: 1080, height: 1920 },
    durationRange: { min: 7, max: 30 },
    platforms: ['Instagram Reels', 'Facebook Reels'],
    icon: 'Film',
  },
};

/** Formatos ordenados para el selector de creación */
export const FORMAT_GROUPS: Array<{
  label: string;
  formats: ContentFormat[];
}> = [
  {
    label: 'Video',
    formats: ['video_9_16', 'reel', 'video_16_9'],
  },
  {
    label: 'Imagen',
    formats: ['image_1_1', 'image_4_5', 'image_16_9'],
  },
  {
    label: 'Historia',
    formats: ['story_9_16'],
  },
  {
    label: 'Carrusel',
    formats: ['carousel'],
  },
];
