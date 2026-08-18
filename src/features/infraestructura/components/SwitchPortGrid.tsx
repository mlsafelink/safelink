import React from 'react';
import type { ElementoPlano } from '@/types/infraestructura';
import styles from './EquipmentGrids.module.css';

interface SwitchPortGridProps {
  cantidadPuertos?: number;
  puertoSeleccionado?: string | null;
  onSelectPuerto?: (puerto: string) => void;
  elementosConectados?: ElementoPlano[];
  switchNombre?: string;
  readOnly?: boolean;
}

export function SwitchPortGrid({
  cantidadPuertos = 24,
  puertoSeleccionado,
  onSelectPuerto,
  elementosConectados = [],
  switchNombre = 'SW-01',
  readOnly = false,
}: SwitchPortGridProps) {
  // Mapa de puerto a elemento conectado (ej: "09" -> ElementoPlano)
  const connectedMap = React.useMemo(() => {
    const map = new Map<string, ElementoPlano>();
    elementosConectados.forEach(elem => {
      if (elem.puerto_canal) {
        // normalizar a 2 dígitos si es numérico
        const clean = elem.puerto_canal.replace(/\D/g, '');
        const formatted = clean.padStart(2, '0');
        map.set(formatted, elem);
        map.set(elem.puerto_canal, elem);
      }
    });
    return map;
  }, [elementosConectados]);

  // Generar pares (impares arriba, pares abajo)
  const columns = Math.ceil(cantidadPuertos / 2);

  return (
    <div className={styles.switchChassis}>
      <div className={styles.chassisHeader}>
        <div className={styles.brandTitle}>
          <span className={styles.brandName}>SafeLink</span>
          <span className={styles.modelTag}>{switchNombre}</span>
          <span className={styles.specTag}>{cantidadPuertos} PUERTOS GIGABIT PoE+</span>
        </div>
        <div className={styles.statusLeds}>
          <span className={styles.ledPwr} title="Power" />
          <span className={styles.ledSys} title="System" />
        </div>
      </div>

      <div className={styles.portsMatrixContainer}>
        {/* Fila Superior (Puertos Impares: 01, 03, 05...) */}
        <div className={styles.portsRow}>
          {Array.from({ length: columns }).map((_, i) => {
            const portNum = (i * 2 + 1).toString().padStart(2, '0');
            const connectedElem = connectedMap.get(portNum);
            const isSelected = puertoSeleccionado === portNum;
            const isOccupied = !!connectedElem;

            return (
              <button
                key={`port-${portNum}`}
                type="button"
                className={`${styles.portBox} ${isOccupied ? styles.portOccupied : ''} ${
                  isSelected ? styles.portSelected : ''
                } ${readOnly ? styles.portReadOnly : ''}`}
                onClick={() => !readOnly && onSelectPuerto?.(portNum)}
                title={
                  connectedElem
                    ? `Puerto ${portNum} ➔ ${connectedElem.codigo} (${connectedElem.nombre})`
                    : `Puerto ${portNum} (Libre)`
                }
              >
                <div className={styles.portLabel}>{portNum}</div>
                <div className={styles.rj45Jack}>
                  <div className={styles.pins} />
                  <div className={styles.clipNotch} />
                </div>
                <div
                  className={`${styles.portLed} ${
                    isOccupied ? (connectedElem?.tipo === 'ap' ? styles.ledAp : styles.ledActive) : styles.ledOff
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Fila Inferior (Puertos Pares: 02, 04, 06...) */}
        <div className={styles.portsRow}>
          {Array.from({ length: columns }).map((_, i) => {
            const portNum = (i * 2 + 2).toString().padStart(2, '0');
            const connectedElem = connectedMap.get(portNum);
            const isSelected = puertoSeleccionado === portNum;
            const isOccupied = !!connectedElem;

            return (
              <button
                key={`port-${portNum}`}
                type="button"
                className={`${styles.portBox} ${styles.portInverted} ${isOccupied ? styles.portOccupied : ''} ${
                  isSelected ? styles.portSelected : ''
                } ${readOnly ? styles.portReadOnly : ''}`}
                onClick={() => !readOnly && onSelectPuerto?.(portNum)}
                title={
                  connectedElem
                    ? `Puerto ${portNum} ➔ ${connectedElem.codigo} (${connectedElem.nombre})`
                    : `Puerto ${portNum} (Libre)`
                }
              >
                <div
                  className={`${styles.portLed} ${
                    isOccupied ? (connectedElem?.tipo === 'ap' ? styles.ledAp : styles.ledActive) : styles.ledOff
                  }`}
                />
                <div className={styles.rj45Jack}>
                  <div className={styles.clipNotch} />
                  <div className={styles.pins} />
                </div>
                <div className={styles.portLabel}>{portNum}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info del puerto seleccionado */}
      {puertoSeleccionado && (
        <div className={styles.portDetailBar}>
          <span className={styles.detailPortTitle}>Puerto [{puertoSeleccionado}]</span>
          {connectedMap.get(puertoSeleccionado) ? (
            <span className={styles.detailConnected}>
              Conectado a: <strong>{connectedMap.get(puertoSeleccionado)?.codigo}</strong> (
              {connectedMap.get(puertoSeleccionado)?.nombre})
            </span>
          ) : (
            <span className={styles.detailFree}>Puerto Disponible / Sin Conexión</span>
          )}
        </div>
      )}
    </div>
  );
}
