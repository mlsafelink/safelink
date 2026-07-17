import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { instructivoService, type InstructivoBloque } from '@/services/documentService';
import { consorcioService } from '@/services/consorcioService';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Card } from '@/components/ui/Card/Card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader/ImageUploader';
import styles from './DocForm.module.css';

const instructivoSchema = z.object({
  consorcio_id: z.string().min(1, 'Seleccione un consorcio'),
  titulo: z.string().min(1, 'El título es requerido'),
});

type InstructivoFormData = z.infer<typeof instructivoSchema>;

interface InstructivoFormProps {
  onBack: () => void;
  editingId: string | null;
}

export function InstructivoForm({ onBack, editingId }: InstructivoFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editingId;
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditing);
  const [bloques, setBloques] = useState<InstructivoBloque[]>([{ tipo: 'texto', contenido: '' }]);

  const { data: consorcios = [] } = useQuery({ queryKey: ['consorcios'], queryFn: consorcioService.getAll });
  const consorcioOptions = consorcios.map(c => ({ label: c.nombre, value: c.id }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstructivoFormData>({
    resolver: zodResolver(instructivoSchema),
    defaultValues: { consorcio_id: '', titulo: '' },
  });

  const { data: instructivos } = useQuery({ queryKey: ['instructivos'], queryFn: instructivoService.getAll, enabled: isEditing });

  useEffect(() => {
    if (isEditing && instructivos) {
      const instr = instructivos.find(x => x.id === editingId);
      if (instr) {
        reset({ consorcio_id: instr.consorcio_id, titulo: instr.titulo });
        setBloques(instr.contenido);
        setIsDataLoaded(true);
      }
    }
  }, [isEditing, instructivos, editingId, reset]);

  const mutation = useMutation({
    mutationFn: (data: InstructivoFormData) => {
      const payload = { ...data, contenido: bloques };
      return isEditing ? instructivoService.update(editingId!, payload) : instructivoService.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructivos'] }); onBack(); },
  });

  const addBloque = (tipo: InstructivoBloque['tipo']) => {
    setBloques(prev => [...prev, { tipo, contenido: '' }]);
  };

  const updateBloque = (index: number, contenido: string) => {
    setBloques(prev => prev.map((b, i) => i === index ? { ...b, contenido } : b));
  };

  const removeBloque = (index: number) => {
    setBloques(prev => prev.filter((_, i) => i !== index));
  };

  if (!isDataLoaded) return <p className={styles.loading}>Cargando datos...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>Volver</Button>
        <h1>{isEditing ? 'Editar Instructivo' : 'Nuevo Instructivo'}</h1>
      </div>

      <Card variant="neumorphic" className={styles.formCard}>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className={styles.form}>
          <div className={styles.grid2}>
            <Select label="Consorcio *" options={consorcioOptions} error={errors.consorcio_id?.message} {...register('consorcio_id')} className={styles.fullWidth} />
            <Input label="Título *" placeholder="Título del instructivo" error={errors.titulo?.message} {...register('titulo')} className={styles.fullWidth} />
          </div>

          {/* Editor de bloques */}
          <div className={styles.section}>
            <h3>Contenido</h3>
            <div className={styles.bloquesList}>
              {bloques.map((bloque, i) => (
                <div key={i} className={styles.bloque}>
                  <div className={styles.bloqueHeader}>
                    <span className={`${styles.bloqueTag} ${styles[`tag_${bloque.tipo}`]}`}>{bloque.tipo.toUpperCase()}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => removeBloque(i)}><Trash2 size={14} /></button>
                  </div>
                  {bloque.tipo === 'titulo' ? (
                    <Input
                      placeholder="Título de sección"
                      value={bloque.contenido}
                      onChange={e => updateBloque(i, e.target.value)}
                    />
                  ) : bloque.tipo === 'imagen' ? (
                    <ImageUploader
                      value={bloque.contenido}
                      onChange={url => updateBloque(i, url)}
                    />
                  ) : (
                    <textarea
                      className={styles.textArea}
                      rows={4}
                      placeholder="Escriba el contenido..."
                      value={bloque.contenido}
                      onChange={e => updateBloque(i, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className={styles.addBloqueButtons}>
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => addBloque('titulo')}>
                Título
              </Button>
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => addBloque('texto')}>
                Texto
              </Button>
              <Button type="button" variant="secondary" size="sm" leftIcon={<Plus size={14} />} onClick={() => addBloque('imagen')}>
                Imagen
              </Button>
            </div>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onBack}>Cancelar</Button>
            <Button type="submit" variant="primary" leftIcon={<Save size={18} />} isLoading={mutation.isPending}>
              {isEditing ? 'Guardar Cambios' : 'Crear Instructivo'}
            </Button>
          </div>
          {mutation.isError && <p className={styles.errorMsg}>Error al guardar.</p>}
        </form>
      </Card>
    </div>
  );
}
