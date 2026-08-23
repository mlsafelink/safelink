import { useState } from 'react';
import { GitBranch, X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import type { TopologiaNodo, TopologiaConexion, TipoConexionTopologia } from '@/types/topologia';
import styles from './ConectarModal.module.css';

interface Props {
  nodos: TopologiaNodo[];
  initialSourceId?: string | null;
  onSave: (conn: TopologiaConexion) => void;
  onClose: () => void;
}

export function ConectarModal({ nodos, initialSourceId, onSave, onClose }: Props) {
  const [sourceId, setSourceId] = useState(initialSourceId || (nodos[0]?.id ?? ''));
  const [targetId, setTargetId] = useState(
    nodos.find(n => n.id !== (initialSourceId || nodos[0]?.id))?.id ?? ''
  );
  const [tipoConexion, setTipoConexion] = useState<TipoConexionTopologia>('datos');
  const [puerto, setPuerto] = useState('');
  const [notas, setNotas] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) return;

    const newConn: TopologiaConexion = {
      id: `conn-${Date.now()}`,
      source_id: sourceId,
      target_id: targetId,
      tipo_conexion: tipoConexion,
      puerto: puerto.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    onSave(newConn);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <GitBranch size={20} />
            </div>
            <div>
              <h3 className={styles.title}>Nueva Conexión de Red</h3>
              <p className={styles.subtitle}>Vincular dos nodos en la topología</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>1. Equipo Origen (Uplink / Switch / Modem / PoE)</label>
            <select
              className={styles.select}
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
              required
            >
              {nodos.map(n => (
                <option key={n.id} value={n.id}>
                  {n.codigo} — {n.nombre} ({n.tipo.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>2. Equipo Destino (Dispositivo / Patch / PoE)</label>
            <select
              className={styles.select}
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              required
            >
              {nodos
                .filter(n => n.id !== sourceId)
                .map(n => (
                  <option key={n.id} value={n.id}>
                    {n.codigo} — {n.nombre} ({n.tipo.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>3. Tipo de Conexión</label>
            <div className={styles.typeCards}>
              <div
                className={`${styles.typeCard} ${tipoConexion === 'datos' ? styles.typeCardSelected : ''}`}
                onClick={() => setTipoConexion('datos')}
              >
                <span className={`${styles.typeLine} ${styles.lineDatos}`}>──────</span>
                <span className={styles.typeCardTitle}>Datos / Red</span>
              </div>

              <div
                className={`${styles.typeCard} ${tipoConexion === 'poe' ? styles.typeCardSelected : ''}`}
                onClick={() => setTipoConexion('poe')}
              >
                <span className={`${styles.typeLine} ${styles.linePoe}`}>- - - -</span>
                <span className={styles.typeCardTitle}>Alimentación PoE</span>
              </div>

              <div
                className={`${styles.typeCard} ${tipoConexion === 'inalambrico' ? styles.typeCardSelected : ''}`}
                onClick={() => setTipoConexion('inalambrico')}
              >
                <span className={`${styles.typeLine} ${styles.lineInalambrico}`}>········</span>
                <span className={styles.typeCardTitle}>Inalámbrico</span>
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Puerto / Canal físico (Opcional)</label>
            <input
              type="text"
              placeholder="ej: Puerto 12, Boca A3, Canal WAN"
              className={styles.input}
              value={puerto}
              onChange={e => setPuerto(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Notas técnicas (Opcional)</label>
            <input
              type="text"
              placeholder="ej: Cable Cat 6 UTP Exterior 25m"
              className={styles.input}
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          <div className={styles.footer}>
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar Conexión
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
