import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FileText,
  User,
  MapPin,
  Phone,
  Calendar,
  Settings,
  Network,
  Lightbulb,
  Zap,
  FileEdit,
  Image as ImageIcon,
  Package,
  Box,
  Check,
  Search,
  ChevronDown,
} from 'lucide-react';
import styles from './NuevoRelevamiento.module.css';
import { relevamientoService } from '@/services/relevamientoService';
import { safeLinkNoteService } from '@/services/safeLinkNoteService';
import { ClienteSelectorModal, type ClienteItem } from './ClienteSelectorModal';
import { ClienteNuevoModal } from './ClienteNuevoModal';

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
const TIPOS: { key: TipoTrabajo; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { key: 'CAMARAS',      label: 'Cámaras',      icon: Camera },
  { key: 'REDES',        label: 'Redes',        icon: Network },
  { key: 'ILUMINACION',  label: 'Iluminación',  icon: Lightbulb },
  { key: 'ELECTRICIDAD', label: 'Electricidad', icon: Zap },
  { key: 'OTRO',         label: 'Otro',         icon: FileText },
];

const MAT_FORM_INITIAL: MatFormData = { nombre: '', cantidad: '1', costo: '', observacion: '' };

// ── Utilidades ─────────────────────────────────────────────────────
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Sanitiza el nombre de archivo .sln elegido por el usuario:
 * - Elimina o reemplaza caracteres no permitidos: / \ : * ? " < > |
 * - Reemplaza espacios por guiones
 * - Elimina acentos y caracteres especiales (normalización Unicode)
 * - Agrega automáticamente la extensión .sln si falta
 * - Si el usuario ya escribió .sln, no duplica la extensión
 * - Previene nombres vacíos
 */
