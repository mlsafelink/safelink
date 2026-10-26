import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Award, FileText } from 'lucide-react';
import { type Factura, esFacturaArca } from '@/services/facturaService';
import { formatMonto } from '../FinanzasPage';
import { DiscriminacionIngresosCard } from './DiscriminacionIngresosCard';
import styles from './FinanzasDashboard.module.css';

interface Props {
  facturas: Factura[];
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function EstadisticasAnuales({ facturas }: Props) {
  const anioActual = new Date().getFullYear();

  const facturasAnio = useMemo(
    () =>
      facturas.filter(f => {
        if (!f.fecha_emision) return false;
        return new Date(f.fecha_emision + 'T12:00:00').getFullYear() === anioActual;
      }),
    [facturas, anioActual]
  );

  // Facturación por mes con discriminación ARCA vs Sin Datos
  const facturacionPorMes = useMemo(() => {
    const mapa = Array.from({ length: 12 }, (_, i) => ({
      mes: MESES[i],
      total: 0,
      cantidad: 0,
      conFactura: 0,
      sinDatos: 0,
    }));
    facturasAnio.forEach(f => {
      const m = new Date(f.fecha_emision! + 'T12:00:00').getMonth();
      mapa[m].total += f.monto_total;
      mapa[m].cantidad += 1;
      if (esFacturaArca(f)) {
        mapa[m].conFactura += 1;
      } else {
        mapa[m].sinDatos += 1;
      }
    });
    return mapa;
  }, [facturasAnio]);

  const totalAnualConNumeracion = useMemo(
    () => facturasAnio.filter(f => esFacturaArca(f)).length,
    [facturasAnio]
  );
  const totalAnualSinDatos = facturasAnio.length - totalAnualConNumeracion;

  // Clientes top anual (top 3)
  const clientesTop = useMemo(() => {
    const mapa = new Map<string, { nombre: string; total: number }>();
    facturasAnio.forEach(f => {
      const nombre = (f.consorcios as any)?.nombre ?? 'Desconocido';
      const prev = mapa.get(f.consorcio_id) ?? { nombre, total: 0 };
      mapa.set(f.consorcio_id, { nombre, total: prev.total + f.monto_total });
    });
    return [...mapa.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [facturasAnio]);

  // Mayor factura del año
  const mayorFactura = useMemo(() => {
    if (facturasAnio.length === 0) return null;
    return facturasAnio.reduce((max, f) => (f.monto_total > max.monto_total ? f : max));
  }, [facturasAnio]);

  const totalAnual = facturasAnio.reduce((acc, f) => acc + f.monto_total, 0);
  const promedioPorTrabajoAnual =
    facturasAnio.length > 0 ? totalAnual / facturasAnio.length : 0;

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding: '0.6rem 1rem',
          fontSize: '0.8rem',
          color: '#e2e8f0',
        }}>
          <strong>{label}</strong>
          <div style={{ color: '#60a5fa', marginTop: '0.2rem' }}>
            {formatMonto(payload[0].value)}
          </div>
          {payload[1] && (
            <div style={{ color: '#94a3b8' }}>{payload[1].value} facturas</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.anualSection}>
      <div className={styles.anualTitle}>
        <TrendingUp size={14} />
        Estadísticas Anuales {anioActual}
      </div>

      <div className={styles.anualGrid}>

        {/* Gráfico facturación mensual */}
        <div className={`${styles.anualCard}`} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.anualCardTitle}>Facturación mensual</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={facturacionPorMes} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="mes"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {facturacionPorMes.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.total > 0 ? '#2563eb' : 'rgba(37,99,235,0.15)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico cantidad de facturas por mes */}
        <div className={styles.anualCard}>
          <div className={styles.anualCardTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span>Facturas emitidas por mes</span>
            <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'none' }}>
              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                {totalAnualConNumeracion} con N° ARCA
              </span>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
                {totalAnualSinDatos} Sin Datos
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={facturacionPorMes} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="mes"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{
                        background: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.8rem',
                        fontSize: '0.78rem',
                        color: '#e2e8f0',
                      }}>
                        <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{label}</strong>
                        <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>●</span> Con numeración ARCA: <strong>{data.conFactura}</strong>
                        </div>
                        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span>●</span> Sin Datos: <strong>{data.sinDatos}</strong>
                        </div>
                        <div style={{ color: '#60a5fa', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.35rem', paddingTop: '0.25rem', fontWeight: 700 }}>
                          Total registros: {data.cantidad}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="conFactura" name="Con numeración ARCA" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={24} />
              <Bar dataKey="sinDatos" name="Sin Datos" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rankings */}
        <div className={styles.anualCard}>
          <div className={styles.anualCardTitle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={12} />
              Clientes top del año
            </div>
          </div>
          <div className={styles.rankingList}>
            {clientesTop.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Sin datos este año</p>
            ) : (
              clientesTop.map((c, i) => (
                <div key={i} className={styles.rankingItem}>
                  <span className={styles.rankingPos}>#{i + 1}</span>
                  <span className={styles.rankingName}>{c.nombre}</span>
                  <span className={styles.rankingMonto}>{formatMonto(c.total)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* KPIs anuales */}
        <div className={styles.anualCard}>
          <div className={styles.anualCardTitle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={12} />
              Resumen anual
            </div>
          </div>
          <div className={styles.rankingList}>
            <div className={styles.rankingItem}>
              <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Total anual</span>
              <span className={styles.rankingMonto}>{formatMonto(totalAnual)}</span>
            </div>
            <div className={styles.rankingItem}>
              <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Facturas emitidas</span>
              <span className={styles.rankingMonto}>{facturasAnio.length}</span>
            </div>
            <div className={styles.rankingItem}>
              <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Con N° ARCA</span>
              <span className={styles.rankingMonto} style={{ color: '#34d399' }}>{totalAnualConNumeracion}</span>
            </div>
            <div className={styles.rankingItem}>
              <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Sin Datos</span>
              <span className={styles.rankingMonto} style={{ color: '#94a3b8' }}>{totalAnualSinDatos}</span>
            </div>
            <div className={styles.rankingItem}>
              <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Promedio por trabajo</span>
              <span className={styles.rankingMonto}>{formatMonto(promedioPorTrabajoAnual)}</span>
            </div>
            {mayorFactura && (
              <div className={styles.rankingItem}>
                <span className={styles.rankingName} style={{ color: '#94a3b8' }}>Mayor factura</span>
                <span className={styles.rankingMonto}>{formatMonto(mayorFactura.monto_total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nueva Card: Discriminación de Ingresos (Facturas ARCA vs Sin Datos) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <DiscriminacionIngresosCard facturas={facturas} />
        </div>
      </div>
    </div>
  );
}
