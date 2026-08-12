import React, { useState, useEffect } from 'react';
import { landingService, type ServicioTipo } from '@/services/landingService';
import styles from './ConsultaForm.module.css';

const SERVICIOS: { value: ServicioTipo; label: string }[] = [
  { value: 'camaras', label: 'Cámaras' },
  { value: 'iluminacion', label: 'Iluminación' },
  { value: 'redes', label: 'Redes' },
  { value: 'otro', label: 'Otro' },
];

type Props = {
  servicioPreseleccionado?: ServicioTipo;
};

export function ConsultaForm({ servicioPreseleccionado }: Props) {
  const [servicio, setServicio] = useState<ServicioTipo>(servicioPreseleccionado ?? 'camaras');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (servicioPreseleccionado) {
      setServicio(servicioPreseleccionado);
    }
  }, [servicioPreseleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await landingService.createConsulta({
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        servicio,
        descripcion: descripcion.trim(),
        monto_cotizado: monto ? parseFloat(monto) : null,
      });
      setEnviado(true);
    } catch {
      setError('Hubo un problema al enviar tu consulta. Por favor, intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h3>¡Gracias por tu consulta!</h3>
        <p>Recibimos tu mensaje y nos vamos a comunicar con vos a la brevedad.</p>
        <button
          className={styles.resetBtn}
          onClick={() => {
            setEnviado(false);
            setDescripcion('');
            setMonto('');
            setNombre('');
            setWhatsapp('');
          }}
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} id="formulario-consulta">
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="consulta-servicio">Servicio</label>
        <select
          id="consulta-servicio"
          className={styles.select}
          value={servicio}
          onChange={e => setServicio(e.target.value as ServicioTipo)}
          required
        >
          {SERVICIOS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="consulta-descripcion">Contanos qué necesitás</label>
        <textarea
          id="consulta-descripcion"
          className={styles.textarea}
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Ej.: Necesito instalar 4 cámaras en mi casa. Ya tengo parte del sistema y me cotizaron un trabajo, pero quisiera conocer otra alternativa."
          rows={4}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="consulta-monto">
          ¿Cuánto te cotizaron? <span className={styles.opcional}>(opcional)</span>
        </label>
        <div className={styles.inputPrefix}>
          <span className={styles.prefix}>$</span>
          <input
            id="consulta-monto"
            type="number"
            className={styles.input}
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0"
            min="0"
            step="1"
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="consulta-nombre">Nombre</label>
          <input
            id="consulta-nombre"
            type="text"
            className={styles.input}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="consulta-whatsapp">WhatsApp</label>
          <input
            id="consulta-whatsapp"
            type="tel"
            className={styles.input}
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="11 1234 5678"
            required
          />
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isLoading}
        id="btn-enviar-consulta"
      >
        {isLoading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            <span>📩</span>
            <span>Enviar consulta</span>
          </>
        )}
      </button>
    </form>
  );
}
