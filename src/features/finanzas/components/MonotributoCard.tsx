import { useState, useMemo } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Edit3 } from 'lucide-react';
import styles from './FinanzasDashboard.module.css';

const STORAGE_KEY = 'safelink_monotributo_dia';

function getDiasRestantes(diaVencimiento: number): number {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  let vencimiento = new Date(anio, mes, diaVencimiento);
  // Si ya pasó este mes, calculamos para el próximo
  if (vencimiento < hoy) {
    vencimiento = new Date(anio, mes + 1, diaVencimiento);
  }
  const diff = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getSemaforo(dias: number): 'verde' | 'amarillo' | 'naranja' | 'rojo' {
  if (dias <= 0) return 'rojo';
  if (dias <= 5) return 'naranja';
  if (dias <= 10) return 'amarillo';
  return 'verde';
}

function getProximoVencimiento(diaVencimiento: number): Date {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  let vencimiento = new Date(anio, mes, diaVencimiento);
  if (vencimiento < hoy) {
    vencimiento = new Date(anio, mes + 1, diaVencimiento);
  }
  return vencimiento;
}

function formatFechaLarga(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function MonotributoCard() {
  const [diaVenc, setDiaVenc] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 20;
  });
  const [editando, setEditando] = useState(false);
  const [inputVal, setInputVal] = useState(String(diaVenc));

  const diasRestantes = useMemo(() => getDiasRestantes(diaVenc), [diaVenc]);
  const semaforo = getSemaforo(diasRestantes);
  const proximoVenc = useMemo(() => getProximoVencimiento(diaVenc), [diaVenc]);

  const handleGuardarDia = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 1 && n <= 31) {
      setDiaVenc(n);
      localStorage.setItem(STORAGE_KEY, String(n));
    }
    setEditando(false);
  };

  const labelEstado = {
    verde: '✓ Al día',
    amarillo: '⚠ Próximo',
    naranja: '⚠ Urgente',
    rojo: diasRestantes <= 0 ? '⛔ VENCIDO' : '⚡ MAÑANA',
  }[semaforo];

  return (
    <div className={`${styles.monotributoCard} ${styles[semaforo]}`}>
      <div className={`${styles.monotributoTitle} ${styles[semaforo]}`}>
        {semaforo === 'verde' ? (
          <CheckCircle2 size={14} />
        ) : (
          <AlertTriangle size={14} />
        )}
        Monotributo
      </div>

      <div className={`${styles.monotributoBig} ${styles[semaforo]}`}>
        {diasRestantes <= 0 ? 'HOY' : `${diasRestantes}d`}
      </div>

      <p className={styles.monotributoSub}>
        {diasRestantes <= 0
          ? 'El vencimiento es hoy o ya pasó'
          : `Vence el ${formatFechaLarga(proximoVenc)}`}
      </p>

      <div className={styles.monotributoVencimiento}>
        <Calendar size={13} />
        <span>Día de vencimiento:</span>
        {editando ? (
          <>
            <input
              className={styles.monotributoDiaInput}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={handleGuardarDia}
              onKeyDown={e => e.key === 'Enter' && handleGuardarDia()}
              autoFocus
              type="number"
              min={1}
              max={31}
            />
          </>
        ) : (
          <>
            <strong style={{ color: '#e2e8f0' }}>día {diaVenc}</strong>
            <button
              onClick={() => { setInputVal(String(diaVenc)); setEditando(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px' }}
              title="Editar día"
            >
              <Edit3 size={12} />
            </button>
          </>
        )}
      </div>

      <div className={`${styles.monotributoBadge} ${styles[semaforo]}`}>
        {labelEstado}
      </div>
    </div>
  );
}

/** Banner que se muestra en el dashboard cuando quedan ≤5 días */
export function MonotributoBanner() {
  const diaVenc = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 20;
  }, []);
  const diasRestantes = useMemo(() => getDiasRestantes(diaVenc), [diaVenc]);
  const semaforo = getSemaforo(diasRestantes);

  if (semaforo !== 'naranja' && semaforo !== 'rojo') return null;

  return (
    <div className={`${styles.alertBanner} ${styles[semaforo]}`}>
      <AlertTriangle size={18} />
      {diasRestantes <= 0
        ? '⛔ El Monotributo está VENCIDO. Realizá el pago a la brevedad.'
        : `⚠️ El Monotributo vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}. Recordá realizar el pago.`}
    </div>
  );
}
