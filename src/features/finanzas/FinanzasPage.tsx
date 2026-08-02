import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturaService, type Factura, type FacturaEstado } from '@/services/facturaService';
import { notificacionService } from '@/services/notificacionService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import {
  DollarSign, Plus, Search, FileText, Edit, Trash2,
  Eye, Check, X, Filter, Download, Share2, Clock,
  CheckCircle2, AlertCircle, XCircle, MinusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FacturaForm } from './FacturaForm';
import { FacturaDetalle } from './FacturaDetalle';
import styles from './FinanzasPage.module.css';

type ViewMode = 'list' | 'form' | 'detalle';
type FilterEstado = 'todos' | FacturaEstado;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getEstadoConfig(estado: FacturaEstado) {
  switch (estado) {
    case 'pagado':
      return { label: 'Pagado', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle2 };
    case 'parcial':
      return { label: 'Parcial', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: MinusCircle };
    case 'pendiente':
      return { label: 'Pendiente', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle };
    case 'vencida':
      return { label: 'Vencida', color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: AlertCircle };
  }
}

export function formatMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(monto);
}

export function formatFechaCorta(fecha: string | null) {
  if (!fecha) return '—';
  try {
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  } catch {
    return fecha;
  }
}

export function isVencida(factura: Factura): boolean {
  if (!factura.fecha_vencimiento) return false;
  if (factura.estado === 'pagado') return false;
  return new Date(factura.fecha_vencimiento) < new Date();
}

// ── Componente principal ──────────────────────────────────────────────────────

