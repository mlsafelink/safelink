import { useState, useRef } from 'react';
import {
  Mic2,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  BarChart2,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './VoiceLabPage.module.css';
import { generateTts } from '../../services/vibeApi';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { supabase } from '@/lib/supabase';

// ─── Catálogo de voces neuronal ───────────────────────────────────────────────
const VOICES = [
  {
    id: 'Fenrir',
    name: 'Fenrir',
    label: 'Masculina · Profesional',
    description: 'Grave y confiable, ideal para institucional y seguridad',
    style: 'professional',
    accent: 'LatAm',
    sample: '¿Tu edificio está realmente protegido?',
    color: '#6366f1',
  },
  {
    id: 'Kore',
    name: 'Kore',
    label: 'Femenina · Cálida',
    description: 'Natural y cercana, ideal para WhatsApp y redes sociales',
    style: 'warm',
    accent: 'LatAm',
    sample: 'Con SafeLink tenés todo bajo control desde tu celular.',
    color: '#ec4899',
  },
  {
    id: 'Charon',
    name: 'Charon',
    label: 'Masculina · Dinámica',
    description: 'Energética y comercial, ideal para Reels y TikTok',
    style: 'energetic',
    accent: 'LatAm',
    sample: '¡Instalación en 48 hs, garantía total, sin vueltas!',
    color: '#f59e0b',
  },
  {
    id: 'Leda',
    name: 'Leda',
    label: 'Femenina · Corporativa',
    description: 'Clara y precisa, ideal para consorcios y empresas',
    style: 'corporate',
    accent: 'Neutral',
    sample: 'Soluciones de videovigilancia de alta fidelidad para su empresa.',
    color: '#10b981',
  },
  {
    id: 'Orus',
    name: 'Orus',
    label: 'Masculino · Storytelling',
    description: 'Narrador, cadencia pausada, ideal para video largo',
    style: 'narrative',
    accent: 'LatAm',
    sample: 'Cada instalación SafeLink comienza con una sola pregunta...',
    color: '#8b5cf6',
  },
  {
    id: 'Aoede',
    name: 'Aoede',
    label: 'Femenina · Joven',
    description: 'Fresca y contemporánea, ideal para público joven',
    style: 'youthful',
    accent: 'Neutral',
    sample: '¡Seguí a SafeLink y descubrí cómo proteger tu hogar!',
    color: '#06b6d4',
  },
];

const SUBTITLE_STYLES = [
  { id: 'karaoke', label: 'Karaoke activo', description: 'Reels / TikTok — palabra por palabra resaltada', icon: '🎤' },
  { id: 'bottom', label: 'Banda inferior clásica', description: 'Institucional — subtítulo fijo abajo', icon: '📺' },
  { id: 'none', label: 'Sin subtítulos', description: 'Solo audio, sin overlay de texto', icon: '🔇' },
];

const SCRIPT_PRESETS = [
  {
    label: 'WhatsApp Status · Cámaras',
    text: '¿Tu edificio o casa está realmente protegido? Con SafeLink tenés cámaras de seguridad en ultra alta definición con visión nocturna a color y acceso en tiempo real desde tu celular. Protegé lo que más te importa con instalación limpia y soporte técnico continuo. Escribinos ahora para pedirte tu relevamiento sin cargo.',
  },
  {
    label: 'Reel · Internet y Redes',
    text: '¿Cansado de los cortes de Internet? En SafeLink diseñamos redes empresariales que no fallan. Cableado estructurado, Wi-Fi de cobertura total y soporte 24/7. Pedí tu diagnóstico gratis hoy.',
  },
  {
    label: 'Feed · Iluminación inteligente',
    text: 'Iluminación LED inteligente para tu consorcio o empresa. Ahorrás hasta un 60% en energía con control automatizado por zona, horario y sensor de movimiento. SafeLink lo instala y lo gestiona por vos.',
  },
];

export function VoiceLabPage() {
  const { showToast } = useToast();

  // State
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [subtitleStyle, setSubtitleStyle] = useState('karaoke');
  const [scriptText, setScriptText] = useState(SCRIPT_PRESETS[0].text);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFileName, setSavedFileName] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const charCount = scriptText.length;
  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSec = Math.ceil(wordCount / 2.5); // ~150 words/min

  const handleGenerate = async () => {
    if (!scriptText.trim()) {
      showToast('Escribí el guión antes de generar el audio.', 'error');
      return;
    }
    setIsGenerating(true);
    setAudioBlob(null);
    setAudioUrl(null);
    setSavedFileName(null);

    const res = await generateTts({ text: scriptText, voiceName: selectedVoice.id });

    if (!res.ok || !res.data) {
      showToast(res.error || 'Error al generar audio.', 'error');
      setIsGenerating(false);
      return;
    }

    // Convertir base64 → Blob → URL
    const { audioBase64, mimeType } = res.data;
    const byteChars = atob(audioBase64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);

    setAudioBlob(blob);
    setAudioUrl(url);
    setIsGenerating(false);
    showToast(`Audio generado con voz ${selectedVoice.name} ✓`, 'success');
  };

  const handlePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `safelink-voz-${selectedVoice.id.toLowerCase()}-${Date.now()}.wav`;
    a.click();
  };

  const handleSaveToLibrary = async () => {
    if (!audioBlob) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `voz-${selectedVoice.id.toLowerCase()}-${Date.now()}.wav`;
      const filePath = user ? `${user.id}/${fileName}` : fileName;

      const { error } = await supabase.storage
        .from('safelink-vibe')
        .upload(filePath, audioBlob, { contentType: 'audio/wav', upsert: false });

      if (error) {
        showToast(`Error al guardar: ${error.message}`, 'error');
      } else {
        setSavedFileName(fileName);
        showToast('Audio guardado en la Biblioteca ✓', 'success');
      }
    } catch {
      showToast('Error inesperado al guardar.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <h1 className={styles.pageTitle}>
            <Mic2 size={22} aria-hidden="true" />
            Laboratorio de Voz
          </h1>
          <p className={styles.pageSubtitle}>
            Síntesis neuronal de locución. Elegí la voz, escribí el guión y generá el audio al instante.
          </p>
        </div>
        <div className={styles.pageHeaderBadge}>
          <Sparkles size={13} />
          Gemini TTS · 6 voces neurales
        </div>
      </div>

      <div className={styles.layout}>
        {/* ─── Panel izquierdo ─────────────────────────────── */}
        <div className={styles.leftPanel}>

          {/* Selector de voz */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Volume2 size={15} />
              Voz de locución
            </h2>
            <div className={styles.voiceGrid}>
              {VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  className={clsx(styles.voiceCard, selectedVoice.id === voice.id && styles.voiceCardActive)}
                  onClick={() => setSelectedVoice(voice)}
                  style={{ '--voice-color': voice.color } as React.CSSProperties}
                  aria-pressed={selectedVoice.id === voice.id}
                >
                  <div className={styles.voiceCardDot} />
                  <div className={styles.voiceCardName}>{voice.name}</div>
                  <div className={styles.voiceCardLabel}>{voice.label}</div>
                  <div className={styles.voiceCardDesc}>{voice.description}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Estilo de subtítulos */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <BarChart2 size={15} />
              Estilo de subtítulos
            </h2>
            <div className={styles.subtitleOptions}>
              {SUBTITLE_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={clsx(styles.subtitleOption, subtitleStyle === s.id && styles.subtitleOptionActive)}
                  onClick={() => setSubtitleStyle(s.id)}
                  aria-pressed={subtitleStyle === s.id}
                >
                  <span className={styles.subtitleIcon}>{s.icon}</span>
                  <div>
                    <div className={styles.subtitleLabel}>{s.label}</div>
                    <div className={styles.subtitleDesc}>{s.description}</div>
                  </div>
                  {subtitleStyle === s.id && <CheckCircle2 size={14} className={styles.subtitleCheck} />}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ─── Panel derecho ────────────────────────────────── */}
        <div className={styles.rightPanel}>

          {/* Guión */}
          <section className={styles.card}>
            <div className={styles.scriptHeader}>
              <h2 className={styles.cardTitle}>
                <ChevronRight size={15} />
                Guión de locución
              </h2>
              <div className={styles.scriptPresets}>
                {SCRIPT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className={styles.presetBtn}
                    onClick={() => setScriptText(p.text)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className={styles.scriptTextarea}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Escribí o pegá el guión de locución aquí..."
              rows={8}
              id="voice-lab-script"
              aria-label="Guión de locución"
            />

            <div className={styles.scriptMeta}>
              <span>{charCount} caracteres · {wordCount} palabras</span>
              <span>≈ {estimatedSec} segundos de audio</span>
            </div>
          </section>

          {/* Preview de voz seleccionada */}
          <section className={styles.voicePreviewCard} style={{ '--voice-color': selectedVoice.color } as React.CSSProperties}>
            <div className={styles.voicePreviewLeft}>
              <div className={styles.voicePreviewName}>{selectedVoice.name}</div>
              <div className={styles.voicePreviewMeta}>{selectedVoice.label} · Acento {selectedVoice.accent}</div>
              <div className={styles.voicePreviewSample}>"{selectedVoice.sample}"</div>
            </div>
            <div className={styles.voicePreviewWave} aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <div
                  key={i}
                  className={styles.voiceWaveBar}
                  style={{ animationDelay: `${i * 60}ms`, height: `${12 + Math.sin(i * 0.8) * 10}px` }}
                />
              ))}
            </div>
          </section>

          {/* Generación */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Sparkles size={15} />
              Síntesis de audio
            </h2>

            <button
              type="button"
              className={clsx(styles.generateBtn, isGenerating && styles.generateBtnLoading)}
              onClick={handleGenerate}
              disabled={isGenerating || !scriptText.trim()}
              id="voice-lab-generate"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={15} className={styles.spin} />
                  Sintetizando voz neuronal...
                </>
              ) : (
                <>
                  <Mic2 size={15} />
                  Generar Audio · {selectedVoice.name}
                </>
              )}
            </button>

            {/* Player */}
            {audioUrl && (
              <div className={styles.player}>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />
                <div className={styles.playerBar}>
                  <button
                    type="button"
                    className={styles.playerPlayBtn}
                    onClick={handlePlay}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    id="voice-lab-play"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>

                  <div className={styles.playerWave} aria-hidden="true">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(styles.playerWaveBar, isPlaying && styles.playerWaveBarActive)}
                        style={{ height: `${8 + Math.abs(Math.sin(i * 0.6)) * 20}px`, animationDelay: `${i * 40}ms` }}
                      />
                    ))}
                  </div>

                  <div className={styles.playerActions}>
                    <button
                      type="button"
                      className={styles.playerActionBtn}
                      onClick={handleDownload}
                      title="Descargar WAV"
                      id="voice-lab-download"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.playerInfo}>
                  <CheckCircle2 size={13} className={styles.playerInfoIcon} />
                  Audio generado · Voz {selectedVoice.name} · {subtitleStyle === 'karaoke' ? 'Karaoke' : subtitleStyle === 'bottom' ? 'Banda inferior' : 'Sin subtítulos'}
                </div>

                {/* Guardar en biblioteca */}
                <div className={styles.saveSection}>
                  {savedFileName ? (
                    <div className={styles.savedBadge}>
                      <CheckCircle2 size={14} />
                      Guardado en Biblioteca: {savedFileName}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={handleSaveToLibrary}
                      disabled={isSaving}
                      id="voice-lab-save"
                    >
                      {isSaving ? (
                        <><RefreshCw size={13} className={styles.spin} /> Guardando...</>
                      ) : (
                        <><Download size={13} /> Guardar en Biblioteca</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {!audioUrl && !isGenerating && (
              <div className={styles.emptyPlayer}>
                <AlertCircle size={18} className={styles.emptyPlayerIcon} />
                <span>Presioná "Generar Audio" para sintetizar la locución.</span>
              </div>
            )}
          </section>

          {/* Info de integración */}
          <div className={styles.infoBox}>
            <Info size={13} />
            <span>
              El audio generado se puede adjuntar directamente al <strong>Crear Contenido</strong> como pista de voz, 
              o exportar a la <strong>Biblioteca</strong> para sincronizar con Google Drive.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
