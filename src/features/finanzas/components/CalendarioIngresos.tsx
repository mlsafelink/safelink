import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  X, Check, Edit2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facturaService, type Factura, type FacturaInsert, type FacturaEstado, type FacturaTipo } from '@/services/facturaService';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { formatMonto } from '../FinanzasPage';
import styles from './FinanzasDashboard.module.css';

interface Props {
  facturas: Factura[];
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function CalendarioIngresos({ facturas }: Props) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Queries de clientes para el formulario
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares'],
    queryFn: particularService.getAll,
  });

  // Campos de formulario para agregar/editar ingreso
  const [formData, setFormData] = useState<{
    consorcio_id: string;
    monto_total: string;
    numero_factura: string;
    tipo_factura: FacturaTipo;
    estado: FacturaEstado;
    observaciones: string;
  }>({
    consorcio_id: '',
    monto_total: '',
    numero_factura: '',
    tipo_factura: 'C',
    estado: 'pagado',
    observaciones: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Nombre del mes actual
  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Generar la grilla del calendario (42 celdas = 6 semanas)
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar para que el primer día sea Lunes (0 = Lun, 6 = Dom)
    let dayOfWeek = firstDayOfMonth.getDay() - 1;
    if (dayOfWeek === -1) dayOfWeek = 6;

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; dateObj: Date }[] = [];

    // Días del mes anterior para completar la primera semana
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      cells.push({
        dateStr: formatDateKey(prevDate.getFullYear(), prevDate.getMonth(), d),
        dayNum: d,
        isCurrentMonth: false,
        dateObj: prevDate,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const curDate = new Date(year, month, d);
      cells.push({
        dateStr: formatDateKey(year, month, d),
        dayNum: d,
        isCurrentMonth: true,
        dateObj: curDate,
      });
    }

    // Días del mes siguiente para completar 42 celdas
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      cells.push({
        dateStr: formatDateKey(nextDate.getFullYear(), nextDate.getMonth(), d),
        dayNum: d,
        isCurrentMonth: false,
        dateObj: nextDate,
      });
    }

    return cells;
  }, [year, month]);

  // Mapa de facturas por fecha (YYYY-MM-DD)
  const facturasPorFecha = useMemo(() => {
    const mapa = new Map<string, Factura[]>();
    facturas.forEach(f => {
      if (!f.fecha_emision) return;
      const key = f.fecha_emision.split('T')[0];
      const list = mapa.get(key) || [];
      list.push(f);
      mapa.set(key, list);
    });
    return mapa;
  }, [facturas]);

  // Hoy en formato string
  const todayStr = useMemo(() => {
    const today = new Date();
    return formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  // Navegación de meses
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Facturas del día seleccionado
  const facturasDelDiaSeleccionado = useMemo(() => {
    if (!selectedDayStr) return [];
    return facturasPorFecha.get(selectedDayStr) || [];
  }, [selectedDayStr, facturasPorFecha]);

  // Total del día seleccionado
  const totalDiaSeleccionado = useMemo(() => {
    return facturasDelDiaSeleccionado.reduce((acc, f) => acc + f.monto_total, 0);
  }, [facturasDelDiaSeleccionado]);

  // Mutación para guardar/crear un ingreso
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDayStr) throw new Error('No hay fecha seleccionada');
      if (!formData.consorcio_id) throw new Error('Seleccione un cliente / consorcio');
      const monto = parseFloat(formData.monto_total);
      if (isNaN(monto) || monto <= 0) throw new Error('Ingrese un monto válido');

      const numFactura = formData.numero_factura.trim() || `ING-${selectedDayStr.replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

      if (editingId) {
        return facturaService.update(editingId, {
          consorcio_id: formData.consorcio_id,
          monto_total: monto,
          numero_factura: numFactura,
          tipo_factura: formData.tipo_factura,
          estado: formData.estado,
          observaciones: formData.observaciones || null,
          fecha_emision: selectedDayStr,
          fecha_pago: formData.estado === 'pagado' ? selectedDayStr : null,
        });
      } else {
        const payload: FacturaInsert = {
          consorcio_id: formData.consorcio_id,
          presupuesto_id: null,
          reporte_trabajo_id: null,
          numero_factura: numFactura,
          tipo_factura: formData.tipo_factura,
          fecha_emision: selectedDayStr,
          fecha_vencimiento: null,
          monto_total: monto,
          estado: formData.estado,
          observaciones: formData.observaciones || 'Ingreso registrado en Calendario',
          fecha_pago: formData.estado === 'pagado' ? selectedDayStr : null,
          pdf_url: null,
          pdf_nombre: null,
          pdf_cargado_at: null,
          pdf_cargado_por: null,
        };
        return facturaService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setShowForm(false);
      setEditingId(null);
      setFormData({
        consorcio_id: '',
        monto_total: '',
        numero_factura: '',
        tipo_factura: 'C',
        estado: 'pagado',
        observaciones: '',
      });
    },
  });

  // Mutación para eliminar un ingreso
  const deleteMutation = useMutation({
    mutationFn: (id: string) => facturaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
    },
  });

  // Preparar la edición de una factura existente
  const handleEditarFactura = (f: Factura) => {
    setEditingId(f.id);
    setFormData({
      consorcio_id: f.consorcio_id,
      monto_total: String(f.monto_total),
      numero_factura: f.numero_factura,
      tipo_factura: f.tipo_factura || 'C',
      estado: f.estado,
      observaciones: f.observaciones || '',
    });
    setShowForm(true);
  };

  // Abrir nuevo ingreso para la fecha seleccionada
  const handleNuevoIngreso = () => {
    setEditingId(null);
    setFormData({
      consorcio_id: consorcios[0]?.id || particulares[0]?.id || '',
      monto_total: '',
      numero_factura: `ING-${selectedDayStr?.replace(/-/g, '') || ''}-${String(facturasDelDiaSeleccionado.length + 1).padStart(3, '0')}`,
      tipo_factura: 'C',
      estado: 'pagado',
      observaciones: '',
    });
    setShowForm(true);
  };

  return (
    <div className={styles.calCard}>
      {/* Encabezado del Calendario */}
      <div className={styles.calHeader}>
        <div className={styles.calTitle}>
          <CalendarIcon size={18} style={{ color: '#60a5fa' }} />
          <span>Calendario de Ingresos & Facturación</span>
        </div>
        <div className={styles.calNav}>
          <button className={styles.calNavBtn} onClick={handleToday}>
            Hoy
          </button>
          <button className={styles.calNavBtn} onClick={handlePrevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className={styles.calMonthLabel}>{monthName}</span>
          <button className={styles.calNavBtn} onClick={handleNextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className={styles.calWeekdays}>
        {DIAS_SEMANA.map((dia, idx) => (
          <div key={idx} className={styles.calWeekday}>
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className={styles.calGrid}>
        {calendarCells.map(cell => {
          const facturasDia = facturasPorFecha.get(cell.dateStr) || [];
          const totalDia = facturasDia.reduce((acc, f) => acc + f.monto_total, 0);
          const tieneActividad = facturasDia.length > 0;
          const esHoy = cell.dateStr === todayStr;

          return (
            <div
              key={cell.dateStr}
              onClick={() => setSelectedDayStr(cell.dateStr)}
              className={`
                ${styles.calCell}
                ${!cell.isCurrentMonth ? styles.calCellOtherMonth : ''}
                ${esHoy ? styles.calCellToday : ''}
                ${tieneActividad ? styles.calCellActive : ''}
              `}
            >
              <div className={styles.calCellNum} style={esHoy ? { color: '#60a5fa' } : undefined}>
                {cell.dayNum}
              </div>

              {tieneActividad && (
                <div>
                  <div className={styles.calCellBadge}>
                    {formatMonto(totalDia)}
                  </div>
                  <div className={styles.calCellCount}>
                    {facturasDia.length} ingreso{facturasDia.length > 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MODAL DETALLE / EDICIÓN DE DÍA ── */}
      <AnimatePresence>
        {selectedDayStr && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedDayStr(null); setShowForm(false); }}
          >
            <motion.div
              className={styles.modalCard}
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <CalendarIcon size={18} style={{ color: '#3b82f6' }} />
                  <span>Ingresos del {selectedDayStr.split('-').reverse().join('/')}</span>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => { setSelectedDayStr(null); setShowForm(false); }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Contenido principal del Modal */}
              {!showForm ? (
                <div>
                  {/* Resumen del día */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total registrado el día:</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                        {formatMonto(totalDiaSeleccionado)}
                      </div>
                    </div>
                    <button
                      onClick={handleNuevoIngreso}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2563eb', color: '#fff', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      <Plus size={15} />
                      <span>Agregar Ingreso</span>
                    </button>
                  </div>

                  {/* Lista de facturas/ingresos del día */}
                  {facturasDelDiaSeleccionado.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                      <p>No hay ingresos registrados en esta fecha.</p>
                      <button
                        onClick={handleNuevoIngreso}
                        style={{ marginTop: '0.75rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        + Cargar primer ingreso del día
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {facturasDelDiaSeleccionado.map(f => {
                        const clienteNombre = (f.consorcios as any)?.nombre ?? 'Cliente N/A';
                        const esPagado = f.estado === 'pagado';
                        return (
                          <div
                            key={f.id}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: '10px' }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                                {clienteNombre}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span>{f.numero_factura}</span>
                                <span>•</span>
                                <span style={{ color: esPagado ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                  {esPagado ? '🟢 Pagado' : '🔴 Pendiente'}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontWeight: 800, color: '#60a5fa', fontSize: '1rem' }}>
                                {formatMonto(f.monto_total)}
                              </span>
                              <button
                                onClick={() => handleEditarFactura(f)}
                                style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#cbd5e1', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Editar ingreso"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(f.id)}
                                style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#f87171', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Eliminar ingreso"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Formulario de carga / edición de ingreso */
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    saveMutation.mutate();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', color: '#3b82f6', fontWeight: 700, fontSize: '0.88rem' }}>
                    <span>{editingId ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}</span>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ← Volver a lista
                    </button>
                  </div>

                  {/* Selector de Cliente / Consorcio */}
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Cliente / Consorcio de Origen *</label>
                    <select
                      className={styles.modalSelect}
                      value={formData.consorcio_id}
                      onChange={e => setFormData(prev => ({ ...prev, consorcio_id: e.target.value }))}
                      required
                    >
                      <option value="" disabled>-- Seleccionar Cliente --</option>
                      <optgroup label="Consorcios">
                        {consorcios.map(c => (
                          <option key={c.id} value={c.id}>
                            🏢 {c.nombre}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Clientes Privados">
                        {particulares.map(p => (
                          <option key={p.id} value={p.id}>
                            👤 {p.nombre}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Monto del ingreso */}
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Monto del Ingreso ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 150000"
                      className={styles.modalInput}
                      value={formData.monto_total}
                      onChange={e => setFormData(prev => ({ ...prev, monto_total: e.target.value }))}
                      required
                    />
                  </div>

                  {/* N° Factura / Identificador */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className={styles.modalFormGroup}>
                      <label className={styles.modalLabel}>N° Factura / Referencia</label>
                      <input
                        type="text"
                        placeholder="Ej: FAC-0001"
                        className={styles.modalInput}
                        value={formData.numero_factura}
                        onChange={e => setFormData(prev => ({ ...prev, numero_factura: e.target.value }))}
                      />
                    </div>
                    <div className={styles.modalFormGroup}>
                      <label className={styles.modalLabel}>Estado del Pago</label>
                      <select
                        className={styles.modalSelect}
                        value={formData.estado}
                        onChange={e => setFormData(prev => ({ ...prev, estado: e.target.value as FacturaEstado }))}
                      >
                        <option value="pagado">🟢 Pagado (Cobrado)</option>
                        <option value="pendiente">🔴 Pendiente (A cobrar)</option>
                        <option value="parcial">🟡 Parcial</option>
                      </select>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className={styles.modalFormGroup}>
                    <label className={styles.modalLabel}>Observaciones (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Trabajo técnico de mantenimiento..."
                      className={styles.modalInput}
                      value={formData.observaciones}
                      onChange={e => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    />
                  </div>

                  {/* Botones de acción del formulario */}
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Check size={16} />
                      <span>{saveMutation.isPending ? 'Guardando...' : 'Guardar Ingreso'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