export function sanitizarNombreArchivoSln(nombre: string): string {
  let limpio = nombre.trim();

  // Quitar extensión .sln si ya fue escrita para limpiar el cuerpo
  limpio = limpio.replace(/\.sln$/i, '').trim();

  // Eliminar acentos y tildes
  limpio = limpio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Reemplazar caracteres problemáticos en rutas y sistemas de archivos
  limpio = limpio.replace(/[/\\:*?"<>|]/g, '-');

  // Reemplazar espacios por guiones de forma consistente
  limpio = limpio.replace(/\s+/g, '-');

  // Permitir únicamente caracteres alfanuméricos, guiones y guiones bajos
  limpio = limpio.replace(/[^a-zA-Z0-9_-]/g, '-');

  // Reducir múltiples guiones consecutivos a uno solo
  limpio = limpio.replace(/-+/g, '-');

  // Quitar guiones iniciales o finales
  limpio = limpio.replace(/^-+|-+$/g, '');

  // Si quedó vacío, usar identificador seguro por fecha
  if (!limpio) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    limpio = `SLN-${today}-001`;
  }

  return `${limpio}.sln`;
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

function formatFechaHoraRelevamiento(date: Date): { fechaHeader: string; fechaCampo: string } {
  const diaSemana = date.toLocaleDateString('es-AR', { weekday: 'long' });
  const diaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hh = String(hours).padStart(2, '0');

  const horaFormateada = `${hh}:${minutes} ${ampm} Hs.`;

  return {
    fechaHeader: `${diaCap}, ${dd}/${mm}/${yyyy} · ${horaFormateada}`,
    fechaCampo: `${diaCap}, ${dd}/${mm}/${yyyy}, ${horaFormateada}`,
  };
}

// Acceso a la Web Speech API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR_API: any = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

// ── Componente principal ───────────────────────────────────────────
export function NuevoRelevamiento() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);

  // ID de sesión — null hasta el primer GUARDAR exitoso
  const supabaseIdRef  = useRef<string | null>(null);
  // Fecha fija para mostrar en el encabezado
  const fechaCreacion  = useRef<Date>(new Date());

  // Identificador interno del cliente
  const [clienteId, setClienteId] = useState<string | null>(null);

  // Modales de clientes
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [showClienteNuevo,    setShowClienteNuevo]    = useState(false);

  const [form, setForm] = useState<FormData>({
    cliente: '', direccion: '', contacto: '',
    tipoTrabajo: ['CAMARAS'], observaciones: '',
  });
  const [fotos,      setFotos]      = useState<Foto[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);

  // Carga en modo edición
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);

  // Dictado
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Estado de guardado
  const [saveStatus,   setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError,    setSaveError]    = useState<string>('');
  const [isFinishing,  setIsFinishing]  = useState(false);

  // Modal para confirmar y personalizar el nombre del archivo .sln
  const [showFinalizarModal,    setShowFinalizarModal]    = useState(false);
  const [nombreArchivoInput,     setNombreArchivoInput]     = useState('');
  const [savedFileNameConfirm,  setSavedFileNameConfirm]  = useState<string | null>(null);

  // Formulario de materiales
  const [showMatForm, setShowMatForm] = useState(false);
  const [matForm,     setMatForm]     = useState<MatFormData>(MAT_FORM_INITIAL);

  // Refs para inputs de archivo
  const cameraInputRef  = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Limpiar reconocimiento al desmontar
  useEffect(() => () => recognitionRef.current?.stop(), []);

  // Cargar datos del relevamiento en modo edición
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    setLoadingEdit(true);
    relevamientoService.obtener(editId).then(rel => {
      if (cancelled || !rel) return;
      supabaseIdRef.current = rel.id;
      fechaCreacion.current = rel.created_at ? new Date(rel.created_at) : new Date();
      setForm({
        cliente:       rel.cliente       ?? '',
        direccion:     rel.direccion     ?? '',
        contacto:      rel.contacto      ?? '',
        tipoTrabajo:   (rel.tipos_trabajo ?? []) as TipoTrabajo[],
        observaciones: rel.observaciones ?? '',
      });
      setFotos(rel.fotos       ?? []);
      setMateriales(rel.materiales ?? []);
      setLoadingEdit(false);
    }).catch(() => {
      if (!cancelled) setLoadingEdit(false);
    });
    return () => { cancelled = true; };
  }, [editId]);

  // ── Helpers de form ────────────────────────────────────────────────
  const updateForm = (field: keyof Omit<FormData, 'tipoTrabajo'>, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleTipo = (tipo: TipoTrabajo) =>
    setForm(prev => ({
      ...prev,
      tipoTrabajo: prev.tipoTrabajo.includes(tipo)
        ? prev.tipoTrabajo.filter(t => t !== tipo)
        : [...prev.tipoTrabajo, tipo],
    }));

  const handleSelectCliente = (item: ClienteItem) => {
    setClienteId(item.id);
    setForm(prev => ({
      ...prev,
      cliente: item.nombre,
      direccion: item.direccion || prev.direccion,
      contacto: item.contacto || prev.contacto,
    }));
  };

  // ── Dictado de voz ─────────────────────────────────────────────────
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

  // ── Fotos ──────────────────────────────────────────────────────────
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

  // ── Materiales ─────────────────────────────────────────────────────
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

  // ── Persistencia ───────────────────────────────────────────────────
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
        await relevamientoService.actualizar(supabaseIdRef.current, input);
      } else {
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

  // Generación de nombre sugerido: SLN-YYYYMMDD-NNN-CLIENTE
  const generarNombreSugerido = async (): Promise<string> => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fecha = `${yyyy}${mm}${dd}`;

    let correlativo = '001';
    try {
      const total = await relevamientoService.contarTotal();
      correlativo = String(total + 1).padStart(3, '0');
    } catch {
      correlativo = '001';
    }

    let clienteSlug = 'Relevamiento';
    if (form.cliente.trim()) {
      clienteSlug = form.cliente
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    return `SLN-${fecha}-${correlativo}-${clienteSlug || 'Relevamiento'}`;
  };

  const handleAbrirFinalizar = async () => {
    setIsFinishing(true);
    try {
      const sugerido = await generarNombreSugerido();
      setNombreArchivoInput(sugerido);
      setShowFinalizarModal(true);
    } catch (err) {
      console.error('Error generando nombre sugerido:', err);
      setNombreArchivoInput(`SLN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-001-Relevamiento`);
      setShowFinalizarModal(true);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleConfirmarFinalizar = async () => {
    setIsFinishing(true);
    setSaveError('');
    try {
      const finalFileName = sanitizarNombreArchivoSln(nombreArchivoInput);

      // Generar contenido del archivo .sln manteniendo formato y guardando identificador interno
      const slnData = {
        inspection: {
          client_id: clienteId || null,
          client_name: form.cliente || '',
          address: form.direccion || '',
          contact: form.contacto || '',
          date: fechaCreacion.current.getTime(),
          code: finalFileName.replace(/\.sln$/i, ''),
          work_types: form.tipoTrabajo,
          notes: form.observaciones || '',
          materials: materiales,
          photos_count: fotos.length,
        },
      };
      const slnJson = JSON.stringify(slnData, null, 2);

      // 1. Subir archivo .sln al bucket 'exports' con el nombre visible elegido
      await safeLinkNoteService.uploadSlnFile(finalFileName, slnJson);

      // 2. Guardar / actualizar en base de datos con sln_path y estado FINALIZADO
      const input = {
        ...buildInput('FINALIZADO'),
        sln_path: finalFileName,
      };

      if (supabaseIdRef.current) {
        await relevamientoService.actualizar(supabaseIdRef.current, input);
      } else {
        const created = await relevamientoService.crear(input);
        supabaseIdRef.current = created.id;
      }

      // 3. Cerrar modal y mostrar confirmación con el nombre guardado
      setShowFinalizarModal(false);
      setSavedFileNameConfirm(finalFileName);

      // 4. Redireccionar tras confirmación
      setTimeout(() => {
        navigate('/safelink-note');
      }, 2500);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[NuevoRelevamiento] Error guardando relevamiento:', msg);
      setSaveError(msg);
      alert(`Error al guardar el relevamiento: ${msg}`);
    } finally {
      setIsFinishing(false);
    }
  };

  const { fechaHeader, fechaCampo } = formatFechaHoraRelevamiento(fechaCreacion.current);

  // ── Render ─────────────────────────────────────────────────────────
  if (loadingEdit) {
    return (
      <div className={styles.page} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
          <div className={styles.spinner} />
          <span style={{ fontSize: '0.95rem' }}>Cargando relevamiento…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ═══════════════════════════════════════════════
            1. HEADER
        ═══════════════════════════════════════════════ */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.backBtn}
              onClick={() => navigate('/safelink-note')}
              aria-label="Volver"
              type="button"
            >
              <ArrowLeft size={19} />
            </button>
            <div className={styles.headerIconBadge}>
              <FileText size={22} />
            </div>
            <div className={styles.headerText}>
              <h1 className={styles.headerTitle}>
                {isEditMode ? 'Editar Relevamiento' : 'Nuevo Relevamiento'}
              </h1>
              <span className={styles.headerSub}>
                {fechaHeader}
              </span>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════
            2. DATOS DEL CLIENTE
        ═══════════════════════════════════════════════ */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <User size={18} />
            </div>
            <h2 className={styles.cardTitle}>Datos del cliente</h2>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.datosClienteGrid}>

              {/* Selector de Cliente / Empresa */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <User size={14} className={styles.fieldLabelIcon} />
                  <span>Cliente / Empresa</span>
                </label>
                <button
                  type="button"
                  className={styles.clientSelectorTrigger}
                  onClick={() => setShowClienteSelector(true)}
                >
                  <div className={styles.clientSelectorTriggerLeft}>
                    <Search size={16} className={styles.triggerSearchIcon} />
                    <span className={form.cliente ? styles.triggerTextSelected : styles.triggerTextPlaceholder}>
                      {form.cliente || 'Seleccionar cliente...'}
                    </span>
                  </div>
                  <ChevronDown size={16} className={styles.triggerChevron} />
                </button>
              </div>

              {/* Dirección */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <MapPin size={14} className={styles.fieldLabelIcon} />
                  <span>Dirección</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin size={16} className={styles.inputIcon} />
                  <input
                    className={styles.inputWithIcon}
                    placeholder="Calle, número, localidad"
                    value={form.direccion}
                    onChange={e => updateForm('direccion', e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* Contacto / Teléfono */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <Phone size={14} className={styles.fieldLabelIcon} />
                  <span>Contacto / Teléfono</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Phone size={16} className={styles.inputIcon} />
                  <input
                    className={styles.inputWithIcon}
                    placeholder="Nombre y teléfono de contacto"
                    value={form.contacto}
                    onChange={e => updateForm('contacto', e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Fecha y hora del relevamiento */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <Calendar size={14} className={styles.fieldLabelIcon} />
                  <span>Fecha y hora del relevamiento</span>
                </label>
                <div className={styles.fechaHoraCard}>
                  <div className={styles.fechaHoraLeft}>
                    <Calendar size={18} className={styles.fechaHoraMainIcon} />
                    <div className={styles.fechaHoraTexts}>
                      <span className={styles.fechaHoraLabel}>Fecha y hora del relevamiento</span>
                      <span className={styles.fechaHoraVal}>{fechaCampo}</span>
                    </div>
                  </div>
                  <Calendar size={15} className={styles.fechaHoraRightIcon} />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            3. TIPO DE TRABAJO
        ═══════════════════════════════════════════════ */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderIcon}>
              <Settings size={18} />
            </div>
            <div className={styles.cardHeaderTitles}>
              <h2 className={styles.cardTitle}>Tipo de trabajo</h2>
              <span className={styles.cardSubtitle}>
                Seleccioná el tipo de trabajo que vas a realizar
              </span>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.tipoGrid}>
              {TIPOS.map(t => {
                const IconComponent = t.icon;
                const active = form.tipoTrabajo.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`${styles.tipoCard} ${active ? styles.tipoCardActive : ''}`}
                    onClick={() => toggleTipo(t.key)}
                    aria-pressed={active}
                  >
                    <div className={styles.tipoCardLeft}>
                      <IconComponent size={20} className={styles.tipoCardIcon} />
                      <span className={styles.tipoCardLabel}>{t.label}</span>
                    </div>
                    <div className={`${styles.tipoCardRadio} ${active ? styles.tipoCardRadioActive : ''}`}>
                      {active && <Check size={13} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            4. OBSERVACIONES
        ═══════════════════════════════════════════════ */}
        <section className={styles.card}>
          <div className={styles.cardHeaderBetween}>
            <div className={styles.cardHeaderLeftGroup}>
              <div className={styles.cardHeaderIcon}>
                <FileEdit size={18} />
              </div>
              <h2 className={styles.cardTitle}>Observaciones</h2>
            </div>
            <button
              type="button"
              className={`${styles.dictarBtn} ${isListening ? styles.dictarActive : ''}`}
              onClick={handleDictar}
              aria-label={isListening ? 'Detener dictado' : 'Dictar observaciones'}
            >
              {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{isListening ? 'Detener' : 'Dictar'}</span>
            </button>
          </div>

          <div className={styles.cardBody}>
            {isListening && (
              <div className={styles.listeningBadge}>
                <span className={styles.listeningDot} />
                <span>Escuchando… hablacon claridad</span>
              </div>
            )}
            <textarea
              className={styles.textarea}
              placeholder="Describí las condiciones, equipos existentes, estado de la instalación..."
              value={form.observaciones}
              onChange={e => updateForm('observaciones', e.target.value)}
              rows={4}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            5. FOTOGRAFÍAS
        ═══════════════════════════════════════════════ */}
        <section className={styles.card}>
          <div className={styles.cardHeaderBetween}>
            <div className={styles.cardHeaderLeftGroup}>
              <div className={styles.cardHeaderIcon}>
                <ImageIcon size={18} />
              </div>
              <h2 className={styles.cardTitle}>Fotografías</h2>
            </div>
            <span className={styles.badgeCount}>
              {fotos.length} {fotos.length === 1 ? 'imagen' : 'imágenes'}
            </span>
          </div>

          <div className={styles.cardBody}>
            {/* Inputs ocultos de archivo */}
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

            {fotos.length === 0 ? (
              <div className={styles.fotoDropZone}>
                <div className={styles.fotoDropCameraIcon}>
                  <Camera size={34} strokeWidth={1.6} />
                </div>
                <h3 className={styles.fotoDropTitle}>Agregar fotografías</h3>
                <p className={styles.fotoDropSubtitle}>
                  Podés tomar fotos o seleccionar desde la galería
                </p>
                <div className={styles.fotoDropButtons}>
                  <button
                    type="button"
                    className={styles.fotoBtnPrimary}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={16} />
                    <span>Tomar foto</span>
                  </button>
                  <button
                    type="button"
                    className={styles.fotoBtnSecondary}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus size={16} />
                    <span>Desde galería</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.fotoContentBox}>
                <div className={styles.fotoGrid}>
                  {fotos.map(f => (
                    <div key={f.id} className={styles.fotoThumb}>
                      <img src={f.dataUrl} alt="Foto relevamiento" className={styles.thumbImg} />
                      <button
                        type="button"
                        className={styles.thumbRemove}
                        onClick={() => removePhoto(f.id)}
                        aria-label="Eliminar foto"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.fotoAddMoreRow}>
                  <button
                    type="button"
                    className={styles.fotoBtnPrimary}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera size={15} />
                    <span>Tomar foto</span>
                  </button>
                  <button
                    type="button"
                    className={styles.fotoBtnSecondary}
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    <ImagePlus size={15} />
                    <span>Desde galería</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            6. MATERIALES / EQUIPOS
        ═══════════════════════════════════════════════ */}
        <section className={styles.card}>
          <div className={styles.cardHeaderBetween}>
            <div className={styles.cardHeaderLeftGroup}>
              <div className={styles.cardHeaderIcon}>
                <Package size={18} />
              </div>
              <h2 className={styles.cardTitle}>Materiales / Equipos</h2>
            </div>
            <button
              type="button"
              className={styles.btnHeaderAction}
              onClick={() => setShowMatForm(true)}
            >
              <Plus size={15} />
              <span>Agregar material</span>
            </button>
          </div>

          <div className={styles.cardBody}>
            {materiales.length > 0 && (
              <div className={styles.matList}>
                {materiales.map(m => (
                  <div key={m.id} className={styles.matCard}>
                    <div className={styles.matIconBox}>
                      <Package size={16} />
                    </div>
                    <div className={styles.matInfo}>
                      <span className={styles.matNombre}>{m.nombre}</span>
                      <span className={styles.matMeta}>
                        Cant: <strong>{m.cantidad}</strong>
                        {m.costo ? ` · $${m.costo}` : ''}
                        {m.observacion ? ` · ${m.observacion}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.matRemoveBtn}
                      onClick={() => removeMaterial(m.id)}
                      aria-label="Eliminar material"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showMatForm ? (
              <div className={styles.matFormCard}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nombre del material o equipo *</label>
                  <input
                    className={styles.input}
                    placeholder="Ej: Cable UTP Cat6, Switch 8 puertos..."
                    value={matForm.nombre}
                    onChange={e => setMatForm(p => ({ ...p, nombre: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className={styles.matFormRow}>
                  <div className={styles.fieldGroup} style={{ flex: 1 }}>
                    <label className={styles.fieldLabel}>Cantidad</label>
                    <input
                      className={styles.input}
                      placeholder="1"
                      type="number"
                      min="1"
                      value={matForm.cantidad}
                      onChange={e => setMatForm(p => ({ ...p, cantidad: e.target.value }))}
                    />
                  </div>
                  <div className={styles.fieldGroup} style={{ flex: 1 }}>
                    <label className={styles.fieldLabel}>Costo aprox. ($)</label>
                    <input
                      className={styles.input}
                      placeholder="0"
                      type="number"
                      min="0"
                      value={matForm.costo}
                      onChange={e => setMatForm(p => ({ ...p, costo: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Observación (opcional)</label>
                  <input
                    className={styles.input}
                    placeholder="Detalles técnicos, ubicación..."
                    value={matForm.observacion}
                    onChange={e => setMatForm(p => ({ ...p, observacion: e.target.value }))}
                  />
                </div>
                <div className={styles.matFormActions}>
                  <button
                    type="button"
                    className={styles.matCancelBtn}
                    onClick={() => { setShowMatForm(false); setMatForm(MAT_FORM_INITIAL); }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.matAddBtn}
                    onClick={addMaterial}
                    disabled={!matForm.nombre.trim()}
                  >
                    <Plus size={14} />
                    <span>Guardar material</span>
                  </button>
                </div>
              </div>
            ) : materiales.length === 0 ? (
              <div className={styles.matEmptyBox}>
                <div className={styles.matEmptyIcon}>
                  <Box size={28} strokeWidth={1.5} />
                </div>
                <span className={styles.matEmptyTitle}>
                  Aún no hay materiales o equipos agregados
                </span>
                <span className={styles.matEmptySubtitle}>
                  Tocá en "Agregar material" para sumar elementos.
                </span>
              </div>
            ) : null}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            7. ACCIONES FINALES
        ═══════════════════════════════════════════════ */}
        <div className={styles.finalActionsSection}>
          {saveStatus === 'saved' && (
            <div className={styles.feedbackOk}>
              <CheckCircle size={15} />
              <span>Guardado correctamente — estado: PENDIENTE</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className={styles.feedbackErr}>
              <AlertCircle size={15} />
              <span>{saveError || 'Error al guardar. Revisá la conexión.'}</span>
            </div>
          )}

          <div className={styles.finalButtonsRow}>
            <button
              type="button"
              className={styles.btnGuardarRelevamiento}
              onClick={guardar}
              disabled={saveStatus === 'saving' || isFinishing}
            >
              <Save size={18} />
              <span>{saveStatus === 'saving' ? 'GUARDANDO…' : 'GUARDAR RELEVAMIENTO'}</span>
            </button>

            <button
              type="button"
              className={styles.btnFinalizarRelevamiento}
              onClick={handleAbrirFinalizar}
              disabled={isFinishing || saveStatus === 'saving'}
            >
              <Check size={18} strokeWidth={2.8} />
              <span>{isFinishing ? 'PREPARANDO…' : 'FINALIZAR RELEVAMIENTO'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── SELECTOR DE CLIENTE (MODAL) ── */}
      <ClienteSelectorModal
        isOpen={showClienteSelector}
        onClose={() => setShowClienteSelector(false)}
        onSelect={handleSelectCliente}
        onOpenCreate={() => setShowClienteNuevo(true)}
        selectedId={clienteId}
      />

      {/* ── CREAR NUEVO CLIENTE (MODAL) ── */}
      <ClienteNuevoModal
        isOpen={showClienteNuevo}
        onClose={() => setShowClienteNuevo(false)}
        onCreated={handleSelectCliente}
      />

      {/* ── MODAL: GUARDAR RELEVAMIENTO (.SLN) ── */}
      {showFinalizarModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconBox}>
                <FileText size={20} />
              </div>
              <span className={styles.modalTitle}>GUARDAR RELEVAMIENTO</span>
            </div>

            <div className={styles.modalBody}>
              <label className={styles.modalFieldLabel} htmlFor="sln-filename-input">
                Nombre del archivo .SLN
              </label>
              <input
                id="sln-filename-input"
                className={styles.modalInput}
                value={nombreArchivoInput}
                onChange={e => setNombreArchivoInput(e.target.value)}
                placeholder="SLN-YYYYMMDD-NNN-CLIENTE"
                autoFocus
              />
              <div className={styles.modalPreviewText}>
                <span>Nombre final:</span>
                <strong>{sanitizarNombreArchivoSln(nombreArchivoInput)}</strong>
              </div>
              <p className={styles.modalHint}>
                Elija un nombre que permita identificar fácilmente este relevamiento.
              </p>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.modalBtnCancel}
                onClick={() => setShowFinalizarModal(false)}
                disabled={isFinishing}
              >
                CANCELAR
              </button>
              <button
                type="button"
                className={styles.modalBtnSave}
                onClick={handleConfirmarFinalizar}
                disabled={isFinishing || !nombreArchivoInput.trim()}
              >
                <Save size={15} />
                <span>{isFinishing ? 'GUARDANDO…' : 'GUARDAR'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMACIÓN DE GUARDADO (.SLN) ── */}
      {savedFileNameConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <div className={styles.confirmIconSuccess}>
              <CheckCircle size={34} />
            </div>
            <div className={styles.confirmTitle}>¡Relevamiento Guardado!</div>
            <p className={styles.confirmSubtitle}>
              El archivo .sln fue generado y almacenado exitosamente:
            </p>
            <div className={styles.confirmFileBox}>
              {savedFileNameConfirm}
            </div>
            <span className={styles.confirmRedirectHint}>
              Redirigiendo a SafeLink Note…
            </span>
            <button
              type="button"
              className={styles.modalBtnSave}
              onClick={() => navigate('/safelink-note')}
            >
              ACEPTAR
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
export default NuevoRelevamiento;
