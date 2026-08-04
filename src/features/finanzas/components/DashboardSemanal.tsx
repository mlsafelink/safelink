import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { type Factura } from '@/services/facturaService';
import { formatMonto } from '../FinanzasPage';
import styles from './FinanzasDashboard.module.css';

interface Props {
  facturas: Factura[];
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getLunesYDomingoSemanaActual(): { lunes: Date; domingo: Date } {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=Dom, 1=Lun ...
  const offsetLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + offsetLunes);
  lunes.setHours(0, 0, 0, 0);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return { lunes, domingo };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function DashboardSemanal({ facturas }: Props) {
  const { lunes, domingo } = useMemo(getLunesYDomingoSemanaActual, []);

  const semanaRange = useMemo(() => {
    const dias: Date[] = [];
    const cur = new Date(lunes);
    while (cur <= domingo) {
      dias.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dias;
  }, [lunes, domingo]);

  const facturasSemana = useMemo(() => {
    return facturas.filter(f => {
      if (!f.fecha_emision) return false;
      const d = new Date(f.fecha_emision + 'T12:00:00');
      return d >= lunes && d <= domingo;
    });
  }, [facturas, lunes, domingo]);

  const totalSemana = facturasSemana.reduce((acc, f) => acc + f.monto_total, 0);

  const diasConActividad = semanaRange.filter(dia =>
    facturasSemana.some(f => {
      const d = new Date(f.fecha_emision! + 'T12:00:00');
      return isSameDay(d, dia);
    })
  );

  const diasTrabajados = diasConActividad.length;
  const promedioPorDia = diasTrabajados > 0 ? totalSemana / diasTrabajados : 0;

  const semanaLabel = `${lunes.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} — ${domingo.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;

  return (
    <div className={styles.semanaCard}>
      <div className={styles.semanaTitle}>
        <CalendarDays size={14} />
        Semana Actual — {semanaLabel}
      </div>

      <div className={styles.semanaRows}>
        {semanaRange.map(dia => {
          const facturasDelDia = facturasSemana.filter(f => {
            const d = new Date(f.fecha_emision! + 'T12:00:00');
            return isSameDay(d, dia);
          });
          const totalDia = facturasDelDia.reduce((acc, f) => acc + f.monto_total, 0);
          const tieneActividad = facturasDelDia.length > 0;
          const esHoy = isSameDay(dia, new Date());

          return (
            <div
              key={dia.toISOString()}
              className={`${styles.semanaRow} ${tieneActividad ? styles.semanaRowActivo : ''}`}
            >
              <span className={styles.semanaDia} style={esHoy ? { color: '#fff', fontWeight: 700 } : undefined}>
                {DIAS_SEMANA[dia.getDay()]}
                {esHoy && <span style={{ fontSize: '0.65rem', marginLeft: '0.35rem', color: '#a78bfa' }}>hoy</span>}
              </span>
              {tieneActividad ? (
                <>
                  <span className={`${styles.semanaInfo} ${styles.semanaInfoActivo}`}>
                    ✅ {facturasDelDia.length} factura{facturasDelDia.length > 1 ? 's' : ''} emitida{facturasDelDia.length > 1 ? 's' : ''}
                  </span>
                  <span className={styles.semanaMonto}>{formatMonto(totalDia)}</span>
                </>
              ) : (
                <span className={styles.semanaInfo}>Sin actividad</span>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.semanaFooter}>
        <div className={styles.semanaFooterStat}>
          <div className={styles.semanaFooterValue}>{formatMonto(totalSemana)}</div>
          <div className={styles.semanaFooterLabel}>Total semanal</div>
        </div>
        <div className={styles.semanaFooterStat}>
          <div className={styles.semanaFooterValue}>{diasTrabajados}</div>
          <div className={styles.semanaFooterLabel}>Días trabajados</div>
        </div>
        <div className={styles.semanaFooterStat}>
          <div className={styles.semanaFooterValue}>{diasTrabajados > 0 ? formatMonto(promedioPorDia) : '—'}</div>
          <div className={styles.semanaFooterLabel}>Prom. por día</div>
        </div>
      </div>
    </div>
  );
}
