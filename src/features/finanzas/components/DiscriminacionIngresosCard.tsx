import { useState, useMemo } from 'react';
import {
  FileCheck2,
  FileQuestion,
  Calendar,
  CalendarRange,
  Search,
  ExternalLink,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { type Factura, esFacturaArca } from '@/services/facturaService';
import { formatMonto, formatFechaCorta, isVencida, getEstadoConfig } from '../FinanzasPage';
import styles from './DiscriminacionIngresosCard.module.css';

interface Props {
  facturas: Factura[];
}

type PeriodoFiltro = 'semana' | 'mes' | 'anio' | 'todo';
type TipoComprobanteFiltro = 'todos' | 'con_arca' | 'sin_datos';

function getLunesYDomingoSemana(): { lunes: Date; domingo: Date } {
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

function parseFecha(fechaStr: string | null | undefined): Date | null {
  if (!fechaStr) return null;
  return new Date(fechaStr + 'T12:00:00');
}

export function DiscriminacionIngresosCard({ facturas }: Props) {
  const [periodoActivo, setPeriodoActivo] = useState<PeriodoFiltro>('mes');
  const [tipoFiltro, setTipoFiltro] = useState<TipoComprobanteFiltro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [limiteVista, setLimiteVista] = useState(12);

  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth();
  const { lunes, domingo } = useMemo(getLunesYDomingoSemana, []);

  // Etiqueta de la semana actual
  const labelSemana = useMemo(() => {
    const d1 = lunes.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    const d2 = domingo.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    return `${d1} — ${d2}`;
  }, [lunes, domingo]);

  // Nombre del mes actual
  const labelMes = useMemo(() => {
    return new Date(anioActual, mesActual, 1).toLocaleDateString('es-AR', {
      month: 'long',
      year: 'numeric',
    });
  }, [anioActual, mesActual]);

  // Función para computar métricas de cualquier conjunto de facturas
  const calcularMetricas = (items: Factura[]) => {
    let totalMonto = 0;
    let arcaMonto = 0;
    let arcaCount = 0;
    let sinDatosMonto = 0;
    let sinDatosCount = 0;

    for (const f of items) {
      const monto = f.monto_total || 0;
      totalMonto += monto;
      if (esFacturaArca(f)) {
        arcaMonto += monto;
        arcaCount += 1;
      } else {
        sinDatosMonto += monto;
        sinDatosCount += 1;
      }
    }

    const pctFormalizado = totalMonto > 0 ? Math.round((arcaMonto / totalMonto) * 100) : 0;

    return {
      totalMonto,
      totalCount: items.length,
      arcaMonto,
      arcaCount,
      sinDatosMonto,
      sinDatosCount,
      pctFormalizado,
    };
  };

  // Conjuntos por período
  const facturasSemana = useMemo(() => {
    return facturas.filter(f => {
      const d = parseFecha(f.fecha_emision);
      if (!d) return false;
      return d >= lunes && d <= domingo;
    });
  }, [facturas, lunes, domingo]);

  const facturasMes = useMemo(() => {
    return facturas.filter(f => {
      const d = parseFecha(f.fecha_emision);
      if (!d) return false;
      return d.getFullYear() === anioActual && d.getMonth() === mesActual;
    });
  }, [facturas, anioActual, mesActual]);

  const facturasAnio = useMemo(() => {
    return facturas.filter(f => {
      const d = parseFecha(f.fecha_emision);
      if (!d) return false;
      return d.getFullYear() === anioActual;
    });
  }, [facturas, anioActual]);

  // Métricas de cada período
  const metricasSemana = useMemo(() => calcularMetricas(facturasSemana), [facturasSemana]);
  const metricasMes = useMemo(() => calcularMetricas(facturasMes), [facturasMes]);
  const metricasAnio = useMemo(() => calcularMetricas(facturasAnio), [facturasAnio]);
  const metricasTotal = useMemo(() => calcularMetricas(facturas), [facturas]);

  // Facturas del período actualmente seleccionado para la lista detallada
  const facturasPeriodoSeleccionado = useMemo(() => {
    switch (periodoActivo) {
      case 'semana':
        return facturasSemana;
      case 'mes':
        return facturasMes;
      case 'anio':
        return facturasAnio;
      case 'todo':
      default:
        return facturas;
    }
  }, [periodoActivo, facturasSemana, facturasMes, facturasAnio, facturas]);

  // Filtrado por Tipo (ARCA vs Sin Datos) y Búsqueda
  const facturasFiltradas = useMemo(() => {
    let result = facturasPeriodoSeleccionado;

    // Filtro por tipo de comprobante
    if (tipoFiltro === 'con_arca') {
      result = result.filter(f => esFacturaArca(f));
    } else if (tipoFiltro === 'sin_datos') {
      result = result.filter(f => !esFacturaArca(f));
    }

    // Filtro por texto de búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      result = result.filter(f => {
        const cliente = (f.consorcios as any)?.nombre?.toLowerCase() ?? '';
        const admin = (f.consorcios as any)?.administraciones?.nombre?.toLowerCase() ?? '';
        const num = (f.numero_factura || '').toLowerCase();
        const obs = (f.observaciones || '').toLowerCase();
        const montoStr = String(f.monto_total);
        return (
          cliente.includes(q) ||
          admin.includes(q) ||
          num.includes(q) ||
          obs.includes(q) ||
          montoStr.includes(q)
        );
      });
    }

    return result;
  }, [facturasPeriodoSeleccionado, tipoFiltro, busqueda]);

  // Conteos para los botones de filtro dentro del período activo
  const countsPeriodo = useMemo(() => {
    const conArca = facturasPeriodoSeleccionado.filter(f => esFacturaArca(f)).length;
    const sinDatos = facturasPeriodoSeleccionado.length - conArca;
    return {
      todos: facturasPeriodoSeleccionado.length,
      conArca,
      sinDatos,
    };
  }, [facturasPeriodoSeleccionado]);

  // Lista visible con paginación
  const facturasVisibles = useMemo(() => {
    return facturasFiltradas.slice(0, limiteVista);
  }, [facturasFiltradas, limiteVista]);

  return (
    <div className={styles.cardContainer}>
      {/* ── Encabezado Principal ── */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.titleRow}>
            <div className={styles.headerIcon}>
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className={styles.title}>
                Discriminación de Ingresos: Facturas ARCA vs Sin Datos
              </div>
              <p className={styles.subtitle}>
                Diferenciación de ingresos formales con factura de ARCA vinculada vs. ingresos sin comprobante emitido
              </p>
            </div>
          </div>
        </div>

        {/* Badges globales del año */}
        <div className={styles.summaryBadges}>
          <div className={`${styles.badgePill} ${styles.badgePillArca}`}>
            <FileCheck2 size={13} />
            <span>Año: {metricasAnio.arcaCount} con Factura ARCA ({formatMonto(metricasAnio.arcaMonto)})</span>
          </div>
          <div className={`${styles.badgePill} ${styles.badgePillSinDatos}`}>
            <FileQuestion size={13} />
            <span>{metricasAnio.sinDatosCount} Sin Datos ({formatMonto(metricasAnio.sinDatosMonto)})</span>
          </div>
        </div>
      </div>

      {/* ── Resumen Comparativo: Semana, Mes y Año ── */}
      <div className={styles.periodsGrid}>
        {/* Semana */}
        <div
          className={`${styles.periodCard} ${periodoActivo === 'semana' ? styles.periodCardActive : ''}`}
          onClick={() => {
            setPeriodoActivo('semana');
            setLimiteVista(12);
          }}
          title="Ver ingresos de esta semana"
        >
          <div className={styles.periodCardHeader}>
            <span className={styles.periodName}>
              <Calendar size={13} />
              Semana Actual
            </span>
            <span className={styles.periodRange}>{labelSemana}</span>
          </div>

          <div className={styles.periodTotalRow}>
            <span className={styles.periodTotalLabel}>Total recaudado</span>
            <span className={styles.periodTotalValue}>{formatMonto(metricasSemana.totalMonto)}</span>
          </div>

          <div className={styles.periodBreakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotArca} />
                Con Factura ARCA ({metricasSemana.arcaCount})
              </span>
              <span className={styles.breakdownValueArca}>
                {formatMonto(metricasSemana.arcaMonto)}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotSinDatos} />
                Sin Datos ({metricasSemana.sinDatosCount})
              </span>
              <span className={styles.breakdownValueSinDatos}>
                {formatMonto(metricasSemana.sinDatosMonto)}
              </span>
            </div>
          </div>

          <div className={styles.formalizadoBarContainer}>
            <div className={styles.formalizadoBarInfo}>
              <span>Formalizado con ARCA</span>
              <strong>{metricasSemana.pctFormalizado}%</strong>
            </div>
            <div className={styles.formalizadoBarTrack}>
              <div
                className={styles.formalizadoBarFill}
                style={{ width: `${metricasSemana.pctFormalizado}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mes */}
        <div
          className={`${styles.periodCard} ${periodoActivo === 'mes' ? styles.periodCardActive : ''}`}
          onClick={() => {
            setPeriodoActivo('mes');
            setLimiteVista(12);
          }}
          title="Ver ingresos de este mes"
        >
          <div className={styles.periodCardHeader}>
            <span className={styles.periodName}>
              <CalendarRange size={13} />
              Mes Actual
            </span>
            <span className={styles.periodRange} style={{ textTransform: 'capitalize' }}>
              {labelMes}
            </span>
          </div>

          <div className={styles.periodTotalRow}>
            <span className={styles.periodTotalLabel}>Total recaudado</span>
            <span className={styles.periodTotalValue}>{formatMonto(metricasMes.totalMonto)}</span>
          </div>

          <div className={styles.periodBreakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotArca} />
                Con Factura ARCA ({metricasMes.arcaCount})
              </span>
              <span className={styles.breakdownValueArca}>
                {formatMonto(metricasMes.arcaMonto)}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotSinDatos} />
                Sin Datos ({metricasMes.sinDatosCount})
              </span>
              <span className={styles.breakdownValueSinDatos}>
                {formatMonto(metricasMes.sinDatosMonto)}
              </span>
            </div>
          </div>

          <div className={styles.formalizadoBarContainer}>
            <div className={styles.formalizadoBarInfo}>
              <span>Formalizado con ARCA</span>
              <strong>{metricasMes.pctFormalizado}%</strong>
            </div>
            <div className={styles.formalizadoBarTrack}>
              <div
                className={styles.formalizadoBarFill}
                style={{ width: `${metricasMes.pctFormalizado}%` }}
              />
            </div>
          </div>
        </div>

        {/* Año */}
        <div
          className={`${styles.periodCard} ${periodoActivo === 'anio' ? styles.periodCardActive : ''}`}
          onClick={() => {
            setPeriodoActivo('anio');
            setLimiteVista(12);
          }}
          title="Ver ingresos de este año"
        >
          <div className={styles.periodCardHeader}>
            <span className={styles.periodName}>
              <TrendingUp size={13} />
              Año {anioActual}
            </span>
            <span className={styles.periodRange}>Enero — Diciembre</span>
          </div>

          <div className={styles.periodTotalRow}>
            <span className={styles.periodTotalLabel}>Total recaudado</span>
            <span className={styles.periodTotalValue}>{formatMonto(metricasAnio.totalMonto)}</span>
          </div>

          <div className={styles.periodBreakdown}>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotArca} />
                Con Factura ARCA ({metricasAnio.arcaCount})
              </span>
              <span className={styles.breakdownValueArca}>
                {formatMonto(metricasAnio.arcaMonto)}
              </span>
            </div>
            <div className={styles.breakdownRow}>
              <span className={styles.breakdownLabel}>
                <span className={styles.breakdownDotSinDatos} />
                Sin Datos ({metricasAnio.sinDatosCount})
              </span>
              <span className={styles.breakdownValueSinDatos}>
                {formatMonto(metricasAnio.sinDatosMonto)}
              </span>
            </div>
          </div>

          <div className={styles.formalizadoBarContainer}>
            <div className={styles.formalizadoBarInfo}>
              <span>Formalizado con ARCA</span>
              <strong>{metricasAnio.pctFormalizado}%</strong>
            </div>
            <div className={styles.formalizadoBarTrack}>
              <div
                className={styles.formalizadoBarFill}
                style={{ width: `${metricasAnio.pctFormalizado}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Controles y Filtros del Detalle ── */}
      <div className={styles.controlsSection}>
        <div className={styles.controlsRow}>
          {/* Selector de Período Activo */}
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterBtn} ${periodoActivo === 'semana' ? styles.filterBtnActive : ''}`}
              onClick={() => {
                setPeriodoActivo('semana');
                setLimiteVista(12);
              }}
            >
              Semana
            </button>
            <button
              className={`${styles.filterBtn} ${periodoActivo === 'mes' ? styles.filterBtnActive : ''}`}
              onClick={() => {
                setPeriodoActivo('mes');
                setLimiteVista(12);
              }}
            >
              Mes
            </button>
            <button
              className={`${styles.filterBtn} ${periodoActivo === 'anio' ? styles.filterBtnActive : ''}`}
              onClick={() => {
                setPeriodoActivo('anio');
                setLimiteVista(12);
              }}
            >
              Año {anioActual}
            </button>
            <button
              className={`${styles.filterBtn} ${periodoActivo === 'todo' ? styles.filterBtnActive : ''}`}
              onClick={() => {
                setPeriodoActivo('todo');
                setLimiteVista(12);
              }}
            >
              Histórico Todo
            </button>
          </div>

          {/* Filtro por tipo de comprobante */}
          <div className={styles.filterGroup}>
            <button
              className={`${styles.filterBtn} ${tipoFiltro === 'todos' ? styles.filterBtnActive : ''}`}
              onClick={() => setTipoFiltro('todos')}
            >
              Todos
              <span className={styles.filterCount}>{countsPeriodo.todos}</span>
            </button>
            <button
              className={`${styles.filterBtn} ${tipoFiltro === 'con_arca' ? styles.filterBtnActive : ''}`}
              onClick={() => setTipoFiltro('con_arca')}
              style={tipoFiltro === 'con_arca' ? { color: '#34d399', borderColor: 'rgba(16,185,129,0.4)' } : undefined}
            >
              🟢 Con Factura ARCA
              <span className={styles.filterCount}>{countsPeriodo.conArca}</span>
            </button>
            <button
              className={`${styles.filterBtn} ${tipoFiltro === 'sin_datos' ? styles.filterBtnActive : ''}`}
              onClick={() => setTipoFiltro('sin_datos')}
              style={tipoFiltro === 'sin_datos' ? { color: '#cbd5e1', borderColor: 'rgba(148,163,184,0.4)' } : undefined}
            >
              ⚪ Sin Datos
              <span className={styles.filterCount}>{countsPeriodo.sinDatos}</span>
            </button>
          </div>

          {/* Buscador */}
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar cliente, N° comprobante o monto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabla Detallada de Ingresos Discriminados ── */}
        <div className={styles.tableWrapper}>
          <table className={styles.ingresosTable}>
            <thead>
              <tr>
                <th>Tipo / Discriminación</th>
                <th>Cliente / Consorcio</th>
                <th>Fecha Emisión</th>
                <th>N° de Factura / Ref</th>
                <th>Valor / Monto</th>
                <th>Estado de Pago</th>
                <th>Comprobante</th>
              </tr>
            </thead>
            <tbody>
              {facturasVisibles.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    {busqueda
                      ? 'No hay registros que coincidan con la búsqueda.'
                      : tipoFiltro === 'con_arca'
                      ? 'No hay facturas emitidas con numeración ARCA en este período.'
                      : tipoFiltro === 'sin_datos'
                      ? 'No hay ingresos sin datos en este período.'
                      : 'No hay ingresos registrados en el período seleccionado.'}
                  </td>
                </tr>
              ) : (
                facturasVisibles.map(f => {
                  const tieneArca = esFacturaArca(f);
                  const estadoConfig = getEstadoConfig(
                    isVencida(f) && f.estado !== 'pagado' ? 'vencida' : f.estado
                  );
                  const clienteNombre = (f.consorcios as any)?.nombre ?? 'Cliente Particular';
                  const adminNombre = (f.consorcios as any)?.administraciones?.nombre;

                  return (
                    <tr key={f.id} className={styles.tableRow}>
                      {/* Tipo / Discriminación */}
                      <td>
                        {tieneArca ? (
                          <span className={`${styles.distincionBadge} ${styles.distincionArca}`}>
                            <FileCheck2 size={12} />
                            Factura ARCA
                          </span>
                        ) : (
                          <span className={`${styles.distincionBadge} ${styles.distincionSinDatos}`}>
                            <FileQuestion size={12} />
                            Sin Datos ARCA
                          </span>
                        )}
                      </td>

                      {/* Cliente / Consorcio */}
                      <td>
                        <div className={styles.clienteNombre}>{clienteNombre}</div>
                        {adminNombre && (
                          <div className={styles.clienteAdmin}>Adm: {adminNombre}</div>
                        )}
                      </td>

                      {/* Fecha */}
                      <td>
                        <span className={styles.fechaText}>
                          {formatFechaCorta(f.fecha_emision)}
                        </span>
                      </td>

                      {/* N° Comprobante / Ref */}
                      <td>
                        <div className={styles.comprobanteNumero}>
                          {f.numero_factura || '—'}
                        </div>
                        <div className={styles.comprobanteSub}>
                          {tieneArca
                            ? `Tipo ${f.tipo_factura || 'C'}`
                            : f.numero_factura?.startsWith('ING-')
                            ? 'Generado por Calendario'
                            : 'Sin vinculación fiscal'}
                        </div>
                      </td>

                      {/* Valor / Monto */}
                      <td>
                        <span className={styles.montoDestacado}>
                          {formatMonto(f.monto_total)}
                        </span>
                      </td>

                      {/* Estado */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: estadoConfig.color,
                            background: estadoConfig.bg,
                            border: `1px solid ${estadoConfig.color}40`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: estadoConfig.color,
                            }}
                          />
                          {estadoConfig.label}
                        </span>
                      </td>

                      {/* Comprobante PDF / Link */}
                      <td>
                        {f.pdf_url ? (
                          <a
                            href={f.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.pdfBtn}
                            title="Abrir PDF oficial de ARCA"
                          >
                            <ExternalLink size={12} />
                            Ver PDF
                          </a>
                        ) : (
                          <span style={{ color: '#475569', fontSize: '0.72rem' }}>
                            Sin PDF
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pie con información y botón de mostrar más ── */}
        <div className={styles.footerRow}>
          <span>
            Mostrando <strong>{facturasVisibles.length}</strong> de <strong>{facturasFiltradas.length}</strong> registros
            {tipoFiltro !== 'todos' && ` (filtrado por ${tipoFiltro === 'con_arca' ? 'Con Factura ARCA' : 'Sin Datos'})`}
          </span>

          {limiteVista < facturasFiltradas.length && (
            <button
              className={styles.loadMoreBtn}
              onClick={() => setLimiteVista(prev => prev + 15)}
            >
              Mostrar más ({facturasFiltradas.length - limiteVista} restantes)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
