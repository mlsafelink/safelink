import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Square,
  Smartphone,
  Film,
  Monitor,
  LayoutGrid,
  Play,
  Pause,
  Volume2,
  Video,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './CreateContentPage.module.css';
import { CONTENT_FORMATS } from '../../constants/formats';
import type { ContentFormat } from '../../constants/formats';
import { SAFELINK_SERVICES } from '../../constants/services';
import { createProject } from '../../services/projectService';
import {
  generateScript,
  generateTts,
  startVideoGeneration,
  pollVideoStatus,
} from '../../services/vibeApi';
import { useToast } from '@/components/ui/Toast/ToastContext';

const OBJECTIVES = [
  { id: 'lead_gen', label: 'Captación de clientes' },
  { id: 'branding', label: 'Posicionamiento y confianza' },
  { id: 'promo', label: 'Promoción de servicio' },
  { id: 'tech_demo', label: 'Demostración técnica' },
];

const VOICES = [
  { id: 'es_ar_male_prof', name: 'Voz 1 — Masculina Profesional (LatAm / AR)' },
  { id: 'es_ar_female_warm', name: 'Voz 2 — Femenina Cercana y Confiable' },
  { id: 'es_ar_male_energetic', name: 'Voz 3 — Masculina Dinámica y Comercial' },
];

