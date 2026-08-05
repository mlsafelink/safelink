import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaultService } from '@/services/vaultService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/ToastContext';
import { VaultCard } from './VaultCard';
import { VaultSkeleton } from './VaultSkeleton';
import { VaultForm } from './VaultForm';
import { VaultDetalle } from './VaultDetalle';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Lock, Plus, Search, Shield, X, AlertCircle, Trash2
} from 'lucide-react';
import styles from './BóvedaPage.module.css';

type View = 'list' | 'form' | 'detalle';

export function BóvedaPage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [view, setView] = useState<View>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: ['vault'],
    queryFn: vaultService.getAll,
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vaultService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      toast.success('Ficha eliminada de la Bóveda.');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Error al eliminar la ficha.');
      setDeletingId(null);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter(e =>
      e.nombre_consorcio.toLowerCase().includes(q) ||
      (e.direccion?.toLowerCase().includes(q) ?? false) ||
      (e.serial_number?.toLowerCase().includes(q) ?? false)
    );
  }, [entries, search]);

  // ── Navegación ───────────────────────────────────────────────────────────

  const goList = () => {
    setView('list');
    setEditingId(null);
    setDetalleId(null);
  };

  const goNew = () => {
    setEditingId(null);
    setView('form');
  };

  const goEdit = (id: string) => {
    setEditingId(id);
    setView('form');
  };

  const goDetalle = (id: string) => {
    setDetalleId(id);
    setView('detalle');
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = () => {
    if (deletingId) deleteMutation.mutate(deletingId);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <VaultForm
        editingId={editingId}
        onBack={goList}
        onDeleted={goList}
      />
    );
  }

  if (view === 'detalle' && detalleId) {
    return (
      <VaultDetalle
        entryId={detalleId}
        onBack={goList}
        onEdit={id => goEdit(id)}
        onDeleted={goList}
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Lock size={24} />
          </div>
          <div>
            <h1>Bóveda Segura</h1>
            <p>Credenciales y accesos de equipos DVR/XVR</p>
          </div>
        </div>
        <Button variant="primary" leftIcon={<Plus size={16} />} onClick={goNew}>
          Nueva Ficha
        </Button>
      </div>

      {/* Buscador */}
      <Card variant="glass" className={styles.searchCard}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre, dirección o número de serie…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        {!isLoading && (
          <p className={styles.count}>
            <Shield size={13} />
            {entries.length} {entries.length === 1 ? 'ficha' : 'fichas'} en la bóveda
            {search && ` · ${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </Card>

      {/* Error state */}
      {isError && (
        <Card variant="glass" className={styles.errorCard}>
          <AlertCircle size={20} />
          <p>Error al cargar la bóveda. Verificá la conexión e intentá nuevamente.</p>
          <Button variant="secondary" onClick={() => queryClient.invalidateQueries({ queryKey: ['vault'] })}>
            Reintentar
          </Button>
        </Card>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <VaultSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && entries.length === 0 && (
        <Card variant="neumorphic" className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <Lock size={40} />
          </div>
          <h2>La bóveda está vacía</h2>
          <p>Guardá las credenciales de acceso de tus equipos DVR/XVR de forma organizada.</p>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={goNew}>
            Crear primera ficha
          </Button>
        </Card>
      )}

      {/* No results */}
      {!isLoading && !isError && entries.length > 0 && filtered.length === 0 && (
        <Card variant="glass" className={styles.emptyCard}>
          <Search size={32} className={styles.emptySearchIcon} />
          <h2>Sin resultados</h2>
          <p>No se encontraron fichas para "<strong>{search}</strong>"</p>
          <Button variant="secondary" onClick={() => setSearch('')}>
            Limpiar búsqueda
          </Button>
        </Card>
      )}

      {/* Grid de fichas */}
      {!isLoading && filtered.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            className={styles.grid}
            initial={false}
          >
            {filtered.map(entry => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <VaultCard
                  entry={entry}
                  onOpen={goDetalle}
                  onEdit={goEdit}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalIcon}>
                <Trash2 size={28} />
              </div>
              <h3>¿Eliminar esta ficha?</h3>
              <p>Esta acción no se puede deshacer. La ficha será eliminada permanentemente de la Bóveda.</p>
              <div className={styles.modalActions}>
                <Button
                  variant="primary"
                  isLoading={deleteMutation.isPending}
                  onClick={confirmDelete}
                >
                  Sí, eliminar
                </Button>
                <Button variant="secondary" onClick={() => setDeletingId(null)}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
