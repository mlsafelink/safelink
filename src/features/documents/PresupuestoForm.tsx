import { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { presupuestoService } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import styles from './DocForm.module.css';

// Todos los números se manejan como strings en el form para evitar
// conflictos de tipo con zodResolver + verbatimModuleSyntax
const presupuestoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  titulo: z.string().min(1, 'El título es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  materiales: z.array(z.object({
    nombre: z.string(),
    cantidad: z.string(),
    precio_unitario: z.string(),
  })),
  mano_obra: z.string(),
  descuentos: z.string(),
  validez: z.string().optional(),
  garantia: z.string().optional(),
  condiciones: z.string().optional(),
  observaciones: z.string().optional(),
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

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const consorcioOptions = consorcios.map(c => ({ label: c.nombre, value: c.id }));

  const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm<PresupuestoFormData>({
    resolver: zodResolver(presupuestoSchema),
    defaultValues: {
      consorcio_id: '', titulo: '', fecha: new Date().toISOString().split('T')[0],
      materiales: [], mano_obra: '0', descuentos: '0',
      validez: '', garantia: '', condiciones: '', observaciones: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'materiales' });
  const materiales = watch('materiales');
  const manoObraStr = watch('mano_obra');
  const descuentosStr = watch('descuentos');

  const subtotales = materiales.reduce((acc, m) => {
    return acc + (parseFloat(m.cantidad) || 0) * (parseFloat(m.precio_unitario) || 0);
  }, 0);
  const total = subtotales + (parseFloat(manoObraStr) || 0) - (parseFloat(descuentosStr) || 0);

  const { data: presupuestos } = useQuery({ queryKey: ['presupuestos'], queryFn: presupuestoService.getAll, enabled: isEditing });

  useEffect(() => {
    if (isEditing && presupuestos) {
      const p = presupuestos.find(x => x.id === editingId);
      if (p) {
        reset({
          consorcio_id: p.consorcio_id,
          titulo: p.titulo,
          fecha: p.fecha,
          materiales: p.materiales.map(m => ({
            nombre: m.nombre,
            cantidad: String(m.cantidad),
            precio_unitario: String(m.precio_unitario),
          })),
          mano_obra: String(p.mano_obra),
          descuentos: String(p.descuentos),
          validez: p.validez || '',
          garantia: p.garantia || '',
          condiciones: p.condiciones || '',
          observaciones: p.observaciones || '',
        });
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, presupuestos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (payload: object) =>
      isEditing ? presupuestoService.update(editingId!, payload) : presupuestoService.create(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['presupuestos'] }); onBack(); },
  });

  const onSubmit: SubmitHandler<PresupuestoFormData> = (data) => {
    const payload = {
      consorcio_id: data.consorcio_id,
      titulo: data.titulo,
      fecha: data.fecha,
      validez: data.validez || null,
      garantia: data.garantia || null,
      condiciones: data.condiciones || null,
      observaciones: data.observaciones || null,
      mano_obra: parseFloat(data.mano_obra) || 0,
      descuentos: parseFloat(data.descuentos) || 0,
      total,
      materiales: data.materiales.map(m => ({
        nombre: m.nombre,
        cantidad: parseFloat(m.cantidad) || 0,
        precio_unitario: parseFloat(m.precio_unitario) || 0,
        subtotal: (parseFloat(m.cantidad) || 0) * (parseFloat(m.precio_unitario) || 0),
      })),
    };
    mutation.mutate(payload);
  };

  const addMaterial = () => append({ nombre: '', cantidad: '1', precio_unitario: '0' });
  const fmt = (n: number) => n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

  if (!isDataLoaded) return <p className={styles.loading}>Cargando datos...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>Volver</Button>
        <h1>{isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.grid2}>
            <Select label="Consorcio *" options={consorcioOptions} error={errors.consorcio_id?.message} {...register('consorcio_id')} className={styles.fullWidth} />
            <Input label="Título *" placeholder="Título del presupuesto" error={errors.titulo?.message} {...register('titulo')} className={styles.fullWidth} />
            <Input label="Fecha *" type="date" error={errors.fecha?.message} {...register('fecha')} />
            <Input label="Validez" placeholder="Ej: 30 días" {...register('validez')} />
            <Input label="Garantía" placeholder="Ej: 6 meses en mano de obra" {...register('garantia')} className={styles.fullWidth} />
          </div>

          {/* Materiales */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Materiales</h3>
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={addMaterial}>
                Agregar ítem
              </Button>
            </div>

            {fields.length > 0 && (
              <div className={styles.materialsTable}>
                <div className={styles.tableHeader}>
                  <span>Descripción</span><span>Cantidad</span><span>Precio Unit.</span><span>Subtotal</span><span></span>
                </div>
                {fields.map((field, i) => (
                  <div key={field.id} className={styles.tableRow}>
                    <Input placeholder="Descripción" {...register(`materiales.${i}.nombre`)} />
                    <Input type="number" placeholder="0" {...register(`materiales.${i}.cantidad`)} />
                    <Input type="number" placeholder="0.00" {...register(`materiales.${i}.precio_unitario`)} />
                    <div className={styles.subtotalCell}>
                      {fmt((parseFloat(materiales[i]?.cantidad) || 0) * (parseFloat(materiales[i]?.precio_unitario) || 0))}
                    </div>
                    <button type="button" className={styles.removeBtn} onClick={() => remove(i)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <Input label="Mano de Obra ($)" type="number" {...register('mano_obra')} />
              <Input label="Descuentos ($)" type="number" {...register('descuentos')} />
            </div>
            <div className={styles.totalBox}>
              <span>TOTAL</span>
              <strong>{fmt(total)}</strong>
            </div>
          </div>

          <div className={styles.fieldList}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Condiciones</label>
              <textarea className={styles.textArea} rows={3} placeholder="Condiciones del presupuesto..." {...register('condiciones')} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Observaciones</label>
              <textarea className={styles.textArea} rows={3} placeholder="Observaciones..." {...register('observaciones')} />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>Cancelar</Button>
            <Button type="submit" variant="primary" leftIcon={<Save size={18} />} isLoading={mutation.isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Presupuesto'}
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Error al guardar.</p>}
        </form>
      </Card>
    </div>
  );
}
