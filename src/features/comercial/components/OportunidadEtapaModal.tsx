import { useState } from 'react';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialOpportunity,
  type OpportunityStage,
  OPPORTUNITY_STAGES,
  commercialService
} from '@/services/commercialService';
import styles from '../ComercialPage.module.css';

interface OportunidadEtapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CommercialOpportunity;
  onSuccess: (updatedOpp: CommercialOpportunity) => void;
}

export function OportunidadEtapaModal({
  isOpen,
  onClose,
  opportunity,
  onSuccess
}: OportunidadEtapaModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<OpportunityStage>(opportunity.estado);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const isClosing = selectedStage === '8. Ganada' || selectedStage === '9. Perdida' || selectedStage === '10. En pausa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await commercialService.changeOpportunityStage(
        opportunity.id,
        selectedStage,
        reason.trim() || undefined
      );
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Error actualizando etapa:', err);
      alert('Error al actualizar etapa: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={20} color="var(--primary-color)" />
            <h2>Cambiar Etapa de la Oportunidad</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oportunidad:</span>
              <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {opportunity.nombre}
              </h3>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.45rem' }}>
                Seleccionar Nueva Etapa
              </label>
              <select
                value={selectedStage}
                onChange={e => setSelectedStage(e.target.value as OpportunityStage)}
                style={inputStyle}
              >
                {OPPORTUNITY_STAGES.map(st => (
                  <option key={st} value={st}>
                    {st} {st === opportunity.estado ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {isClosing && (
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  {selectedStage === '8. Ganada'
                    ? 'Motivo de éxito / Cierre acordado'
                    : selectedStage === '9. Perdida'
                    ? 'Motivo de pérdida (Precio, Competencia, Cancelado por cliente...)'
                    : 'Motivo de la pausa'}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Detallar motivos para el registro y aprendizaje del equipo..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading} leftIcon={<ArrowRight size={16} />}>
              {loading ? 'Actualizando...' : 'Actualizar Etapa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};
