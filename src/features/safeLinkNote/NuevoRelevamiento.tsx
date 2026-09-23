import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Camera,
  ImagePlus,
  X,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  AlertCircle,
} from 'lucide-react';
import styles from './NuevoRelevamiento.module.css';
import { relevamientoService } from '@/services/relevamientoService';

// ── Tipos ──────────────────────────────────────────────────────────
type TipoTrabajo = 'CAMARAS' | 'REDES' | 'ILUMINACION' | 'ELECTRICIDAD' | 'OTRO';

interface Foto {
  id: string;
  dataUrl: string;
  descripcion: string;
}

interface Material {
  id: string;
  nombre: string;
  cantidad: string;
  costo: string;
  observacion: string;
}

interface FormData {
  cliente: string;
  direccion: string;
  contacto: string;
  tipoTrabajo: TipoTrabajo[];
  observaciones: string;
}

interface MatFormData {
  nombre: string;
  cantidad: string;
  costo: string;
  observacion: string;
}

// ── Constantes ─────────────────────────────────────────────────────
const TIPOS: { key: TipoTrabajo; label: string; emoji: string }[] = [
  { key: 'CAMARAS',      label: 'Cámaras',      emoji: '📷' },
  { key: 'REDES',        label: 'Redes',         emoji: '🌐' },
  { key: 'ILUMINACION',  label: 'Iluminación',   emoji: '💡' },
  { key: 'ELECTRICIDAD', label: 'Electricidad',  emoji: '⚡' },
  { key: 'OTRO',         label: 'Otro',          emoji: '🔧' },
];

const MAT_FORM_INITIAL: MatFormData = { nombre: '', cantidad: '1', costo: '', observacion: '' };

// ── Utilidades ─────────────────────────────────────────────────────
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Comprime una imagen usando el Canvas API del navegador.
 * No requiere librerías externas. Devuelve un data URL JPEG.
 */
