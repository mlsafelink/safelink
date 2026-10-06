import { memo } from 'react';
import {
  Globe, Server, Wifi, Zap, Printer,
  Shield, Network, CircleDot,
} from 'lucide-react';
import type { TopologiaNodo, TopologiaConexion } from '@/types/topologia';
import styles from './TopologiaNodeView.module.css';

interface Props {
  node: TopologiaNodo;
  nodes?: TopologiaNodo[];
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  connections: TopologiaConexion[];
  onSelect: (node: TopologiaNodo) => void;
  onMouseDown: (e: React.MouseEvent, node: TopologiaNodo) => void;
}

export const TopologiaNodeView = memo(function TopologiaNodeView({
  node,
  nodes,
  isSelected,
  isHighlighted,
  isDimmed,
  connections,
  onSelect,
  onMouseDown,
}: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node);
  };

  // 1. WAN / INTERNET
  if (node.codigo === 'INTERNET') {
    return (
      <div
        className={`${styles.nodeWrapper} ${isSelected ? styles.nodeSelected : ''} ${
          isHighlighted ? styles.nodeHighlighted : ''
        } ${isDimmed ? styles.nodeDimmed : ''}`}
        style={{ left: `${node.x}px`, top: `${node.y}px` }}
        onMouseDown={e => onMouseDown(e, node)}
        onClick={handleClick}
      >
        <div className={styles.wanNode}>
          <div className={styles.wanCircle}>
            <div className={styles.wanPulse} />
            <Globe size={28} />
          </div>
          <span className={styles.wanLabel}>INTERNET</span>
        </div>
      </div>
    );
  }

  // 2. MÓDEM
  if (node.tipo === 'modem') {
    const props = node.propiedades as any;
    return (
      <div
        className={`${styles.nodeWrapper} ${isSelected ? styles.nodeSelected : ''} ${
          isHighlighted ? styles.nodeHighlighted : ''
        } ${isDimmed ? styles.nodeDimmed : ''}`}
        style={{ left: `${node.x}px`, top: `${node.y}px` }}
        onMouseDown={e => onMouseDown(e, node)}
        onClick={handleClick}
      >
        <div className={styles.modemCard}>
          <div className={styles.modemHeader}>
            <div className={styles.modemTitleRow}>
              <Globe size={18} className={styles.modemIcon} />
              <span className={styles.nodeCode}>{node.codigo}</span>
            </div>
            {props?.proveedor && (
              <span className={styles.modemIspBadge}>{props.proveedor}</span>
            )}
          </div>
          <div className={styles.modemDetails}>
            <span>{props?.ip || '192.168.1.1'}</span>
            <span>{props?.tipoConexion || 'Fibra'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. SWITCH
  if (node.tipo === 'switch') {
    const props = node.propiedades as any;
    const totalPorts = props?.cantidadPuertos || 16;
    const columns = Math.ceil(totalPorts / 2);

    interface PortOccupancy {
      isOccupied: boolean;
      isPoE: boolean;
      targetCode?: string;
      targetName?: string;
    }

    const portMap = new Map<number, PortOccupancy>();

    // Conexiones salientes desde este switch
    const downstreamConns = connections.filter(c => c.source_id === node.id);

    // Conexiones o dispositivos sin número de puerto explícito
    const unassignedItems: Array<{ isPoE: boolean; targetCode?: string; targetName?: string }> = [];

    downstreamConns.forEach(c => {
      let target = nodes?.find(n => n.id === c.target_id);

      // Si el destino es una fuente PoE intermedia, buscar el dispositivo conectado a ella
      if (target?.tipo === 'fuente_poe' || target?.is_intermediate_poe) {
        const poeConn = connections.find(c2 => c2.source_id === target!.id);
        if (poeConn) {
          const ep = nodes?.find(n => n.id === poeConn.target_id);
          if (ep) target = ep;
        }
      }

      // Extraer número de puerto (ej: "04" -> 4, "Pto 4" -> 4, "Puerto 2" -> 2)
      let portNum: number | null = null;
      if (c.puerto) {
        const parsed = parseInt(c.puerto.replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPorts) {
          portNum = parsed;
        }
      }
      if (portNum === null && target?.puerto_canal) {
        const parsed = parseInt(target.puerto_canal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPorts) {
          portNum = parsed;
        }
      }
      if (portNum === null && (target?.propiedades as any)?.puertoNumero) {
        const parsed = parseInt(String((target!.propiedades as any).puertoNumero).replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPorts) {
          portNum = parsed;
        }
      }

      const isPoE = !!(
        target?.is_intermediate_poe ||
        (target?.propiedades as any)?.use_poe_injector ||
        target?.tipo === 'ap' ||
        (portNum && portNum <= 8)
      );

      if (portNum !== null) {
        portMap.set(portNum, {
          isOccupied: true,
          isPoE,
          targetCode: target?.codigo,
          targetName: target?.nombre,
        });
      } else {
        unassignedItems.push({
          isPoE,
          targetCode: target?.codigo,
          targetName: target?.nombre,
        });
      }
    });

    // Revisar nodos hijos asignados a este switch por parent_element_id que no tengan conexión explícita
    nodes?.forEach(n => {
      const isChild = n.parent_element_id === node.id || (node.elemento_id && n.parent_element_id === node.elemento_id);
      if (isChild && n.puerto_canal) {
        const parsed = parseInt(n.puerto_canal.replace(/[^\d]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPorts && !portMap.has(parsed)) {
          const isPoE = !!((n.propiedades as any)?.use_poe_injector || n.tipo === 'ap' || parsed <= 8);
          portMap.set(parsed, {
            isOccupied: true,
            isPoE,
            targetCode: n.codigo,
            targetName: n.nombre,
          });
        }
      }
    });

    // Asignar los dispositivos sin puerto explícito a los primeros puertos libres disponibles
    let unassignedIdx = 0;
    for (let p = 1; p <= totalPorts && unassignedIdx < unassignedItems.length; p++) {
      if (!portMap.has(p)) {
        const item = unassignedItems[unassignedIdx++];
        portMap.set(p, {
          isOccupied: true,
          isPoE: item.isPoE,
          targetCode: item.targetCode,
          targetName: item.targetName,
        });
      }
    }

    const occupiedCount = portMap.size;

    return (
      <div
        className={`${styles.nodeWrapper} ${isSelected ? styles.nodeSelected : ''} ${
          isHighlighted ? styles.nodeHighlighted : ''
        } ${isDimmed ? styles.nodeDimmed : ''}`}
        style={{ left: `${node.x}px`, top: `${node.y}px` }}
        onMouseDown={e => onMouseDown(e, node)}
        onClick={handleClick}
      >
        <div className={styles.switchCard}>
          <div className={styles.switchHeader}>
            <div className={styles.switchTitleWrap}>
              <Network size={18} className={styles.switchIcon} />
              <div>
                <span className={styles.nodeCode}>{node.codigo}</span>
                <p className={styles.switchModelSub}>{props?.modelo || 'Switch'}</p>
              </div>
            </div>
            {props?.ip && <span className={styles.switchIpBadge}>{props.ip}</span>}
          </div>

          {/* Matriz de Puertos RJ45 (2 filas: Impares Arriba, Pares Abajo) */}
          <div className={styles.portsGridWrap}>
            <div className={styles.portsHeaderRow}>
              <span>Puertos RJ45</span>
              <span>{occupiedCount} / {totalPorts}</span>
            </div>
            <div className={styles.portsMatrix}>
              {/* Fila Superior: Puertos Impares (1, 3, 5, 7, 9...) */}
              <div
                className={styles.portsRow}
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {Array.from({ length: columns }).map((_, colIdx) => {
                  const portNum = colIdx * 2 + 1;
                  const portInfo = portMap.get(portNum);
                  const isOcc = !!portInfo?.isOccupied;
                  const isPoE = !!portInfo?.isPoE;

                  return (
                    <div
                      key={`port-${portNum}`}
                      className={`${styles.portSquare} ${
                        isOcc ? (isPoE ? styles.portPoE : styles.portOccupied) : ''
                      }`}
                      title={
                        isOcc
                          ? `Puerto ${portNum} ➔ ${portInfo?.targetCode || 'Dispositivo'}${
                              portInfo?.targetName ? ` (${portInfo.targetName})` : ''
                            }`
                          : `Puerto ${portNum} (Libre)`
                      }
                    />
                  );
                })}
              </div>

              {/* Fila Inferior: Puertos Pares (2, 4, 6, 8, 10...) */}
              <div
                className={styles.portsRow}
                style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
              >
                {Array.from({ length: columns }).map((_, colIdx) => {
                  const portNum = colIdx * 2 + 2;
                  if (portNum > totalPorts) return null;
                  const portInfo = portMap.get(portNum);
                  const isOcc = !!portInfo?.isOccupied;
                  const isPoE = !!portInfo?.isPoE;

                  return (
                    <div
                      key={`port-${portNum}`}
                      className={`${styles.portSquare} ${
                        isOcc ? (isPoE ? styles.portPoE : styles.portOccupied) : ''
                      }`}
                      title={
                        isOcc
                          ? `Puerto ${portNum} ➔ ${portInfo?.targetCode || 'Dispositivo'}${
                              portInfo?.targetName ? ` (${portInfo.targetName})` : ''
                            }`
                          : `Puerto ${portNum} (Libre)`
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. FUENTE POE
  if (node.tipo === 'fuente_poe' || node.is_intermediate_poe) {
    const voltage = node.poe_voltage || (node.propiedades as any)?.poe_voltage || '24V';
    const is48 = voltage === '48V';

    return (
      <div
        className={`${styles.nodeWrapper} ${isSelected ? styles.nodeSelected : ''} ${
          isHighlighted ? styles.nodeHighlighted : ''
        } ${isDimmed ? styles.nodeDimmed : ''}`}
        style={{ left: `${node.x}px`, top: `${node.y}px` }}
        onMouseDown={e => onMouseDown(e, node)}
        onClick={handleClick}
      >
        <div className={`${styles.poeCard} ${is48 ? styles.poe48Card : styles.poe24Card}`}>
          <Zap size={14} />
          <span className={styles.poeText}>PoE {voltage}</span>
        </div>
      </div>
    );
  }

  // 5. ENDPOINTS (BOCA, AP, SERVIDOR, IMPRESORA, ROUTER, OTRO)
  const props = node.propiedades as any;
  const usePoe = !!props?.use_poe_injector;
  const poeVoltage = props?.poe_voltage || '24V';

  const renderIcon = () => {
    switch (node.tipo) {
      case 'ap':
        return <Wifi size={16} className={styles.endpointIcon_ap} />;
      case 'servidor':
        return <Server size={16} className={styles.endpointIcon_servidor} />;
      case 'impresora':
        return <Printer size={16} className={styles.endpointIcon_impresora} />;
      case 'router':
        return <Shield size={16} className={styles.endpointIcon_router} />;
      case 'boca':
      default:
        return <CircleDot size={16} className={styles.endpointIcon_boca} />;
    }
  };

  return (
    <div
      className={`${styles.nodeWrapper} ${isSelected ? styles.nodeSelected : ''} ${
        isHighlighted ? styles.nodeHighlighted : ''
      } ${isDimmed ? styles.nodeDimmed : ''}`}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      onMouseDown={e => onMouseDown(e, node)}
      onClick={handleClick}
    >
      <div className={styles.endpointCard}>
        <div className={styles.endpointTopRow}>
          {renderIcon()}
          <div>
            <span className={styles.endpointCode}>{node.codigo}</span>
            <p className={styles.endpointNameSub}>{node.nombre}</p>
          </div>
        </div>

        <div className={styles.endpointBottomRow}>
          {node.puerto_canal ? (
            <span className={styles.portPill}>Pto {node.puerto_canal}</span>
          ) : (
            <span className={styles.portPill}>{props?.piso || 'LAN'}</span>
          )}

          {usePoe && (
            <span className={`${styles.poeVoltagePill} ${poeVoltage === '48V' ? styles.poe48Pill : styles.poe24Pill}`}>
              {poeVoltage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
