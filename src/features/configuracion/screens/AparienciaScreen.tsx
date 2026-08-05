import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card/Card';
import { useConfiguracion } from '@/features/configuracion/ConfiguracionContext';
import { useToast } from '@/components/ui/Toast/ToastContext';
import {
  type Tema,
  type ColorPrincipal,
  type Tipografia,
  type ModoDashboard
} from '@/services/configuracionService';
import {
  ArrowLeft, Palette, Sun, Moon, Laptop, Check,
  Sparkles, Type, LayoutGrid, Zap
} from 'lucide-react';
import styles from './AparienciaScreen.module.css';

const TEMAS: { id: Tema; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'oscuro', label: 'Oscuro', icon: Moon, desc: 'Fondo oscuro para mayor descanso visual' },
  { id: 'claro', label: 'Claro', icon: Sun, desc: 'Fondo claro y contrastado' },
  { id: 'sistema', label: 'Seguir Sistema', icon: Laptop, desc: 'Se adapta a la preferencia de tu dispositivo' },
];

const COLORES: { id: ColorPrincipal; label: string; color: string }[] = [
  { id: 'purpura', label: 'Púrpura', color: '#8b5cf6' },
  { id: 'azul', label: 'Azul', color: '#3182ce' },
  { id: 'verde', label: 'Verde', color: '#10b981' },
  { id: 'rojo', label: 'Rojo', color: '#ef4444' },
  { id: 'naranja', label: 'Naranja', color: '#f97316' },
];

const TIPOGRAFIAS: { id: Tipografia; label: string; sizeText: string }[] = [
  { id: 'pequena', label: 'Pequeña', sizeText: '14px' },
  { id: 'normal', label: 'Normal', sizeText: '16px' },
  { id: 'grande', label: 'Grande', sizeText: '18px' },
];

const MODOS_DASHBOARD: { id: ModoDashboard; label: string; desc: string }[] = [
  { id: 'confortable', label: 'Confortable', desc: 'Espaciado amplio para mayor claridad' },
  { id: 'compacto', label: 'Modo Compacto', desc: 'Vista densa con más contenido visible' },
];

export function AparienciaScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { config, updateConfig } = useConfiguracion();

  const handleTemaChange = (t: Tema) => {
    updateConfig({ tema: t });
    toast.success(`Tema cambiado a: ${t}`);
  };

  const handleColorChange = (c: ColorPrincipal) => {
    updateConfig({ color_principal: c });
    toast.success(`Color principal actualizado`);
  };

  const handleTipografiaChange = (tf: Tipografia) => {
    updateConfig({ tipografia: tf });
    toast.success(`Tamaño de letra cambiado`);
  };

  const handleAnimacionesToggle = () => {
    const newValue = !config.mostrar_animaciones;
    updateConfig({ mostrar_animaciones: newValue });
    toast.info(newValue ? 'Animaciones activadas' : 'Animaciones desactivadas');
  };

  const handleModoDashboardChange = (m: ModoDashboard) => {
    updateConfig({ modo_dashboard: m });
    toast.success(`Modo de vista: ${m}`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/configuracion')}>
          <ArrowLeft size={18} />
          <span>Volver a Configuración</span>
        </button>
        <div className={styles.headerTitle}>
          <div className={styles.headerIcon}>
            <Palette size={24} />
          </div>
          <div>
            <h1>Apariencia y Personalización</h1>
            <p>Ajustá el tema, colores, fuentes y modo de visualización de la plataforma</p>
          </div>
        </div>
      </div>

      <div className={styles.sectionsGrid}>
        {/* 1. Tema */}
        <Card variant="glass" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Moon size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Tema de la Interfaz</h2>
          </div>
          <div className={styles.temasGrid}>
            {TEMAS.map(t => {
              const Icon = t.icon;
              const isSelected = config.tema === t.id;
              return (
                <div
                  key={t.id}
                  className={`${styles.temaBox} ${isSelected ? styles.selectedBox : ''}`}
                  onClick={() => handleTemaChange(t.id)}
                >
                  <div className={styles.temaHeader}>
                    <Icon size={20} />
                    <span className={styles.temaLabel}>{t.label}</span>
                    {isSelected && <Check size={16} className={styles.checkIcon} />}
                  </div>
                  <p className={styles.temaDesc}>{t.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 2. Color Principal */}
        <Card variant="glass" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Sparkles size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Color Principal de Acento</h2>
          </div>
          <div className={styles.coloresGrid}>
            {COLORES.map(c => {
              const isSelected = config.color_principal === c.id;
              return (
                <button
                  key={c.id}
                  className={`${styles.colorBtn} ${isSelected ? styles.selectedColorBtn : ''}`}
                  onClick={() => handleColorChange(c.id)}
                >
                  <span className={styles.colorCircle} style={{ backgroundColor: c.color }}>
                    {isSelected && <Check size={16} color="white" />}
                  </span>
                  <span className={styles.colorLabel}>{c.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 3. Tipografía */}
        <Card variant="glass" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <Type size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Tamaño de Tipografía</h2>
          </div>
          <div className={styles.tipografiaGrid}>
            {TIPOGRAFIAS.map(tf => {
              const isSelected = config.tipografia === tf.id;
              return (
                <div
                  key={tf.id}
                  className={`${styles.tipografiaBox} ${isSelected ? styles.selectedBox : ''}`}
                  onClick={() => handleTipografiaChange(tf.id)}
                >
                  <div className={styles.tipografiaHeader}>
                    <span className={styles.tipografiaLabel}>{tf.label}</span>
                    {isSelected && <Check size={16} className={styles.checkIcon} />}
                  </div>
                  <span className={styles.tipografiaSize}>{tf.sizeText}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 4. Dashboard y Rendimiento */}
        <Card variant="glass" className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <LayoutGrid size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Dashboard y Rendimiento</h2>
          </div>

          <div className={styles.optionsList}>
            {/* Animaciones */}
            <div className={styles.optionRow}>
              <div className={styles.optionInfo}>
                <div className={styles.optionTitleRow}>
                  <Zap size={16} className={styles.optionIcon} />
                  <h3>Mostrar Animaciones y Transiciones</h3>
                </div>
                <p>Efectos de movimiento al interactuar con botones, cartas y menús.</p>
              </div>
              <button
                className={`${styles.toggleSwitch} ${config.mostrar_animaciones ? styles.toggleActive : ''}`}
                onClick={handleAnimacionesToggle}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            {/* Modo Dashboard */}
            <div className={styles.optionRow}>
              <div className={styles.optionInfo}>
                <div className={styles.optionTitleRow}>
                  <LayoutGrid size={16} className={styles.optionIcon} />
                  <h3>Modo de Vista del Dashboard</h3>
                </div>
                <p>Elegí entre un diseño con mayor espaciado o una vista compacta de elementos.</p>
              </div>

              <div className={styles.modoButtons}>
                {MODOS_DASHBOARD.map(m => (
                  <button
                    key={m.id}
                    className={`${styles.modoBtn} ${config.modo_dashboard === m.id ? styles.selectedModoBtn : ''}`}
                    onClick={() => handleModoDashboardChange(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
