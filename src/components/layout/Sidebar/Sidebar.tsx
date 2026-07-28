import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Building, FileText, LogOut, UserCheck, Bell, StickyNote, Bot } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useAuth } from '@/features/auth/AuthContext';
import { useSafeLinkNote } from '@/features/safeLinkNote/SafeLinkNoteContext';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

export function Sidebar() {
  const { signOut } = useAuth();
  const { hasUnread } = useSafeLinkNote();

  return (
    <div className={styles.sidebarContent}>
      <div className={styles.logo}>
        <img src={logoImg} alt="SafeLink Logo" className={styles.logoImage} />
        <h2>SafeLink</h2>
      </div>

      <nav className={styles.nav}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/administraciones" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <Building2 size={20} />
          <span>Administraciones</span>
        </NavLink>

        <NavLink 
          to="/consorcios" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <Building size={20} />
          <span>Consorcios</span>
        </NavLink>

        <NavLink 
          to="/clientes" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <UserCheck size={20} />
          <span>Clientes Privados</span>
        </NavLink>

        <NavLink 
          to="/documentos" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <FileText size={20} />
          <span>Documentos</span>
        </NavLink>

        <NavLink 
          to="/notificaciones" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <Bell size={20} />
          <span>Notificaciones</span>
        </NavLink>

        {/* ── SafeLink Note con badge de no leído ── */}
        <div className={styles.navItemWrapper}>
          <NavLink
            to="/safelink-note"
            className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
          >
            <StickyNote size={20} />
            <span>SafeLink Note</span>
          </NavLink>
          {hasUnread && <span className={styles.unreadBadge} />}
        </div>

        {/* ── SafeLink IA ── */}
        <NavLink
          to="/safelink-ia"
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <Bot size={20} />
          <span>SafeLink IA</span>
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
