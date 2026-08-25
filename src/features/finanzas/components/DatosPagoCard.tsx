import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Landmark, Check, AlertCircle, Save, Info } from 'lucide-react';
import { datosPagoService, type DatosPago } from '@/services/datosPagoService';
import { useToast } from '@/components/ui/Toast/ToastContext';
import styles from './DatosPagoCard.module.css';

export function DatosPagoCard() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: initialData, isLoading } = useQuery({
    queryKey: ['datos-pago'],
    queryFn: () => datosPagoService.getDatosPago(),
  });

  const [formData, setFormData] = useState<DatosPago>({
    banco: '',
    titular: '',
    numero_cuenta: '',
    cbu: '',
    alias: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DatosPago, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        banco: initialData.banco || '',
        titular: initialData.titular || '',
        numero_cuenta: initialData.numero_cuenta || '',
        cbu: initialData.cbu || '',
        alias: initialData.alias || '',
      });
    }
  }, [initialData]);

  const saveMutation = useMutation({
    mutationFn: (dataToSave: DatosPago) => datosPagoService.saveDatosPago(dataToSave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datos-pago'] });
      showToast('Datos para recibir pagos guardados con éxito', 'success');
    },
    onError: () => {
      showToast('No se pudieron guardar los datos bancarios en el servidor', 'error');
    },
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DatosPago, string>> = {};

    if (!formData.banco.trim()) {
      newErrors.banco = 'Ingrese la entidad bancaria';
    }

    if (!formData.titular.trim()) {
      newErrors.titular = 'Ingrese el titular de la cuenta';
    }

    if (!formData.numero_cuenta.trim()) {
      newErrors.numero_cuenta = 'Ingrese el número de cuenta';
    }

    const cleanCbu = formData.cbu.trim().replace(/\s+/g, '');
    if (!cleanCbu) {
      newErrors.cbu = 'El CBU es obligatorio';
    } else if (!/^\d+$/.test(cleanCbu)) {
      newErrors.cbu = 'El CBU debe contener solo números';
    } else if (cleanCbu.length !== 22) {
      newErrors.cbu = `El CBU debe tener exactamente 22 dígitos (actual: ${cleanCbu.length})`;
    }

    if (!formData.alias.trim()) {
      newErrors.alias = 'Ingrese el Alias de la cuenta';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    saveMutation.mutate({
      banco: formData.banco.trim(),
      titular: formData.titular.trim(),
      numero_cuenta: formData.numero_cuenta.trim(),
      cbu: formData.cbu.trim().replace(/\s+/g, ''),
      alias: formData.alias.trim().toUpperCase(),
    });
  };

  const isConfigurado = datosPagoService.isConfigurado(initialData);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrap}>
            <Landmark size={18} />
          </div>
          <div>
            <h3 className={styles.title}>Datos para recibir pagos</h3>
            <p className={styles.subtitle}>
              Información de transferencia bancaria visible para los clientes en los enlaces públicos de facturas.
            </p>
          </div>
        </div>

        {/* Estado de configuración */}
        <div
          className={`${styles.statusBadge} ${
            isConfigurado ? styles.statusConfigurado : styles.statusPendiente
          }`}
        >
          {isConfigurado ? (
            <>
              <Check size={14} />
              <span>Datos bancarios configurados</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              <span>Datos bancarios pendientes de configurar</span>
            </>
          )}
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {/* Entidad Bancaria */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>
                Entidad bancaria<span className={styles.requiredMark}>*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Banco Santander"
              className={`${styles.input} ${errors.banco ? styles.inputError : ''}`}
              value={formData.banco}
              disabled={isLoading}
              onChange={e => {
                setFormData(prev => ({ ...prev, banco: e.target.value }));
                if (errors.banco) setErrors(prev => ({ ...prev, banco: undefined }));
              }}
            />
            {errors.banco && <span className={styles.errorText}>{errors.banco}</span>}
          </div>

          {/* Titular de la cuenta */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>
                Titular de la cuenta<span className={styles.requiredMark}>*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: Marcelo Javier XXXXX"
              className={`${styles.input} ${errors.titular ? styles.inputError : ''}`}
              value={formData.titular}
              disabled={isLoading}
              onChange={e => {
                setFormData(prev => ({ ...prev, titular: e.target.value }));
                if (errors.titular) setErrors(prev => ({ ...prev, titular: undefined }));
              }}
            />
            {errors.titular && <span className={styles.errorText}>{errors.titular}</span>}
          </div>

          {/* Número de cuenta */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>
                Número de cuenta<span className={styles.requiredMark}>*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: 123456789"
              className={`${styles.input} ${errors.numero_cuenta ? styles.inputError : ''}`}
              value={formData.numero_cuenta}
              disabled={isLoading}
              onChange={e => {
                setFormData(prev => ({ ...prev, numero_cuenta: e.target.value }));
                if (errors.numero_cuenta) setErrors(prev => ({ ...prev, numero_cuenta: undefined }));
              }}
            />
            {errors.numero_cuenta && <span className={styles.errorText}>{errors.numero_cuenta}</span>}
          </div>

          {/* CBU */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>
                CBU (22 dígitos)<span className={styles.requiredMark}>*</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: formData.cbu.length === 22 ? '#4ade80' : '#94a3b8' }}>
                {formData.cbu.length}/22
              </span>
            </label>
            <input
              type="text"
              maxLength={22}
              placeholder="Ej: 0720123488000012345678"
              className={`${styles.input} ${styles.inputMono} ${errors.cbu ? styles.inputError : ''}`}
              value={formData.cbu}
              disabled={isLoading}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 22);
                setFormData(prev => ({ ...prev, cbu: val }));
                if (errors.cbu) setErrors(prev => ({ ...prev, cbu: undefined }));
              }}
            />
            {errors.cbu && <span className={styles.errorText}>{errors.cbu}</span>}
          </div>

          {/* Alias */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span>
                Alias<span className={styles.requiredMark}>*</span>
              </span>
            </label>
            <input
              type="text"
              placeholder="Ej: SAFELINK.PAGOS"
              className={`${styles.input} ${styles.inputMono} ${errors.alias ? styles.inputError : ''}`}
              value={formData.alias}
              disabled={isLoading}
              onChange={e => {
                setFormData(prev => ({ ...prev, alias: e.target.value }));
                if (errors.alias) setErrors(prev => ({ ...prev, alias: undefined }));
              }}
            />
            {errors.alias && <span className={styles.errorText}>{errors.alias}</span>}
          </div>
        </div>

        {/* Footer y botón guardar */}
        <div className={styles.actionsRow}>
          <div className={styles.infoHint}>
            <Info size={14} />
            <span>Los cambios se reflejarán automáticamente en todos los enlaces públicos de facturas.</span>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={saveMutation.isPending || isLoading}
          >
            <Save size={15} />
            <span>{saveMutation.isPending ? 'Guardando datos...' : 'Guardar datos'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
