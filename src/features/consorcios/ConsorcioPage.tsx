import { useState } from 'react';
import { ConsorcioList } from './ConsorcioList';
import { ConsorcioForm } from './ConsorcioForm';
import { type Consorcio } from '@/services/consorcioService';

export function ConsorcioPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingConsorcio, setEditingConsorcio] = useState<Consorcio | null>(null);

  const handleCreateNew = () => {
    setEditingConsorcio(null);
    setView('form');
  };

  const handleEdit = (consorcio: Consorcio) => {
    setEditingConsorcio(consorcio);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditingConsorcio(null);
  };

  if (view === 'form') {
    const initialData = editingConsorcio
      ? {
          id: editingConsorcio.id,
          administracion_id: editingConsorcio.administracion_id,
          nombre: editingConsorcio.nombre,
          direccion: editingConsorcio.direccion || '',
          localidad: editingConsorcio.localidad || '',
          provincia: editingConsorcio.provincia || '',
          codigo_postal: editingConsorcio.codigo_postal || '',
          // El form usa string internamente, el onSubmit convierte a número antes de enviar
          cantidad_pisos: editingConsorcio.cantidad_pisos != null ? String(editingConsorcio.cantidad_pisos) : '',
          cantidad_unidades: editingConsorcio.cantidad_unidades != null ? String(editingConsorcio.cantidad_unidades) : '',
          encargado: editingConsorcio.encargado || '',
          telefono_encargado: editingConsorcio.telefono_encargado || '',
          administrador_responsable: editingConsorcio.administrador_responsable || '',
          observaciones: editingConsorcio.observaciones || '',
        }
      : undefined;
      
    return <ConsorcioForm onBack={handleBack} initialData={initialData} />;
  }

  return <ConsorcioList onCreateNew={handleCreateNew} onEdit={handleEdit} />;
}