export function FinanzasPage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('todos');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: facturaService.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => facturaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      setDeletingId(null);
    },
  });

  // Filtro local
  const facturasFiltradas = useMemo(() => {
    let result = facturas;

    // Auto-detectar vencidas
    result = result.map(f => ({
      ...f,
      estado: isVencida(f) && f.estado !== 'pagado' ? 'vencida' as FacturaEstado : f.estado,
    }));

    if (filterEstado !== 'todos') {
      result = result.filter(f => f.estado === filterEstado);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f => {
        const consorcio = (f.consorcios as any)?.nombre?.toLowerCase() ?? '';
        const admin = (f.consorcios as any)?.administraciones?.nombre?.toLowerCase() ?? '';
        const numero = f.numero_factura.toLowerCase();
        return consorcio.includes(q) || admin.includes(q) || numero.includes(q);
      });
    }

    return result;
  }, [facturas, filterEstado, search]);

  const handleNew = () => { setEditingId(null); setViewMode('form'); };
  const handleEdit = (id: string) => { setEditingId(id); setViewMode('form'); };
  const handleVer = (id: string) => { setDetalleId(id); setViewMode('detalle'); };
  const handleBack = () => { setEditingId(null); setDetalleId(null); setViewMode('list'); };

  const handleCompartir = (factura: Factura) => {
    const url = `${window.location.origin}/p/factura/${factura.public_id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(factura.id);
    setTimeout(() => setCopiedId(null), 2000);

    notificacionService.create({
      tipo: 'factura_compartida',
      cliente_nombre: (factura.consorcios as any)?.nombre ?? null,
      consorcio_nombre: (factura.consorcios as any)?.nombre ?? null,
      detalles: { numero_factura: factura.numero_factura },
    }).catch(console.error);
  };

  // ── Vistas secundarias ───────────────────────────────────────────────────

  if (viewMode === 'form') {
    return <FacturaForm onBack={handleBack} editingId={editingId} />;
  }

  if (viewMode === 'detalle' && detalleId) {
    return (
      <FacturaDetalle
        facturaId={detalleId}
        onBack={handleBack}
        onEdit={() => handleEdit(detalleId)}
      />
    );
  }

  // ── Counts de estado ─────────────────────────────────────────────────────

  const counts = {
    todos: facturas.length,
    pendiente: facturas.filter(f => !isVencida(f) && f.estado === 'pendiente').length,
    parcial: facturas.filter(f => f.estado === 'parcial').length,
    pagado: facturas.filter(f => f.estado === 'pagado').length,
    vencida: facturas.filter(f => isVencida(f)).length,
  };

  const FILTROS: { key: FilterEstado; label: string; count: number; color?: string }[] = [
    { key: 'todos',     label: 'Todos',      count: counts.todos },
    { key: 'pendiente', label: 'Pendientes',  count: counts.pendiente, color: '#ef4444' },
    { key: 'parcial',   label: 'Parciales',   count: counts.parcial,   color: '#f59e0b' },
    { key: 'pagado',    label: 'Pagadas',     count: counts.pagado,    color: '#22c55e' },
    { key: 'vencida',   label: 'Vencidas',    count: counts.vencida,   color: '#64748b' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1><DollarSign size={28} className={styles.headerIcon} />Finanzas</h1>
          <p>Gestión de facturas y documentación fiscal</p>
        </div>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleNew}>
          Nueva Factura
        </Button>
      </div>

      {/* Buscador + Filtros */}
      <Card variant="glass" className={styles.filtersCard}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Buscar por cliente, consorcio, administración o N° de factura..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterBadge}>
            <Filter size={14} />
            <span>{facturasFiltradas.length} resultado{facturasFiltradas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className={styles.filtrosRow}>
          {FILTROS.map(f => (
            <button
              key={f.key}
              className={`${styles.filtroBtn} ${filterEstado === f.key ? styles.filtroBtnActive : ''}`}
              style={filterEstado === f.key && f.color ? { borderColor: f.color, color: f.color } : undefined}
              onClick={() => setFilterEstado(f.key)}
            >
              {f.label}
              <span className={styles.filtroCount}>{f.count}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Tabla */}
      {isLoading ? (
        <p className={styles.loading}>Cargando facturas...</p>
      ) : facturasFiltradas.length === 0 ? (
        <Card variant="neumorphic" className={styles.emptyCard}>
          <DollarSign size={40} className={styles.emptyIcon} />
          <p>{search || filterEstado !== 'todos' ? 'No hay facturas con esos criterios.' : '¡Cargá la primera factura!'}</p>
        </Card>
      ) : (
        <Card variant="glass" className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Factura</th>
                  <th>Tipo</th>
                  <th>Cliente / Consorcio</th>
                  <th>Administración</th>
                  <th>Fecha</th>
                  <th>Vencimiento</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>PDF</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {facturasFiltradas.map((f, i) => {
                    const est = getEstadoConfig(isVencida(f) && f.estado !== 'pagado' ? 'vencida' : f.estado);
                    const EstIcon = est.icon;
                    const consorcioNombre = (f.consorcios as any)?.nombre ?? '—';
                    const adminNombre = (f.consorcios as any)?.administraciones?.nombre ?? '—';

                    return (
                      <motion.tr
                        key={f.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={styles.tableRow}
                      >
                        <td className={styles.tdNumero}>
                          <span className={styles.numFactura}>{f.numero_factura}</span>
                        </td>
                        <td>
                          <span className={styles.tipoBadge}>Tipo {f.tipo_factura}</span>
                        </td>
                        <td className={styles.tdNombre}>{consorcioNombre}</td>
                        <td className={styles.tdAdmin}>{adminNombre}</td>
                        <td>{formatFechaCorta(f.fecha_emision)}</td>
                        <td className={isVencida(f) ? styles.tdVencida : ''}>
                          {formatFechaCorta(f.fecha_vencimiento)}
                        </td>
                        <td className={styles.tdMonto}>{formatMonto(f.monto_total)}</td>
                        <td>
                          <span
                            className={styles.estadoBadge}
                            style={{ color: est.color, background: est.bg }}
                          >
                            <EstIcon size={12} />
                            {est.label}
                          </span>
                        </td>
                        <td className={styles.tdPdf}>
                          {f.pdf_url ? (
                            <a
                              href={f.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.pdfLink}
                              title="Ver PDF"
                            >
                              <FileText size={16} />
                            </a>
                          ) : (
                            <span className={styles.noPdf} title="Sin PDF">—</span>
                          )}
                        </td>
                        <td>
                          <AnimatePresence mode="wait">
                            {deletingId === f.id ? (
                              <motion.div
                                key="confirm"
                                className={styles.deleteConfirm}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                              >
                                <span className={styles.confirmText}>¿Eliminar?</span>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnConfirmYes}`}
                                  onClick={() => deleteMutation.mutate(f.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnConfirmNo}`}
                                  onClick={() => setDeletingId(null)}
                                >
                                  <X size={13} />
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="actions"
                                className={styles.actions}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                <button
                                  className={`${styles.actionBtn} ${styles.btnVer}`}
                                  onClick={() => handleVer(f.id)}
                                  title="Ver detalle"
                                >
                                  <Eye size={14} />
                                </button>
                                {f.pdf_url && (
                                  <a
                                    href={f.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${styles.actionBtn} ${styles.btnDownload}`}
                                    title="Descargar PDF"
                                  >
                                    <Download size={14} />
                                  </a>
                                )}
                                <button
                                  className={`${styles.actionBtn} ${styles.btnShare} ${copiedId === f.id ? styles.btnShareActive : ''}`}
                                  onClick={() => handleCompartir(f)}
                                  title="Compartir enlace"
                                >
                                  {copiedId === f.id ? <Check size={14} /> : <Share2 size={14} />}
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnEdit}`}
                                  onClick={() => handleEdit(f.id)}
                                  title="Editar"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  className={`${styles.actionBtn} ${styles.btnDelete}`}
                                  onClick={() => setDeletingId(f.id)}
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Resumen de totales */}
      {facturasFiltradas.length > 0 && (
        <div className={styles.totalesRow}>
          <Card variant="neumorphic" className={styles.totalCard}>
            <Clock size={16} />
            <div>
              <p>Pendiente de cobro</p>
              <strong>
                {formatMonto(
                  facturasFiltradas
                    .filter(f => f.estado !== 'pagado')
                    .reduce((acc, f) => acc + f.monto_total, 0)
                )}
              </strong>
            </div>
          </Card>
          <Card variant="neumorphic" className={styles.totalCard}>
            <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
            <div>
              <p>Cobrado</p>
              <strong style={{ color: '#22c55e' }}>
                {formatMonto(
                  facturasFiltradas
                    .filter(f => f.estado === 'pagado')
                    .reduce((acc, f) => acc + f.monto_total, 0)
                )}
              </strong>
            </div>
          </Card>
          <Card variant="neumorphic" className={styles.totalCard}>
            <DollarSign size={16} style={{ color: '#3182ce' }} />
            <div>
              <p>Total facturado</p>
              <strong style={{ color: '#3182ce' }}>
                {formatMonto(facturasFiltradas.reduce((acc, f) => acc + f.monto_total, 0))}
              </strong>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
