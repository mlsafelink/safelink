import { useQuery } from '@tanstack/react-query';
import { adminService, type Administracion } from '@/services/adminService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Plus, Building2, MapPin, Phone, Mail, Edit, Trash2 } from 'lucide-react';
import styles from './AdminList.module.css';

interface AdminListProps {
  onCreateNew: () => void;
  onEdit: (admin: Administracion) => void;
}

export function AdminList({ onCreateNew, onEdit }: AdminListProps) {
  const { data: administraciones, isLoading, error } = useQuery({
    queryKey: ['administraciones'],
    queryFn: adminService.getAll,
  });

  if (isLoading) return <p className={styles.loading}>Cargando administraciones...</p>;
  if (error) return <p className={styles.error}>Error al cargar las administraciones.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Administraciones</h1>
          <p>Gestiona los clientes principales de la plataforma</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={onCreateNew}>
          Nueva Administración
        </Button>
      </div>

      <div className={styles.grid}>
        {administraciones?.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay administraciones registradas.</p>
          </div>
        ) : (
          administraciones?.map((admin: Administracion) => (
            <Card key={admin.id} variant="glass" className={styles.adminCard}>
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <div className={styles.iconBox}><Building2 size={20} /></div>
                  <h3 className={styles.adminName}>{admin.nombre}</h3>
                </div>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => onEdit(admin)} title="Editar"><Edit size={18} /></button>
                  <button className={styles.iconBtnDanger} title="Eliminar"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <div className={styles.details}>
                {admin.cuit && (
                  <p><strong>CUIT:</strong> {admin.cuit}</p>
                )}
                {admin.direccion && (
                  <p className={styles.detailRow}><MapPin size={16} /> {admin.direccion}</p>
                )}
                {admin.telefono && (
                  <p className={styles.detailRow}><Phone size={16} /> {admin.telefono}</p>
                )}
                {admin.email && (
                  <p className={styles.detailRow}><Mail size={16} /> {admin.email}</p>
                )}
                {admin.contacto && (
                  <p className={styles.detailRow}><strong>Contacto:</strong> {admin.contacto}</p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
