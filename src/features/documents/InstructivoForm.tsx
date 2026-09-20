import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { instructivoService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save, Download, QrCode, User, Building2, Globe, List, Camera, Trash2, Plus, Link as LinkIcon } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import { APP_CAMARAS_OPTIONS, TIPO_DISPOSITIVO_OPTIONS, type CamaraItem, getInstructivoCamaras, generatePublicCode, normalizeNombreEnlace } from './constants/instructivoApps';
import styles from './DocForm.module.css';

const instructivoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  titulo: z.string().min(1, 'El título es requerido'),
  nombre_enlace: z.string().optional(),
  app_camaras: z.string().optional().nullable(),
  tipo_dispositivo: z.string().optional().nullable(),
  nombre_app: z.string().optional(),
  texto_descarga: z.string().optional(),
  url_google_play: z.string().optional(),
  url_app_store: z.string().optional(),
  texto_post_instalacion: z.string().optional(),
  nombre_dispositivo: z.string().optional(),
  usuario_dispositivo: z.string().optional(),
  password_dispositivo: z.string().optional(),
  cliente_nombre: z.string().optional(),
  cliente_direccion: z.string().optional(),
  fecha_instalacion: z.string().optional(),
  tecnico_nombre: z.string().optional(),
  url_sitio_web: z.string().optional(),
  telefono_soporte: z.string().optional(),
  email_soporte: z.string().optional(),
  horario_soporte: z.string().optional(),
  numero_serie: z.string().optional(),
});

type InstructivoFormData = z.infer<typeof instructivoSchema>;

interface InstructivoFormProps {
  onBack: () => void;
  editingId: string | null;
}

