import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { consorcioService, type ConsorcioInsert } from '@/services/consorcioService';
import { adminService } from '@/services/adminService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save } from 'lucide-react';
import styles from './ConsorcioForm.module.css';

const consorcioSchema = z.object({
  administracion_id: z.string().min(1, 'Debe seleccionar una administración'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  provincia: z.string().optional(),
  codigo_postal: z.string().optional(),
  cantidad_pisos: z.string().optional().nullable(),
  cantidad_unidades: z.string().optional().nullable(),
  encargado: z.string().optional(),
  telefono_encargado: z.string().optional(),
  administrador_responsable: z.string().optional(),
  observaciones: z.string().optional(),
});

type ConsorcioFormData = z.infer<typeof consorcioSchema>;

interface ConsorcioFormProps {
  onBack: () => void;
  initialData?: ConsorcioFormData & { id?: string };
}

export function ConsorcioForm({ onBack, initialData }: ConsorcioFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  // Obtener administraciones para el selector
  const { data: administraciones, isLoading: loadingAdmins } = useQuery({
    queryKey: ['administraciones'],
    queryFn: adminService.getAll,
  });

  const adminOptions = administraciones?.map(a => ({
    label: a.nombre,
    value: a.id
  })) || [];

  const { register, handleSubmit, formState: { errors } } = useForm<ConsorcioFormData>({
    resolver: zodResolver(consorcioSchema),
    defaultValues: initialData ? {
      ...initialData,
      cantidad_pisos: initialData.cantidad_pisos ? String(initialData.cantidad_pisos) : '',
      cantidad_unidades: initialData.cantidad_unidades ? String(initialData.cantidad_unidades) : '',
    } : {
      administracion_id: '',
      nombre: '',
      direccion: '',
      localidad: '',
      provincia: '',
      codigo_postal: '',
      cantidad_pisos: '',
      cantidad_unidades: '',
      encargado: '',
      telefono_encargado: '',
      administrador_responsable: '',
      observaciones: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ConsorcioInsert) => 
      isEditing ? consorcioService.update(initialData.id!, data) : consorcioService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consorcios'] });
      onBack();
    },
  });

  const onSubmit = (formData: ConsorcioFormData) => {
    const dataToSubmit: ConsorcioInsert = {
      ...formData,
      tipo: 'consorcio',
      cantidad_pisos: formData.cantidad_pisos ? Number(formData.cantidad_pisos) : null,
      cantidad_unidades: formData.cantidad_unidades ? Number(formData.cantidad_unidades) : null,
      direccion: formData.direccion || null,
      localidad: formData.localidad || null,
      provincia: formData.provincia || null,
      codigo_postal: formData.codigo_postal || null,
      encargado: formData.encargado || null,
      telefono_encargado: formData.telefono_encargado || null,
      administrador_responsable: formData.administrador_responsable || null,
      observaciones: formData.observaciones || null,
    };
    mutation.mutate(dataToSubmit);
  };

  if (loadingAdmins || !administraciones) {
    return <p className={styles.loading}>Cargando administraciones...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
          Volver
        </Button>
        <h1>{isEditing ? 'Editar Consorcio' : 'Nuevo Consorcio'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGrid}>
            
            <div className={styles.fullWidth}>
              <Select
                label="Administración *"
                options={adminOptions}
                error={errors.administracion_id?.message}
                {...register('administracion_id')}
              />
            </div>

            <Input
              label="Nombre del Consorcio *"
              placeholder="Ej: Consorcio Las Torres"
              error={errors.nombre?.message}
              {...register('nombre')}
            />
            <Input
              label="Dirección"
              placeholder="Calle Falsa 123"
              error={errors.direccion?.message}
              {...register('direccion')}
            />
            
            <Input
              label="Localidad"
              placeholder="Ej: CABA"
              error={errors.localidad?.message}
              {...register('localidad')}
            />
            <Input
              label="Provincia"
              placeholder="Ej: Buenos Aires"
              error={errors.provincia?.message}
              {...register('provincia')}
            />
            <Input
              label="Código Postal"
              placeholder="Ej: 1425"
              error={errors.codigo_postal?.message}
              {...register('codigo_postal')}
            />
            
            <Input
              label="Cantidad de Pisos"
              type="number"
              error={errors.cantidad_pisos?.message}
              {...register('cantidad_pisos')}
            />
            <Input
              label="Unidades Funcionales"
              type="number"
              error={errors.cantidad_unidades?.message}
              {...register('cantidad_unidades')}
            />

            <Input
              label="Encargado"
              placeholder="Nombre del encargado"
              error={errors.encargado?.message}
              {...register('encargado')}
            />
            <Input
              label="Tel. Encargado"
              placeholder="Teléfono"
              error={errors.telefono_encargado?.message}
              {...register('telefono_encargado')}
            />

            <Input
              label="Administrador Responsable"
              placeholder="Persona a cargo en la admin"
              error={errors.administrador_responsable?.message}
              {...register('administrador_responsable')}
              className={styles.fullWidth}
            />

            <div className={styles.fullWidth}>
              <label className={styles.textAreaLabel}>Observaciones</label>
              <textarea
                className={styles.textArea}
                placeholder="Notas adicionales sobre el edificio..."
                rows={4}
                {...register('observaciones')}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Save size={18} />} isLoading={mutation.isPending}>
              Guardar Consorcio
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Ocurrió un error al guardar.</p>}
        </form>
      </Card>
    </div>
  );
}
