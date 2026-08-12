import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout/MainLayout';
import { Sidebar } from '@/components/layout/Sidebar/Sidebar';
import { Login } from '@/features/auth/Login';
import { PrivateRoute } from '@/features/auth/PrivateRoute';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { AdminPage } from '@/features/admins/AdminPage';
import { ConsorcioPage } from '@/features/consorcios/ConsorcioPage';
import { ParticularPage } from '@/features/particulares/ParticularPage';
import { DocumentPage } from '@/features/documents/DocumentPage';
import { NotificacionesPage } from '@/features/notificaciones/NotificacionesPage';
import { PublicReporteViewer } from '@/features/public/PublicReporteViewer';
import { PublicPresupuestoViewer } from '@/features/public/PublicPresupuestoViewer';
import { PublicInstructivoViewer } from '@/features/public/PublicInstructivoViewer';
import { PublicReporteTrabajoViewer } from '@/features/public/PublicReporteTrabajoViewer';
import { SafeLinkNotePage } from '@/features/safeLinkNote/SafeLinkNotePage';
import { SafeLinkIAPage } from '@/features/safeLinkIA/SafeLinkIAPage';
import { SafeLinkNoteProvider } from '@/features/safeLinkNote/SafeLinkNoteContext';
import { FinanzasPage } from '@/features/finanzas/FinanzasPage';
import { PublicFacturaViewer } from '@/features/public/PublicFacturaViewer';
import { BóvedaPage } from '@/features/boveda/BóvedaPage';
import { ToastProvider } from '@/components/ui/Toast/ToastContext';
import { ConfiguracionProvider } from '@/features/configuracion/ConfiguracionContext';
import { ConfiguracionPage } from '@/features/configuracion/ConfiguracionPage';
import { BackupScreen } from '@/features/configuracion/screens/BackupScreen';
import { AparienciaScreen } from '@/features/configuracion/screens/AparienciaScreen';
import { SitioWebScreen } from '@/features/configuracion/screens/SitioWebScreen';
import { LandingPage } from '@/features/landing/LandingPage';
import { SafeLinkMonitorPage } from '@/features/monitor/SafeLinkMonitorPage';

function App() {
  return (
    <ConfiguracionProvider>
    <ToastProvider>
    <SafeLinkNoteProvider>
      <Routes>
        {/* ---- RUTAS PÚBLICAS — sin login, sin sidebar, sin escape ---- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/p/reporte/:publicId" element={<PublicReporteViewer />} />
        <Route path="/p/presupuesto/:publicId" element={<PublicPresupuestoViewer />} />
        <Route path="/p/instructivo/:publicId" element={<PublicInstructivoViewer />} />
        <Route path="/p/reporte-trabajo/:publicId" element={<PublicReporteTrabajoViewer />} />
        <Route path="/p/factura/:publicId" element={<PublicFacturaViewer />} />

        {/* ---- AUTENTICACIÓN ---- */}
        <Route path="/login" element={<Login />} />

        {/* ---- RUTAS PROTEGIDAS ---- */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout sidebar={<Sidebar />} />}>
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/administraciones" element={<AdminPage />} />
            <Route path="/consorcios"     element={<ConsorcioPage />} />
            <Route path="/clientes"       element={<ParticularPage />} />
            <Route path="/documentos"     element={<DocumentPage />} />
            <Route path="/finanzas"       element={<FinanzasPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/safelink-note"  element={<SafeLinkNotePage />} />
            <Route path="/safelink-ia"    element={<SafeLinkIAPage />} />
            <Route path="/boveda"          element={<BóvedaPage />} />
            <Route path="/monitor"         element={<SafeLinkMonitorPage />} />
            <Route path="/configuracion"            element={<ConfiguracionPage />} />
            <Route path="/configuracion/backup"     element={<BackupScreen />} />
            <Route path="/configuracion/apariencia"  element={<AparienciaScreen />} />
            <Route path="/configuracion/sitio-web"   element={<SitioWebScreen />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SafeLinkNoteProvider>
    </ToastProvider>
    </ConfiguracionProvider>
  );
}

export default App;
