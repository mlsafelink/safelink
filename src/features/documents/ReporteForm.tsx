import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { reporteService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, Trash2, ClipboardList, FileText,
  Cpu, Eye, AlertTriangle, CheckSquare, Camera, Globe,
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const STEPS = [
  { id: 'descripcion',         label: 'Situación',     icon: FileText },
  { id: 'equipo',              label: 'Equipo',        icon: Cpu },
  { id: 'inspeccion',         label: 'Inspección',    icon: Eye },
  { id: 'diagnostico',        label: 'Diagnóstico',   icon: AlertTriangle },
  { id: 'recomendaciones',    label: 'Recomend.',     icon: CheckSquare },
  { id: 'fotos',              label: 'Fotos',         icon: Camera },
  { id: 'soporte',            label: 'Soporte',       icon: Globe },
];

const reporteSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  equipo_relevado: z.string().optional(),
  inspeccion_realizada: z.string().optional(),
  diagnostico: z.string().optional(),
  recomendaciones: z.string().optional(),
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
  const [activeStep, setActiveStep] = useState('descripcion');

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares'],
    queryFn: particularService.getAll,
  });

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
      url_sitio_web: 'instagram.com/ml.safelink',
      telefono_soporte: '11 1234 5678',
      email_soporte: 'soporte@safelink.com.ar',
      horario_soporte: 'Lunes a Viernes de 9:00 a 18:00 hs.',
    },
  });

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
          url_sitio_web: reporte.url_sitio_web || 'instagram.com/ml.safelink',
          telefono_soporte: reporte.telefono_soporte || '11 1234 5678',
          email_soporte: reporte.email_soporte || 'soporte@safelink.com.ar',
          horario_soporte: reporte.horario_soporte || 'Lunes a Viernes de 9:00 a 18:00 hs.',
        });
        setFotografias(reporte.fotografias || []);
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, reportes, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (data: ReporteFormData) => {
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
                label="Cliente / Consorcio *"
                options={clienteOptions}
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

          {/* ── MARCADOR DE SECCIONES ── */}
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', marginLeft: '0.25rem' }}>
              Estás completando:
            </p>
            <div className={styles.stepIndicator}>
              {STEPS.map(step => {
                const Icon = step.icon;
                const isActive = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''}`}
                    title={step.label}
                  >
                    <Icon size={14} className={styles.stepItemIcon} />
                    <span className={styles.stepItemLabel}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Desarrollo del Reporte ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <FileText size={16} />
              <span>Desarrollo del Reporte</span>
            </div>

            <div>
              <label className={styles.textareaLabel}>SECCIÓN 1 — Descripción de la situación</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Escriba la descripción de la situación encontrada..."
                {...register('descripcion')}
                onFocus={() => setActiveStep('descripcion')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 2 — Equipo relevado</label>
              <textarea
                className={styles.textArea}
                rows={3}
                placeholder="Detalle los equipos encontrados (marca, modelo, estado)..."
                {...register('equipo_relevado')}
                onFocus={() => setActiveStep('equipo')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 3 — Inspección realizada</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Detalle las pruebas e inspecciones llevadas a cabo..."
                {...register('inspeccion_realizada')}
                onFocus={() => setActiveStep('inspeccion')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 4 — Diagnóstico</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Conclusión técnica sobre la situación encontrada..."
                {...register('diagnostico')}
                onFocus={() => setActiveStep('diagnostico')}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 5 — Recomendaciones</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="• Una recomendación por línea&#10;• Agregar bullet • al inicio de cada una"
                {...register('recomendaciones')}
                onFocus={() => setActiveStep('recomendaciones')}
              />
              <p className={styles.sectionHint} style={{ marginTop: '0.4rem' }}>
                Usá "•" al inicio de cada línea para mostrarlas como viñetas en el reporte.
              </p>
            </div>
          </div>

          {/* ── Fotografías ── */}
          <div className={styles.sectionBlock} onFocus={() => setActiveStep('fotos')}>
            <div className={styles.sectionTitle}>
              <Camera size={16} />
              <span>Registro Fotográfico</span>
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
            <div style={{ maxWidth: '400px', marginTop: '0.5rem' }}>
              <ImageUploader
                onChange={(url) => url && setFotografias(prev => [...prev, url])}
                label="Agregar fotografía de evidencia"
              />
            </div>
          </div>

          {/* ── Datos de Soporte (¿Necesita ayuda?) ── */}
          <div className={styles.sectionBlock} onFocus={() => setActiveStep('soporte')}>
            <div className={styles.sectionTitle}>
              <Globe size={16} />
              <span>Datos de contacto — ¿Necesita ayuda? (aparece en el pie del reporte)</span>
            </div>
            <div className={styles.grid3}>
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
            <Input
              label="Sitio web (enlace en el pie)"
              placeholder="ej: www.safelink.com.ar"
              {...register('url_sitio_web')}
            />
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
