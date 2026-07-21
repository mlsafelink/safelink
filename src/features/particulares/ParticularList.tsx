import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { particularService, type Particular } from '@/services/particularService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Plus, User, MapPin, Edit, Trash2 } from 'lucide-react';
import styles from './ParticularList.module.css';

interface ParticularListProps {
  onCreateNew: () => void;
  onEdit: (particular: Particular) => void;
}

export function ParticularList({ onCreateNew, onEdit }: ParticularListProps) {
  const queryClient = useQueryClient();

  const { data: particulares, isLoading, error } = useQuery({
    queryKey: ['particulares'],
    queryFn: particularService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => particularService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['particulares'] });
    },
  });

  if (isLoading) return <p className={styles.loading}>Cargando clientes...</p>;
  if (error) return <p className={styles.error}>Error al cargar los clientes.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Clientes Privados</h1>
          <p>Clientes individuales sin administración asociada</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
          Nuevo Cliente
        </Button>
      </div>

      <div className={styles.grid}>
        {particulares?.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay clientes registrados. ¡Creá el primero!</p>
          </div>
        ) : (
          particulares?.map((particular: Particular) => (
            <Card key={particular.id} variant="glass" className={styles.particularCard}>
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <div className={styles.iconBox}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className={styles.name}>{particular.nombre}</h3>
                    <span className={styles.badge}>
                      <User size={11} />
                      Cliente Privado
                    </span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => onEdit(particular)}
                    title="Editar"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className={styles.iconBtnDanger}
                    title="Eliminar"
                    onClick={() => {
                      if (confirm(`¿Eliminar a "${particular.nombre}"?`)) {
                        deleteMutation.mutate(particular.id);
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className={styles.details}>
                {particular.direccion && (
                  <p className={styles.detailRow}>
                    <MapPin size={15} />
                    {particular.direccion}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
