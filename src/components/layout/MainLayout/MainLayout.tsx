import { forwardRef, type HTMLAttributes } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import styles from './MainLayout.module.css';

export interface MainLayoutProps extends HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode;
}

export const MainLayout = forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ className, sidebar, children, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx(styles.layout, className)} {...props}>
        {sidebar && (
          <aside className={styles.sidebar}>
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
