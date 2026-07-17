import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type AdminInsert } from '@/services/adminService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save } from 'lucide-react';
import styles from './AdminForm.module.css';

const adminSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cuit: z.string().optional(),
  direccion: z.string().optional(),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  observaciones: z.string().optional(),
});

type AdminFormData = z.infer<typeof adminSchema>;

interface AdminFormProps {
  onBack: () => void;
  initialData?: AdminFormData & { id?: string };
}

export function AdminForm({ onBack, initialData }: AdminFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const { register, handleSubmit, formState: { errors } } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: initialData || {
      nombre: '',
      cuit: '',
      direccion: '',
      contacto: '',
      telefono: '',
      email: '',
      observaciones: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: AdminInsert) => 
      isEditing ? adminService.update(initialData.id!, data) : adminService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['administraciones'] });
      onBack();
    },
  });

  const onSubmit = (data: AdminFormData) => {
    mutation.mutate(data as AdminInsert);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
          Volver
        </Button>
        <h1>{isEditing ? 'Editar Administración' : 'Nueva Administración'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formGrid}>
            <Input
              label="Nombre *"
              placeholder="Ej: Administración Gómez"
              error={errors.nombre?.message}
              {...register('nombre')}
            />
            <Input
              label="CUIT"
              placeholder="Ej: 30-12345678-9"
              error={errors.cuit?.message}
              {...register('cuit')}
            />
            <Input
              label="Contacto Principal"
              placeholder="Nombre del responsable"
              error={errors.contacto?.message}
              {...register('contacto')}
            />
            <Input
              label="Teléfono"
              placeholder="Ej: 11 1234-5678"
              error={errors.telefono?.message}
              {...register('telefono')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Dirección"
              placeholder="Calle Falsa 123"
              error={errors.direccion?.message}
              {...register('direccion')}
              className={styles.fullWidth}
            />
            <div className={styles.fullWidth}>
              <label className={styles.textAreaLabel}>Observaciones</label>
              <textarea
                className={styles.textArea}
                placeholder="Notas adicionales..."
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
              Guardar Administración
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Ocurrió un error al guardar.</p>}
        </form>
      </Card>
    </div>
  );
}
