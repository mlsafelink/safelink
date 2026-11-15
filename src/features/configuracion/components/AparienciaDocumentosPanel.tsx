import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  aparienciaDocumentosService,
  DEFAULT_APARIENCIA_DOCUMENTOS,
  type AparienciaDocumentosConfig,
  type AparienciaDocumentosPreset
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
  FileText,
  Bookmark,
  BookmarkPlus,
  Edit2,
  Trash2,
  Check,
  Maximize2,
  X,
  CheckCircle2,
  AlertCircle
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
  const [isExpandedPreview, setIsExpandedPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── ESTADO DE "MIS CONFIGURACIONES" (PRESETS) ──
  const [presets, setPresets] = useState<AparienciaDocumentosPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [loadedPresetId, setLoadedPresetId] = useState<string | null>(null);

  // Modales de presets
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<AparienciaDocumentosPreset | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AparienciaDocumentosPreset | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    if (!isLoading && initialConfig) {
      setForm(initialConfig);
    }
  }, [initialConfig, isLoading]);

  // Cargar lista de presets
  const loadPresets = async () => {
    try {
      const list = await aparienciaDocumentosService.getPresets();
      setPresets(list);
      const activeId = aparienciaDocumentosService.getActivePresetId();
      setActivePresetId(activeId);
    } catch (e) {
      console.warn('Error cargando presets:', e);
    }
  };

  useEffect(() => {
    loadPresets();

    const handlePresetsUpdate = () => {
      loadPresets();
    };

    window.addEventListener('safelink-presets-updated', handlePresetsUpdate);
    return () => {
      window.removeEventListener('safelink-presets-updated', handlePresetsUpdate);
    };
  }, []);

  const updateField = <K extends keyof AparienciaDocumentosConfig>(
    field: K,
    value: AparienciaDocumentosConfig[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── GUARDAR COMO CONFIGURACIÓN ACTIVA GLOBAL ──
  const handleSaveActive = async () => {
    try {
      setIsSaving(true);
      await aparienciaDocumentosService.save(form);
      queryClient.invalidateQueries({ queryKey: ['apariencia-documentos'] });
      toast.success('Apariencia activa guardada y sincronizada con todos los documentos');
    } catch {
      toast.error('Ocurrió un error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // ── RESTAURAR PREDETERMINADO ──
  const handleReset = async () => {
    if (!window.confirm('¿Deseás restaurar el diseño visual predeterminado de SafeLink para todos los documentos?')) {
      return;
    }
    try {
      setIsSaving(true);
      const def = await aparienciaDocumentosService.reset();
      setForm(def);
      setLoadedPresetId('preset-safelink-corporativo');
      setActivePresetId('preset-safelink-corporativo');
      queryClient.invalidateQueries({ queryKey: ['apariencia-documentos'] });
      toast.info('Diseño visual restablecido a los valores predeterminados de SafeLink');
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

  // ── SUBIR IMAGEN DE BANNER ──
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

  // ── PRESETS: CARGAR CONFIGURACIÓN EN LOS CONTROLES ──
  const handleLoadPreset = (preset: AparienciaDocumentosPreset) => {
    setForm({
      ...preset.config,
      id: initialConfig.id, // mantener id de trabajo
    });
    setLoadedPresetId(preset.id);
    toast.info(`Configuración "${preset.nombre}" cargada en los controles`);
  };

  // ── PRESETS: APLICAR COMO ACTIVA DIRECTAMENTE ──
  const handleApplyPresetAsActive = async (preset: AparienciaDocumentosPreset) => {
    try {
      setIsSaving(true);
      await aparienciaDocumentosService.applyPreset(preset.id);
      setForm({
        ...preset.config,
        id: initialConfig.id,
      });
      setLoadedPresetId(preset.id);
      setActivePresetId(preset.id);
      queryClient.invalidateQueries({ queryKey: ['apariencia-documentos'] });
      toast.success(`"${preset.nombre}" establecida como configuración activa de documentos`);
    } catch {
      toast.error('No se pudo aplicar la configuración activa');
    } finally {
      setIsSaving(false);
    }
  };

  // ── PRESETS: ABRIR MODAL PARA GUARDAR ──
  const handleOpenSavePresetModal = () => {
    const currentLoaded = presets.find(p => p.id === loadedPresetId);
    setPresetNameInput(currentLoaded ? `${currentLoaded.nombre} (Copia)` : 'Mi Configuración');
    setShowSaveModal(true);
  };

  // ── PRESETS: CONFIRMAR GUARDAR ──
  const handleConfirmSavePreset = async () => {
    const name = presetNameInput.trim();
    if (!name) {
      toast.error('Ingresá un nombre para la configuración');
      return;
    }

    // Comprobar si ya existe una con ese nombre exacto
    const existing = presets.find(p => p.nombre.toLowerCase() === name.toLowerCase());
    if (existing && !window.confirm(`Ya existe una configuración con el nombre "${name}". ¿Deseás sobrescribirla?`)) {
      return;
    }

    try {
      setIsSaving(true);
      const saved = await aparienciaDocumentosService.savePreset(
        name,
        form,
        existing ? existing.id : undefined
      );
      await loadPresets();
      setLoadedPresetId(saved.id);
      setShowSaveModal(false);
      toast.success(`Configuración "${saved.nombre}" guardada en Mis Configuraciones`);
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // ── PRESETS: ABRIR RENOMBRAR ──
  const handleOpenRename = (preset: AparienciaDocumentosPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameTarget(preset);
    setRenameInput(preset.nombre);
    setShowRenameModal(true);
  };

  // ── PRESETS: CONFIRMAR RENOMBRAR ──
  const handleConfirmRename = async () => {
    if (!renameTarget) return;
    const trimmed = renameInput.trim();
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    try {
      setIsSaving(true);
      await aparienciaDocumentosService.renamePreset(renameTarget.id, trimmed);
      await loadPresets();
      setShowRenameModal(false);
      setRenameTarget(null);
      toast.success('Configuración renombrada con éxito');
    } catch (err: any) {
      toast.error(err.message || 'Error al renombrar');
    } finally {
      setIsSaving(false);
    }
  };

  // ── PRESETS: ABRIR ELIMINAR ──
  const handleOpenDelete = (preset: AparienciaDocumentosPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(preset);
    setShowDeleteModal(true);
  };

  // ── PRESETS: CONFIRMAR ELIMINAR ──
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsSaving(true);
      await aparienciaDocumentosService.deletePreset(deleteTarget.id);
      await loadPresets();
      if (loadedPresetId === deleteTarget.id) {
        setLoadedPresetId(null);
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      toast.info('Configuración eliminada');
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    } finally {
      setIsSaving(false);
    }
  };

  // Mapeo de fuentes
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

  // Cálculo de porcentaje de tamaño de banner
  const bannerPct = form.banner_tamano_porcentaje || Math.round((form.banner_altura / 180) * 100);

  // Renderizador de la hoja de documento de vista previa (reutilizable en preview sticky y en modal ampliado)
  const renderDocumentMockup = (isLarge = false) => (
    <div
      className={styles.docSheet}
      style={{
        background: getSheetBackground(),
        opacity: form.fondo_opacidad / 100,
        fontFamily: fontFamilies[form.tipografia_familia] || fontFamilies.Inter,
        color: form.color_textos,
        maxWidth: isLarge ? 860 : 680,
      }}
    >
      {/* 1. Header Banner */}
      <div
        className={styles.previewBannerArea}
        style={{
          height: `${form.banner_altura}px`,
          transition: 'height 0.15s ease',
        }}
      >
        {form.usar_banner_personalizado && form.banner_url ? (
          <img
            src={form.banner_url}
            alt="Banner Documento"
            style={{
              width: form.banner_ajuste === 'contain' ? 'auto' : '100%',
              height: '100%',
              maxWidth: '100%',
              objectFit: form.banner_ajuste,
              objectPosition: form.banner_posicion,
              transform: `scale(${bannerPct / 100})`,
              transformOrigin: form.banner_posicion === 'top' ? 'top center' : form.banner_posicion === 'bottom' ? 'bottom center' : 'center center',
              transition: 'transform 0.15s ease, height 0.15s ease',
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
                      <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: 0 }}>Sistemas de Seguridad e Infraestructura</p>
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
            <span className={styles.previewMetaVal} style={{ color: form.color_titulos }}>15 de Noviembre, 2026</span>
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
                  <li>Configuración de acceso seguro remoto vía VPN institucional SafeLink.</li>
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
  );

  return (
    <div className={styles.panelContainer}>
      {/* ── TOP ACTION BAR ── */}
      <div className={styles.topBarActions}>
        <div className={styles.topBarInfo}>
          <h3>Apariencia Unificada de Documentos</h3>
          <p>Personalizá la identidad visual de Propuestas Técnicas, Informes de Trabajo y Presupuestos</p>
        </div>
        <div className={styles.actionButtons}>
          <button className={styles.btnSecondary} onClick={handleCancel}>
            Cancelar
          </button>
          <button className={styles.btnDanger} onClick={handleReset}>
            <RotateCcw size={16} />
            Restaurar predeterminado
          </button>
          <button className={styles.btnPrimary} onClick={handleSaveActive} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? 'Guardando...' : 'Guardar y aplicar a documentos'}
          </button>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* ========================================================
            COLUMNA IZQUIERDA: CONTROLES DE CONFIGURACIÓN
            ======================================================== */}
        <div className={styles.controlsColumn}>

          {/* ── 0. MIS CONFIGURACIONES GUARDADAS (NUEVO) ── */}
          <div className={styles.presetsCard}>
            <div className={styles.presetsHeader}>
              <div className={styles.presetsHeaderLeft}>
                <Bookmark size={22} style={{ color: '#3b82f6' }} />
                <div>
                  <h3 className={styles.presetsTitle}>Mis Configuraciones</h3>
                  <p className={styles.presetsDesc}>Guardá y alterná entre distintas combinaciones de diseño con un nombre personalizado</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnNewPreset}
                onClick={handleOpenSavePresetModal}
              >
                <BookmarkPlus size={16} />
                Guardar configuración actual...
              </button>
            </div>

            <div className={styles.presetsGrid}>
              {presets.map(p => {
                const isCurrentActive = activePresetId === p.id;
                const isCurrentLoaded = loadedPresetId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`${styles.presetCard} ${isCurrentActive ? styles.presetCardActive : ''}`}
                  >
                    <div className={styles.presetCardTop}>
                      <div>
                        <h4 className={styles.presetName}>{p.nombre}</h4>
                        <div className={styles.presetDetails}>
                          <span>{p.config.tipografia_familia}</span>
                          <span>•</span>
                          <span>{p.config.banner_altura}px</span>
                          <div className={styles.presetColorDots}>
                            <span className={styles.presetDot} style={{ background: p.config.color_primario }} title="Primario" />
                            <span className={styles.presetDot} style={{ background: p.config.color_destacados }} title="Destacado" />
                            <span className={styles.presetDot} style={{ background: p.config.color_titulos }} title="Títulos" />
                          </div>
                        </div>
                      </div>
                      {isCurrentActive && (
                        <span className={styles.presetActiveBadge}>
                          <Check size={11} /> Activa
                        </span>
                      )}
                    </div>

                    <div className={styles.presetActions}>
                      <button
                        type="button"
                        className={styles.presetBtnLoad}
                        onClick={() => handleLoadPreset(p)}
                        title="Cargar esta configuración en los controles para ver y editar"
                      >
                        {isCurrentLoaded ? 'Cargada' : 'Cargar'}
                      </button>

                      {!isCurrentActive && (
                        <button
                          type="button"
                          className={styles.presetIconBtn}
                          onClick={() => handleApplyPresetAsActive(p)}
                          title="Establecer como la configuración activa para nuevos documentos"
                          style={{ color: '#34d399' }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}

                      {!p.es_sistema && (
                        <>
                          <button
                            type="button"
                            className={styles.presetIconBtn}
                            onClick={e => handleOpenRename(p, e)}
                            title="Renombrar configuración"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.presetIconBtn} ${styles.presetIconBtnDanger}`}
                            onClick={e => handleOpenDelete(p, e)}
                            title="Eliminar configuración"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 1. ENCABEZADO Y BANNER PRINCIPAL ── */}
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
                      onClick={() => setForm(prev => ({ ...prev, banner_url: '/banner-corporeo.png', usar_banner_personalizado: true, banner_ajuste: 'contain' }))}
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
                      {isUploading ? 'Subiendo a Supabase Storage...' : 'Seleccionar archivo PNG / JPG'}
                    </button>
                    {form.banner_url && form.banner_url !== '/banner-corporeo.png' && (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => setForm(prev => ({ ...prev, banner_url: '/banner-corporeo.png', usar_banner_personalizado: true }))}
                      >
                        Volver a Corpóreo
                      </button>
                    )}
                  </div>
                  {form.banner_url && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>Origen actual: </span>
                      {form.banner_url.startsWith('http') ? (
                        <span>☁️ Supabase Storage (Bucket: <code>documents/branding</code>)</span>
                      ) : form.banner_url === '/banner-corporeo.png' ? (
                        <span>🏢 Banner Corpóreo Institucional (<code>/banner-corporeo.png</code>)</span>
                      ) : (
                        <span>📁 Imagen cargada</span>
                      )}
                    </div>
                  )}
                  <span className={styles.fieldHint}>
                    Se recomienda formato horizontal (1500x350 px o superior). Se almacena de forma persistente.
                  </span>
                </div>

                {/* CONTROL A: Redimensionamiento del banner corpóreo con cambio inmediato */}
                <div className={styles.fieldGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className={styles.fieldLabel}>
                      Tamaño y Altura del Encabezado ({form.banner_altura}px / {bannerPct}%)
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                      {bannerPct}% del tamaño normal
                    </span>
                  </div>
                  <div className={styles.sliderRow}>
                    <input
                      type="range"
                      min={100}
                      max={320}
                      step={5}
                      value={form.banner_altura}
                      onChange={e => {
                        const h = Number(e.target.value);
                        const pct = Math.round((h / 180) * 100);
                        setForm(prev => ({
                          ...prev,
                          banner_altura: h,
                          banner_tamano_porcentaje: pct,
                        }));
                      }}
                      className={styles.rangeInput}
                    />
                    <span className={styles.sliderValue}>{form.banner_altura}px</span>
                  </div>
                  <span className={styles.fieldHint}>
                    Desplazá la barra para cambiar inmediatamente el tamaño y altura del banner en la vista previa y documentos.
                  </span>
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

          {/* ── 2. FONDOS DE DOCUMENTOS ── */}
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

          {/* ── 3. COLORES CORPORATIVOS ── */}
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

              {/* CONTROL B: Colores de Títulos, Subtítulos y Textos */}
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
                <span className={styles.colorPickerLabel}>Texto General (Cuerpo)</span>
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

          {/* ── 4. TIPOGRAFÍA Y ESTRUCTURA VISUAL ── */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <Type size={20} className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>4. Tipografía y Estructura Visual</h2>
            </div>

            {/* CONTROL C: Selector de Tipografía */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Familia Tipográfica</label>
              <select
                value={form.tipografia_familia}
                onChange={e => updateField('tipografia_familia', e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="Inter">Inter (Moderna, Nítida y Equilibrada — Recomendada SafeLink)</option>
                <option value="Roboto">Roboto (Google Clean — Estructurada y Legible)</option>
                <option value="Montserrat">Montserrat (Elegante y Geométrica — Estilo Corporativo)</option>
                <option value="Arial">Arial (Universal estándar)</option>
                <option value="Helvetica">Helvetica (Clásica Suiza — Neutra)</option>
              </select>
              <span className={styles.fieldHint}>
                Aplica la tipografía seleccionada a todos los títulos, textos y tablas del documento.
              </span>
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

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Márgenes de Página</label>
              <div className={styles.btnGroup}>
                {(['estrecho', 'normal', 'amplio'] as const).map(mg => (
                  <button
                    key={mg}
                    type="button"
                    className={`${styles.groupBtn} ${form.margenes === mg ? styles.groupBtnActive : ''}`}
                    onClick={() => updateField('margenes', mg)}
                  >
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5. IDENTIDAD Y PIE DE PÁGINA ── */}
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
            COLUMNA DERECHA: PANEL LATERAL FLOTANTE Y PERSISTENTE
            (Permanece visible al hacer scroll vertical en los controles)
            ======================================================== */}
        <div className={styles.previewColumn}>
          <div className={styles.previewWrapper}>
            {/* Header de la vista previa */}
            <div className={styles.previewHeaderBar}>
              <div className={styles.previewBadge}>
                <span className={styles.previewLiveDot} />
                <span>Vista Previa en Vivo</span>
              </div>

              <div className={styles.previewRightActions}>
                {/* Selector de Documento de Prueba */}
                <div className={styles.previewDocSelector}>
                  <button
                    type="button"
                    className={`${styles.docSelectBtn} ${previewDoc === 'propuesta' ? styles.docSelectBtnActive : ''}`}
                    onClick={() => setPreviewDoc('propuesta')}
                    title="Ver Propuesta Técnica"
                  >
                    <FileCheck size={13} style={{ marginRight: 3 }} />
                    Propuesta
                  </button>
                  <button
                    type="button"
                    className={`${styles.docSelectBtn} ${previewDoc === 'informe' ? styles.docSelectBtnActive : ''}`}
                    onClick={() => setPreviewDoc('informe')}
                    title="Ver Informe de Trabajos Realizados"
                  >
                    <Wrench size={13} style={{ marginRight: 3 }} />
                    Informe
                  </button>
                  <button
                    type="button"
                    className={`${styles.docSelectBtn} ${previewDoc === 'presupuesto' ? styles.docSelectBtnActive : ''}`}
                    onClick={() => setPreviewDoc('presupuesto')}
                    title="Ver Presupuesto Comercial"
                  >
                    <FileText size={13} style={{ marginRight: 3 }} />
                    Presupuesto
                  </button>
                </div>

                {/* Botón Ampliar / Maximizar Vista Previa */}
                <button
                  type="button"
                  className={styles.btnExpandPreview}
                  onClick={() => setIsExpandedPreview(true)}
                  title="Ampliar vista previa en pantalla completa"
                >
                  <Maximize2 size={13} />
                  <span>Ampliar</span>
                </button>
              </div>
            </div>

            {/* Hoja del documento con scroll independiente */}
            <div className={styles.previewScrollArea}>
              {renderDocumentMockup(false)}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL DE VISTA PREVIA AMPLIADA A PANTALLA COMPLETA
          ======================================================== */}
      {isExpandedPreview && (
        <div className={styles.modalExpandedOverlay} onClick={() => setIsExpandedPreview(false)}>
          <div className={styles.modalExpandedHeader} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={styles.previewBadge}>
                <span className={styles.previewLiveDot} />
                <span>Vista Previa Ampliada</span>
              </span>
              <div className={styles.previewDocSelector}>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'propuesta' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('propuesta')}
                >
                  Propuesta Técnica
                </button>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'informe' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('informe')}
                >
                  Informe Trabajos
                </button>
                <button
                  type="button"
                  className={`${styles.docSelectBtn} ${previewDoc === 'presupuesto' ? styles.docSelectBtnActive : ''}`}
                  onClick={() => setPreviewDoc('presupuesto')}
                >
                  Presupuesto
                </button>
              </div>
            </div>

            <button
              type="button"
              className={styles.dialogCloseBtn}
              onClick={() => setIsExpandedPreview(false)}
              title="Cerrar vista ampliada (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalExpandedContent} onClick={e => e.stopPropagation()}>
            {renderDocumentMockup(true)}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: GUARDAR NUEVA CONFIGURACIÓN (PRESET)
          ======================================================== */}
      {showSaveModal && (
        <div className={styles.dialogBackdrop} onClick={() => setShowSaveModal(false)}>
          <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>Guardar en Mis Configuraciones</h3>
              <button
                type="button"
                className={styles.dialogCloseBtn}
                onClick={() => setShowSaveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.dialogText}>
                Asigná un nombre a la combinación visual actual (banner, colores, tipografía, fondos) para reutilizarla cuando quieras:
              </p>
              <input
                type="text"
                value={presetNameInput}
                onChange={e => setPresetNameInput(e.target.value)}
                placeholder="Ej: SafeLink Corporativo, Presupuesto Azul, etc."
                className={styles.dialogInput}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmSavePreset();
                  if (e.key === 'Escape') setShowSaveModal(false);
                }}
              />
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowSaveModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleConfirmSavePreset}
                disabled={isSaving}
              >
                <Save size={15} />
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RENOMBRAR CONFIGURACIÓN
          ======================================================== */}
      {showRenameModal && renameTarget && (
        <div className={styles.dialogBackdrop} onClick={() => setShowRenameModal(false)}>
          <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>Renombrar Configuración</h3>
              <button
                type="button"
                className={styles.dialogCloseBtn}
                onClick={() => setShowRenameModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.dialogText}>
                Ingresá el nuevo nombre para "{renameTarget.nombre}":
              </p>
              <input
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                className={styles.dialogInput}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setShowRenameModal(false);
                }}
              />
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowRenameModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleConfirmRename}
                disabled={isSaving}
              >
                Guardar Nombre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ELIMINAR CONFIGURACIÓN (CON CONFIRMACIÓN)
          ======================================================== */}
      {showDeleteModal && deleteTarget && (
        <div className={styles.dialogBackdrop} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.dialogBox} onClick={e => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={20} />
                Confirmar Eliminación
              </h3>
              <button
                type="button"
                className={styles.dialogCloseBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.dialogBody}>
              <p className={styles.dialogText}>
                ¿Estás seguro de que deseás eliminar la configuración <strong>"{deleteTarget.nombre}"</strong>?
              </p>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                Esta acción no afectará a los documentos ya creados con este diseño.
              </p>
            </div>

            <div className={styles.dialogFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleConfirmDelete}
                disabled={isSaving}
              >
                <Trash2 size={15} />
                Eliminar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
