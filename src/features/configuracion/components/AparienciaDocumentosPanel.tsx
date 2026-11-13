import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  aparienciaDocumentosService,
  DEFAULT_APARIENCIA_DOCUMENTOS,
  type AparienciaDocumentosConfig
} from '@/services/aparienciaDocumentosService';
import { useAparienciaDocumentos } from '@/hooks/useAparienciaDocumentos';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  Image as ImageIcon,
  Palette,
  Type,
  Layout,
  Building2,
  Upload,
  RotateCcw,
  Save,
  FileCheck,
  Wrench,
  FileText
} from 'lucide-react';
import styles from './AparienciaDocumentosPanel.module.css';

type PreviewDocType = 'propuesta' | 'informe' | 'presupuesto';

export function AparienciaDocumentosPanel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { config: initialConfig, isLoading } = useAparienciaDocumentos();

  // Local editable state for immediate live preview
  const [form, setForm] = useState<AparienciaDocumentosConfig>(initialConfig);
  const [previewDoc, setPreviewDoc] = useState<PreviewDocType>('propuesta');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading && initialConfig) {
      setForm(initialConfig);
    }
  }, [initialConfig, isLoading]);

  const updateField = <K extends keyof AparienciaDocumentosConfig>(
    field: K,
    value: AparienciaDocumentosConfig[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await aparienciaDocumentosService.save(form);
      queryClient.invalidateQueries({ queryKey: ['apariencia-documentos'] });
      toast.success('Apariencia de documentos guardada correctamente');
    } catch {
      toast.error('Ocurrió un error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Deseás restaurar el diseño visual predeterminado de SafeLink para todos los documentos?')) {
      return;
    }
    try {
      setIsSaving(true);
      const def = await aparienciaDocumentosService.reset();
      setForm(def);
      queryClient.invalidateQueries({ queryKey: ['apariencia-documentos'] });
      toast.info('Diseño visual restablecido a los valores predeterminados');
    } catch {
      toast.error('Error al restablecer la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(initialConfig);
    toast.info('Cambios descartados');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await aparienciaDocumentosService.uploadBanner(file);
      setForm(prev => ({
        ...prev,
        banner_url: url,
        usar_banner_personalizado: true,
      }));
      toast.success('Imagen cargada correctamente');
    } catch {
      toast.error('Error al procesar la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetColors = () => {
    setForm(prev => ({
      ...prev,
      color_primario: DEFAULT_APARIENCIA_DOCUMENTOS.color_primario,
      color_secundario: DEFAULT_APARIENCIA_DOCUMENTOS.color_secundario,
      color_titulos: DEFAULT_APARIENCIA_DOCUMENTOS.color_titulos,
      color_subtitulos: DEFAULT_APARIENCIA_DOCUMENTOS.color_subtitulos,
      color_textos: DEFAULT_APARIENCIA_DOCUMENTOS.color_textos,
      color_lineas: DEFAULT_APARIENCIA_DOCUMENTOS.color_lineas,
      color_destacados: DEFAULT_APARIENCIA_DOCUMENTOS.color_destacados,
    }));
    toast.info('Paleta SafeLink corporativa restaurada');
  };

  // Font family styles mapping for preview
  const fontFamilies: Record<AparienciaDocumentosConfig['tipografia_familia'], string> = {
    Inter: "'Inter', sans-serif",
    Roboto: "'Roboto', sans-serif",
    Montserrat: "'Montserrat', sans-serif",
    Arial: "Arial, sans-serif",
    Helvetica: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };

  // Background computation for preview sheet
  const getSheetBackground = () => {
    if (form.fondo_tipo === 'blanco') return '#ffffff';
    if (form.fondo_tipo === 'solido') return form.fondo_color;
    if (form.fondo_tipo === 'degradado') return form.fondo_degradado;
    if (form.fondo_tipo === 'imagen' && form.fondo_imagen_url) {
      return `url(${form.fondo_imagen_url}) center / cover no-repeat`;
    }
    return '#ffffff';
  };

  return (
    <div className={styles.panelContainer}>
      {/* Top Action Bar */}
      <div className={styles.topBarActions}>
        <div className={styles.topBarInfo}>
          <h3>Apariencia Unificada de Documentos</h3>
          <p>La configuración seleccionada se aplica a todas las Propuestas Técnicas, Informes de Trabajo y Presupuestos</p>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.btnSecondary} onClick={handleCancel}>
            Cancelar
          </button>
          <button className={styles.btnDanger} onClick={handleReset}>
            <RotateCcw size={16} />
            Restaurar predeterminado
          </button>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* ========================================================
            LEFT COLUMN: CONTROLS
            ======================================================== */}
        <div className={styles.controlsColumn}>
          {/* 1. ENCABEZADO Y BANNER */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <ImageIcon size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>1. Encabezado y Banner Principal</h2>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Modo de Encabezado</label>
              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={`${styles.groupBtn} ${!form.usar_banner_personalizado ? styles.groupBtnActive : ''}`}
                  onClick={() => updateField('usar_banner_personalizado', false)}
                >
                  Banner SafeLink (Predeterminado)
                </button>
                <button
                  type="button"
                  className={`${styles.groupBtn} ${form.usar_banner_personalizado ? styles.groupBtnActive : ''}`}
                  onClick={() => updateField('usar_banner_personalizado', true)}
                >
                  Banner Personalizado con Imagen
                </button>
              </div>
            </div>

            {form.usar_banner_personalizado && (
              <>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Imágenes predefinidas / Cargadas</label>
                  <div className={styles.presetBannerRow}>
                    <div
                      className={`${styles.presetCard} ${form.banner_url === '/banner-corporeo.png' ? styles.presetCardActive : ''}`}
                      onClick={() => updateField('banner_url', '/banner-corporeo.png')}
                    >
                      <div className={styles.presetPreview}>
                        <img src="/banner-corporeo.png" alt="Banner Corpóreo" />
                      </div>
                      <span className={styles.presetLabel}>Banner Corpóreo SafeLink</span>
                    </div>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Subir nueva imagen desde tu equipo</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <div className={styles.uploadBox}>
                    <button
                      type="button"
                      className={styles.uploadBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload size={16} />
                      {isUploading ? 'Subiendo imagen...' : 'Seleccionar archivo PNG / JPG'}
                    </button>
                    {form.banner_url && form.banner_url !== '/banner-corporeo.png' && (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => updateField('banner_url', '/banner-corporeo.png')}
                      >
                        Volver a Corpóreo
                      </button>
                    )}
                  </div>
                  <span className={styles.fieldHint}>
                    Se recomienda un formato horizontal (1500x400 px o superior). Se almacena de forma persistente.
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Altura del encabezado ({form.banner_altura}px)</label>
                  <div className={styles.sliderRow}>
                    <input
                      type="range"
                      min={120}
                      max={320}
                      step={10}
                      value={form.banner_altura}
                      onChange={e => updateField('banner_altura', Number(e.target.value))}
                      className={styles.rangeInput}
                    />
                    <span className={styles.sliderValue}>{form.banner_altura}px</span>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Modo de ajuste de la imagen</label>
                  <div className={styles.btnGroup}>
                    {(['cover', 'contain', 'fill'] as const).map(fit => (
                      <button
                        key={fit}
                        type="button"
                        className={`${styles.groupBtn} ${form.banner_ajuste === fit ? styles.groupBtnActive : ''}`}
                        onClick={() => updateField('banner_ajuste', fit)}
                      >
                        {fit === 'cover' ? 'Cubrir (Cover)' : fit === 'contain' ? 'Contener (Contain)' : 'Ajustar (Fill)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Posición vertical de la imagen</label>
                  <div className={styles.btnGroup}>
                    {(['top', 'center', 'bottom'] as const).map(pos => (
                      <button
                        key={pos}
                        type="button"
                        className={`${styles.groupBtn} ${form.banner_posicion === pos ? styles.groupBtnActive : ''}`}
                        onClick={() => updateField('banner_posicion', pos)}
                      >
                        {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. FONDOS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Layout size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>2. Fondos de Documentos</h2>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tipo de Fondo</label>
              <div className={styles.btnGroup}>
                <button
                  type="button"
                  className={`${styles.groupBtn} ${form.fondo_tipo === 'blanco' ? styles.groupBtnActive : ''}`}
                  onClick={() => updateField('fondo_tipo', 'blanco')}
                >
                  Blanco Limpio
                </button>
                <button
                  type="button"
                  className={`${styles.groupBtn} ${form.fondo_tipo === 'solido' ? styles.groupBtnActive : ''}`}
                  onClick={() => updateField('fondo_tipo', 'solido')}
                >
                  Color Sólido
                </button>
                <button
                  type="button"
                  className={`${styles.groupBtn} ${form.fondo_tipo === 'degradado' ? styles.groupBtnActive : ''}`}
                  onClick={() => updateField('fondo_tipo', 'degradado')}
                >
                  Degradado Sutil
                </button>
              </div>
            </div>

            {form.fondo_tipo === 'solido' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Color de Fondo</label>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.fondo_color}
                    onChange={e => updateField('fondo_color', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.fondo_color}
                    onChange={e => updateField('fondo_color', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>
            )}

            {form.fondo_tipo === 'degradado' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Estilo de degradado</label>
                <select
                  value={form.fondo_degradado}
                  onChange={e => updateField('fondo_degradado', e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)">Gris Neutro Suave</option>
                  <option value="linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)">Azul Corporativo Tenue</option>
                  <option value="linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)">Blanco a Perla</option>
                  <option value="linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)">Lavanda Profesional</option>
                </select>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Intensidad / Opacidad del Fondo ({form.fondo_opacidad}%)</label>
              <div className={styles.sliderRow}>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={5}
                  value={form.fondo_opacidad}
                  onChange={e => updateField('fondo_opacidad', Number(e.target.value))}
                  className={styles.rangeInput}
                />
                <span className={styles.sliderValue}>{form.fondo_opacidad}%</span>
              </div>
              <span className={styles.fieldHint}>
                Garantiza que el contraste de lectura e impresión sea óptimo.
              </span>
            </div>
          </div>

          {/* 3. COLORES */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Palette size={20} className={styles.sectionIcon} />
                <h2 className={styles.sectionTitle}>3. Paleta de Colores Corporativos</h2>
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                onClick={handleResetColors}
              >
                Restablecer SafeLink
              </button>
            </div>

            <div className={styles.colorGrid}>
              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Color Primario</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_primario}
                    onChange={e => updateField('color_primario', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_primario}
                    onChange={e => updateField('color_primario', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Color Secundario</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_secundario}
                    onChange={e => updateField('color_secundario', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_secundario}
                    onChange={e => updateField('color_secundario', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Títulos Principales</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_titulos}
                    onChange={e => updateField('color_titulos', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_titulos}
                    onChange={e => updateField('color_titulos', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Subtítulos y Secciones</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_subtitulos}
                    onChange={e => updateField('color_subtitulos', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_subtitulos}
                    onChange={e => updateField('color_subtitulos', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Texto General</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_textos}
                    onChange={e => updateField('color_textos', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_textos}
                    onChange={e => updateField('color_textos', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Separadores y Líneas</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_lineas}
                    onChange={e => updateField('color_lineas', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_lineas}
                    onChange={e => updateField('color_lineas', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>

              <div className={styles.colorPickerBox}>
                <span className={styles.colorPickerLabel}>Elemento Destacado</span>
                <div className={styles.colorInputRow}>
                  <input
                    type="color"
                    value={form.color_destacados}
                    onChange={e => updateField('color_destacados', e.target.value)}
                    className={styles.colorInput}
                  />
                  <input
                    type="text"
                    value={form.color_destacados}
                    onChange={e => updateField('color_destacados', e.target.value)}
                    className={styles.colorHexInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. TIPOGRAFÍA Y ESTRUCTURA */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Type size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>4. Tipografía y Estructura Visual</h2>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Familia Tipográfica</label>
              <select
                value={form.tipografia_familia}
                onChange={e => updateField('tipografia_familia', e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="Inter">Inter (Moderna y Neutra - Recomendada)</option>
                <option value="Roboto">Roboto (Google Clean)</option>
                <option value="Montserrat">Montserrat (Elegante y Geométrica)</option>
                <option value="Arial">Arial (Universal estándar)</option>
                <option value="Helvetica">Helvetica (Clásica Suiza)</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tamaño de Títulos</label>
              <div className={styles.btnGroup}>
                {(['compacto', 'normal', 'grande'] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    className={`${styles.groupBtn} ${form.tamano_titulos === sz ? styles.groupBtnActive : ''}`}
                    onClick={() => updateField('tamano_titulos', sz)}
                  >
                    {sz.charAt(0).toUpperCase() + sz.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tamaño de Texto General</label>
              <div className={styles.btnGroup}>
                {(['compacto', 'normal', 'grande'] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    className={`${styles.groupBtn} ${form.tamano_cuerpo === sz ? styles.groupBtnActive : ''}`}
                    onClick={() => updateField('tamano_cuerpo', sz)}
                  >
                    {sz.charAt(0).toUpperCase() + sz.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Espaciado entre Secciones</label>
              <div className={styles.btnGroup}>
                {(['compacto', 'normal', 'amplio'] as const).map(sp => (
                  <button
                    key={sp}
                    type="button"
                    className={`${styles.groupBtn} ${form.espaciado_secciones === sp ? styles.groupBtnActive : ''}`}
                    onClick={() => updateField('espaciado_secciones', sp)}
                  >
                    {sp.charAt(0).toUpperCase() + sp.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. IDENTIDAD Y PIE DE PÁGINA */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Building2 size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>5. Identidad Corporativa y Pie de Página</h2>
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Mostrar Logo SafeLink en Encabezado</span>
                <span className={styles.switchDesc}>Si el banner personalizado ya incluye el logo, podés ocultarlo.</span>
              </div>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${form.mostrar_logo ? styles.toggleActive : ''}`}
                onClick={() => updateField('mostrar_logo', !form.mostrar_logo)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Mostrar Eslogan Institucional</span>
                <span className={styles.switchDesc}>Muestra "Sistemas de Seguridad e Infraestructura".</span>
              </div>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${form.mostrar_eslogan ? styles.toggleActive : ''}`}
                onClick={() => updateField('mostrar_eslogan', !form.mostrar_eslogan)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: '0.85rem' }}>
              <label className={styles.fieldLabel}>Texto de Pie de Página</label>
              <input
                type="text"
                value={form.pie_pagina_texto}
                onChange={e => updateField('pie_pagina_texto', e.target.value)}
                className={styles.textInput}
                placeholder="SafeLink · Sistemas de Seguridad e Infraestructura"
              />
            </div>

            <div className={styles.switchRow}>
              <div className={styles.switchInfo}>
                <span className={styles.switchTitle}>Mostrar Numeración de Páginas</span>
                <span className={styles.switchDesc}>Indica el número de página al pie del documento.</span>
              </div>
              <button
                type="button"
                className={`${styles.toggleSwitch} ${form.mostrar_numeracion ? styles.toggleActive : ''}`}
                onClick={() => updateField('mostrar_numeracion', !form.mostrar_numeracion)}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: REAL-TIME LIVE PREVIEW
            ======================================================== */}
        <div className={styles.previewColumn}>
          <div className={styles.previewWrapper}>
            {/* Header of preview box */}
            <div className={styles.previewHeaderBar}>
              <div className={styles.previewBadge}>
                <span className={styles.previewLiveDot} />
                <span>Vista Previa en Tiempo Real</span>
              </div>

              <div className={styles.previewDocSelector}>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'propuesta' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('propuesta')}
                  title="Ver cómo queda la Propuesta Técnica"
                >
                  <FileCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Propuesta Técnica
                </button>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'informe' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('informe')}
                  title="Ver cómo queda el Informe de Trabajos"
                >
                  <Wrench size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Informe Trabajos
                </button>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'presupuesto' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('presupuesto')}
                  title="Ver cómo queda el Presupuesto"
                >
                  <FileText size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Presupuesto
                </button>
              </div>
            </div>

            {/* Scrollable mockup document sheet */}
            <div className={styles.previewScrollArea}>
              <div
                className={styles.docSheet}
                style={{
                  background: getSheetBackground(),
                  opacity: form.fondo_opacidad / 100,
                  fontFamily: fontFamilies[form.tipografia_familia] || fontFamilies.Inter,
                  color: form.color_textos,
                }}
              >
                {/* 1. Header Banner */}
                <div
                  className={styles.previewBannerArea}
                  style={{
                    height: `${form.banner_altura}px`,
                  }}
                >
                  {form.usar_banner_personalizado && form.banner_url ? (
                    <img
                      src={form.banner_url}
                      alt="Banner Documento"
                      style={{
                        objectFit: form.banner_ajuste,
                        objectPosition: form.banner_posicion,
                      }}
                    />
                  ) : (
                    <div className={styles.previewDefaultBanner}>
                      <div>
                        {form.mostrar_logo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: form.logo_tamano === 'pequeno' ? 28 : form.logo_tamano === 'grande' ? 42 : 34,
                              height: form.logo_tamano === 'pequeno' ? 28 : form.logo_tamano === 'grande' ? 42 : 34,
                              borderRadius: 8,
                              background: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: 16
                            }}>
                              SL
                            </div>
                            <div>
                              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>SafeLink</h2>
                              {form.mostrar_eslogan && (
                                <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: 0 }}>Sistemas de Seguridad</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', opacity: 0.85 }}>
                        <div>www.safelink.com.ar</div>
                        <div>info@safelink.com.ar</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Sheet Body */}
                <div
                  className={styles.previewSheetBody}
                  style={{
                    padding: form.margenes === 'estrecho' ? '1rem' : form.margenes === 'amplio' ? '2.25rem' : '1.5rem',
                    gap: form.espaciado_secciones === 'compacto' ? '0.85rem' : form.espaciado_secciones === 'amplio' ? '1.75rem' : '1.25rem',
                  }}
                >
                  {/* Badge & Title */}
                  <div>
                    <span
                      className={styles.previewDocBadge}
                      style={{
                        background: `${form.color_destacados}18`,
                        color: form.color_destacados,
                      }}
                    >
                      {previewDoc === 'propuesta' && 'Propuesta Técnica'}
                      {previewDoc === 'informe' && 'Informe de Trabajos Realizados (RTE-042)'}
                      {previewDoc === 'presupuesto' && 'Presupuesto Comercial (PRE-108)'}
                    </span>
                    <h1
                      className={styles.previewDocTitle}
                      style={{
                        color: form.color_titulos,
                        fontSize: form.tamano_titulos === 'compacto' ? '1.15rem' : form.tamano_titulos === 'grande' ? '1.55rem' : '1.35rem',
                        marginTop: '0.45rem',
                      }}
                    >
                      {previewDoc === 'propuesta' && 'Modernización del Sistema de Videovigilancia IP y Control de Accesos'}
                      {previewDoc === 'informe' && 'Instalación y Calibración de Cámaras Domo PTZ en Hall y Cocheras'}
                      {previewDoc === 'presupuesto' && 'Provisión de Equipamiento de Seguridad y Cableado Estructurado'}
                    </h1>
                  </div>

                  {/* Meta Bar */}
                  <div className={styles.previewMetaGrid} style={{ borderColor: form.color_lineas }}>
                    <div className={styles.previewMetaItem}>
                      <span className={styles.previewMetaLabel} style={{ color: form.color_subtitulos }}>Cliente / Consorcio</span>
                      <span className={styles.previewMetaVal} style={{ color: form.color_titulos }}>Consorcio Av. Libertador 4500</span>
                    </div>
                    <div className={styles.previewMetaItem}>
                      <span className={styles.previewMetaLabel} style={{ color: form.color_subtitulos }}>Fecha de Emisión</span>
                      <span className={styles.previewMetaVal} style={{ color: form.color_titulos }}>13 de Noviembre, 2026</span>
                    </div>
                    <div className={styles.previewMetaItem}>
                      <span className={styles.previewMetaLabel} style={{ color: form.color_subtitulos }}>Estado</span>
                      <span className={styles.previewMetaVal} style={{ color: form.color_destacados }}>Vigente (v1)</span>
                    </div>
                  </div>

                  <div className={styles.previewDivider} style={{ background: form.color_lineas }} />

                  {/* Document Specific Preview Content */}
                  {previewDoc === 'propuesta' && (
                    <>
                      <div className={styles.previewSection}>
                        <h3 className={styles.previewSectionHeading} style={{ color: form.color_subtitulos }}>
                          1. Situación Actual y Alcance Técnico
                        </h3>
                        <p className={styles.previewParagraph} style={{ color: form.color_textos }}>
                          Se realizó el relevamiento exhaustivo en planta baja, subsuelo y accesos perimetrales.
                          Se constata la necesidad de migración a cámaras IP 4MP con visión nocturna infrarroja y grabación redundante en NVR de 16 canales.
                        </p>
                      </div>

                      <div className={styles.previewSection}>
                        <h3 className={styles.previewSectionHeading} style={{ color: form.color_subtitulos }}>
                          2. Recomendaciones y Propuesta de Trabajo
                        </h3>
                        <div
                          className={styles.previewItemBox}
                          style={{
                            background: `${form.color_primario}08`,
                            borderColor: `${form.color_lineas}`,
                          }}
                        >
                          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: form.color_textos }}>
                            <li>Reemplazo de switch PoE no administrable por switch Gigabit gestionable de 16 bocas.</li>
                            <li>Tendido de cable UTP categoría 6 para exterior con protección UV.</li>
                            <li>Configuración de acceso seguro remoto vía VPN institucional.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Botón de conformidad simulado */}
                      <div style={{
                        padding: '1rem',
                        borderRadius: 8,
                        background: `${form.color_primario}0c`,
                        border: `1px dashed ${form.color_primario}40`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: form.color_titulos }}>Aprobación del cliente</strong>
                          <div style={{ fontSize: '0.72rem', color: form.color_subtitulos }}>El cliente puede brindar conformidad o solicitar modificaciones.</div>
                        </div>
                        <span style={{
                          padding: '0.4rem 0.8rem',
                          background: form.color_destacados,
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          Dar conformidad
                        </span>
                      </div>
                    </>
                  )}

                  {previewDoc === 'informe' && (
                    <>
                      <div className={styles.previewSection}>
                        <h3 className={styles.previewSectionHeading} style={{ color: form.color_subtitulos }}>
                          Tareas Efectivamente Realizadas
                        </h3>
                        <p className={styles.previewParagraph} style={{ color: form.color_textos }}>
                          Se completó con éxito el montaje, conexionado, alineación de ángulo visual y prueba de estanqueidad de las 4 cámaras domo en cocheras y palier.
                        </p>
                      </div>

                      <div className={styles.previewSection}>
                        <h3 className={styles.previewSectionHeading} style={{ color: form.color_subtitulos }}>
                          Registro Fotográfico de Conformidad
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                          <div style={{ height: 75, background: '#cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#475569' }}>
                            [Foto 1: Vista Domo Palier]
                          </div>
                          <div style={{ height: 75, background: '#cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: '#475569' }}>
                            [Foto 2: Rack y Switch Gigabit]
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {previewDoc === 'presupuesto' && (
                    <>
                      <div className={styles.previewSection}>
                        <h3 className={styles.previewSectionHeading} style={{ color: form.color_subtitulos }}>
                          Detalle de Cotización
                        </h3>
                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid ${form.color_lineas}`, color: form.color_subtitulos }}>
                              <th style={{ textAlign: 'left', padding: '0.35rem 0' }}>Descripción</th>
                              <th style={{ textAlign: 'center', padding: '0.35rem' }}>Cant</th>
                              <th style={{ textAlign: 'right', padding: '0.35rem 0' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody style={{ color: form.color_textos }}>
                            <tr style={{ borderBottom: `1px solid ${form.color_lineas}` }}>
                              <td style={{ padding: '0.4rem 0' }}>Cámara IP Domo 4MP Exterior IK10</td>
                              <td style={{ textAlign: 'center' }}>4</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>$ 380.000</td>
                            </tr>
                            <tr style={{ borderBottom: `1px solid ${form.color_lineas}` }}>
                              <td style={{ padding: '0.4rem 0' }}>Mano de obra especializada y calibración</td>
                              <td style={{ textAlign: 'center' }}>1</td>
                              <td style={{ textAlign: 'right', fontWeight: 600 }}>$ 150.000</td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: form.color_subtitulos }}>Total Presupuestado: </span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: form.color_destacados }}>$ 530.000 ARS</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Document Footer */}
                  <div
                    className={styles.previewFooter}
                    style={{
                      borderColor: form.color_lineas,
                      color: form.color_subtitulos,
                    }}
                  >
                    <span>{form.pie_pagina_texto || 'SafeLink · Sistemas de Seguridad e Infraestructura'}</span>
                    {form.mostrar_numeracion && <span>Pág. 1 de 1</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

