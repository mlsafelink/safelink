import { useState } from 'react';
import { ParticularList } from './ParticularList';
import { ParticularForm } from './ParticularForm';
import { type Particular } from '@/services/particularService';

export function ParticularPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingParticular, setEditingParticular] = useState<Particular | null>(null);

  const handleCreateNew = () => {
    setEditingParticular(null);
    setView('form');
  };

  const handleEdit = (particular: Particular) => {
    setEditingParticular(particular);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setEditingParticular(null);
  };

  if (view === 'form') {
    return (
      <ParticularForm
        onBack={handleBack}
        initialData={
          editingParticular
            ? {
                id: editingParticular.id,
                nombre: editingParticular.nombre,
                direccion: editingParticular.direccion || '',
              }
            : undefined
        }
      />
    );
  }

  return <ParticularList onCreateNew={handleCreateNew} onEdit={handleEdit} />;
}
