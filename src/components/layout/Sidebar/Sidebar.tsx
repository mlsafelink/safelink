import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Building, FileText, LogOut,
  UserCheck, Bell, StickyNote, Bot, DollarSign, Lock,
  Settings, Radio, Layers, ChevronLeft
} from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useAuth } from '@/features/auth/AuthContext';
import { useSafeLinkNote } from '@/features/safeLinkNote/SafeLinkNoteContext';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

export function Sidebar() {
  const { signOut } = useAuth();
  const { hasUnread } = useSafeLinkNote();
  const { close } = useDrawer();

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleNavClick = () => {
    // En mobile, cerrar el drawer al navegar
    if (isMobile) close();
  };

  return (
    <div className={styles.sidebarContent}>
      {/* Header: Logo + botón de cierre */}
      <div className={styles.logoRow}>
        <div className={styles.logo}>
          <img src={logoImg} alt="SafeLink Logo" className={styles.logoImage} />
          <h2>SafeLink</h2>
        </div>
        <button
          className={styles.closeBtn}
          onClick={close}
          title="Cerrar menú"
          aria-label="Cerrar menú de navegación"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/administraciones"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Building2 size={20} />
          <span>Administraciones</span>
        </NavLink>

        <NavLink
          to="/consorcios"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Building size={20} />
          <span>Consorcios</span>
        </NavLink>

        <NavLink
          to="/clientes"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <UserCheck size={20} />
          <span>Clientes Privados</span>
        </NavLink>

        <NavLink
          to="/documentos"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <FileText size={20} />
          <span>Documentos</span>
        </NavLink>

        <NavLink
          to="/finanzas"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <DollarSign size={20} />
          <span>Finanzas</span>
        </NavLink>

        <NavLink
          to="/notificaciones"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Bell size={20} />
          <span>Notificaciones</span>
        </NavLink>

        {/* SafeLink Note con badge de no leído */}
        <div className={styles.navItemWrapper}>
          <NavLink
            to="/safelink-note"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
            onClick={handleNavClick}
          >
            <StickyNote size={20} />
            <span>SafeLink Note</span>
          </NavLink>
          {hasUnread && <span className={styles.unreadBadge} />}
        </div>

        <NavLink
          to="/safelink-ia"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Bot size={20} />
          <span>SafeLink IA</span>
        </NavLink>

        <NavLink
          to="/boveda"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Lock size={20} />
          <span>Bóveda Segura</span>
        </NavLink>

        <NavLink
          to="/monitor"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Radio size={20} />
          <span>SafeLink Mónitor</span>
        </NavLink>

        <NavLink
          to="/infraestructura"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Layers size={20} />
          <span>Infraestructura técnica</span>
        </NavLink>

        <NavLink
          to="/configuracion"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          onClick={handleNavClick}
        >
          <Settings size={20} />
          <span>Configuración</span>
        </NavLink>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={signOut}>
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
