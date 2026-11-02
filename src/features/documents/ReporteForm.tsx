import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { reporteService, normalizeFotos, type FotoItem } from '@/services/documentService';
import { normalizeNombreEnlace, generatePublicCode } from '@/features/documents/constants/instructivoApps';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, ClipboardList, FileText,
  Cpu, AlertTriangle, Camera, Globe, Link as LinkIcon,
} from 'lucide-react';
import { DocumentPhotoUploader } from './components/DocumentPhotoUploader';
import styles from './DocForm.module.css';

const STEPS = [
  { id: 'situacion',           label: 'Situación',     icon: FileText },
  { id: 'relevamiento',        label: 'Relevam.',      icon: Cpu },
  { id: 'diagnostico',        label: 'Diagnóstico',   icon: AlertTriangle },
  { id: 'fotos',              label: 'Fotos',         icon: Camera },
  { id: 'soporte',            label: 'Soporte',       icon: Globe },
];

const reporteSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  titulo: z.string().min(1, 'El título es requerido'),
  nombre_enlace: z.string().optional(),
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
  const [fotografias, setFotografias] = useState<FotoItem[]>([]);
  const [incluirFotografias, setIncluirFotografias] = useState<boolean>(true);
  const [activeStep, setActiveStep] = useState('situacion');
  const [codigoPublico, setCodigoPublico] = useState<string>(() => generatePublicCode(4));

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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ReporteFormData>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      consorcio_id: '',
      fecha: new Date().toISOString().split('T')[0],
      titulo: '',
      nombre_enlace: '',
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

  const watchedNombreEnlace = watch('nombre_enlace');
  const normalizedSlugName = normalizeNombreEnlace(watchedNombreEnlace || '');
  const previewSlug = normalizedSlugName
    ? `${normalizedSlugName}-${codigoPublico}`
    : `nombre-enlace-${codigoPublico}`;

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
          nombre_enlace: reporte.nombre_enlace ?? '',
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
        setFotografias(normalizeFotos(reporte.fotografias));
        setIncluirFotografias(reporte.incluir_fotografias !== false);
        if (reporte.codigo_publico) {
          setCodigoPublico(reporte.codigo_publico);
        } else {
          setCodigoPublico(generatePublicCode(4));
        }
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, reportes, editingId, reset]);

  const mutation = useMutation({
    mutationFn: async (data: ReporteFormData) => {
      let finalSlug: string | null = null;
      let finalCode = codigoPublico;
      if (data.nombre_enlace && data.nombre_enlace.trim()) {
        const uniqueRes = await reporteService.ensureUniqueSlug(
          data.nombre_enlace,
          codigoPublico,
          editingId || undefined
        );
        finalSlug = uniqueRes.public_slug;
        finalCode = uniqueRes.codigo_publico;
      }

      const payload = {
        ...data,
        fotografias,
        incluir_fotografias: incluirFotografias,
        nombre_enlace: data.nombre_enlace ? normalizeNombreEnlace(data.nombre_enlace) : null,
        codigo_publico: finalCode,
        public_slug: finalSlug,
      };
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

              {/* ── Nombre del enlace y Previsualización ── */}
              <div className={styles.fullWidth} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                <Input
                  label="Nombre del enlace"
                  placeholder="ej: Relevamiento-CCTV-AvLibertador, Inspeccion-Sarmiento-21-9..."
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
                    {typeof window !== 'undefined' ? window.location.origin : 'https://safelinkcloud.online'}/p/reporte/
                    <strong style={{ color: '#2b6cb0' }}>{previewSlug}</strong>
                  </div>
                </div>
              </div>
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

            {/* 1. Situación y alcance */}
            <div>
              <label className={styles.textareaLabel}>SECCIÓN 1 — Situación y alcance</label>
              <textarea
                className={styles.textArea}
                rows={4}
                placeholder="Describa la situación encontrada y el alcance de la intervención..."
                {...register('descripcion')}
                onFocus={() => setActiveStep('situacion')}
              />
            </div>

            {/* 2. Relevamiento técnico */}
            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 2 — Relevamiento técnico</label>
              <div style={{ marginTop: '0.5rem' }}>
                <label className={styles.textareaLabel} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Equipo relevado</label>
                <textarea
                  className={styles.textArea}
                  rows={3}
                  placeholder="Detalle los equipos encontrados (marca, modelo, estado)..."
                  {...register('equipo_relevado')}
                  onFocus={() => setActiveStep('relevamiento')}
                />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label className={styles.textareaLabel} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Inspección realizada</label>
                <textarea
                  className={styles.textArea}
                  rows={4}
                  placeholder="Detalle las pruebas e inspecciones llevadas a cabo..."
                  {...register('inspeccion_realizada')}
                  onFocus={() => setActiveStep('relevamiento')}
                />
              </div>
            </div>

            {/* 3. Diagnóstico y recomendaciones */}
            <div style={{ marginTop: '1rem' }}>
              <label className={styles.textareaLabel}>SECCIÓN 3 — Diagnóstico y recomendaciones</label>
              <div style={{ marginTop: '0.5rem' }}>
                <label className={styles.textareaLabel} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Diagnóstico</label>
                <textarea
                  className={styles.textArea}
                  rows={4}
                  placeholder="Conclusión técnica sobre la situación encontrada..."
                  {...register('diagnostico')}
                  onFocus={() => setActiveStep('diagnostico')}
                />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <label className={styles.textareaLabel} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Recomendaciones</label>
                <textarea
                  className={styles.textArea}
                  rows={4}
                  placeholder="• Una recomendación por línea&#10;• Agregar bullet • al inicio de cada una"
                  {...register('recomendaciones')}
                  onFocus={() => setActiveStep('diagnostico')}
                />
                <p className={styles.sectionHint} style={{ marginTop: '0.4rem' }}>
                  Usá "•" al inicio de cada línea para mostrarlas como viñetas en el reporte.
                </p>
              </div>
            </div>
          </div>

          {/* ── Registro fotográfico (opcional) ── */}
          <div className={styles.sectionBlock} onFocus={() => setActiveStep('fotos')}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                checked={incluirFotografias}
                onChange={e => setIncluirFotografias(e.target.checked)}
                style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Incluir registro fotográfico</span>
            </label>
            {incluirFotografias && (
              <DocumentPhotoUploader
                fotografias={fotografias}
                onChange={setFotografias}
                label="Registro Fotográfico de Evidencia"
                hint="Subí imágenes de la inspección o relevamiento técnico. Podés añadir una descripción opcional a cada fotografía."
              />
            )}
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
