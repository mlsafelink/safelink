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
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const reporteSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  motivo: z.string().optional(),
  descripcion: z.string().optional(),
  diagnostico: z.string().optional(),
  trabajo_realizado: z.string().optional(),
  recomendaciones: z.string().optional(),
  conclusiones: z.string().optional(),
  observaciones: z.string().optional(),
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
      consorcio_id: '', fecha: new Date().toISOString().split('T')[0],
      titulo: '', motivo: '', descripcion: '', diagnostico: '',
      trabajo_realizado: '', recomendaciones: '', conclusiones: '', observaciones: '',
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
          motivo: reporte.motivo || '',
          descripcion: reporte.descripcion || '',
          diagnostico: reporte.diagnostico || '',
          trabajo_realizado: reporte.trabajo_realizado || '',
          recomendaciones: reporte.recomendaciones || '',
          conclusiones: reporte.conclusiones || '',
          observaciones: reporte.observaciones || '',
        });
        setFotografias(reporte.fotografias || []);
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, reportes, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (data: ReporteFormData) =>
      isEditing
        ? reporteService.update(editingId!, { ...data, fotografias })
        : reporteService.create({ ...data, fotografias }),
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
          <div className={styles.grid2}>
            <Select label="Consorcio *" options={consorcioOptions} error={errors.consorcio_id?.message} {...register('consorcio_id')} className={styles.fullWidth} />
            <Input label="Fecha *" type="date" error={errors.fecha?.message} {...register('fecha')} />
            <Input label="Título *" placeholder="Título del reporte" error={errors.titulo?.message} {...register('titulo')} className={styles.fullWidth} />
          </div>

          <div className={styles.fieldList}>
            {([
              { name: 'motivo', label: 'Motivo' },
              { name: 'descripcion', label: 'Descripción' },
              { name: 'diagnostico', label: 'Diagnóstico' },
              { name: 'trabajo_realizado', label: 'Trabajo Realizado' },
              { name: 'recomendaciones', label: 'Recomendaciones' },
              { name: 'conclusiones', label: 'Conclusiones' },
              { name: 'observaciones', label: 'Observaciones' },
            ] as { name: keyof ReporteFormData; label: string }[]).map(field => (
              <div key={field.name} className={styles.fieldGroup}>
                <label className={styles.label}>{field.label}</label>
                <textarea
                  className={styles.textArea}
                  rows={3}
                  placeholder={`${field.label}...`}
                  {...register(field.name)}
                />
              </div>
            ))}
          </div>

          {/* Fotografías */}
          <div className={styles.section}>
            <label className={styles.label}>Fotografías del Reporte</label>
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

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>Cancelar</Button>
            <Button type="submit" variant="primary" leftIcon={<Save size={18} />} isLoading={mutation.isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Reporte'}
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Error al guardar. Verifique los datos.</p>}
        </form>
      </Card>
    </div>
  );
}
