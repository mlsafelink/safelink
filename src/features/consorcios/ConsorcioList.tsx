import { useQuery } from '@tanstack/react-query';
import { consorcioService, type Consorcio } from '@/services/consorcioService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Plus, Building, MapPin, Building2, User, Edit, Trash2 } from 'lucide-react';
import styles from './ConsorcioList.module.css';

interface ConsorcioListProps {
  onCreateNew: () => void;
  onEdit: (consorcio: Consorcio) => void;
}

export function ConsorcioList({ onCreateNew, onEdit }: ConsorcioListProps) {
  const { data: consorcios, isLoading, error } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  if (isLoading) return <p className={styles.loading}>Cargando consorcios...</p>;
  if (error) return <p className={styles.error}>Error al cargar los consorcios.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Consorcios</h1>
          <p>Gestiona los edificios de cada administración</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
          Nuevo Consorcio
        </Button>
      </div>

      <div className={styles.grid}>
        {consorcios?.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay consorcios registrados.</p>
          </div>
        ) : (
          consorcios?.map((consorcio: Consorcio) => (
            <Card key={consorcio.id} variant="glass" className={styles.consorcioCard}>
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <div className={styles.iconBox}><Building size={20} /></div>
                  <h3 className={styles.name}>{consorcio.nombre}</h3>
                </div>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => onEdit(consorcio)} title="Editar"><Edit size={18} /></button>
                  <button className={styles.iconBtnDanger} title="Eliminar"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <div className={styles.details}>
                {consorcio.administraciones && (
                  <p className={styles.detailRow} title="Administración">
                    <Building2 size={16} /> <strong>{consorcio.administraciones.nombre}</strong>
                  </p>
                )}
                {consorcio.direccion && (
                  <p className={styles.detailRow}>
                    <MapPin size={16} /> {consorcio.direccion}{consorcio.localidad ? `, ${consorcio.localidad}` : ''}
                  </p>
                )}
                <div className={styles.stats}>
                  {consorcio.cantidad_pisos != null && (
                    <span className={styles.statBadge}>{consorcio.cantidad_pisos} Pisos</span>
                  )}
                  {consorcio.cantidad_unidades != null && (
                    <span className={styles.statBadge}>{consorcio.cantidad_unidades} UF</span>
                  )}
                </div>
                {consorcio.encargado && (
                  <p className={styles.detailRow}>
                    <User size={16} /> Encargado: {consorcio.encargado}
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
