import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { presupuestoService, reporteService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, FileText, DollarSign,
  AlertCircle, Info, Globe
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
  reporte_id: z.string().optional(),
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
  const [activeStep, setActiveStep] = useState('descripcion');

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const { data: particulares = [] } = useQuery({ queryKey: ['particulares'], queryFn: particularService.getAll });
  const { data: reportes = [] } = useQuery({ queryKey: ['reportes'], queryFn: reporteService.getAll });

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      consorcio_id: '',
      reporte_id: '',
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
          reporte_id: p.reporte_id || '',
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
      }
    }
  }, [isEditing, presupuestos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (payload: any) => {
      if (isEditing && editingId) {
        return presupuestoService.update(editingId, payload);
      }
      return presupuestoService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presupuestos'] });
      onBack();
    },
  });

  const onSubmit = (data: PresupuestoFormData) => {
    mutation.mutate({
      ...data,
      total: parseFloat(data.total) || 0,
      reporte_id: data.reporte_id || null,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
          Volver a la lista
        </Button>
        <h2>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto (PRES)'}</h2>
      </div>

      <div className={styles.stepperNav}>
        {STEPS.map(step => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              className={`${styles.stepBtn} ${isActive ? styles.stepBtnActive : ''}`}
              onClick={() => setActiveStep(step.id)}
            >
              <Icon size={16} />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContent}>
        <Card variant="neumorphic" className={styles.cardPadding}>
          {activeStep === 'descripcion' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <Select
                  label="Cliente / Consorcio *"
                  options={clienteOptions}
                  error={errors.consorcio_id?.message}
                  {...register('consorcio_id')}
                />
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.inputLabel}>Reporte Técnico Origen (Reporte Padre)</label>
                <select className={styles.nativeSelect} {...register('reporte_id')}>
                  <option value="">-- Sin reporte técnico asociado --</option>
                  {reportes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.codigo || 'RT'} - {r.titulo}
                    </option>
                  ))}
                </select>
                <span className={styles.fieldHint}>
                  Vincular el Reporte Técnico del cual deriva este presupuesto.
                </span>
              </div>

              <Input
                label="Título del Presupuesto *"
                placeholder="Ej. Provisión e Instalación de Sistema CCTV"
                error={errors.titulo?.message}
                {...register('titulo')}
              />

              <Input
                label="Fecha *"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />

              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Descripción Detallada de la Propuesta</label>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  placeholder="Detalle de trabajos, alcance y materiales previstos..."
                  {...register('descripcion')}
                />
              </div>
            </div>
          )}

          {activeStep === 'monto' && (
            <div className={styles.formGrid}>
              <Input
                label="Monto Total (ARS) *"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.total?.message}
                {...register('total')}
              />
              <Input
                label="Validez de la Oferta"
                placeholder="Ej. 15 días corridos"
                {...register('validez')}
              />
              <Input
                label="Garantía Ofrecida"
                placeholder="Ej. 6 meses sobre mano de obra"
                {...register('garantia')}
              />
            </div>
          )}

          {activeStep === 'condiciones' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Condiciones Comerciales y Pago</label>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  {...register('condiciones')}
                />
              </div>
            </div>
          )}

          {activeStep === 'observaciones' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Observaciones Adicionales</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  {...register('observaciones')}
                />
              </div>
            </div>
          )}

          {activeStep === 'soporte' && (
            <div className={styles.formGrid}>
              <Input label="Sitio Web" {...register('url_sitio_web')} />
              <Input label="Teléfono de Soporte" {...register('telefono_soporte')} />
              <Input label="Email de Soporte" {...register('email_soporte')} />
              <Input label="Horario de Soporte" {...register('horario_soporte')} />
            </div>
          )}

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={onBack}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={mutation.isPending} leftIcon={<Save size={18} />}>
              {isEditing ? 'Guardar Cambios' : 'Crear Presupuesto (PRES)'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
