import { useState } from 'react';
import { X, Network, Wifi, Video, Radio, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import type { TopologiaTipo } from '@/types/topologia';
import styles from './NuevaTopologiaModal.module.css';

interface NuevaTopologiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientAddress?: string;
  onSubmit: (data: { nombre: string; descripcion: string; tipo: TopologiaTipo }) => void;
}

const TOPOLOGY_TYPES: { id: TopologiaTipo; label: string; icon: React.ReactNode }[] = [
  { id: 'red_general', label: 'Red General', icon: <Network size={20} /> },
  { id: 'wifi', label: 'WiFi', icon: <Wifi size={20} /> },
  { id: 'cctv', label: 'CCTV / Cámaras', icon: <Video size={20} /> },
  { id: 'enlaces', label: 'Enlaces', icon: <Radio size={20} /> },
  { id: 'otra', label: 'Otra Topología', icon: <Layers size={20} /> },
];

export function NuevaTopologiaModal({
  isOpen,
  onClose,
  clientName,
  clientAddress,
  onSubmit,
}: NuevaTopologiaModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TopologiaTipo>('red_general');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipo,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <Plus size={20} />
            </div>
            <div>
              <h3 className={styles.title}>Nueva Topología de Red</h3>
              <p className={styles.subtitle}>Crear un nuevo diagrama técnico independiente</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {/* Contexto: Cliente e Instalación */}
            <div className={styles.contextBox}>
              <div className={styles.contextRow}>
                <span className={styles.contextLabel}>Cliente:</span>
                <span className={styles.contextValue}>{clientName}</span>
              </div>
              {clientAddress && (
                <div className={styles.contextRow}>
                  <span className={styles.contextLabel}>Instalación:</span>
                  <span className={styles.contextValue}>{clientAddress}</span>
                </div>
              )}
            </div>

            {/* Nombre de Topología */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Nombre de la Topología <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="ej: Red General, Enlace WiFi Exterior, Rack PB..."
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Tipo de Topología */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tipo de Topología</label>
              <div className={styles.typeGrid}>
                {TOPOLOGY_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.typeCard} ${tipo === t.id ? styles.typeCardActive : ''}`}
                    onClick={() => setTipo(t.id)}
                  >
                    {t.icon}
                    <span className={styles.typeTitle}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Descripción (opcional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Notas adicionales o alcance del diagrama..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.footer}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={!nombre.trim()}>
              Crear Topología
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
