import { useQuery } from '@tanstack/react-query';
import {
  aparienciaDocumentosService,
  DEFAULT_APARIENCIA_DOCUMENTOS,
  type AparienciaDocumentosConfig
} from '@/services/aparienciaDocumentosService';
import { useMemo } from 'react';

export function useAparienciaDocumentos() {
  const { data: config = DEFAULT_APARIENCIA_DOCUMENTOS, isLoading } = useQuery<AparienciaDocumentosConfig>({
    queryKey: ['apariencia-documentos'],
    queryFn: () => aparienciaDocumentosService.get(),
    staleTime: 1000 * 60 * 5, // 5 min
  });

  const fontFamilies: Record<AparienciaDocumentosConfig['tipografia_familia'], string> = {
    Inter: "'Inter', system-ui, -apple-system, sans-serif",
    Roboto: "'Roboto', sans-serif",
    Montserrat: "'Montserrat', sans-serif",
    Arial: "Arial, Helvetica, sans-serif",
    Helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };

  const cssVariables = useMemo(() => {
    return {
      '--doc-color-primary': config.color_primario,
      '--doc-color-secondary': config.color_secundario,
      '--doc-color-titles': config.color_titulos,
      '--doc-color-subtitles': config.color_subtitulos,
      '--doc-color-text': config.color_textos,
      '--doc-color-lines': config.color_lineas,
      '--doc-color-accent': config.color_destacados,
      '--doc-font-family': fontFamilies[config.tipografia_familia] || fontFamilies.Inter,
    } as React.CSSProperties;
  }, [config]);

  return {
    config,
    isLoading,
    cssVariables,
  };
}

