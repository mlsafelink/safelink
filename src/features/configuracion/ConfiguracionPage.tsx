import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card/Card';
import { Cloud, Palette, Settings, ChevronRight } from 'lucide-react';
import styles from './ConfiguracionPage.module.css';

export function ConfiguracionPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <Settings size={26} />
        </div>
        <div>
          <h1>Centro de Configuración</h1>
          <p>Administrá los respaldos de la plataforma y personalizá tu experiencia visual</p>
        </div>
      </div>

      {/* Grid de 2 Tarjetas Grandes */}
      <div className={styles.cardsGrid}>
        {/* Tarjeta 1: Backup */}
        <Card
          variant="glass"
          className={styles.configCard}
          onClick={() => navigate('/configuracion/backup')}
        >
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrapper} ${styles.backupIcon}`}>
              <Cloud size={32} />
            </div>
            <div className={styles.badge}>Seguridad</div>
          </div>
          <div className={styles.cardContent}>
            <h2>Backup</h2>
            <p>
              Gestión de respaldos, copias de seguridad de datos de la plataforma y restauración del sistema.
            </p>
          </div>
          <div className={styles.cardFooter}>
            <span>Abrir panel de backup</span>
            <ChevronRight size={18} className={styles.arrow} />
          </div>
        </Card>

        {/* Tarjeta 2: Apariencia */}
        <Card
          variant="glass"
          className={styles.configCard}
          onClick={() => navigate('/configuracion/apariencia')}
        >
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrapper} ${styles.aparienciaIcon}`}>
              <Palette size={32} />
            </div>
            <div className={styles.badge}>Personalización</div>
          </div>
          <div className={styles.cardContent}>
            <h2>Apariencia</h2>
            <p>
              Personalización de temas (oscuro/claro), paleta de colores, modo compacto, tipografía y animaciones.
            </p>
          </div>
          <div className={styles.cardFooter}>
            <span>Personalizar interfaz</span>
            <ChevronRight size={18} className={styles.arrow} />
          </div>
        </Card>
      </div>
    </div>
  );
}
