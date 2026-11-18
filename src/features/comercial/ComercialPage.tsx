import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Briefcase, LayoutDashboard, Building2, Users, Calendar,
  TrendingUp, CheckSquare, Plus, UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  commercialService,
  type CommercialCompany,
  type CommercialContact,
  type CommercialVisit,
  type CommercialOpportunity,
  type CommercialTask
} from '@/services/commercialService';

import { ResumenTab } from './tabs/ResumenTab';
import { EmpresasTab } from './tabs/EmpresasTab';
import { ContactosTab } from './tabs/ContactosTab';
import { VisitasTab } from './tabs/VisitasTab';
import { OportunidadesTab } from './tabs/OportunidadesTab';
import { SeguimientosTab } from './tabs/SeguimientosTab';

import { EmpresaFormModal } from './components/EmpresaFormModal';
import { ContactoFormModal } from './components/ContactoFormModal';
import { VisitaFormModal } from './components/VisitaFormModal';
import { OportunidadFormModal } from './components/OportunidadFormModal';
import { OportunidadEtapaModal } from './components/OportunidadEtapaModal';
import { SeguimientoFormModal } from './components/SeguimientoFormModal';
import { EmpresaDetalleModal } from './components/EmpresaDetalleModal';
import { ImportarExcelModal } from './components/ImportarExcelModal';

import styles from './ComercialPage.module.css';

type MainTab = 'resumen' | 'empresas' | 'contactos' | 'visitas' | 'oportunidades' | 'seguimientos';

