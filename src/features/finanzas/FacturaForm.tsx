import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { facturaService, type FacturaInsert, type FacturaTipo, type FacturaEstado } from '@/services/facturaService';
import { notificacionService } from '@/services/notificacionService';
import { consorcioService } from '@/services/consorcioService';
import { presupuestoService } from '@/services/documentService';
import { reporteTrabajoService } from '@/services/documentService';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import {
  ArrowLeft, Save, FileText, Upload, CheckCircle2, X, AlertCircle
} from 'lucide-react';
import styles from './FacturaForm.module.css';

interface FacturaFormProps {
  onBack: () => void;
  editingId: string | null;
}

const ESTADOS: { value: FacturaEstado; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'parcial',   label: 'Parcial' },
  { value: 'pagado',    label: 'Pagado' },
];

const TIPOS: FacturaTipo[] = ['A', 'B', 'C'];

export function FacturaForm({ onBack, editingId }: FacturaFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  // Datos de formulario
  const [form, setForm] = useState<Partial<FacturaInsert>>({
    tipo_factura: 'A',
    estado: 'pendiente',
    monto_total: 0,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Queries
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const { data: presupuestos = [] } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: presupuestoService.getAll,
  });

  const { data: reportesTrabajo = [] } = useQuery({
    queryKey: ['reportes_trabajo'],
    queryFn: reporteTrabajoService.getAll,
  });

  // Cargar datos si es edición
  const { data: facturaExistente } = useQuery({
    queryKey: ['factura', editingId],
    queryFn: () => facturaService.getById(editingId!),
    enabled: !!editingId,
  });

  useEffect(() => {
    if (facturaExistente) {
      setForm({
        consorcio_id:       facturaExistente.consorcio_id,
        presupuesto_id:     facturaExistente.presupuesto_id,
        reporte_trabajo_id: facturaExistente.reporte_trabajo_id,
        numero_factura:     facturaExistente.numero_factura,
        tipo_factura:       facturaExistente.tipo_factura,
        fecha_emision:      facturaExistente.fecha_emision,
        fecha_vencimiento:  facturaExistente.fecha_vencimiento ?? undefined,
        monto_total:        facturaExistente.monto_total,
        estado:             facturaExistente.estado,
        observaciones:      facturaExistente.observaciones ?? '',
        pdf_url:            facturaExistente.pdf_url ?? undefined,
        pdf_nombre:         facturaExistente.pdf_nombre ?? undefined,
      });
    }
  }, [facturaExistente]);

  // Filtrar presupuestos/reportes por consorcio seleccionado
  const presupuestosFiltrados = presupuestos.filter(
    p => !form.consorcio_id || p.consorcio_id === form.consorcio_id
  );
  const reportesFiltrados = reportesTrabajo.filter(
    r => !form.consorcio_id || r.consorcio_id === form.consorcio_id
  );

  // ── Mutaciones ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.consorcio_id || !form.numero_factura || !form.fecha_emision || !form.tipo_factura) {
        throw new Error('Completá los campos obligatorios.');
      }

      const payload = form as FacturaInsert;

      let factura;
      if (editingId) {
        factura = await facturaService.update(editingId, payload);
      } else {
        factura = await facturaService.create(payload);
        // Notificación de nueva factura
        await notificacionService.create({
          tipo: 'factura_cargada',
          cliente_nombre: null,
          consorcio_nombre: consorcios.find(c => c.id === factura.consorcio_id)?.nombre ?? null,
          detalles: { numero_factura: factura.numero_factura },
        });
      }

      // Upload PDF si hay uno nuevo seleccionado
      if (pdfFile && user?.email) {
        setUploadProgress(true);
        await facturaService.uploadPDF(pdfFile, factura.id, user.email);
        setUploadProgress(false);
      }

      return factura;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facturas'] });
      onBack();
    },
    onError: (err: Error) => {
      console.error(err);
      setUploadProgress(false);
    },
  });

  // ── PDF handling ────────────────────────────────────────────────────────────

  const handleFileChange = (file: File) => {
    setPdfError('');
    if (file.type !== 'application/pdf') {
      setPdfError('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > 52428800) {
      setPdfError('El archivo supera el límite de 50 MB.');
      return;
    }
    setPdfFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  // ── Campo helper ─────────────────────────────────────────────────────────────

  const set = (key: keyof FacturaInsert, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const isEditing = !!editingId;
  const hasPdf = !!(form.pdf_url || pdfFile);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Volver</span>
        </button>
        <div>
          <h1>{isEditing ? 'Editar Factura' : 'Nueva Factura'}</h1>
          <p>{isEditing ? `Editando factura ${facturaExistente?.numero_factura ?? ''}` : 'Registrá una factura emitida externamente vía ARCA'}</p>
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* Columna principal */}
        <div className={styles.mainColumn}>
          {/* Datos del cliente */}
          <Card variant="glass" className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos del Cliente</h2>
            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Cliente / Consorcio *</label>
                <select
                  className={styles.select}
                  value={form.consorcio_id ?? ''}
                  onChange={e => {
                    set('consorcio_id', e.target.value);
                    set('presupuesto_id', undefined);
                    set('reporte_trabajo_id', undefined);
                  }}
                  required
                >
                  <option value="">Seleccioná...</option>
                  <optgroup label="Consorcios">
                    {consorcios.filter(c => !c.tipo || c.tipo === 'consorcio').map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Clientes Privados">
                    {consorcios.filter(c => c.tipo === 'particular').map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Trabajo asociado (Presupuesto)</label>
                <select
                  className={styles.select}
                  value={form.presupuesto_id ?? ''}
                  onChange={e => set('presupuesto_id', e.target.value || null)}
                  disabled={!form.consorcio_id}
                >
                  <option value="">Sin presupuesto asociado</option>
                  {presupuestosFiltrados.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} — ` : ''}{p.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Reporte de Trabajo asociado</label>
                <select
                  className={styles.select}
                  value={form.reporte_trabajo_id ?? ''}
                  onChange={e => set('reporte_trabajo_id', e.target.value || null)}
                  disabled={!form.consorcio_id}
                >
                  <option value="">Sin reporte asociado</option>
                  {reportesFiltrados.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.codigo ? `${r.codigo} — ` : ''}{r.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Datos de la factura */}
          <Card variant="glass" className={styles.section}>
            <h2 className={styles.sectionTitle}>Datos de la Factura</h2>
            <div className={styles.fieldsGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Número de Factura *</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Ej: 0001-00012345"
                  value={form.numero_factura ?? ''}
                  onChange={e => set('numero_factura', e.target.value)}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de Factura *</label>
                <div className={styles.tipoGroup}>
                  {TIPOS.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`${styles.tipoBtn} ${form.tipo_factura === t ? styles.tipoBtnActive : ''}`}
                      onClick={() => set('tipo_factura', t)}
                    >
                      Tipo {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fecha de Emisión *</label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.fecha_emision ?? ''}
                  onChange={e => set('fecha_emision', e.target.value)}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fecha de Vencimiento</label>
                <input
                  className={styles.input}
                  type="date"
                  value={form.fecha_vencimiento ?? ''}
                  onChange={e => set('fecha_vencimiento', e.target.value || undefined)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Monto Total *</label>
                <div className={styles.montoWrapper}>
                  <span className={styles.montoPrefix}>$</span>
                  <input
                    className={`${styles.input} ${styles.montoInput}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.monto_total ?? ''}
                    onChange={e => set('monto_total', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Estado *</label>
                <div className={styles.estadoGroup}>
                  {ESTADOS.map(e => (
                    <button
                      key={e.value}
                      type="button"
                      className={`${styles.estadoBtn} ${form.estado === e.value ? styles.estadoBtnActive : ''}`}
                      data-estado={e.value}
                      onClick={() => {
                        set('estado', e.value);
                        if (e.value === 'pagado' && !form.fecha_pago) {
                          set('fecha_pago', new Date().toISOString().split('T')[0]);
                        }
                      }}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.estado === 'pagado' && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Fecha de Pago</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.fecha_pago ?? ''}
                    onChange={e => set('fecha_pago', e.target.value || undefined)}
                  />
                </div>
              )}

              <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
                <label className={styles.label}>Observaciones</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Observaciones adicionales sobre la factura..."
                  value={form.observaciones ?? ''}
                  onChange={e => set('observaciones', e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Columna lateral — PDF */}
        <div className={styles.sideColumn}>
          <Card variant="neumorphic" className={styles.pdfSection}>
            <div className={styles.pdfHeader}>
              <FileText size={20} />
              <h2 className={styles.sectionTitle}>Factura PDF</h2>
            </div>
            <p className={styles.pdfSubtitle}>
              Cargá el PDF emitido por ARCA. Solo se aceptan archivos PDF (máx. 50 MB).
            </p>

            {/* Estado PDF actual */}
            {(form.pdf_url && !pdfFile) && (
              <div className={styles.pdfExisting}>
                <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                <span>{form.pdf_nombre ?? 'Factura cargada'}</span>
              </div>
            )}

            {/* Dropzone */}
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneOver : ''} ${pdfFile ? styles.dropzoneFilled : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileChange(file);
                }}
              />
              {pdfFile ? (
                <div className={styles.pdfFilePreview}>
                  <FileText size={28} style={{ color: '#3182ce' }} />
                  <div>
                    <p className={styles.pdfFileName}>{pdfFile.name}</p>
                    <p className={styles.pdfFileSize}>
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    className={styles.pdfRemove}
                    onClick={e => { e.stopPropagation(); setPdfFile(null); }}
                    title="Quitar archivo"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropzoneEmpty}>
                  <Upload size={28} className={styles.uploadIcon} />
                  <p>Arrastrá el PDF aquí</p>
                  <p className={styles.dropzoneOr}>o hacé clic para seleccionar</p>
                  <span className={styles.dropzoneHint}>Solo archivos .pdf</span>
                </div>
              )}
            </div>

            {pdfError && (
              <div className={styles.pdfError}>
                <AlertCircle size={14} />
                <span>{pdfError}</span>
              </div>
            )}

            {/* Indicador de PDF cargado en BD */}
            {form.pdf_url && (
              <div className={styles.pdfStatus}>
                <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                <span>Factura PDF disponible</span>
                <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className={styles.pdfViewLink}>
                  Ver →
                </a>
              </div>
            )}
          </Card>

          {/* Botones de acción */}
          <div className={styles.formActions}>
            <Button variant="secondary" onClick={onBack}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              leftIcon={uploadProgress ? undefined : <Save size={16} />}
              isLoading={saveMutation.isPending || uploadProgress}
              onClick={() => saveMutation.mutate()}
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Factura'}
            </Button>
          </div>

          {saveMutation.isError && (
            <Card variant="glass" className={styles.errorCard}>
              <AlertCircle size={16} />
              <span>{(saveMutation.error as Error).message}</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