async function compressImage(file: File, maxDim = 900, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim)      { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Acceso a la Web Speech API (evita error de TS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR_API: any = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

// ── Componente principal ───────────────────────────────────────────
export function NuevoRelevamiento() {
  const navigate = useNavigate();

  // ID de sesión — null hasta el primer GUARDAR exitoso
  const supabaseIdRef  = useRef<string | null>(null);
  // Fecha fija para mostrar en el encabezado
  const fechaCreacion  = useRef<Date>(new Date());

  const [form, setForm] = useState<FormData>({
    cliente: '', direccion: '', contacto: '',
    tipoTrabajo: [], observaciones: '',
  });
  const [fotos,      setFotos]      = useState<Foto[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  // Dictado
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Estado de guardado
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError,    setSaveError]    = useState<string>('');
  const [isFinishing,  setIsFinishing]  = useState(false);

  // Formulario de materiales
  const [showMatForm, setShowMatForm] = useState(false);
  const [matForm,     setMatForm]     = useState<MatFormData>(MAT_FORM_INITIAL);

  // Refs para inputs de archivo
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Limpiar reconocimiento al desmontar
  useEffect(() => () => recognitionRef.current?.stop(), []);

  // ── Helpers de form ──────────────────────────────────────────────
  const updateForm = (field: keyof Omit<FormData, 'tipoTrabajo'>, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleTipo = (tipo: TipoTrabajo) =>
    setForm(prev => ({
      ...prev,
      tipoTrabajo: prev.tipoTrabajo.includes(tipo)
        ? prev.tipoTrabajo.filter(t => t !== tipo)
        : [...prev.tipoTrabajo, tipo],
    }));

  // ── Dictado de voz ───────────────────────────────────────────────
  const handleDictar = () => {
    if (!SR_API) {
      alert('El reconocimiento de voz no está disponible en este navegador.\nProbá en Chrome o Safari móvil.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR_API();
    rec.lang = 'es-AR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: Event) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ev = e as any;
      const newText = Array.from(ev.results as SpeechRecognitionResultList)
        .slice(ev.resultIndex)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join(' ');
      setForm(prev => ({
        ...prev,
        observaciones: prev.observaciones
          ? `${prev.observaciones} ${newText}`
          : newText,
      }));
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  // ── Fotos ────────────────────────────────────────────────────────
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nuevas: Foto[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await compressImage(file);
      nuevas.push({ id: generateId(), dataUrl, descripcion: '' });
    }
    setFotos(prev => [...prev, ...nuevas]);
  };

  const removePhoto = (id: string) =>
    setFotos(prev => prev.filter(f => f.id !== id));

  // ── Materiales ───────────────────────────────────────────────────
  const addMaterial = () => {
    if (!matForm.nombre.trim()) return;
    setMateriales(prev => [
      ...prev,
      { id: generateId(), ...matForm, nombre: matForm.nombre.trim() },
    ]);
    setMatForm(MAT_FORM_INITIAL);
    setShowMatForm(false);
  };

  const removeMaterial = (id: string) =>
    setMateriales(prev => prev.filter(m => m.id !== id));

  // ── Persistencia ─────────────────────────────────────────────────
  const buildInput = (estado: 'PENDIENTE' | 'FINALIZADO') => ({
    cliente:       form.cliente,
    direccion:     form.direccion,
    contacto:      form.contacto,
    tipos_trabajo: form.tipoTrabajo as string[],
    observaciones: form.observaciones,
    fotos,
    materiales,
    estado,
  });

  const guardar = async () => {
    setSaveStatus('saving');
    try {
      const input = buildInput('PENDIENTE');
      if (supabaseIdRef.current) {
        // Ya fue guardado antes → actualizar
        await relevamientoService.actualizar(supabaseIdRef.current, input);
      } else {
        // Primera vez → crear
        const created = await relevamientoService.crear(input);
        supabaseIdRef.current = created.id;
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NuevoRelevamiento] Error guardando:', msg);
      setSaveError(msg);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  const finalizar = async () => {
    setIsFinishing(true);
    try {
      const input = buildInput('FINALIZADO');
      if (supabaseIdRef.current) {
        await relevamientoService.actualizar(supabaseIdRef.current, input);
      } else {
        const created = await relevamientoService.crear(input);
        supabaseIdRef.current = created.id;
      }
      // TODO (próxima etapa): generar archivo .sln y subirlo al bucket
      navigate('/safelink-note');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NuevoRelevamiento] Error finalizando:', msg);
      setSaveError(msg);
      setIsFinishing(false);
    }
  };

  // ── Fechas formateadas ───────────────────────────────────────────
  const fechaStr = fechaCreacion.current.toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const horaStr = fechaCreacion.current.toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit',
  });

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── ENCABEZADO ── */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/safelink-note')}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerText}>
          <span className={styles.headerTitle}>Nuevo Relevamiento</span>
          <span className={styles.headerSub}>{fechaStr} · {horaStr} hs.</span>
        </div>
      </div>

      {/* ── SECCIÓN 1: DATOS DEL CLIENTE ── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Datos del Cliente</div>
        <input
          className={styles.input}
          placeholder="Cliente / Empresa"
          value={form.cliente}
          onChange={e => updateForm('cliente', e.target.value)}
          autoComplete="organization"
        />
        <input
          className={styles.input}
          placeholder="Dirección"
          value={form.direccion}
          onChange={e => updateForm('direccion', e.target.value)}
          autoComplete="street-address"
        />
        <input
          className={styles.input}
          placeholder="Contacto / Teléfono"
          value={form.contacto}
          onChange={e => updateForm('contacto', e.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
        <div className={styles.fechaRow}>
          <span className={styles.fechaLabel}>📅 Fecha y hora del relevamiento</span>
          <span className={styles.fechaValue}>{fechaStr}, {horaStr} hs.</span>
        </div>
      </section>

      {/* ── SECCIÓN 2: TIPO DE TRABAJO ── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Tipo de Trabajo</div>
        <div className={styles.tipoGrid}>
          {TIPOS.map(t => (
            <button
              key={t.key}
              className={`${styles.tipoBtn} ${form.tipoTrabajo.includes(t.key) ? styles.tipoBtnActive : ''}`}
              onClick={() => toggleTipo(t.key)}
            >
              <span className={styles.tipoEmoji}>{t.emoji}</span>
              <span className={styles.tipoLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN 3: OBSERVACIONES ── */}
      <section className={styles.section}>
        <div className={styles.sectionLabelRow}>
          <span className={styles.sectionLabel}>Observaciones</span>
          <button
            className={`${styles.dictarBtn} ${isListening ? styles.dictarActive : ''}`}
            onClick={handleDictar}
            aria-label={isListening ? 'Detener dictado' : 'Dictar por voz'}
          >
            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            {isListening ? 'Detener' : '🎙 Dictar'}
          </button>
        </div>
        {isListening && (
          <div className={styles.listeningBadge}>
            <span className={styles.listeningDot} />
            Escuchando… hablá con claridad
          </div>
        )}
        <textarea
          className={styles.textarea}
          placeholder="Describí las condiciones, equipos existentes, estado de la instalación…"
          value={form.observaciones}
          onChange={e => updateForm('observaciones', e.target.value)}
          rows={5}
        />
      </section>

      {/* ── SECCIÓN 4: FOTOGRAFÍAS ── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Fotografías</div>
        {/* Inputs ocultos para captura */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className={styles.hiddenInput}
          onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={e => { handleImageFiles(e.target.files); e.target.value = ''; }}
        />
        <div className={styles.fotoActions}>
          <button
            className={styles.fotoBtn}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={16} />
            Tomar foto
          </button>
          <button
            className={styles.fotoBtn}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus size={16} />
            Desde galería
          </button>
        </div>
        {fotos.length > 0 ? (
          <div className={styles.fotoGrid}>
            {fotos.map(f => (
              <div key={f.id} className={styles.fotoThumb}>
                <img src={f.dataUrl} alt="Foto relevamiento" className={styles.thumbImg} />
                <button
                  className={styles.thumbRemove}
                  onClick={() => removePhoto(f.id)}
                  aria-label="Eliminar foto"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyHint}>Sin fotografías. Podés agregar múltiples imágenes.</p>
        )}
      </section>

      {/* ── SECCIÓN 5: MATERIALES / EQUIPOS ── */}
      <section className={styles.section}>
        <div className={styles.sectionLabel}>Materiales / Equipos</div>

        {materiales.length > 0 && (
          <div className={styles.matList}>
            {materiales.map(m => (
              <div key={m.id} className={styles.matCard}>
                <div className={styles.matInfo}>
                  <span className={styles.matNombre}>{m.nombre}</span>
                  <span className={styles.matMeta}>
                    Cant: <strong>{m.cantidad}</strong>
                    {m.costo     ? ` · $${m.costo}`          : ''}
                    {m.observacion ? ` · ${m.observacion}`   : ''}
                  </span>
                </div>
                <button
                  className={styles.matRemoveBtn}
                  onClick={() => removeMaterial(m.id)}
                  aria-label="Eliminar material"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showMatForm ? (
          <div className={styles.matForm}>
            <input
              className={styles.input}
              placeholder="Nombre del material / equipo *"
              value={matForm.nombre}
              onChange={e => setMatForm(p => ({ ...p, nombre: e.target.value }))}
              autoFocus
            />
            <div className={styles.matFormRow}>
              <input
                className={`${styles.input} ${styles.inputHalf}`}
                placeholder="Cantidad"
                type="number"
                min="1"
                inputMode="numeric"
                value={matForm.cantidad}
                onChange={e => setMatForm(p => ({ ...p, cantidad: e.target.value }))}
              />
              <input
                className={`${styles.input} ${styles.inputHalf}`}
                placeholder="Costo est. ($)"
                type="number"
                min="0"
                inputMode="decimal"
                value={matForm.costo}
                onChange={e => setMatForm(p => ({ ...p, costo: e.target.value }))}
              />
            </div>
            <input
              className={styles.input}
              placeholder="Observación (opcional)"
              value={matForm.observacion}
              onChange={e => setMatForm(p => ({ ...p, observacion: e.target.value }))}
            />
            <div className={styles.matFormActions}>
              <button
                className={styles.matCancelBtn}
                onClick={() => { setShowMatForm(false); setMatForm(MAT_FORM_INITIAL); }}
              >
                Cancelar
              </button>
              <button
                className={styles.matAddBtn}
                onClick={addMaterial}
                disabled={!matForm.nombre.trim()}
              >
                <Plus size={14} />
                Agregar
              </button>
            </div>
          </div>
        ) : (
          <button className={styles.addMatBtn} onClick={() => setShowMatForm(true)}>
            <Plus size={16} />
            AGREGAR MATERIAL
          </button>
        )}
      </section>

      {/* ── ACCIONES ── */}
      <div className={styles.actions}>
        {saveStatus === 'saved' && (
          <div className={styles.feedbackOk}>
            <CheckCircle size={14} />
            Guardado correctamente — estado: PENDIENTE
          </div>
        )}
        {saveStatus === 'error' && (
          <div className={styles.feedbackErr}>
            <AlertCircle size={14} />
            <span>{saveError || 'Error al guardar. Revisá la conexión.'}</span>
          </div>
        )}

        <button
          className={styles.btnGuardar}
          onClick={guardar}
          disabled={saveStatus === 'saving' || isFinishing}
        >
          <Save size={17} />
          {saveStatus === 'saving' ? 'Guardando…' : 'GUARDAR'}
        </button>

        <button
          className={styles.btnFinalizar}
          onClick={finalizar}
          disabled={isFinishing || saveStatus === 'saving'}
        >
          <CheckCircle size={17} />
          {isFinishing ? 'Finalizando…' : 'FINALIZAR RELEVAMIENTO'}
        </button>
      </div>

    </div>
  );
}