export function InstructivoForm({ onBack, editingId }: InstructivoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingId;
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditing);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [codigoPublico, setCodigoPublico] = useState(() => generatePublicCode(4));
  const [camaras, setCamaras] = useState<CamaraItem[]>([
    {
      id: 'cam-1',
      nombre: 'Cámara 1',
      qr_image_url: '',
      usuario: 'admin',
      password: '',
    },
  ]);

  const handleAddCamera = () => {
    const nextNum = camaras.length + 1;
    setCamaras(prev => [
      ...prev,
      {
        id: `cam-${Date.now()}-${nextNum}`,
        nombre: `Cámara ${nextNum}`,
        qr_image_url: '',
        usuario: 'admin',
        password: '',
      },
    ]);
  };

  const handleRemoveCamera = (id: string) => {
    if (camaras.length <= 1) return;
    setCamaras(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCamera = (id: string, field: keyof CamaraItem, value: string | null) => {
    setCamaras(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const { data: particulares = [] } = useQuery({ queryKey: ['particulares'], queryFn: particularService.getAll });

  const clienteOptions = [
    {
      groupLabel: 'Consorcios',
      options: consorcios.map(c => ({ label: c.nombre, value: c.id })),
    },
    {
      groupLabel: 'Clientes Privados',
      options: particulares.map(p => ({ label: p.nombre, value: p.id })),
    },
  ];

  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<InstructivoFormData>({
    resolver: zodResolver(instructivoSchema),
    defaultValues: {
      consorcio_id: '',
      titulo: '',
      nombre_enlace: '',
      app_camaras: '',
      tipo_dispositivo: 'XVR',
      nombre_app: 'Easy Viewer',
      texto_descarga: 'Descargue la aplicación desde la tienda correspondiente a su dispositivo.',
      url_google_play: '',
      url_app_store: '',
      texto_post_instalacion: 'Una vez instalada, abra la aplicación.',
      nombre_dispositivo: 'DVR / XVR',
      usuario_dispositivo: '',
      password_dispositivo: '',
      cliente_nombre: '',
      cliente_direccion: '',
      fecha_instalacion: '',
      tecnico_nombre: '',
      url_sitio_web: 'www.safelink.com.ar',
      telefono_soporte: '',
      email_soporte: '',
      horario_soporte: 'Lunes a Viernes de 9:00 a 18:00 hs.',
      numero_serie: '',
    },
  });

  const selectedApp = watch('app_camaras');
  const isEasyViewer = selectedApp === 'easy_viewer_pro';

  const watchedNombreEnlace = watch('nombre_enlace');
  const normalizedSlugName = normalizeNombreEnlace(watchedNombreEnlace || '');
  const previewSlug = normalizedSlugName
    ? `${normalizedSlugName}-${codigoPublico}`
    : `nombre-enlace-${codigoPublico}`;

  useEffect(() => {
    if (selectedApp === 'easy_viewer_pro') {
      const currentNombre = getValues('nombre_app');
      if (!currentNombre || currentNombre === 'Easy Viewer') {
        setValue('nombre_app', 'Easy Viewer Pro');
      }
    }
  }, [selectedApp, setValue, getValues]);

  const { data: instructivos } = useQuery({
    queryKey: ['instructivos'],
    queryFn: instructivoService.getAll,
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && instructivos) {
      const instr = instructivos.find(x => x.id === editingId);
      if (instr) {
        reset({
          consorcio_id: instr.consorcio_id,
          titulo: instr.titulo,
          nombre_enlace: instr.nombre_enlace ?? '',
          app_camaras: instr.app_camaras ?? '',
          tipo_dispositivo: instr.tipo_dispositivo ?? 'XVR',
          nombre_app: instr.nombre_app ?? 'Easy Viewer',
          texto_descarga: instr.texto_descarga ?? '',
          url_google_play: instr.url_google_play ?? '',
          url_app_store: instr.url_app_store ?? '',
          texto_post_instalacion: instr.texto_post_instalacion ?? '',
          nombre_dispositivo: instr.nombre_dispositivo ?? '',
          usuario_dispositivo: instr.usuario_dispositivo ?? '',
          password_dispositivo: instr.password_dispositivo ?? '',
          cliente_nombre: instr.cliente_nombre ?? '',
          cliente_direccion: instr.cliente_direccion ?? '',
          fecha_instalacion: instr.fecha_instalacion ?? '',
          tecnico_nombre: instr.tecnico_nombre ?? '',
          url_sitio_web: instr.url_sitio_web ?? 'www.safelink.com.ar',
          telefono_soporte: instr.telefono_soporte ?? '',
          email_soporte: instr.email_soporte ?? '',
          horario_soporte: instr.horario_soporte ?? 'Lunes a Viernes de 9:00 a 18:00 hs.',
          numero_serie: instr.numero_serie ?? '',
        });
        if (instr.codigo_publico) {
          setCodigoPublico(instr.codigo_publico);
        } else {
          setCodigoPublico(generatePublicCode(4));
        }
        const loadedCamaras = getInstructivoCamaras(instr);
        setCamaras(loadedCamaras);
        setQrImageUrl(loadedCamaras[0]?.qr_image_url ?? '');
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, instructivos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: async (data: InstructivoFormData) => {
      const isEasy = data.app_camaras === 'easy_viewer_pro';
      const primaryCam = camaras[0];

      let finalSlug: string | null = null;
      let finalCode = codigoPublico;
      if (data.nombre_enlace && data.nombre_enlace.trim()) {
        const uniqueRes = await instructivoService.ensureUniqueSlug(
          data.nombre_enlace,
          codigoPublico,
          editingId || undefined
        );
        finalSlug = uniqueRes.public_slug;
        finalCode = uniqueRes.codigo_publico;
      }

      const payload = {
        ...data,
        nombre_enlace: data.nombre_enlace ? normalizeNombreEnlace(data.nombre_enlace) : null,
        codigo_publico: finalCode,
        public_slug: finalSlug,
        fecha_instalacion: data.fecha_instalacion || null,
        app_camaras: data.app_camaras || null,
        tipo_dispositivo: data.tipo_dispositivo || 'XVR',
        camaras: isEasy
          ? camaras
          : (data.nombre_dispositivo || qrImageUrl ? [{
              id: 'cam-1',
              nombre: data.nombre_dispositivo || 'Cámara 1',
              qr_image_url: qrImageUrl,
              usuario: data.usuario_dispositivo || 'admin',
              password: data.password_dispositivo || '',
            }] : []),
        qr_image_url: isEasy ? (primaryCam?.qr_image_url || null) : (qrImageUrl || null),
        nombre_dispositivo: isEasy ? (primaryCam?.nombre || 'DVR / XVR') : (data.nombre_dispositivo || 'DVR / XVR'),
        usuario_dispositivo: isEasy ? (primaryCam?.usuario || 'admin') : (data.usuario_dispositivo || 'admin'),
        password_dispositivo: isEasy ? (primaryCam?.password || '') : (data.password_dispositivo || ''),
      };
      return isEditing
        ? instructivoService.update(editingId!, payload)
        : instructivoService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructivos'] });
      onBack();
    },
  });

  if (!isDataLoaded) return <p className={styles.loading}>Cargando datos...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>Volver</Button>
        <h1>{isEditing ? 'Editar Instructivo' : 'Nuevo Instructivo'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className={styles.form}>

          {/* ── Datos Generales ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Building2 size={16} />
              <span>Datos Generales</span>
            </div>
            <div className={styles.grid2}>
              <Select
                label="Cliente / Consorcio *"
                options={clienteOptions}
                error={errors.consorcio_id?.message}
                {...register('consorcio_id')}
                className={styles.fullWidth}
              />
              <Input
                label="Título del instructivo *"
                placeholder="ej: VISUALIZACIÓN DE CÁMARAS DESDE DISPOSITIVOS MÓVILES"
                error={errors.titulo?.message}
                {...register('titulo')}
                className={styles.fullWidth}
              />
              <Select
                label="Aplicación de cámaras"
                placeholder="Seleccionar aplicación"
                options={APP_CAMARAS_OPTIONS}
                error={errors.app_camaras?.message}
                {...register('app_camaras')}
                className={styles.fullWidth}
              />

              {/* ── Nombre del enlace y Previsualización ── */}
              <div className={styles.fullWidth} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                <Input
                  label="Nombre del enlace"
                  placeholder="ej: JuanBJusto-EVP-21-9-26, CamaraJuan-EVP, CasaPerez-Camaras..."
                  error={errors.nombre_enlace?.message}
                  {...register('nombre_enlace')}
                  className={styles.fullWidth}
                />
                <p className={styles.sectionHint} style={{ margin: 0, fontSize: '0.78rem' }}>
                  Identificador personalizado que formará parte de la URL pública. El sistema normalizará espacios y caracteres incompatibles.
                </p>
                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary, #718096)',
                  marginTop: '0.35rem',
                  background: 'rgba(49, 130, 206, 0.05)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(49, 130, 206, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-primary, #2d3748)' }}>
                      <LinkIcon size={14} style={{ color: '#3182ce' }} />
                      <span>URL pública:</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#4a5568', background: '#e2e8f0', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                      Código aleatorio: <strong>{codigoPublico}</strong>
                    </span>
                  </div>
                  <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: '#3182ce', fontSize: '0.85rem' }}>
                    {typeof window !== 'undefined' ? window.location.origin : 'https://safelinkcloud.online'}/p/instructivo/
                    <strong style={{ color: '#2b6cb0' }}>{previewSlug}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── PASO 1 — Descarga de la aplicación ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Download size={16} />
              <span>Paso 1 — Descarga de la aplicación</span>
            </div>
            <div className={styles.grid2}>
              <Input
                label="Nombre de la aplicación"
                placeholder="ej: Easy Viewer"
                {...register('nombre_app')}
              />
              <Input
                label="URL Google Play"
                placeholder="https://play.google.com/store/apps/..."
                {...register('url_google_play')}
              />
              <Input
                label="URL App Store"
                placeholder="https://apps.apple.com/..."
                {...register('url_app_store')}
              />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>Texto de descarga</label>
              <textarea
                className={styles.textArea}
                rows={3}
                placeholder="Descargue la aplicación desde la tienda correspondiente a su dispositivo."
                {...register('texto_descarga')}
              />
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <label className={styles.textareaLabel}>Texto post-instalación</label>
              <textarea
                className={styles.textArea}
                rows={2}
                placeholder="Una vez instalada, abra la aplicación."
                {...register('texto_post_instalacion')}
              />
            </div>
          </div>

          {isEasyViewer ? (
            <>
              {/* ── PASO 3 — Tipo de dispositivo ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>
                  <List size={16} />
                  <span>Paso 3 — Tipo de dispositivo</span>
                </div>
                <p className={styles.sectionHint}>
                  Seleccione el dispositivo instalado (XVR, NVR o Cámara inalámbrica) que se mostrará en el instructivo.
                </p>
                <div className={styles.grid2}>
                  <Select
                    label="Tipo de dispositivo *"
                    options={TIPO_DISPOSITIVO_OPTIONS as any}
                    error={errors.tipo_dispositivo?.message}
                    {...register('tipo_dispositivo')}
                    className={styles.fullWidth}
                  />
                </div>
              </div>

              {/* ── CÁMARAS ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>
                  <Camera size={16} />
                  <span>Cámaras</span>
                </div>
                <p className={styles.sectionHint}>
                  Agregue cada una de las cámaras que formarán parte del instructivo con su respectivo código QR y credenciales de acceso.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                  {camaras.map((cam, index) => (
                    <div
                      key={cam.id}
                      style={{
                        border: '1px solid var(--glass-border, #e2e8f0)',
                        borderRadius: 'var(--radius-md, 8px)',
                        padding: '1.25rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: 'var(--shadow-light, 0 2px 4px rgba(0,0,0,0.05))',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-color, #3182ce)' }}>
                          CÁMARA {index + 1}
                        </h4>
                        {camaras.length > 1 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRemoveCamera(cam.id)}
                            style={{ color: '#e53e3e', borderColor: '#feb2b2' }}
                          >
                            <Trash2 size={14} style={{ marginRight: '0.25rem' }} />
                            Eliminar cámara
                          </Button>
                        )}
                      </div>

                      <div className={styles.grid2}>
                        <Input
                          label="Nombre de cámara *"
                          placeholder="ej: Cámara de entrada, pasillo, patio..."
                          value={cam.nombre}
                          onChange={e => handleUpdateCamera(cam.id, 'nombre', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={styles.label} style={{ display: 'block', marginBottom: '0.5rem' }}>
                          Código QR:
                        </label>
                        <ImageUploader
                          value={cam.qr_image_url || undefined}
                          onChange={url => handleUpdateCamera(cam.id, 'qr_image_url', url)}
                        />
                      </div>

                      <div className={styles.grid2}>
                        <Input
                          label="Usuario *"
                          placeholder="ej: admin"
                          value={cam.usuario}
                          onChange={e => handleUpdateCamera(cam.id, 'usuario', e.target.value)}
                        />
                        <Input
                          label="Contraseña"
                          placeholder="ej: 123456"
                          value={cam.password}
                          onChange={e => handleUpdateCamera(cam.id, 'password', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddCamera}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <Plus size={16} />
                      + Agregar cámara
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* ── PASO 2 — Código QR ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>
                  <QrCode size={16} />
                  <span>Paso 2 — Código QR del equipo</span>
                </div>
                <p className={styles.sectionHint}>
                  Subí la imagen del código QR que el cliente deberá escanear para agregar el equipo.
                </p>
                <ImageUploader
                  value={qrImageUrl}
                  onChange={url => setQrImageUrl(url)}
                />
                <div style={{ marginTop: '1.25rem' }}>
                  <Input
                    label="Número de Serie (Opcional - para ingreso manual)"
                    placeholder="ej: SN: 1234567890ABC"
                    {...register('numero_serie')}
                  />
                </div>
              </div>

              {/* ── PASO 3 — Tipo de dispositivo ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>
                  <List size={16} />
                  <span>Paso 3 — Tipo de dispositivo</span>
                </div>
                <p className={styles.sectionHint}>
                  Seleccione el dispositivo instalado (XVR, NVR o Cámara inalámbrica) que se mostrará en el instructivo.
                </p>
                <div className={styles.grid2}>
                  <Select
                    label="Tipo de dispositivo *"
                    options={TIPO_DISPOSITIVO_OPTIONS as any}
                    error={errors.tipo_dispositivo?.message}
                    {...register('tipo_dispositivo')}
                    className={styles.fullWidth}
                  />
                </div>
              </div>

              {/* ── PASO 4 — Credenciales del equipo ── */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionTitle}>
                  <User size={16} />
                  <span>Paso 4 — Credenciales del equipo</span>
                </div>
                <div className={styles.grid3}>
                  <Input
                    label="Nombre del dispositivo"
                    placeholder="ej: CASA, DVR / XVR"
                    {...register('nombre_dispositivo')}
                  />
                  <Input
                    label="Usuario"
                    placeholder="ej: propietarios"
                    {...register('usuario_dispositivo')}
                  />
                  <Input
                    label="Contraseña"
                    placeholder="ej: Azul2185.prop"
                    {...register('password_dispositivo')}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── Datos del cliente ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Globe size={16} />
              <span>Datos de la instalación (footer del instructivo)</span>
            </div>
            <div className={styles.grid2}>
              <Input
                label="Nombre del cliente"
                placeholder="ej: Consorcio Edificio Libertad"
                {...register('cliente_nombre')}
              />
              <Input
                label="Dirección"
                placeholder="ej: Av. Corrientes 1234, CABA"
                {...register('cliente_direccion')}
              />
              <Input
                label="Fecha de instalación"
                type="date"
                {...register('fecha_instalacion')}
              />
              <Input
                label="Técnico responsable"
                placeholder="ej: Juan Pérez"
                {...register('tecnico_nombre')}
              />
              <Input
                label="Sitio web (enlace en el pie)"
                placeholder="ej: www.safelink.com.ar"
                {...register('url_sitio_web')}
                className={styles.fullWidth}
              />
            </div>

            {/* Datos de soporte */}
            <div className={styles.grid3} style={{ marginTop: '0.5rem' }}>
              <Input
                label="Teléfono soporte"
                placeholder="ej: 11 1234 5678"
                {...register('telefono_soporte')}
              />
              <Input
                label="Email soporte"
                placeholder="ej: soporte@safelink.com.ar"
                {...register('email_soporte')}
              />
              <Input
                label="Horario de atención"
                placeholder="ej: Lunes a Viernes de 9:00 a 18:00 hs."
                {...register('horario_soporte')}
              />
            </div>
          </div>

          {/* Acciones */}
          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>Cancelar</Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={18} />}
              isLoading={mutation.isPending}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Instructivo'}
            </Button>
          </div>

          {mutation.isError && (
            <p className={styles.errorMsg}>
              Error al guardar: {(mutation.error as any)?.message || 'Error desconocido'}. 
              Verificá que ejecutaste la migración en Supabase.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
