import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, FileText, DollarSign,
  AlertCircle, Info, FileSpreadsheet, Globe, ClipboardList
} from 'lucide-react';
import styles from './DocForm.module.css';

const STEPS = [
  { id: 'descripcion', label: 'Descripción', icon: FileText },
  { id: 'monto', label: 'Monto', icon: DollarSign },
  { id: 'condiciones', label: 'Condiciones', icon: AlertCircle },
  { id: 'observaciones', label: 'Observaciones', icon: Info },
  { id: 'soporte', label: 'Soporte', icon: Globe },
];

const presupuestoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  titulo: z.string().min(1, 'El título es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  validez: z.string().optional(),
  garantia: z.string().optional(),
  descripcion: z.string().optional(),
  total: z.string().min(1, 'El monto total es requerido'),
  condiciones: z.string().optional(),
  observaciones: z.string().optional(),
  url_sitio_web: z.string().optional(),
  telefono_soporte: z.string().optional(),
  email_soporte: z.string().optional(),
  horario_soporte: z.string().optional(),
});

type PresupuestoFormData = z.infer<typeof presupuestoSchema>;

interface PresupuestoFormProps {
  onBack: () => void;
  editingId: string | null;
}

export function PresupuestoForm({ onBack, editingId }: PresupuestoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingId;
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditing);
  const [activeStep, setActiveStep] = useState('descripcion');

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const consorcioOptions = consorcios.map(c => ({ label: c.nombre, value: c.id }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      consorcio_id: '',
      titulo: '',
      fecha: new Date().toISOString().split('T')[0],
      validez: '30 días',
      garantia: '6 meses',
      descripcion: '',
      total: '0',
      condiciones: '• Forma de pago: 50% de anticipo y 50% al finalizar la instalación.\n• Plazo de ejecución estimado: 3 a 5 días hábiles.',
      observaciones: '',
      url_sitio_web: 'instagram.com/ml.safelink',
      telefono_soporte: '11 1234 5678',
      email_soporte: 'soporte@safelink.com.ar',
      horario_soporte: 'Lunes a Viernes de 9:00 a 18:00 hs.',
    },
  });

  const { data: presupuestos } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: presupuestoService.getAll,
    enabled: isEditing
  });

  useEffect(() => {
    if (isEditing && presupuestos) {
      const p = presupuestos.find(x => x.id === editingId);
      if (p) {
        reset({
          consorcio_id: p.consorcio_id,
          titulo: p.titulo,
          fecha: p.fecha,
          validez: p.validez || '',
          garantia: p.garantia || '',
          descripcion: p.descripcion || '',
          total: String(p.total),
          condiciones: p.condiciones || '',
          observaciones: p.observaciones || '',
          url_sitio_web: p.url_sitio_web || 'instagram.com/ml.safelink',
          telefono_soporte: p.telefono_soporte || '11 1234 5678',
          email_soporte: p.email_soporte || 'soporte@safelink.com.ar',
          horario_soporte: p.horario_soporte || 'Lunes a Viernes de 9:00 a 18:00 hs.',
        });
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, presupuestos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (payload: object) =>
      isEditing ? presupuestoService.update(editingId!, payload) : presupuestoService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      onBack();
    },
  });

  const onSubmit: SubmitHandler<PresupuestoFormData> = (data) => {
    const payload = {
      consorcio_id: data.consorcio_id,
      titulo: data.titulo,
      fecha: data.fecha,
      validez: data.validez || null,
      garantia: data.garantia || null,
      descripcion: data.descripcion || null,
      total: parseFloat(data.total) || 0,
      condiciones: data.condiciones || null,
      observaciones: data.observaciones || null,
      url_sitio_web: data.url_sitio_web || null,
      telefono_soporte: data.telefono_soporte || null,
      email_soporte: data.email_soporte || null,
      horario_soporte: data.horario_soporte || null,
      materiales: [], // Empty array for backwards compatibility
      mano_obra: 0,
      descuentos: 0,
    };
    mutation.mutate(payload);
  };

  if (!isDataLoaded) return <p className={styles.loading}>Cargando datos...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>Volver</Button>
        <h1>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          
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
                label="Título del Presupuesto *"
                placeholder="ej: PROVISIÓN E INSTALACIÓN DE SISTEMA DE CÁMARAS"
                error={errors.titulo?.message}
                {...register('titulo')}
                className={styles.fullWidth}
              />
              <Input
                label="Fecha *"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />
              <Input
                label="Validez"
                placeholder="ej: 30 días"
                {...register('validez')}
              />
              <Input
                label="Garantía"
                placeholder="ej: 6 meses"
                {...register('garantia')}
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

          {/* ── Desarrollo del Presupuesto ── */}
          <div className={styles.sectionBlock}>
            <div className={styles.sectionTitle}>
              <FileSpreadsheet size={16} />
              <span>Desarrollo del Presupuesto</span>
            </div>

            <div>
              <label className={styles.textareaLabel}>SECCIÓN 1 — Descripción de los trabajos a realizar</label>
              <textarea
                className={styles.textArea}
                rows={8}
                placeholder="Detalle los trabajos, materiales y mano de obra a realizar de forma descriptiva..."
                {...register('descripcion')}
                onFocus={() => setActiveStep('descripcion')}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }} onFocus={() => setActiveStep('monto')}>
              <Input
                label="SECCIÓN 2 — Monto Total ($) *"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.total?.message}
                {...register('total')}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 3 — Condiciones</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Condiciones del servicio (forma de pago, plazos)..."
                {...register('condiciones')}
                onFocus={() => setActiveStep('condiciones')}
              />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 4 — Observaciones</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Observaciones adicionales..."
                {...register('observaciones')}
                onFocus={() => setActiveStep('observaciones')}
              />
            </div>
          </div>

          {/* ── Datos de Soporte ── */}
          <div className={styles.sectionBlock} onFocus={() => setActiveStep('soporte')}>
            <div className={styles.sectionTitle}>
              <Globe size={16} />
              <span>Datos de contacto — ¿Necesita ayuda? (aparece en el pie del presupuesto)</span>
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
              label="Enlace a Instagram"
              placeholder="ej: instagram.com/ml.safelink"
              {...register('url_sitio_web')}
            />
          </div>

          {/* Acciones */}
          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>Cancelar</Button>
            <Button type="submit" variant="primary" leftIcon={<Save size={18} />} isLoading={mutation.isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Error al guardar el presupuesto.</p>}
        </form>
      </Card>
    </div>
  );
}
