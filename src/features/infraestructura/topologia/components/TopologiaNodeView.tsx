import { memo } from 'react';
import {
  Globe, Server, Wifi, Zap, Printer,
  Shield, Network, CircleDot,
} from 'lucide-react';
import type { TopologiaNodo, TopologiaConexion } from '@/types/topologia';
import styles from './TopologiaNodeView.module.css';

interface Props {
  node: TopologiaNodo;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  connections: TopologiaConexion[];
  onSelect: (node: TopologiaNodo) => void;
  onMouseDown: (e: React.MouseEvent, node: TopologiaNodo) => void;
}

export const TopologiaNodeView = memo(function TopologiaNodeView({
  node,
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
    
    // Contar puertos conectados a este switch
    const downstreamConns = connections.filter(c => c.source_id === node.id);
    const occupiedCount = downstreamConns.length;

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

          {/* Matriz de Puertos RJ45 */}
          <div className={styles.portsGridWrap}>
            <div className={styles.portsHeaderRow}>
              <span>Puertos RJ45</span>
              <span>{occupiedCount} / {totalPorts}</span>
            </div>
            <div className={styles.portsMatrix}>
              {Array.from({ length: totalPorts }).map((_, i) => {
                const portNum = i + 1;
                const isOcc = portNum <= occupiedCount;
                const isPoEPort = portNum <= 8; // Ports 1-8 PoE indicator
                return (
                  <div
                    key={i}
                    className={`${styles.portSquare} ${
                      isOcc ? (isPoEPort ? styles.portPoE : styles.portOccupied) : ''
                    }`}
                    title={`Puerto ${portNum} ${isOcc ? '(Ocupado)' : '(Libre)'}`}
                  />
                );
              })}
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
