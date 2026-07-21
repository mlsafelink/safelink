import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { particularService } from '@/services/particularService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save } from 'lucide-react';
import styles from './ParticularForm.module.css';

const particularSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional(),
});

type ParticularFormData = z.infer<typeof particularSchema>;

interface ParticularFormProps {
  onBack: () => void;
  initialData?: ParticularFormData & { id?: string };
}

export function ParticularForm({ onBack, initialData }: ParticularFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const { register, handleSubmit, formState: { errors } } = useForm<ParticularFormData>({
    resolver: zodResolver(particularSchema),
    defaultValues: initialData ?? {
      nombre: '',
      direccion: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ParticularFormData) =>
      isEditing
        ? particularService.update(initialData!.id!, data)
        : particularService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['particulares'] });
      onBack();
    },
  });

  const onSubmit = (data: ParticularFormData) => {
    mutation.mutate({
      nombre: data.nombre,
      direccion: data.direccion || null,
    } as any);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
          Volver
        </Button>
        <h1>{isEditing ? 'Editar Cliente' : 'Nuevo Cliente Privado'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.formGrid}>
          <Input
            label="Nombre del Cliente *"
            placeholder="Ej: Juan García"
            error={errors.nombre?.message}
            {...register('nombre')}
          />
          <Input
            label="Dirección"
            placeholder="Ej: Av. Corrientes 1234, CABA"
            error={errors.direccion?.message}
            {...register('direccion')}
          />

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save size={18} />}
              isLoading={mutation.isPending}
            >
              Guardar Cliente
            </Button>
          </div>
          {mutation.isError && (
            <p className={styles.errorMsg}>Ocurrió un error al guardar.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