export function ComercialPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('resumen');

  // Modales
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<CommercialCompany | null>(null);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<CommercialContact | null>(null);
  const [contactDefaultCompanyId, setContactDefaultCompanyId] = useState<string | undefined>();

  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<CommercialVisit | null>(null);
  const [visitDefaultCompanyId, setVisitDefaultCompanyId] = useState<string | undefined>();

  const [isOppModalOpen, setIsOppModalOpen] = useState(false);
  const [oppToEdit, setOppToEdit] = useState<CommercialOpportunity | null>(null);
  const [oppDefaultCompanyId, setOppDefaultCompanyId] = useState<string | undefined>();

  const [isOppStageModalOpen, setIsOppStageModalOpen] = useState(false);
  const [oppForStage, setOppForStage] = useState<CommercialOpportunity | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<CommercialTask | null>(null);
  const [taskDefaultCompanyId, setTaskDefaultCompanyId] = useState<string | undefined>();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CommercialCompany | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Consultas React Query
  const { data: companies = [], refetch: refetchCompanies } = useQuery({
    queryKey: ['commercial-companies'],
    queryFn: () => commercialService.getCompanies()
  });

  const { data: contacts = [], refetch: refetchContacts } = useQuery({
    queryKey: ['commercial-contacts'],
    queryFn: () => commercialService.getContacts()
  });

  const { data: visits = [], refetch: refetchVisits } = useQuery({
    queryKey: ['commercial-visits'],
    queryFn: () => commercialService.getVisits()
  });

  const { data: opportunities = [], refetch: refetchOpportunities } = useQuery({
    queryKey: ['commercial-opportunities'],
    queryFn: () => commercialService.getOpportunities()
  });

  const { data: tasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['commercial-tasks'],
    queryFn: () => commercialService.getTasks()
  });

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['commercial-summary'],
    queryFn: () => commercialService.getCommercialSummary()
  });

  const refetchAll = () => {
    refetchCompanies();
    refetchContacts();
    refetchVisits();
    refetchOpportunities();
    refetchTasks();
    refetchSummary();
  };

  // Mutaciones de borrado con confirmación
  const deleteCompanyMutation = useMutation({
    mutationFn: (id: string) => commercialService.deleteCompany(id),
    onSuccess: () => {
      refetchAll();
      setIsDetailModalOpen(false);
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => commercialService.deleteContact(id),
    onSuccess: () => refetchAll()
  });

  const deleteVisitMutation = useMutation({
    mutationFn: (id: string) => commercialService.deleteVisit(id),
    onSuccess: () => refetchAll()
  });

  const deleteOppMutation = useMutation({
    mutationFn: (id: string) => commercialService.deleteOpportunity(id),
    onSuccess: () => refetchAll()
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => commercialService.deleteTask(id),
    onSuccess: () => refetchAll()
  });

  // Handlers para abrir modales contextuales
  const handleOpenNewCompany = () => {
    setCompanyToEdit(null);
    setIsCompanyModalOpen(true);
  };

  const handleEditCompany = (company: CommercialCompany) => {
    setCompanyToEdit(company);
    setIsCompanyModalOpen(true);
  };

  const handleDeleteCompany = (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    if (window.confirm(`¿Seguro que deseas archivar a la empresa "${comp?.nombre_comercial || ''}"?`)) {
      deleteCompanyMutation.mutate(companyId);
    }
  };

  const handleSelectCompany = (company: CommercialCompany) => {
    setSelectedCompany(company);
    setIsDetailModalOpen(true);
  };

  const handleOpenNewContact = (companyId?: string) => {
    setContactToEdit(null);
    setContactDefaultCompanyId(companyId);
    setIsContactModalOpen(true);
  };

  const handleEditContact = (contact: CommercialContact) => {
    setContactToEdit(contact);
    setContactDefaultCompanyId(contact.company_id);
    setIsContactModalOpen(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este contacto?')) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const handleOpenNewVisit = (companyId?: string) => {
    setVisitToEdit(null);
    setVisitDefaultCompanyId(companyId);
    setIsVisitModalOpen(true);
  };

  const handleEditVisit = (visit: CommercialVisit) => {
    setVisitToEdit(visit);
    setVisitDefaultCompanyId(visit.company_id);
    setIsVisitModalOpen(true);
  };

  const handleDeleteVisit = (visitId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta visita?')) {
      deleteVisitMutation.mutate(visitId);
    }
  };

  const handleOpenNewOpp = (companyId?: string) => {
    setOppToEdit(null);
    setOppDefaultCompanyId(companyId);
    setIsOppModalOpen(true);
  };

  const handleOpenNewOppFromVisit = (visit: CommercialVisit) => {
    const comp = companies.find(c => c.id === visit.company_id);
    setOppToEdit({
      id: '',
      company_id: visit.company_id,
      contact_id: visit.contact_id || null,
      visit_id: visit.id,
      nombre: `Oportunidad: ${visit.objetivo || comp?.nombre_comercial || 'Relevamiento'}`,
      necesidad: visit.necesidades_detectadas || '',
      alcance: visit.servicios_ofrecidos || '',
      servicios: comp?.servicios_potenciales || ['Sistema de CCTV'],
      prioridad: 'Media',
      importe_estimado: 0,
      fecha_deteccion: visit.fecha,
      proxima_accion: visit.proximo_paso || '',
      fecha_proxima_accion: visit.fecha_proximo_paso || null,
      estado: '2. Relevamiento preliminar',
      motivo_cierre: null,
      presupuesto_id: null,
      reporte_id: null,
      observaciones: visit.resultado || null,
      created_at: '',
      updated_at: ''
    });
    setOppDefaultCompanyId(visit.company_id);
    setIsOppModalOpen(true);
  };

  const handleEditOpp = (opp: CommercialOpportunity) => {
    setOppToEdit(opp);
    setOppDefaultCompanyId(opp.company_id);
    setIsOppModalOpen(true);
  };

  const handleDeleteOpp = (oppId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta oportunidad?')) {
      deleteOppMutation.mutate(oppId);
    }
  };

  const handleChangeOppStage = (opp: CommercialOpportunity) => {
    setOppForStage(opp);
    setIsOppStageModalOpen(true);
  };

  const handleOpenNewTask = (companyId?: string) => {
    setTaskToEdit(null);
    setTaskDefaultCompanyId(companyId);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: CommercialTask) => {
    setTaskToEdit(task);
    setTaskDefaultCompanyId(task.company_id);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este seguimiento?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header Principal */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            <Briefcase size={26} color="var(--primary-color)" />
            Desarrollo Comercial
          </h1>
          <p>Gestión integral de prospección, empresas, visitas, pipeline de oportunidades y seguimientos</p>
        </div>

        <div className={styles.headerActions}>
          <Button variant="secondary" size="sm" leftIcon={<UploadCloud size={15} />} onClick={() => setIsImportModalOpen(true)}>
            Importar Excel
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={handleOpenNewCompany}>
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Tabs Principales */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'resumen' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          <LayoutDashboard size={16} />
          <span>Resumen</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'empresas' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('empresas')}
        >
          <Building2 size={16} />
          <span>Empresas</span>
          <span className={styles.badgeCount}>{companies.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'contactos' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('contactos')}
        >
          <Users size={16} />
          <span>Contactos</span>
          <span className={styles.badgeCount}>{contacts.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'visitas' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('visitas')}
        >
          <Calendar size={16} />
          <span>Visitas</span>
          <span className={styles.badgeCount}>{visits.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'oportunidades' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('oportunidades')}
        >
          <TrendingUp size={16} />
          <span>Oportunidades</span>
          <span className={styles.badgeCount}>{opportunities.length}</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'seguimientos' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('seguimientos')}
        >
          <CheckSquare size={16} />
          <span>Seguimientos</span>
          <span className={styles.badgeCount}>{tasks.length}</span>
        </button>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className={styles.tabContent}>
        {activeTab === 'resumen' && (
          <ResumenTab
            summary={summary || {
              totalEmpresas: companies.length,
              totalContactos: contacts.length,
              visitasProgramadas: visits.filter(v => v.estado === 'Planificada' || v.estado === 'Confirmada').length,
              visitasRealizadas: visits.filter(v => v.estado === 'Realizada').length,
              oportunidadesAbiertas: opportunities.filter(o => o.estado !== '8. Ganada' && o.estado !== '9. Perdida').length,
              seguimientosPendientes: tasks.filter(t => t.estado === 'Pendiente' || t.estado === 'En curso').length,
              seguimientosVencidos: tasks.filter(t => (t.estado === 'Pendiente' || t.estado === 'En curso') && t.fecha_programada < new Date().toISOString().split('T')[0]).length,
              presupuestosGenerados: opportunities.filter(o => o.presupuesto_id || o.reporte_id).length,
              actividadReciente: [],
              proximasActividades: []
            }}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenNewCompany={handleOpenNewCompany}
            onOpenNewContact={() => handleOpenNewContact()}
            onOpenNewVisit={() => handleOpenNewVisit()}
            onOpenNewOpportunity={() => handleOpenNewOpp()}
            onOpenNewTask={() => handleOpenNewTask()}
            onOpenImportExcel={() => setIsImportModalOpen(true)}
            onRefresh={refetchAll}
          />
        )}

        {activeTab === 'empresas' && (
          <EmpresasTab
            companies={companies}
            contacts={contacts}
            onSelectCompany={handleSelectCompany}
            onOpenNewCompany={handleOpenNewCompany}
            onOpenImportExcel={() => setIsImportModalOpen(true)}
            onDeleteCompany={handleDeleteCompany}
          />
        )}

        {activeTab === 'contactos' && (
          <ContactosTab
            contacts={contacts}
            companies={companies}
            onOpenNewContact={() => handleOpenNewContact()}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            onSelectCompany={handleSelectCompany}
          />
        )}

        {activeTab === 'visitas' && (
          <VisitasTab
            visits={visits}
            companies={companies}
            contacts={contacts}
            onOpenNewVisit={handleOpenNewVisit}
            onEditVisit={handleEditVisit}
            onDeleteVisit={handleDeleteVisit}
            onSelectCompany={handleSelectCompany}
            onOpenNewOpportunityFromVisit={handleOpenNewOppFromVisit}
            onRefresh={refetchAll}
          />
        )}

        {activeTab === 'oportunidades' && (
          <OportunidadesTab
            opportunities={opportunities}
            companies={companies}
            onOpenNewOpportunity={handleOpenNewOpp}
            onEditOpportunity={handleEditOpp}
            onDeleteOpportunity={handleDeleteOpp}
            onSelectCompany={handleSelectCompany}
            onChangeStage={handleChangeOppStage}
            onRefresh={refetchAll}
          />
        )}

        {activeTab === 'seguimientos' && (
          <SeguimientosTab
            tasks={tasks}
            companies={companies}
            contacts={contacts}
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onSelectCompany={handleSelectCompany}
            onRefresh={refetchAll}
          />
        )}
      </div>

      {/* Modales */}
      <EmpresaFormModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        onSuccess={() => refetchAll()}
        companyToEdit={companyToEdit}
      />

      <ContactoFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onSuccess={() => refetchAll()}
        contactToEdit={contactToEdit}
        defaultCompanyId={contactDefaultCompanyId}
        companies={companies}
      />

      <VisitaFormModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        onSuccess={() => refetchAll()}
        visitToEdit={visitToEdit}
        defaultCompanyId={visitDefaultCompanyId}
        companies={companies}
        contacts={contacts}
      />

      <OportunidadFormModal
        isOpen={isOppModalOpen}
        onClose={() => setIsOppModalOpen(false)}
        onSuccess={() => refetchAll()}
        oppToEdit={oppToEdit}
        defaultCompanyId={oppDefaultCompanyId}
        companies={companies}
        contacts={contacts}
      />

      {oppForStage && (
        <OportunidadEtapaModal
          isOpen={isOppStageModalOpen}
          onClose={() => {
            setIsOppStageModalOpen(false);
            setOppForStage(null);
          }}
          opportunity={oppForStage}
          onSuccess={() => refetchAll()}
        />
      )}

      <SeguimientoFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => refetchAll()}
        taskToEdit={taskToEdit}
        defaultCompanyId={taskDefaultCompanyId}
        companies={companies}
        contacts={contacts}
        opportunities={opportunities}
      />

      {selectedCompany && (
        <EmpresaDetalleModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          contacts={contacts}
          visits={visits}
          opportunities={opportunities}
          tasks={tasks}
          onEditCompany={comp => {
            setIsDetailModalOpen(false);
            handleEditCompany(comp);
          }}
          onDeleteCompany={id => {
            handleDeleteCompany(id);
          }}
          onAddContact={id => handleOpenNewContact(id)}
          onAddVisit={id => handleOpenNewVisit(id)}
          onAddOpportunity={id => handleOpenNewOpp(id)}
          onAddTask={id => handleOpenNewTask(id)}
          onRefresh={refetchAll}
        />
      )}

      <ImportarExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => refetchAll()}
        existingCompanies={companies}
      />
    </div>
  );
}
