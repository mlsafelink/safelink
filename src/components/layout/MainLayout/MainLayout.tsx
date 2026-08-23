import { forwardRef, type HTMLAttributes } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { Menu } from 'lucide-react';
import { useDrawer } from '@/contexts/DrawerContext';
import styles from './MainLayout.module.css';

export interface MainLayoutProps extends HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
}

export const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ className, sidebar, children, ...props }, ref) => {
    const { isOpen, toggle, close } = useDrawer();

    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return (
      <div ref={ref} className={clsx(styles.layout, className)} {...props}>
        {/* Botón ☰ flotante — visible solo cuando el drawer está cerrado en desktop */}
        {!isOpen && (
          <button
            className={styles.menuToggleBtn}
            onClick={toggle}
            title="Abrir menú"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Overlay mobile — aparece cuando el drawer está abierto en mobile */}
        {isOpen && isMobile && (
          <div
            className={styles.mobileOverlay}
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* Sidebar / Drawer */}
        {sidebar && (
          <aside
            className={clsx(
              styles.sidebar,
              !isOpen && !isMobile && styles.sidebarCollapsed,
              isOpen && isMobile && styles.sidebarMobileOpen
            )}
          >
            {sidebar}
          </aside>
        )}

        <main className={styles.main}>
          <div className={styles.container}>
            {children || <Outlet />}
          </div>
        </main>
      </div>
    );
  }
);

MainLayout.displayName = 'MainLayout';
