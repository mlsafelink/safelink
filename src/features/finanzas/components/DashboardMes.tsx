import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { type Factura } from '@/services/facturaService';
import { formatMonto, isVencida } from '../FinanzasPage';
import styles from './FinanzasDashboard.module.css';

interface Props {
  facturas: Factura[];
}

function getMesActual(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function DashboardMes({ facturas }: Props) {
  const { year, month } = getMesActual();

  const mesActualNombre = new Date(year, month, 1).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  const facturasMes = useMemo(
    () =>
      facturas.filter(f => {
        if (!f.fecha_emision) return false;
        const d = new Date(f.fecha_emision + 'T12:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [facturas, year, month]
  );

  const totalMes = facturasMes.reduce((acc, f) => acc + f.monto_total, 0);
  const cobradas = facturasMes.filter(f => f.estado === 'pagado').length;
  const pendientes = facturasMes.filter(
    f => f.estado !== 'pagado' && !isVencida(f)
  ).length;

  return (
    <div className={styles.mesCard}>
      <div className={styles.mesCardTitle}>
        <TrendingUp size={14} />
        Resumen del Mes — {mesActualNombre}
      </div>

      <div className={styles.mesMain}>
        <div className={styles.mesMainLabel}>Facturado este mes</div>
        <div className={styles.mesMainValue}>{formatMonto(totalMes)}</div>
      </div>

      <div className={styles.mesGrid}>
        <div className={styles.mesStat}>
          <div className={styles.mesStatValue}>{facturasMes.length}</div>
          <div className={styles.mesStatLabel}>Facturas emitidas</div>
        </div>
        <div className={styles.mesStat}>
          <div className={styles.mesStatValue} style={{ color: '#4ade80' }}>
            {cobradas}
          </div>
          <div className={styles.mesStatLabel}>Cobradas</div>
        </div>
        <div className={styles.mesStat}>
          <div className={styles.mesStatValue} style={{ color: '#f87171' }}>
            {pendientes}
          </div>
          <div className={styles.mesStatLabel}>Pendientes</div>
        </div>
      </div>
    </div>
  );
}
