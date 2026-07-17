import { useState } from 'react';
import { AdminList } from './AdminList';
import { AdminForm } from './AdminForm';
import { type Administracion } from '@/services/adminService';

export function AdminPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingAdmin, setEditingAdmin] = useState<Administracion | null>(null);

  const handleCreateNew = () => {
    setEditingAdmin(null);
    setView('form');
  };

  const handleEdit = (admin: Administracion) => {
    setEditingAdmin(admin);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditingAdmin(null);
  };

  if (view === 'form') {
    const initialData = editingAdmin
      ? {
          id: editingAdmin.id,
          nombre: editingAdmin.nombre,
          cuit: editingAdmin.cuit || '',
          direccion: editingAdmin.direccion || '',
          contacto: editingAdmin.contacto || '',
          telefono: editingAdmin.telefono || '',
          email: editingAdmin.email || '',
          observaciones: editingAdmin.observaciones || '',
        }
      : undefined;
      
    return <AdminForm onBack={handleBack} initialData={initialData} />;
  }

  return <AdminList onCreateNew={handleCreateNew} onEdit={handleEdit} />;
}
