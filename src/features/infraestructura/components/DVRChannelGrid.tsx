import React from 'react';
import type { ElementoPlano } from '@/types/infraestructura';
import styles from './EquipmentGrids.module.css';

interface DVRChannelGridProps {
  cantidadCanales?: number;
  canalSeleccionado?: string | null;
  onSelectCanal?: (canal: string) => void;
  camarasConectadas?: ElementoPlano[];
  dvrNombre?: string;
  readOnly?: boolean;
}

export function DVRChannelGrid({
  cantidadCanales = 16,
  canalSeleccionado,
  onSelectCanal,
  camarasConectadas = [],
  dvrNombre = 'DVR-01',
  readOnly = false,
}: DVRChannelGridProps) {
  // Mapa de canal a cámara (ej: "CH01" -> ElementoPlano)
  const connectedMap = React.useMemo(() => {
    const map = new Map<string, ElementoPlano>();
    camarasConectadas.forEach(elem => {
      if (elem.puerto_canal) {
        const clean = elem.puerto_canal.toUpperCase();
        map.set(clean, elem);
        // También soportar "01" como "CH01"
        const num = clean.replace(/\D/g, '').padStart(2, '0');
        map.set(`CH${num}`, elem);
        map.set(num, elem);
      }
    });
    return map;
  }, [camarasConectadas]);

  const columns = Math.ceil(cantidadCanales / 2);

  return (
    <div className={`${styles.switchChassis} ${styles.dvrChassis}`}>
      <div className={styles.chassisHeader}>
        <div className={styles.brandTitle}>
          <span className={styles.brandName}>SafeLink</span>
          <span className={`${styles.modelTag} ${styles.dvrModelTag}`}>{dvrNombre}</span>
          <span className={styles.specTag}>{cantidadCanales} CANALES CCTV 4K</span>
        </div>
        <div className={styles.statusLeds}>
          <span className={styles.ledPwr} title="Power" />
          <span className={styles.ledRec} title="HDD Record" />
        </div>
      </div>

      <div className={styles.portsMatrixContainer}>
        {/* Fila Superior: CH01, CH02, CH03... */}
        <div className={styles.portsRow}>
          {Array.from({ length: columns }).map((_, i) => {
            const num = (i + 1).toString().padStart(2, '0');
            const chName = `CH${num}`;
            const connectedCam = connectedMap.get(chName) || connectedMap.get(num);
            const isSelected =
              canalSeleccionado === chName || canalSeleccionado === num;
            const isOccupied = !!connectedCam;

            return (
              <button
                key={`ch-${chName}`}
                type="button"
                className={`${styles.portBox} ${styles.dvrChannelBox} ${
                  isOccupied ? styles.dvrChannelOccupied : ''
                } ${isSelected ? styles.dvrChannelSelected : ''} ${
                  readOnly ? styles.portReadOnly : ''
                }`}
                onClick={() => !readOnly && onSelectCanal?.(chName)}
                title={
                  connectedCam
                    ? `${chName} ➔ ${connectedCam.codigo} (${connectedCam.nombre})`
                    : `${chName} (Disponible)`
                }
              >
                <div className={styles.portLabel}>{chName}</div>
                <div className={styles.bncJack}>
                  <div className={styles.bncOuter}>
                    <div className={styles.bncInner} />
                  </div>
                </div>
                <div
                  className={`${styles.portLed} ${
                    isOccupied ? styles.ledRec : styles.ledOff
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Fila Inferior: CH(cols+1)... */}
        <div className={styles.portsRow}>
          {Array.from({ length: columns }).map((_, i) => {
            const num = (i + columns + 1).toString().padStart(2, '0');
            const chName = `CH${num}`;
            const connectedCam = connectedMap.get(chName) || connectedMap.get(num);
            const isSelected =
              canalSeleccionado === chName || canalSeleccionado === num;
            const isOccupied = !!connectedCam;

            return (
              <button
                key={`ch-${chName}`}
                type="button"
                className={`${styles.portBox} ${styles.dvrChannelBox} ${
                  isOccupied ? styles.dvrChannelOccupied : ''
                } ${isSelected ? styles.dvrChannelSelected : ''} ${
                  readOnly ? styles.portReadOnly : ''
                }`}
                onClick={() => !readOnly && onSelectCanal?.(chName)}
                title={
                  connectedCam
                    ? `${chName} ➔ ${connectedCam.codigo} (${connectedCam.nombre})`
                    : `${chName} (Disponible)`
                }
              >
                <div
                  className={`${styles.portLed} ${
                    isOccupied ? styles.ledRec : styles.ledOff
                  }`}
                />
                <div className={styles.bncJack}>
                  <div className={styles.bncOuter}>
                    <div className={styles.bncInner} />
                  </div>
                </div>
                <div className={styles.portLabel}>{chName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info del canal seleccionado */}
      {canalSeleccionado && (
        <div className={styles.portDetailBar}>
          <span className={`${styles.detailPortTitle} ${styles.detailDvrTitle}`}>
            Canal [{canalSeleccionado}]
          </span>
          {connectedMap.get(canalSeleccionado) ? (
            <span className={styles.detailConnected}>
              Conectado a: <strong>{connectedMap.get(canalSeleccionado)?.codigo}</strong> (
              {connectedMap.get(canalSeleccionado)?.nombre})
            </span>
          ) : (
            <span className={styles.detailFree}>Canal Disponible / Sin Cámara Asignada</span>
          )}
        </div>
      )}
    </div>
  );
}
