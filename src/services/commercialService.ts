import { supabase } from '@/lib/supabase';

export interface CommercialCompany {
  id: string;
  user_id?: string | null;
  nombre_comercial: string;
  razon_social?: string | null;
  cuit?: string | null;
  rubro?: string | null;
  tipo_establecimiento?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  pais?: string | null;
  coordenadas?: { lat: number; lng: number } | null;
  sitio_web?: string | null;
  telefono?: string | null;
  email?: string | null;
  fuente?: string | null;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado_investigacion: string;
  servicios_potenciales?: string[] | null;
  observaciones?: string | null;
  consorcio_id?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins opcionales
  consorcios?: { id: string; nombre: string; direccion: string | null } | null;
  contacts_count?: number;
  open_opps_count?: number;
}

export type CommercialCompanyInsert = Omit<CommercialCompany, 'id' | 'created_at' | 'updated_at' | 'consorcios' | 'contacts_count' | 'open_opps_count'>;

export interface CommercialContact {
  id: string;
  company_id: string;
  user_id?: string | null;
  nombre: string;
  apellido?: string | null;
  cargo?: string | null;
  area?: string | null;
  telefono?: string | null;
  telefono_interno?: string | null;
  email?: string | null;
  horario_contacto?: string | null;
  medio_preferido?: string | null;
  estado_verificacion: 'Confirmado' | 'A confirmar' | 'Desactualizado' | 'Desvinculado';
  fuente?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  commercial_companies?: { id: string; nombre_comercial: string } | null;
}

export type CommercialContactInsert = Omit<CommercialContact, 'id' | 'created_at' | 'updated_at' | 'commercial_companies'>;

export interface CommercialVisit {
  id: string;
  company_id: string;
  contact_id?: string | null;
  user_id?: string | null;
  fecha: string; // YYYY-MM-DD
  hora?: string | null; // HH:mm
  direccion?: string | null;
  modalidad: 'Presencial' | 'Virtual';
  objetivo?: string | null;
  estado: 'Planificada' | 'Confirmada' | 'Realizada' | 'Reprogramada' | 'Cancelada';
  resultado?: string | null;
  necesidades_detectadas?: string | null;
  sistemas_observados?: string | null;
  proveedores_actuales?: string | null;
  servicios_ofrecidos?: string | null;
  proximo_paso?: string | null;
  fecha_proximo_paso?: string | null;
  fotografias?: string[] | null;
  created_at: string;
  updated_at: string;
  // Joins
  commercial_companies?: { id: string; nombre_comercial: string; direccion: string | null } | null;
  commercial_contacts?: { id: string; nombre: string; apellido?: string | null; cargo?: string | null } | null;
}

export type CommercialVisitInsert = Omit<CommercialVisit, 'id' | 'created_at' | 'updated_at' | 'commercial_companies' | 'commercial_contacts'>;

export const OPPORTUNITY_STAGES = [
  '1. Detectada',
  '2. Relevamiento preliminar',
  '3. En estudio técnico',
  '4. Propuesta técnica en elaboración',
  '5. Presupuesto en elaboración',
  '6. Propuesta enviada',
  '7. En negociación',
  '8. Ganada',
  '9. Perdida',
  '10. En pausa',
] as const;

export type OpportunityStage = typeof OPPORTUNITY_STAGES[number];

export interface CommercialOpportunity {
  id: string;
  company_id: string;
  contact_id?: string | null;
  visit_id?: string | null;
  user_id?: string | null;
  nombre: string;
  necesidad?: string | null;
  alcance?: string | null;
  servicios?: string[] | null;
  prioridad: 'Alta' | 'Media' | 'Baja';
  importe_estimado: number;
  fecha_deteccion: string;
  proxima_accion?: string | null;
  fecha_proxima_accion?: string | null;
  estado: OpportunityStage;
  motivo_cierre?: string | null;
  presupuesto_id?: string | null;
  reporte_id?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  commercial_companies?: { id: string; nombre_comercial: string; consorcio_id?: string | null } | null;
  commercial_contacts?: { id: string; nombre: string; apellido?: string | null } | null;
  presupuestos?: { id: string; titulo: string; total: number; public_id: string } | null;
  reportes?: { id: string; titulo: string; public_id: string } | null;
}

