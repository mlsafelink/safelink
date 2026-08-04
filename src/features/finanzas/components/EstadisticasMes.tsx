import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { type Factura } from '@/services/facturaService';
import { formatMonto } from '../FinanzasPage';
import styles from './FinanzasDashboard.module.css';

interface Props {
  facturas: Factura[];
}

export function EstadisticasMes({ facturas }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

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

  // Días únicos con facturas
  const diasTrabajados = useMemo(() => {
    const fechas = new Set(facturasMes.map(f => f.fecha_emision));
    return fechas.size;
  }, [facturasMes]);

  const promedioPorJornada = diasTrabajados > 0 ? totalMes / diasTrabajados : 0;

  // Trabajo de mayor importe
  const mayorImporte = useMemo(() => {
    if (facturasMes.length === 0) return null;
    return facturasMes.reduce((max, f) => (f.monto_total > max.monto_total ? f : max));
  }, [facturasMes]);

  // Cliente que más facturó
  const clienteTop = useMemo(() => {
    const mapa = new Map<string, { nombre: string; total: number }>();
    facturasMes.forEach(f => {
      const nombre = (f.consorcios as any)?.nombre ?? 'Desconocido';
      const prev = mapa.get(f.consorcio_id) ?? { nombre, total: 0 };
      mapa.set(f.consorcio_id, { nombre, total: prev.total + f.monto_total });
    });
    if (mapa.size === 0) return null;
    return [...mapa.values()].reduce((top, v) => (v.total > top.total ? v : top));
  }, [facturasMes]);

  return (
    <div className={styles.estMesCard}>
      <div className={styles.estMesTitle}>
        <BarChart3 size={14} />
        Estadísticas del Mes
      </div>

      <div className={styles.estMesGrid}>
        <div className={styles.estMesStat}>
          <div className={styles.estMesStatValue}>{formatMonto(totalMes)}</div>
          <div className={styles.estMesStatLabel}>Facturación total</div>
        </div>
        <div className={styles.estMesStat}>
          <div className={styles.estMesStatValue}>{diasTrabajados}</div>
          <div className={styles.estMesStatLabel}>Días trabajados</div>
        </div>
        <div className={styles.estMesStat}>
          <div className={styles.estMesStatValue}>{diasTrabajados > 0 ? formatMonto(promedioPorJornada) : '—'}</div>
          <div className={styles.estMesStatLabel}>Promedio por jornada</div>
        </div>
        <div className={styles.estMesStat}>
          <div className={styles.estMesStatValue} style={{ fontSize: '1rem' }}>
            {mayorImporte ? formatMonto(mayorImporte.monto_total) : '—'}
          </div>
          <div className={styles.estMesStatLabel}>Mayor importe</div>
          {mayorImporte && (
            <div className={styles.estMesStatSub}>
              {(mayorImporte.consorcios as any)?.nombre ?? '—'}
            </div>
          )}
        </div>
        <div className={`${styles.estMesStat} ${styles.estMesStatFull}`}>
          <div className={styles.estMesStatValue} style={{ fontSize: '1rem' }}>
            {clienteTop ? clienteTop.nombre : '—'}
          </div>
          <div className={styles.estMesStatLabel}>Cliente top del mes</div>
          {clienteTop && (
            <div className={styles.estMesStatSub}>{formatMonto(clienteTop.total)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
