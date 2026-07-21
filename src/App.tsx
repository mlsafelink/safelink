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
import { PublicReporteViewer } from '@/features/public/PublicReporteViewer';
import { PublicPresupuestoViewer } from '@/features/public/PublicPresupuestoViewer';
import { PublicInstructivoViewer } from '@/features/public/PublicInstructivoViewer';

function App() {
  return (
    <Routes>
      {/* ---- RUTAS PÚBLICAS — sin login, sin sidebar, sin escape ---- */}
      <Route path="/p/reporte/:publicId" element={<PublicReporteViewer />} />
      <Route path="/p/presupuesto/:publicId" element={<PublicPresupuestoViewer />} />
      <Route path="/p/instructivo/:publicId" element={<PublicInstructivoViewer />} />

      {/* ---- AUTENTICACIÓN ---- */}
      <Route path="/login" element={<Login />} />

      {/* ---- RUTAS PROTEGIDAS ---- */}
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout sidebar={<Sidebar />} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/administraciones" element={<AdminPage />} />
          <Route path="/consorcios" element={<ConsorcioPage />} />
          <Route path="/clientes" element={<ParticularPage />} />
          <Route path="/documentos" element={<DocumentPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
