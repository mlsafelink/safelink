import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { reporteTrabajoService, presupuestoService, reporteService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, FileText, Cpu, CheckSquare, Wrench,
  Camera, Shield, UserCheck, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const STEPS = [
  { id: 'general', label: 'Datos Generales', icon: FileText },
  { id: 'trabajos', label: 'Trabajos', icon: Wrench },
  { id: 'equipamiento', label: 'Equipos & Mat.', icon: Cpu },
  { id: 'configuraciones', label: 'Configuración', icon: CheckSquare },
  { id: 'fotos', label: 'Fotos', icon: Camera },
  { id: 'garantia', label: 'Garantía & Firma', icon: Shield },
];

const reporteTrabajoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un cliente / consorcio'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  tecnico_nombre: z.string().min(1, 'Nombre del técnico es requerido'),
  cliente_nombre: z.string().optional(),
  cliente_direccion: z.string().optional(),
  descripcion_trabajos: z.string().optional(),
  equipamiento_instalado: z.string().optional(),
  materiales_utilizados: z.string().optional(),
  configuraciones_realizadas: z.string().optional(),
  observaciones: z.string().optional(),
  garantia: z.string().optional(),
  presupuesto_id: z.string().optional(),
  reporte_id: z.string().optional(),
  url_sitio_web: z.string().optional(),
  telefono_soporte: z.string().optional(),
  email_soporte: z.string().optional(),
  horario_soporte: z.string().optional(),
});

type ReporteTrabajoFormData = z.infer<typeof reporteTrabajoSchema>;

interface ReporteTrabajoFormProps {
  onBack: () => void;
  editingId: string | null;
}

