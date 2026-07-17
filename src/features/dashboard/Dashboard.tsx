import { Card } from '@/components/ui/Card/Card';
import { Building2, Building, FileText, ClipboardList, BookOpen } from 'lucide-react';
import styles from './Dashboard.module.css';

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card variant="glass" className={styles.statCard}>
      <div className={styles.statContent}>
        <div>
          <p className={styles.statTitle}>{title}</p>
          <h3 className={styles.statValue}>{value}</h3>
        </div>
        <div className={styles.iconWrapper} style={{ backgroundColor: color }}>
          <Icon size={24} color="white" />
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Resumen general de la plataforma</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Administraciones" value="0" icon={Building2} color="#3182ce" />
        <StatCard title="Consorcios" value="0" icon={Building} color="#38a169" />
        <StatCard title="Reportes" value="0" icon={ClipboardList} color="#d69e2e" />
        <StatCard title="Presupuestos" value="0" icon={FileText} color="#805ad5" />
        <StatCard title="Instructivos" value="0" icon={BookOpen} color="#e53e3e" />
      </div>

      <div className={styles.recentSection}>
        <Card variant="neumorphic">
          <h2>Últimos Documentos Creados</h2>
          <div className={styles.emptyState}>
            <p>No hay documentos recientes para mostrar.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