export function CreateContentPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Form State
  const [format, setFormat] = useState<ContentFormat>('video_9_16');
  const [service, setService] = useState<string>(SAFELINK_SERVICES[0].id);
  const [objective, setObjective] = useState<string>('lead_gen');
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('Protegé lo que más te importa con SafeLink');
  const [bodyText, setBodyText] = useState('Instalación profesional de sistemas de seguridad y conectividad de alta fidelidad.');
  const [ctaText, setCtaText] = useState('Consultanos por WhatsApp');
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [subtitleStyle, setSubtitleStyle] = useState<'karaoke' | 'bottom' | 'none'>('karaoke');

  // Asset Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Submission State
  const [isSaving, setIsSaving] = useState(false);

  // Obtener metadata del formato seleccionado
  const currentFormatMeta = CONTENT_FORMATS[format];

  // Manejo de carga de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFileError('Solo se admiten imágenes JPG, PNG o WEBP.');
      return;
    }

    // Validación de tamaño (máx 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('La imagen no debe superar los 10 MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scenes, setScenes] = useState<Array<{
    time: string;
    title: string;
    visualDescription: string;
    audioLine: string;
    icon: string;
  }>>([]);
  const [veoPrompt, setVeoPrompt] = useState<string>('');

  // Audio State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Video Generation State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatusText, setVideoStatusText] = useState('');

  const handleGenerateWithAI = async () => {
    const selectedServiceObj = SAFELINK_SERVICES.find((s: { id: string }) => s.id === service);

    setIsGeneratingScript(true);
    try {
      const res = await generateScript({
        services: [selectedServiceObj?.name || 'Seguridad y Conectividad'],
        tone: 'profesional',
        durationSeconds: 15,
      });

      if (res.ok) {
        if (!title.trim() && res.data.title) setTitle(res.data.title);
        if (res.data.headline) setHeadline(res.data.headline);
        if (res.data.voiceoverScript) setBodyText(res.data.voiceoverScript);
        if (res.data.ctaText) setCtaText(res.data.ctaText);
        if (res.data.scenes) setScenes(res.data.scenes);
        if (res.data.veoPrompt) setVeoPrompt(res.data.veoPrompt);
        showToast('¡Guión y copy publicitario generados con IA!', 'success');
      } else {
        showToast(
          res.error || 'Asegurate de iniciar el servidor en el puerto 3001 con "npm run vibe:server".',
          'error'
        );
      }
    } catch {
      showToast('Error de conexión con el backend de IA.', 'error');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!bodyText.trim()) {
      showToast('Escribí o generá un guión primero para sintetizar la voz.', 'error');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const res = await generateTts({
        text: bodyText,
        voiceName: voiceId === 'es_ar_female_warm' ? 'Kore' : 'Fenrir',
      });

      if (res.ok) {
        setAudioBase64(res.data.audioBase64);
        const audioSrc = `data:${res.data.mimeType};base64,${res.data.audioBase64}`;
        const audio = new Audio(audioSrc);
        setAudioElement(audio);
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        setIsPlayingAudio(true);
        showToast('¡Locución generada con éxito!', 'success');
      } else {
        showToast(res.error || 'Error al generar locución.', 'error');
      }
    } catch {
      showToast('Error de conexión con el backend de voz.', 'error');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleTogglePlayAudio = () => {
    if (!audioElement) return;
    if (isPlayingAudio) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      audioElement.play();
      setIsPlayingAudio(true);
    }
  };

  const handleGenerateVideo = async () => {
    const promptToUse = veoPrompt || headline || `Cinematic professional video showcasing ${service} installation for SafeLink`;
    const targetRatio = currentFormatMeta.aspectRatio === '16:9' ? '16:9' : '9:16';

    setIsGeneratingVideo(true);
    setVideoProgress(15);
    setVideoStatusText('Enviando petición a Google Veo...');

    try {
      const res = await startVideoGeneration({
        prompt: promptToUse,
        aspectRatio: targetRatio,
        resolution: '720p',
      });

      if (!res.ok) {
        showToast(res.error || 'Error al iniciar generación de video.', 'error');
        setIsGeneratingVideo(false);
        return;
      }

      const operationName = res.data.operationName;
      setVideoProgress(35);
      setVideoStatusText('Renderizando fotogramas con Veo (esto puede demorar unos minutos)...');

      let attempts = 0;
      const maxAttempts = 30;

      const interval = setInterval(async () => {
        attempts++;
        setVideoProgress((prev) => Math.min(prev + 3, 92));

        const statusRes = await pollVideoStatus(operationName);
        if (statusRes.ok && statusRes.data.done) {
          clearInterval(interval);
          setVideoProgress(100);
          setVideoStatusText('¡Video generado!');
          setIsGeneratingVideo(false);
          showToast('¡Video generado con Google Veo!', 'success');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsGeneratingVideo(false);
          setVideoStatusText('Procesamiento en progreso en Google Cloud.');
        }
      }, 5000);
    } catch {
      showToast('Error de comunicación con el motor de video.', 'error');
      setIsGeneratingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast('Por favor, ingresá un nombre o título para el proyecto.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const selectedServiceObj = SAFELINK_SERVICES.find((s: { id: string }) => s.id === service);

      const result = await createProject({
        title: title.trim(),
        format,
        description: `Objetivo: ${objective}. Servicio: ${selectedServiceObj?.name ?? service}`,
        tags: [service, objective, currentFormatMeta.aspectRatio],
        project_data: {
          prompt: `${headline}. ${bodyText}`,
          voiceoverScript: bodyText,
          aspectRatio: currentFormatMeta.aspectRatio,
          scenes: [
            {
              id: 'scene-1',
              order: 1,
              title: headline,
              visualDescription: `Publicidad para ${selectedServiceObj?.name ?? 'SafeLink'} con CTA: ${ctaText}`,
              audioLine: bodyText,
              durationSec: 5,
            },
          ],
        },
      });

      if (result.ok) {
        showToast('Proyecto guardado exitosamente.', 'success');
        navigate('/vibe/proyectos');
      } else {
        showToast(result.error || 'Error al guardar el proyecto.', 'error');
      }
    } catch {
      showToast('Ocurrió un error inesperado al guardar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calcular dimensiones para el mockup de preview
  const getMockDimensions = () => {
    switch (currentFormatMeta.aspectRatio) {
      case '9:16':
        return { width: '220px', height: '390px', aspectRatio: '9/16' };
      case '1:1':
        return { width: '280px', height: '280px', aspectRatio: '1/1' };
      case '4:5':
        return { width: '260px', height: '325px', aspectRatio: '4/5' };
      case '16:9':
        return { width: '360px', height: '202px', aspectRatio: '16/9' };
      default:
        return { width: '260px', height: '260px', aspectRatio: '1/1' };
    }
  };

  const mockDim = getMockDimensions();

  return (
    <div className={styles.page}>
      {/* Barra superior */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate('/vibe')}
            title="Volver al Dashboard"
            aria-label="Volver al Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.pageTitle}>Crear Nueva Pieza Publicitaria</h1>
            <p className={styles.pageSubtitle}>
              Configurá el formato, mensaje y composición para SafeLink.
            </p>
          </div>
        </div>

        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => navigate('/vibe')}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={15} />
            <span>{isSaving ? 'Guardando...' : 'Guardar Proyecto'}</span>
          </button>
        </div>
      </div>

      {/* Grid del editor */}
      <div className={styles.editorGrid}>
        {/* Columna izquierda: formulario secuencial */}
        <div className={styles.sectionsContainer}>
          {/* 1. Datos básicos y Título */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>1</span>
                <div>
                  <h2 className={styles.sectionTitle}>Identificación del Proyecto</h2>
                  <p className={styles.sectionDesc}>Nombre para organizar tu contenido en SafeLink Vibe</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="project-title" className={styles.label}>
                Nombre de la pieza publicitaria *
              </label>
              <input
                id="project-title"
                type="text"
                className={styles.input}
                placeholder="Ej: Promo Cámaras Consorcios Octubre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Formato */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>2</span>
                <div>
                  <h2 className={styles.sectionTitle}>Formato y Proporción</h2>
                  <p className={styles.sectionDesc}>Elegí la plataforma de destino de la pieza</p>
                </div>
              </div>
            </div>

            <div className={styles.formatsGrid}>
              {Object.entries(CONTENT_FORMATS).map(([fmtKey, fmtMeta]) => {
                const isActive = format === fmtKey;
                return (
                  <button
                    key={fmtKey}
                    type="button"
                    className={clsx(styles.formatOption, isActive && styles.formatOptionActive)}
                    onClick={() => setFormat(fmtKey as ContentFormat)}
                  >
                    {fmtMeta.aspectRatio === '9:16' && <Smartphone size={22} />}
                    {fmtMeta.aspectRatio === '1:1' && <Square size={22} />}
                    {fmtMeta.aspectRatio === '4:5' && <Film size={22} />}
                    {fmtMeta.aspectRatio === '16:9' && <Monitor size={22} />}
                    {fmtKey === 'carousel' && <LayoutGrid size={22} />}

                    <span className={styles.formatLabel}>{fmtMeta.label}</span>
                    <span className={styles.formatRatioBadge}>{fmtMeta.aspectRatio}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Servicio y Objetivo */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>3</span>
                <div>
                  <h2 className={styles.sectionTitle}>Servicio y Enfoque Comercial</h2>
                  <p className={styles.sectionDesc}>Servicios autorizados para comunicación pública</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Servicio a promocionar</label>
              <div className={styles.chipsContainer}>
                {SAFELINK_SERVICES.map((srv: { id: string; name: string; description: string }) => (
                  <button
                    key={srv.id}
                    type="button"
                    className={clsx(styles.chip, service === srv.id && styles.chipActive)}
                    onClick={() => {
                      setService(srv.id);
                      setHeadline(`Protección integral con ${srv.name}`);
                      setBodyText(srv.description);
                    }}
                  >
                    {srv.name}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Objetivo de la comunicación</label>
              <div className={styles.chipsContainer}>
                {OBJECTIVES.map((obj) => (
                  <button
                    key={obj.id}
                    type="button"
                    className={clsx(styles.chip, objective === obj.id && styles.chipActive)}
                    onClick={() => setObjective(obj.id)}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Mensaje publicitario y Copy */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>4</span>
                <div>
                  <h2 className={styles.sectionTitle}>Mensaje y Llamada a la Acción</h2>
                  <p className={styles.sectionDesc}>Textos visibles y gancho publicitario</p>
                </div>
              </div>

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleGenerateWithAI}
                disabled={isGeneratingScript}
                title="Generar copy con Gemini"
              >
                <Sparkles size={14} color="var(--vibe-blue)" />
                <span>{isGeneratingScript ? 'Generando...' : 'Autocompletar con IA'}</span>
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="ad-headline" className={styles.label}>Titular / Gancho principal</label>
              <input
                id="ad-headline"
                type="text"
                className={styles.input}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ej: Seguridad perimetral sin fallas"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="ad-body" className={styles.label}>Texto explicativo / Locución</label>
              <textarea
                id="ad-body"
                className={styles.textarea}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Explicá la propuesta de valor sin inventar precios o garantías no verificadas."
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="ad-cta" className={styles.label}>Botón / Llamada a la acción (CTA)</label>
              <input
                id="ad-cta"
                type="text"
                className={styles.input}
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Ej: Escribinos por WhatsApp al..."
              />
            </div>

            {scenes.length > 0 && (
              <div className={styles.scenesTimeline}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Layers size={15} color="var(--vibe-blue)" />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--vibe-text-primary)' }}>
                    Guión Desglosado en Escenas ({scenes.length} tomas)
                  </span>
                </div>
                {scenes.map((scene, idx) => (
                  <div key={idx} className={styles.sceneCard}>
                    <div className={styles.sceneCardHeader}>
                      <span className={styles.sceneTitle}>{scene.title}</span>
                      <span className={styles.sceneTimeBadge}>{scene.time}</span>
                    </div>
                    <div className={styles.sceneVisualDesc}>{scene.visualDescription}</div>
                    <div className={styles.sceneAudioLine}>"{scene.audioLine}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Recursos visuales */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>5</span>
                <div>
                  <h2 className={styles.sectionTitle}>Recurso Visual</h2>
                  <p className={styles.sectionDesc}>Imagen o fondo fotográfico para la composición</p>
                </div>
              </div>
            </div>

            <label className={styles.dropzone}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={28} color="var(--vibe-blue)" />
              <span className={styles.dropzoneText}>
                Hacé clic o arrastrá una imagen real (JPG, PNG, WEBP)
              </span>
              <span className={styles.dropzoneHint}>
                Resolución recomendada para {currentFormatMeta.aspectRatio}: {currentFormatMeta.dimensions.width}x{currentFormatMeta.dimensions.height} px
              </span>
            </label>

            {fileError && (
              <div style={{ color: 'var(--vibe-error)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <AlertCircle size={14} />
                <span>{fileError}</span>
              </div>
            )}

            {selectedFile && previewUrl && (
              <div className={styles.assetPreviewBox}>
                <img src={previewUrl} alt="Vista previa del recurso" className={styles.assetThumb} />
                <div className={styles.assetInfo}>
                  <div className={styles.assetName}>{selectedFile.name}</div>
                  <div className={styles.assetSize}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Imagen cargada
                  </div>
                </div>
                <CheckCircle2 size={18} color="var(--vibe-success)" />
              </div>
            )}
          </div>

          {/* 6. Voz y Subtítulos */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <span className={styles.sectionNumber}>6</span>
                <div>
                  <h2 className={styles.sectionTitle}>Configuración de Voz y Subtítulos</h2>
                  <p className={styles.sectionDesc}>Parámetros para la síntesis de audio y subtítulos</p>
                </div>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="voice-select" className={styles.label}>Voz de locución</label>
              <select
                id="voice-select"
                className={styles.select}
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Estilo de subtítulos</label>
              <div className={styles.chipsContainer}>
                <button
                  type="button"
                  className={clsx(styles.chip, subtitleStyle === 'karaoke' && styles.chipActive)}
                  onClick={() => setSubtitleStyle('karaoke')}
                >
                  Karaoke activo (Reels/TikTok)
                </button>
                <button
                  type="button"
                  className={clsx(styles.chip, subtitleStyle === 'bottom' && styles.chipActive)}
                  onClick={() => setSubtitleStyle('bottom')}
                >
                  Banda inferior clásica
                </button>
                <button
                  type="button"
                  className={clsx(styles.chip, subtitleStyle === 'none' && styles.chipActive)}
                  onClick={() => setSubtitleStyle('none')}
                >
                  Sin subtítulos
                </button>
              </div>
            </div>

            {/* Reproductor y Síntesis de Audio TTS */}
            <div className={styles.audioPlayerBox}>
              <div className={styles.audioControlsRow}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--vibe-text-primary)' }}>
                    Locución Neuronal de Prueba
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--vibe-text-muted)' }}>
                    Sintetizá y escuchá la voz generada antes de guardar
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className={styles.audioPlayBtn}
                    onClick={handleGenerateTTS}
                    disabled={isGeneratingAudio}
                  >
                    <Volume2 size={15} />
                    <span>{isGeneratingAudio ? 'Sintetizando...' : 'Generar Audio'}</span>
                  </button>

                  {audioBase64 && (
                    <button
                      type="button"
                      className={styles.audioPlayBtn}
                      onClick={handleTogglePlayAudio}
                      style={{ background: 'var(--vibe-blue)', color: 'white' }}
                    >
                      {isPlayingAudio ? <Pause size={15} /> : <Play size={15} />}
                      <span>{isPlayingAudio ? 'Pausar' : 'Escuchar'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Vista previa interactiva y Generador de Video */}
        <div className={styles.previewColumn}>
          {/* Caja de Generación de Video con Veo */}
          <div className={styles.videoGenBox}>
            <div className={styles.videoGenHeader}>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--vibe-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Video size={15} color="var(--vibe-blue)" />
                  <span>Render de Video con Google Veo</span>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--vibe-text-muted)' }}>
                  Generación cinematográfica en proporción {currentFormatMeta.aspectRatio}
                </div>
              </div>

              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
              >
                <Sparkles size={13} />
                <span>{isGeneratingVideo ? 'Procesando...' : 'Generar Video'}</span>
              </button>
            </div>

            {isGeneratingVideo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBarFill} style={{ width: `${videoProgress}%` }} />
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--vibe-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{videoStatusText}</span>
                  <span>{videoProgress}%</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                <Sparkles size={16} color="var(--vibe-blue)" />
                <span>Vista Previa del Formato ({currentFormatMeta.aspectRatio})</span>
              </div>
            </div>

            <div className={styles.mockViewportContainer}>
              <div
                className={styles.mockFrame}
                style={{
                  width: mockDim.width,
                  height: mockDim.height,
                  backgroundImage: previewUrl ? `url(${previewUrl})` : undefined,
                }}
              >
                <div className={styles.mockFrameOverlay} />
                <div className={styles.mockFrameContent}>
                  <div className={styles.mockBadge}>
                    <Sparkles size={11} />
                    <span>SafeLink Vibe</span>
                  </div>

                  <div className={styles.mockMainText}>
                    <div className={styles.mockHeadline}>{headline || 'Titular del anuncio'}</div>
                    <div className={styles.mockBody}>{bodyText || 'Texto descriptivo del servicio.'}</div>
                  </div>

                  <div className={styles.mockCtaBox}>
                    {ctaText || 'Contactar'}
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
