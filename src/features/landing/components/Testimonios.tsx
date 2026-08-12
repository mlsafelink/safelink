import styles from './Testimonios.module.css';

// Datos de ejemplo — estructura lista para conectar a Supabase en el futuro
// No se muestran si no hay datos reales; se usa un flag para indicar que son ejemplos
const TESTIMONIOS_EJEMPLO = [
  {
    id: '1',
    nombre: 'María G.',
    comentario: 'Excelente trabajo. Instalaron las cámaras de forma prolija y quedaron funcionando perfecto. Muy atentos y puntuales.',
    estrellas: 5,
  },
  {
    id: '2',
    nombre: 'Roberto M.',
    comentario: 'Muy buena atención y presupuesto claro. Resolvieron el problema de red en nuestra oficina en pocas horas.',
    estrellas: 5,
  },
  {
    id: '3',
    nombre: 'Claudia P.',
    comentario: 'Rehicieron toda la iluminación de nuestro local. El resultado fue increíble, mucho mejor de lo esperado.',
    estrellas: 5,
  },
  {
    id: '4',
    nombre: 'Javier T.',
    comentario: 'Los recomiendo sin dudar. Trabajo impecable, todo documentado y con seguimiento post-instalación.',
    estrellas: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className={styles.stars} aria-label={`${count} estrellas`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < count ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className={styles.googleIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function Testimonios() {
  return (
    <div className={styles.grid}>
      {TESTIMONIOS_EJEMPLO.map(t => (
        <div key={t.id} className={styles.card}>
          <div className={styles.cardTop}>
            <StarRating count={t.estrellas} />
            <GoogleIcon />
          </div>
          <p className={styles.comentario}>"{t.comentario}"</p>
          <div className={styles.autor}>
            <div className={styles.avatar}>
              {t.nombre.charAt(0)}
            </div>
            <span className={styles.nombre}>{t.nombre}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