export type CommercialOpportunityInsert = Omit<CommercialOpportunity, 'id' | 'created_at' | 'updated_at' | 'commercial_companies' | 'commercial_contacts' | 'presupuestos' | 'reportes'>;

export interface CommercialOpportunityHistory {
  id: string;
  opportunity_id: string;
  user_id?: string | null;
  estado_anterior?: string | null;
  estado_nuevo: string;
  motivo?: string | null;
  created_at: string;
}

export interface CommercialTask {
  id: string;
  company_id: string;
  contact_id?: string | null;
  opportunity_id?: string | null;
  user_id?: string | null;
  titulo: string;
  descripcion?: string | null;
  tipo: 'Llamada telefónica' | 'Correo electrónico' | 'Mensaje WhatsApp' | 'Visita presencial' | 'Reunión virtual' | 'Envío de presupuesto' | 'Seguimiento de propuesta' | 'Tarea interna';
  fecha_programada: string; // YYYY-MM-DD
  hora_programada?: string | null;
  prioridad: 'Urgente' | 'Alta' | 'Normal' | 'Baja';
  estado: 'Pendiente' | 'En curso' | 'Realizada' | 'Vencida' | 'Cancelada';
  resultado?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  commercial_companies?: { id: string; nombre_comercial: string; telefono?: string | null } | null;
  commercial_contacts?: { id: string; nombre: string; apellido?: string | null; telefono?: string | null } | null;
  commercial_opportunities?: { id: string; nombre: string } | null;
}

export type CommercialTaskInsert = Omit<CommercialTask, 'id' | 'created_at' | 'updated_at' | 'commercial_companies' | 'commercial_contacts' | 'commercial_opportunities'>;

export interface CommercialSummary {
  totalEmpresas: number;
  totalContactos: number;
  visitasProgramadas: number;
  visitasRealizadas: number;
  oportunidadesAbiertas: number;
  seguimientosPendientes: number;
  seguimientosVencidos: number;
  presupuestosGenerados: number;
  actividadReciente: Array<{
    id: string;
    tipo: 'empresa' | 'contacto' | 'visita' | 'oportunidad' | 'seguimiento';
    titulo: string;
    subtitulo: string;
    fecha: string;
  }>;
  proximasActividades: Array<{
    id: string;
    tipo: 'visita' | 'seguimiento';
    titulo: string;
    empresa: string;
    fecha: string;
    hora?: string | null;
    prioridad: string;
    vencido: boolean;
  }>;
}