export function ReporteTrabajoForm({ onBack, editingId }: ReporteTrabajoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingId;
  const [fotografias, setFotografias] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState('general');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares'],
    queryFn: particularService.getAll,
  });

  const { data: presupuestos = [] } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: presupuestoService.getAll,
  });

  const { data: reportes = [] } = useQuery({
    queryKey: ['reportes'],
    queryFn: reporteService.getAll,
  });

  const { data: reportesTrabajo = [] } = useQuery({
    queryKey: ['reportes_trabajo'],
    queryFn: reporteTrabajoService.getAll,
    enabled: isEditing,
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReporteTrabajoFormData>({
    resolver: zodResolver(reporteTrabajoSchema),
    defaultValues: {
      consorcio_id: '',
      fecha: new Date().toISOString().split('T')[0],
      titulo: 'Reporte de Trabajo Efectuado',
      tecnico_nombre: 'Técnico SafeLink',
      cliente_nombre: '',
      cliente_direccion: '',
      descripcion_trabajos: '',
      equipamiento_instalado: '',
      materiales_utilizados: '',
      configuraciones_realizadas: '',
      observaciones: '',
      garantia: '6 meses de garantía sobre los trabajos realizados.',
      presupuesto_id: '',
      reporte_id: '',
      url_sitio_web: 'www.safelink.com.ar',
      telefono_soporte: '11 1234 5678',
      email_soporte: 'soporte@safelink.com.ar',
      horario_soporte: 'Lunes a Viernes de 9:00 a 18:00 hs.',
    },
  });

  useEffect(() => {
    if (isEditing && reportesTrabajo.length > 0) {
      const doc = reportesTrabajo.find(x => x.id === editingId);
      if (doc) {
        reset({
          consorcio_id: doc.consorcio_id,
          fecha: doc.fecha,
          titulo: doc.titulo,
          tecnico_nombre: doc.tecnico_nombre || '',
          cliente_nombre: doc.cliente_nombre || '',
          cliente_direccion: doc.cliente_direccion || '',
          descripcion_trabajos: doc.descripcion_trabajos || '',
          equipamiento_instalado: doc.equipamiento_instalado || '',
          materiales_utilizados: doc.materiales_utilizados || '',
          configuraciones_realizadas: doc.configuraciones_realizadas || '',
          observaciones: doc.observaciones || '',
          garantia: doc.garantia || '',
          presupuesto_id: doc.presupuesto_id || '',
          reporte_id: doc.reporte_id || '',
          url_sitio_web: doc.url_sitio_web || 'www.safelink.com.ar',
          telefono_soporte: doc.telefono_soporte || '',
          email_soporte: doc.email_soporte || '',
          horario_soporte: doc.horario_soporte || '',
        });
        setFotografias(doc.fotografias || []);
      }
    }
  }, [isEditing, reportesTrabajo, editingId, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ReporteTrabajoFormData) => {
      setErrorMsg('');
      const selectedConsorcio = consorcios.find(c => c.id === data.consorcio_id);
      const selectedParticular = particulares.find(p => p.id === data.consorcio_id);
      const clienteNombre = data.cliente_nombre || selectedConsorcio?.nombre || selectedParticular?.nombre || 'Cliente';

      const payload = {
        ...data,
        cliente_nombre: clienteNombre,
        fotografias,
        firmas: [{ tipo: 'digital', estado: 'preparada' }],
      };

      if (isEditing && editingId) {
        return reporteTrabajoService.update(editingId, payload);
      }
      return reporteTrabajoService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportes_trabajo'] });
      setSuccessMsg(isEditing ? '¡Reporte actualizado con éxito!' : '¡Reporte creado con éxito!');
      setTimeout(() => {
        onBack();
      }, 1500);
    },
    onError: (err: Error) => {
      console.error(err);
      setErrorMsg(err.message || 'Error al guardar el reporte de trabajo.');
    },
  });

  const onSubmit = (data: ReporteTrabajoFormData) => {
    mutation.mutate(data);
  };

  const handleRemovePhoto = (index: number) => {
    setFotografias(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
          Volver a la lista
        </Button>
        <h2>{isEditing ? 'Editar Reporte de Trabajo' : 'Nuevo Reporte de Trabajo Efectuado (RTE)'}</h2>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#15803d',
          fontWeight: 700,
          fontSize: '0.92rem',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
        }}>
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#b91c1c',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}>
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

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
          {activeStep === 'general' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <Select
                  label="Cliente / Consorcio *"
                  options={clienteOptions}
                  error={errors.consorcio_id?.message}
                  {...register('consorcio_id')}
                />
              </div>

              <Input
                label="Título del Trabajo *"
                placeholder="Ej. Instalación de Control de Acceso Peatonal"
                error={errors.titulo?.message}
                {...register('titulo')}
              />

              <Input
                label="Fecha *"
                type="date"
                error={errors.fecha?.message}
                {...register('fecha')}
              />

              <Input
                label="Técnico Responsable *"
                placeholder="Nombre del técnico"
                error={errors.tecnico_nombre?.message}
                {...register('tecnico_nombre')}
              />

              <div className={styles.fullWidth}>
                <label className={styles.sectionDividerLabel}>Vinculación Documental Jerárquica</label>
              </div>

              <div>
                <label className={styles.inputLabel}>Presupuesto Base (PRES-)</label>
                <select className={styles.nativeSelect} {...register('presupuesto_id')}>
                  <option value="">-- Sin presupuesto vinculado --</option>
                  {presupuestos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo || 'PRES'} - {p.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={styles.inputLabel}>Reporte Técnico Origen (RT-)</label>
                <select className={styles.nativeSelect} {...register('reporte_id')}>
                  <option value="">-- Sin reporte técnico vinculado --</option>
                  {reportes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.codigo || 'RT'} - {r.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeStep === 'trabajos' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Descripción de los Trabajos Efectuados</label>
                <textarea
                  className={styles.textarea}
                  rows={6}
                  placeholder="Detalle minucioso de las tareas ejecutadas por el equipo técnico..."
                  {...register('descripcion_trabajos')}
                />
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Observaciones Generales</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="Novedades o aclaraciones adicionales sobre el servicio prestado..."
                  {...register('observaciones')}
                />
              </div>
            </div>
          )}

          {activeStep === 'equipamiento' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Equipamiento Instalado</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="Ej. 1x DVR Dahua 8 Ch, 4x Cámaras Bullet Full HD 1080p, 1x Fuente centralizada 12V 10A..."
                  {...register('equipamiento_instalado')}
                />
              </div>

              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Materiales Utilizados</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="Ej. 60 mts de cable UTP Cat5e exterior, 8x Balunes HD, conectores jack de alimentación..."
                  {...register('materiales_utilizados')}
                />
              </div>
            </div>
          )}

          {activeStep === 'configuraciones' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.textareaLabel}>Configuraciones Realizadas</label>
                <textarea
                  className={styles.textarea}
                  rows={5}
                  placeholder="Ej. Apertura de puertos en router, asignación de IP estática 192.168.1.200, configuración de usuarios y permisos de visualización móvil..."
                  {...register('configuraciones_realizadas')}
                />
              </div>
            </div>
          )}

          {activeStep === 'fotos' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <label className={styles.sectionDividerLabel}>Fotografías del Trabajo Finalizado</label>
                <ImageUploader
                  onChange={(url) => setFotografias(prev => [...prev, url])}
                />

                {fotografias.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                    {fotografias.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                        <img src={url} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 'garantia' && (
            <div className={styles.formGrid}>
              <div className={styles.fullWidth}>
                <Input
                  label="Garantía Ofrecida"
                  placeholder="Ej. 6 meses de garantía oficial SafeLink sobre la instalación y equipos."
                  {...register('garantia')}
                />
              </div>

              <div className={styles.fullWidth}>
                <div className={styles.signatureBoxMock}>
                  <UserCheck size={24} style={{ color: '#2563eb' }} />
                  <div>
                    <h4>Firma Digital (Preparada para Futuro)</h4>
                    <p>Espacio reservado para conformidad del cliente y firma del técnico responsable.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={onBack}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isLoading={mutation.isPending} leftIcon={<Save size={18} />}>
              {isEditing ? 'Guardar Cambios' : 'Crear Reporte de Trabajo (RTE)'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
