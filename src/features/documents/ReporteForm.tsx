import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { reporteService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save, Trash2, ClipboardList, Info, Shield, Globe } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const reporteSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(), // Descripción de la situación
  equipo_relevado: z.string().optional(),
  inspeccion_realizada: z.string().optional(),
  diagnostico: z.string().optional(),
  recomendaciones: z.string().optional(),
  cliente_nombre: z.string().optional(),
  cliente_direccion: z.string().optional(),
  fecha_instalacion: z.string().optional(),
  tecnico_nombre: z.string().optional(),
  url_sitio_web: z.string().optional(),
  telefono_soporte: z.string().optional(),
  email_soporte: z.string().optional(),
  horario_soporte: z.string().optional(),
});

type ReporteFormData = z.infer<typeof reporteSchema>;

interface ReporteFormProps {
  onBack: () => void;
  editingId: string | null;
}

export function ReporteForm({ onBack, editingId }: ReporteFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingId;
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditing);
  const [fotografias, setFotografias] = useState<string[]>([]);

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const consorcioOptions = consorcios.map(c => ({ label: c.nombre, value: c.id }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      consorcio_id: '',
      fecha: new Date().toISOString().split('T')[0],
      titulo: '',
      descripcion: '',
      equipo_relevado: '',
      inspeccion_realizada: '',
      diagnostico: '',
      recomendaciones: '• Mantener el equipo en un área ventilada y limpia.\n• No compartir credenciales con terceros.\n• Realizar mantenimientos preventivos trimestrales.',
      cliente_nombre: '',
      cliente_direccion: '',
      fecha_instalacion: '',
      tecnico_nombre: '',
      url_sitio_web: 'www.safelink.com.ar',
      telefono_soporte: '',
      email_soporte: '',
      horario_soporte: 'Lunes a Viernes de 9:00 a 18:00 hs.',
    },
  });

  // Cargar datos para edición
  const { data: reportes } = useQuery({
    queryKey: ['reportes'],
    queryFn: reporteService.getAll,
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && reportes) {
      const reporte = reportes.find(r => r.id === editingId);
      if (reporte) {
        reset({
          consorcio_id: reporte.consorcio_id,
          fecha: reporte.fecha,
          titulo: reporte.titulo,
          descripcion: reporte.descripcion || '',
          equipo_relevado: reporte.equipo_relevado || '',
          inspeccion_realizada: reporte.inspeccion_realizada || '',
          diagnostico: reporte.diagnostico || '',
          recomendaciones: reporte.recomendaciones || '',
          cliente_nombre: reporte.cliente_nombre || '',
          cliente_direccion: reporte.cliente_direccion || '',
          fecha_instalacion: reporte.fecha_instalacion || '',
          tecnico_nombre: reporte.tecnico_nombre || '',
          url_sitio_web: reporte.url_sitio_web || 'www.safelink.com.ar',
          telefono_soporte: reporte.telefono_soporte || '',
          email_soporte: reporte.email_soporte || '',
          horario_soporte: reporte.horario_soporte || 'Lunes a Viernes de 9:00 a 18:00 hs.',
        });
        setFotografias(reporte.fotografias || []);
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, reportes, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (data: ReporteFormData & { fotografias?: string[] }) => {
      const payload = { ...data, fotografias };
      return isEditing
        ? reporteService.update(editingId!, payload)
        : reporteService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      onBack();
    },
  });

  if (!isDataLoaded) return <p className={styles.loading}>Cargando datos...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>Volver</Button>
        <h1>{isEditing ? 'Editar Reporte Técnico' : 'Nuevo Reporte Técnico'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className={styles.form}>
          
          {/* ── Datos Generales ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <ClipboardList size={16} />
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
                label="Fecha *"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />
              <Input
                label="Título del Reporte *"
                placeholder="ej: RELEVAMIENTO TÉCNICO Y CONTROL DE ACCESO"
                error={errors.titulo?.message}
                {...register('titulo')}
                className={styles.fullWidth}
              />
            </div>
          </div>

          {/* ── Desarrollo del Reporte (Cards) ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Info size={16} />
              <span>Desarrollo del Reporte</span>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <label className={styles.textareaLabel}>1. Descripción de la situación</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Escriba la descripción..."
                {...register('descripcion')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>2. Equipo relevado</label>
              <textarea
                className={styles.textArea}
                rows={3}
                placeholder="Detalle de los equipos encontrados..."
                {...register('equipo_relevado')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>3. Inspección realizada</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Detalle de las pruebas e inspecciones hechas..."
                {...register('inspeccion_realizada')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>4. Diagnóstico</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Diagnóstico de la situación/problema..."
                {...register('diagnostico')}
              />
            </div>
          </div>

          {/* ── Fotografías ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Shield size={16} />
              <span>Fotografías del Reporte</span>
            </div>
            {fotografias.length > 0 && (
              <div className={styles.imageGrid}>
                {fotografias.map((url, index) => (
                  <div key={index} className={styles.imageItem}>
                    <img src={url} alt={`Foto ${index + 1}`} className={styles.imageItemPreview} />
                    <button
                      type="button"
                      className={styles.imageRemoveBtn}
                      onClick={() => setFotografias(prev => prev.filter((_, i) => i !== index))}
                      title="Eliminar foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ maxWidth: '400px', marginTop: '1rem' }}>
              <ImageUploader
                onChange={(url) => url && setFotografias(prev => [...prev, url])}
                label="Agregar fotografía"
              />
            </div>
          </div>

          {/* ── Datos de la instalación y Recomendaciones ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <Globe size={16} />
              <span>Datos del Footer y Recomendaciones</span>
            </div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label className={styles.textareaLabel}>Recomendaciones (se mostrarán como viñetas en el pie)</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Ingrese una recomendación por línea..."
                {...register('recomendaciones')}
              />
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
            <div className={styles.grid3} style={{ marginTop: '0.75rem' }}>
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
              {isEditing ? 'Guardar Cambios' : 'Crear Reporte'}
            </Button>
          </div>
          {mutation.isError && (
            <p className={styles.errorMsg}>
              Error al guardar: {(mutation.error as any)?.message || 'Error desconocido'}. 
              Verifique los datos e intente de nuevo.
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
