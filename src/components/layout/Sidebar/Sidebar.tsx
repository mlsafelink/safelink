import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Building, FileText, LogOut } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { useAuth } from '@/features/auth/AuthContext';
import styles from './Sidebar.module.css';
import { clsx } from 'clsx';

export function Sidebar() {
  const { signOut } = useAuth();

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
          to="/documentos" 
          className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
        >
          <FileText size={20} />
          <span>Documentos</span>
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
