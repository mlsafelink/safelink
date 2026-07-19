import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { instructivoService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save, Download, QrCode, User, Building2, Globe } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const instructivoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  titulo: z.string().min(1, 'El título es requerido'),
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
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const consorcioOptions = consorcios.map(c => ({ label: c.nombre, value: c.id }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstructivoFormData>({
    resolver: zodResolver(instructivoSchema),
    defaultValues: {
      consorcio_id: '',
      titulo: '',
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
        setQrImageUrl(instr.qr_image_url ?? '');
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, instructivos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (data: InstructivoFormData & { qr_image_url?: string | null }) => {
      const payload = { ...data, qr_image_url: qrImageUrl || null };
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
                label="Consorcio *"
                options={consorcioOptions}
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
