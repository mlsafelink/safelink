import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  Plus,
  FolderOpen,
  Library,
  Megaphone,
  LayoutTemplate,
  Mic2,
  Settings,
} from 'lucide-react';
import { InstagramIcon } from '../InstagramIcon';
import { clsx } from 'clsx';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './VibeLayout.module.css';
import '../../styles/vibe-tokens.css';
import { checkVibeServerHealth } from '../../services/vibeApi';

interface NavEntry {
  to: string;
  label: string;
  icon: React.ReactNode;
  pending?: boolean;
}

const NAV_ITEMS: NavEntry[] = [
  { to: '/vibe', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { to: '/vibe/proyectos', label: 'Proyectos', icon: <FolderOpen size={14} /> },
  { to: '/vibe/biblioteca', label: 'Biblioteca', icon: <Library size={14} /> },
  { to: '/vibe/campanas', label: 'Campañas', icon: <Megaphone size={14} /> },
  { to: '/vibe/plantillas', label: 'Plantillas', icon: <LayoutTemplate size={14} /> },
  { to: '/vibe/voz', label: 'Voz y subtítulos', icon: <Mic2 size={14} /> },
  { to: '/vibe/instagram', label: 'Instagram', icon: <InstagramIcon size={14} /> },
  { to: '/vibe/configuracion', label: 'Marca', icon: <Settings size={14} /> },
];

function getSectionLabel(pathname: string): string {
  if (pathname === '/vibe') return 'Dashboard';
  if (pathname.includes('/vibe/crear')) return 'Crear contenido';
  if (pathname.includes('/vibe/proyectos')) return 'Proyectos';
  if (pathname.includes('/vibe/biblioteca')) return 'Biblioteca';
  if (pathname.includes('/vibe/campanas')) return 'Campañas';
  if (pathname.includes('/vibe/plantillas')) return 'Plantillas';
  if (pathname.includes('/vibe/voz')) return 'Voz y subtítulos';
  if (pathname.includes('/vibe/instagram')) return 'Cuenta de Instagram';
  if (pathname.includes('/vibe/configuracion')) return 'Configuración de marca';
  return 'Vibe';
}

export function VibeLayout() {
  const location = useLocation();
  const { isOpen } = useDrawer();
  const sectionLabel = getSectionLabel(location.pathname);
  const [serverStatus, setServerStatus] = useState<{ isOnline: boolean; aiConfigured?: boolean }>({
    isOnline: false,
  });

  useEffect(() => {
    checkVibeServerHealth().then(setServerStatus);
  }, []);

  return (
    <div className={styles.vibeLayout}>
      {/* ---- Header ---- */}
      <header
        className={clsx(styles.header, !isOpen && styles.headerWithDrawerClosed)}
        role="banner"
      >
        <div className={styles.headerLeft}>
          <Link to="/vibe" className={styles.headerLogo} aria-label="SafeLink Vibe — inicio">
            <div className={styles.headerLogoMark} aria-hidden="true">
              <Sparkles size={16} />
            </div>
            <div>
              <div className={styles.headerBrandName}>SafeLink Vibe</div>
              <div className={styles.headerBrandSub}>Tu estudio creativo de publicidad</div>
            </div>
          </Link>

          <div className={styles.headerDivider} aria-hidden="true" />
          <span className={styles.headerSection} aria-current="page">{sectionLabel}</span>
        </div>

        <div className={styles.headerRight}>
          {/* Estado de la API de generación */}
          <div
            className={styles.headerApiStatus}
            title={
              serverStatus.isOnline
                ? (serverStatus.aiConfigured ? 'Servidor Vibe activo con Google Gemini conectado' : 'Servidor activo en :3001 (falta GEMINI_API_KEY en .env)')
                : 'Servidor multimedia offline. Ejecutá "npm run vibe:server" para iniciarlo.'
            }
            role="status"
            aria-label="Estado del motor de generación"
          >
            <span
              className={clsx(
                styles.apiDot,
                serverStatus.isOnline
                  ? (serverStatus.aiConfigured ? styles.apiDotOnline : styles.apiDotPending)
                  : styles.apiDotOffline
              )}
              aria-hidden="true"
            />
            {serverStatus.isOnline
              ? (serverStatus.aiConfigured ? 'Motor IA: Activo' : 'Motor IA: Configurar Key')
              : 'Motor IA: Offline (:3001)'}
          </div>

          {/* Acción principal */}
          <Link to="/vibe/crear" className={styles.createButton} id="vibe-create-btn">
            <Plus size={14} aria-hidden="true" />
            <span>Crear</span>
          </Link>
        </div>
      </header>

      {/* ---- Navegación secundaria ---- */}
      <nav className={styles.navWrapper} aria-label="Navegación de SafeLink Vibe">
        <div className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/vibe'}
              aria-disabled={item.pending}
              title={item.pending ? 'Disponible próximamente' : undefined}
              className={({ isActive }) =>
                clsx(
                  styles.navItem,
                  isActive && styles.navItemActive,
                  item.pending && styles.navItemPending
                )
              }
            >
              {item.icon}
              {item.label}
              {item.pending && (
                <span className={styles.navBadge} aria-label="próximamente">
                  Pronto
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ---- Contenido de la ruta activa ---- */}
      <main className={styles.content} id="vibe-main-content">
        <Outlet />
      </main>
    </div>
  );
}
