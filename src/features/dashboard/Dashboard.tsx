import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { consorcioService } from '@/services/consorcioService';
import { reporteService, presupuestoService, instructivoService } from '@/services/documentService';
import { Card } from '@/components/ui/Card/Card';
import { Building2, Building, FileText, ClipboardList, BookOpen } from 'lucide-react';
import styles from './Dashboard.module.css';

function StatCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
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
  const { data: administraciones = [] } = useQuery({
    queryKey: ['administraciones'],
    queryFn: adminService.getAll,
  });

  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
  });

  const { data: reportes = [] } = useQuery({
    queryKey: ['reportes'],
    queryFn: reporteService.getAll,
  });

  const { data: presupuestos = [] } = useQuery({
    queryKey: ['presupuestos'],
    queryFn: presupuestoService.getAll,
  });

  const { data: instructivos = [] } = useQuery({
    queryKey: ['instructivos'],
    queryFn: instructivoService.getAll,
  });

  // Últimos documentos: mezcla y ordena por created_at
  const recentDocs = [
    ...reportes.map(r => ({ tipo: 'Reporte', titulo: r.titulo, fecha: r.created_at, color: '#d69e2e' })),
    ...presupuestos.map(p => ({ tipo: 'Presupuesto', titulo: p.titulo, fecha: p.created_at, color: '#805ad5' })),
    ...instructivos.map(i => ({ tipo: 'Instructivo', titulo: i.titulo, fecha: i.created_at, color: '#e53e3e' })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 8);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Resumen general de la plataforma</p>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Administraciones" value={administraciones.length} icon={Building2} color="#3182ce" />
        <StatCard title="Consorcios"        value={consorcios.length}       icon={Building}  color="#38a169" />
        <StatCard title="Reportes"          value={reportes.length}         icon={ClipboardList} color="#d69e2e" />
        <StatCard title="Presupuestos"      value={presupuestos.length}     icon={FileText}  color="#805ad5" />
        <StatCard title="Instructivos"      value={instructivos.length}     icon={BookOpen}  color="#e53e3e" />
      </div>

      <div className={styles.recentSection}>
        <Card variant="neumorphic">
          <h2>Últimos Documentos Creados</h2>
          {recentDocs.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay documentos recientes para mostrar.</p>
            </div>
          ) : (
            <div className={styles.recentList}>
              {recentDocs.map((doc, i) => (
                <div key={i} className={styles.recentItem}>
                  <span
                    className={styles.recentBadge}
                    style={{ background: doc.color }}
                  >
                    {doc.tipo}
                  </span>
                  <span className={styles.recentTitle}>{doc.titulo}</span>
                  <span className={styles.recentDate}>
                    {new Date(doc.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