export const commercialService = {
  // ==========================================
  // EMPRESAS
  // ==========================================
  async getCompanies(filters?: { search?: string; rubro?: string; prioridad?: string; estado?: string; activo?: boolean }) {
    let query = supabase
      .from('commercial_companies')
      .select(`
        *,
        consorcios:consorcio_id (id, nombre, direccion)
      `)
      .order('nombre_comercial', { ascending: true });

    if (filters?.activo !== undefined) {
      query = query.eq('activo', filters.activo);
    } else {
      query = query.eq('activo', true);
    }

    if (filters?.rubro) {
      query = query.eq('rubro', filters.rubro);
    }
    if (filters?.prioridad) {
      query = query.eq('prioridad', filters.prioridad);
    }
    if (filters?.estado) {
      query = query.eq('estado_investigacion', filters.estado);
    }
    if (filters?.search) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`nombre_comercial.ilike.${term},razon_social.ilike.${term},direccion.ilike.${term},localidad.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching commercial_companies:', error.message);
      return [] as CommercialCompany[];
    }
    return (data || []) as CommercialCompany[];
  },

  async getCompanyById(id: string) {
    const { data, error } = await supabase
      .from('commercial_companies')
      .select(`
        *,
        consorcios:consorcio_id (id, nombre, direccion)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CommercialCompany;
  },

  async createCompany(company: CommercialCompanyInsert) {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...company,
      user_id: authData?.user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commercial_companies')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialCompany;
  },

  async updateCompany(id: string, updates: Partial<CommercialCompany>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    delete (payload as any).consorcios;
    delete (payload as any).contacts_count;
    delete (payload as any).open_opps_count;

    const { data, error } = await supabase
      .from('commercial_companies')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialCompany;
  },

  async deleteCompany(id: string, hard: boolean = false) {
    if (!hard) {
      // Soft-delete
      const { error } = await supabase
        .from('commercial_companies')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('commercial_companies')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
    return true;
  },

  async convertCompanyToClient(companyId: string, tipo: 'particular' | 'consorcio' = 'particular') {
    const company = await this.getCompanyById(companyId);
    if (!company) throw new Error('Empresa no encontrada');

    if (company.consorcio_id) {
      return company.consorcio_id;
    }

    // Insertar en consorcios
    const { data: newClient, error: clientErr } = await supabase
      .from('consorcios')
      .insert({
        tipo,
        nombre: company.nombre_comercial,
        direccion: company.direccion || null,
        localidad: company.localidad || null,
        provincia: company.provincia || null,
        telefono_encargado: company.telefono || null,
        observaciones: `Cliente originado desde Desarrollo Comercial (Empresa: ${company.nombre_comercial}). ${company.observaciones || ''}`
      })
      .select()
      .single();

    if (clientErr) throw clientErr;

    // Vincular consorcio_id en commercial_companies
    await this.updateCompany(companyId, {
      consorcio_id: newClient.id,
      estado_investigacion: 'Propuesta enviada'
    });

    return newClient.id as string;
  },

  // ==========================================
  // CONTACTOS
  // ==========================================
  async getContacts(companyId?: string) {
    let query = supabase
      .from('commercial_contacts')
      .select(`
        *,
        commercial_companies:company_id (id, nombre_comercial)
      `)
      .order('nombre', { ascending: true });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching commercial_contacts:', error.message);
      return [] as CommercialContact[];
    }
    return (data || []) as CommercialContact[];
  },

  async createContact(contact: CommercialContactInsert) {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...contact,
      user_id: authData?.user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commercial_contacts')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialContact;
  },

  async updateContact(id: string, updates: Partial<CommercialContact>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    delete (payload as any).commercial_companies;

    const { data, error } = await supabase
      .from('commercial_contacts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialContact;
  },

  async deleteContact(id: string) {
    const { error } = await supabase
      .from('commercial_contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // VISITAS
  // ==========================================
  async getVisits(filters?: { companyId?: string; estado?: string }) {
    let query = supabase
      .from('commercial_visits')
      .select(`
        *,
        commercial_companies:company_id (id, nombre_comercial, direccion),
        commercial_contacts:contact_id (id, nombre, apellido, cargo)
      `)
      .order('fecha', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching commercial_visits:', error.message);
      return [] as CommercialVisit[];
    }
    return (data || []) as CommercialVisit[];
  },

  async createVisit(visit: CommercialVisitInsert) {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...visit,
      user_id: authData?.user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commercial_visits')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialVisit;
  },

  async updateVisit(id: string, updates: Partial<CommercialVisit>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    delete (payload as any).commercial_companies;
    delete (payload as any).commercial_contacts;

    const { data, error } = await supabase
      .from('commercial_visits')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialVisit;
  },

  async deleteVisit(id: string) {
    const { error } = await supabase
      .from('commercial_visits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // OPORTUNIDADES
  // ==========================================
  async getOpportunities(filters?: { companyId?: string; estado?: string; prioridad?: string }) {
    let query = supabase
      .from('commercial_opportunities')
      .select(`
        *,
        commercial_companies:company_id (id, nombre_comercial, consorcio_id),
        commercial_contacts:contact_id (id, nombre, apellido),
        presupuestos:presupuesto_id (id, titulo, total, public_id),
        reportes:reporte_id (id, titulo, public_id)
      `)
      .order('created_at', { ascending: false });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }
    if (filters?.prioridad) {
      query = query.eq('prioridad', filters.prioridad);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching commercial_opportunities:', error.message);
      return [] as CommercialOpportunity[];
    }
    return (data || []) as CommercialOpportunity[];
  },

  async createOpportunity(opportunity: CommercialOpportunityInsert) {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...opportunity,
      user_id: authData?.user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commercial_opportunities')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    // Registrar en historial de estado
    try {
      await supabase.from('commercial_opportunity_history').insert({
        opportunity_id: data.id,
        user_id: authData?.user?.id || null,
        estado_anterior: null,
        estado_nuevo: data.estado,
        motivo: 'Creación de oportunidad comercial'
      });
    } catch {}

    return data as CommercialOpportunity;
  },

  async updateOpportunity(id: string, updates: Partial<CommercialOpportunity>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    delete (payload as any).commercial_companies;
    delete (payload as any).commercial_contacts;
    delete (payload as any).presupuestos;
    delete (payload as any).reportes;

    const { data, error } = await supabase
      .from('commercial_opportunities')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialOpportunity;
  },

  async changeOpportunityStage(id: string, newStage: OpportunityStage, reason?: string) {
    const { data: authData } = await supabase.auth.getUser();

    // Obtener estado anterior
    const { data: current } = await supabase
      .from('commercial_opportunities')
      .select('estado')
      .eq('id', id)
      .single();

    const previousStage = current?.estado;

    const { data, error } = await supabase
      .from('commercial_opportunities')
      .update({
        estado: newStage,
        motivo_cierre: (newStage === '8. Ganada' || newStage === '9. Perdida') ? (reason || null) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Guardar en historial
    await supabase.from('commercial_opportunity_history').insert({
      opportunity_id: id,
      user_id: authData?.user?.id || null,
      estado_anterior: previousStage || null,
      estado_nuevo: newStage,
      motivo: reason || null
    });

    return data as CommercialOpportunity;
  },

  async deleteOpportunity(id: string) {
    const { error } = await supabase
      .from('commercial_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getOpportunityHistory(opportunityId: string) {
    const { data, error } = await supabase
      .from('commercial_opportunity_history')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching opportunity history:', error.message);
      return [] as CommercialOpportunityHistory[];
    }
    return (data || []) as CommercialOpportunityHistory[];
  },

  // ==========================================
  // SEGUIMIENTOS Y TAREAS
  // ==========================================
  async getTasks(filters?: { companyId?: string; estado?: string }) {
    let query = supabase
      .from('commercial_tasks')
      .select(`
        *,
        commercial_companies:company_id (id, nombre_comercial, telefono),
        commercial_contacts:contact_id (id, nombre, apellido, telefono),
        commercial_opportunities:opportunity_id (id, nombre)
      `)
      .order('fecha_programada', { ascending: true });

    if (filters?.companyId) {
      query = query.eq('company_id', filters.companyId);
    }
    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching commercial_tasks:', error.message);
      return [] as CommercialTask[];
    }
    return (data || []) as CommercialTask[];
  },

  async createTask(task: CommercialTaskInsert) {
    const { data: authData } = await supabase.auth.getUser();
    const payload = {
      ...task,
      user_id: authData?.user?.id || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('commercial_tasks')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialTask;
  },

  async updateTask(id: string, updates: Partial<CommercialTask>) {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    delete (payload as any).commercial_companies;
    delete (payload as any).commercial_contacts;
    delete (payload as any).commercial_opportunities;

    const { data, error } = await supabase
      .from('commercial_tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CommercialTask;
  },

  async completeTask(id: string, result?: string) {
    return this.updateTask(id, {
      estado: 'Realizada',
      resultado: result || 'Completada'
    });
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('commercial_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // ==========================================
  // DASHBOARD KPI & RESUMEN
  // ==========================================
  async getCommercialSummary(): Promise<CommercialSummary> {
    const todayStr = new Date().toISOString().split('T')[0];

    // Cargar en paralelo sin bloquear
    const [
      companiesRes,
      contactsRes,
      visitsRes,
      oppsRes,
      tasksRes
    ] = await Promise.all([
      supabase.from('commercial_companies').select('id, nombre_comercial, created_at, activo').eq('activo', true),
      supabase.from('commercial_contacts').select('id, nombre, apellido, created_at, company_id'),
      supabase.from('commercial_visits').select('id, fecha, hora, estado, created_at, company_id, commercial_companies(nombre_comercial)'),
      supabase.from('commercial_opportunities').select('id, nombre, estado, created_at, presupuesto_id, reporte_id, commercial_companies(nombre_comercial)'),
      supabase.from('commercial_tasks').select('id, titulo, tipo, fecha_programada, hora_programada, prioridad, estado, created_at, commercial_companies(nombre_comercial)')
    ]);

    const companies = companiesRes.data || [];
    const contacts = contactsRes.data || [];
    const visits = visitsRes.data || [];
    const opps = oppsRes.data || [];
    const tasks = tasksRes.data || [];

    const totalEmpresas = companies.length;
    const totalContactos = contacts.length;

    const visitasProgramadas = visits.filter(v => v.estado === 'Planificada' || v.estado === 'Confirmada').length;
    const visitasRealizadas = visits.filter(v => v.estado === 'Realizada').length;

    const oportunidadesAbiertas = opps.filter(o => o.estado !== '8. Ganada' && o.estado !== '9. Perdida').length;
    const presupuestosGenerados = opps.filter(o => o.presupuesto_id || o.reporte_id).length;

    const seguimientosPendientes = tasks.filter(t => t.estado === 'Pendiente' || t.estado === 'En curso').length;
    const seguimientosVencidos = tasks.filter(t => (t.estado === 'Pendiente' || t.estado === 'En curso') && t.fecha_programada < todayStr).length;

    // Próximas actividades (seguimientos y visitas para hoy o futuro próximo)
    const proximasActividades: CommercialSummary['proximasActividades'] = [];

    // Tareas pendientes o vencidas
    tasks
      .filter(t => t.estado === 'Pendiente' || t.estado === 'En curso')
      .sort((a, b) => a.fecha_programada.localeCompare(b.fecha_programada))
      .slice(0, 10)
      .forEach(t => {
        const empresaName = (t as any).commercial_companies?.nombre_comercial || 'Empresa';
        proximasActividades.push({
          id: t.id,
          tipo: 'seguimiento',
          titulo: `${t.tipo}: ${t.titulo}`,
          empresa: empresaName,
          fecha: t.fecha_programada,
          hora: t.hora_programada,
          prioridad: t.prioridad,
          vencido: t.fecha_programada < todayStr
        });
      });

    // Visitas planificadas
    visits
      .filter(v => v.estado === 'Planificada' || v.estado === 'Confirmada')
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 5)
      .forEach(v => {
        const empresaName = (v as any).commercial_companies?.nombre_comercial || 'Empresa';
        proximasActividades.push({
          id: v.id,
          tipo: 'visita',
          titulo: `Visita comercial`,
          empresa: empresaName,
          fecha: v.fecha,
          hora: v.hora,
          prioridad: 'Alta',
          vencido: v.fecha < todayStr
        });
      });

    // Ordenar próximas por fecha
    proximasActividades.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Actividad reciente unificada
    const actividadReciente: CommercialSummary['actividadReciente'] = [];

    companies.slice(-5).forEach(c => {
      actividadReciente.push({
        id: `emp-${c.id}`,
        tipo: 'empresa',
        titulo: `Nueva empresa registrada`,
        subtitulo: c.nombre_comercial,
        fecha: c.created_at
      });
    });

    visits.filter(v => v.estado === 'Realizada').slice(-5).forEach(v => {
      actividadReciente.push({
        id: `vis-${v.id}`,
        tipo: 'visita',
        titulo: `Visita realizada`,
        subtitulo: (v as any).commercial_companies?.nombre_comercial || 'Visita comercial',
        fecha: v.created_at
      });
    });

    opps.slice(-5).forEach(o => {
      actividadReciente.push({
        id: `opp-${o.id}`,
        tipo: 'oportunidad',
        titulo: `Oportunidad: ${o.estado}`,
        subtitulo: `${(o as any).commercial_companies?.nombre_comercial || ''} — ${o.nombre}`,
        fecha: o.created_at
      });
    });

    tasks.filter(t => t.estado === 'Realizada').slice(-5).forEach(t => {
      actividadReciente.push({
        id: `tsk-${t.id}`,
        tipo: 'seguimiento',
        titulo: `Seguimiento completado`,
        subtitulo: `${(t as any).commercial_companies?.nombre_comercial || ''} — ${t.titulo}`,
        fecha: t.created_at
      });
    });

    actividadReciente.sort((a, b) => b.fecha.localeCompare(a.fecha));

    return {
      totalEmpresas,
      totalContactos,
      visitasProgramadas,
      visitasRealizadas,
      oportunidadesAbiertas,
      seguimientosPendientes,
      seguimientosVencidos,
      presupuestosGenerados,
      actividadReciente: actividadReciente.slice(0, 10),
      proximasActividades: proximasActividades.slice(0, 10)
    };
  },

  // ==========================================
  // IMPORTACIÓN POR LOTES
  // ==========================================
  async importCompaniesBatch(companies: CommercialCompanyInsert[]) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const payload = companies.map(c => ({
      ...c,
      user_id: userId,
      activo: true,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('commercial_companies')
      .insert(payload)
      .select();

    if (error) throw error;
    return data as CommercialCompany[];
  }
};
