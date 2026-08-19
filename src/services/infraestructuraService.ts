import { supabase } from '@/lib/supabase';
import type {
  PlanoInfraestructura,
  ElementoPlano,
  ResumenInfraestructura,
  PlanoTipo,
} from '@/types/infraestructura';

const BUCKET = 'infrastructure-plans';
const LOCAL_STORAGE_PLANS_KEY = 'sl_infra_plans_cache_v1';

// ── Planos DEMO iniciales para visualización inmediata ────────────
const DEMO_PLANS: PlanoInfraestructura[] = [
  {
    id: 'demo-plan-redes-01',
    public_id: '8f7a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
    nombre: 'Avellaneda 229 — Redes',
    tipo: 'redes',
    archivo_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    archivo_tipo: 'imagen',
    archivo_nombre: 'plano_redes_avellaneda_229.png',
    descripcion: 'Topología de red, switches principales en rack PB y bocas de datos para oficinas y consorcio.',
    consorcio: {
      id: 'c1',
      nombre: 'Consorcio Avellaneda 229',
      direccion: 'Avellaneda 229, CABA',
    },
    elementos: [
      {
        id: 'elem-modem-01',
        plan_id: 'demo-plan-redes-01',
        tipo: 'modem',
        codigo: 'MODEM-01',
        nombre: 'Módem Fibertel Principal',
        pos_x: 12,
        pos_y: 20,
        estado: 'activo',
        propiedades: {
          proveedor: 'Fibertel',
          tipoConexion: 'Fibra',
          ip: '192.168.1.1',
          marca: 'Sagemcom',
          modelo: 'Fast 5655v2',
          mac: '3C:90:66:A1:B2:C3',
          numeroSerie: 'SN-FIB-20268841',
          ubicacion: 'Rack Principal PB',
          observaciones: 'Línea de fibra óptica comercial 500Mbps',
        },
      },
      {
        id: 'elem-sw-01',
        plan_id: 'demo-plan-redes-01',
        tipo: 'switch',
        codigo: 'SW-01',
        nombre: 'Switch Principal Ubiquiti UniFi',
        pos_x: 24,
        pos_y: 35,
        parent_element_id: 'elem-modem-01',
        estado: 'activo',
        propiedades: {
          marca: 'Ubiquiti UniFi',
          modelo: 'USW-16-PoE',
          ip: '192.168.1.2',
          ubicacion: 'Rack Principal PB',
          cantidadPuertos: 16,
          modemId: 'elem-modem-01',
          observaciones: 'Switch Gigabit (1-8 PoE / 9-16 Non-PoE) con Uplink a MODEM-01',
        },
      },
      {
        id: 'elem-boca-p2-8',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P2_8',
        nombre: 'Puesto 2do Piso 8',
        pos_x: 48,
        pos_y: 28,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '01',
        estado: 'activo',
        propiedades: {
          piso: '2°',
          ubicacion: '2do Piso Oficina A',
          switchId: 'elem-sw-01',
          puertoNumero: '01',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-p1-5',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P1_5',
        nombre: 'Puesto 1er Piso 5',
        pos_x: 62,
        pos_y: 28,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '02',
        estado: 'activo',
        propiedades: {
          piso: '1°',
          ubicacion: '1er Piso Sala B',
          switchId: 'elem-sw-01',
          puertoNumero: '02',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-p2-7',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P2_7',
        nombre: 'Puesto 2do Piso A',
        pos_x: 42,
        pos_y: 50,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '03',
        estado: 'activo',
        propiedades: {
          piso: '2°',
          ubicacion: '2do Piso Oficina A',
          tipoCable: 'Cat 6 UTP',
          switchId: 'elem-sw-01',
          puertoNumero: '03',
          use_poe_injector: false,
          observaciones: 'Conexión PoE directa al switch',
        },
      },
      {
        id: 'elem-boca-sum-8',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'SUM_8',
        nombre: 'Puesto Salón Usos Múltiples',
        pos_x: 82,
        pos_y: 38,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '04',
        estado: 'activo',
        propiedades: {
          piso: 'PB',
          ubicacion: 'SUM Hall',
          switchId: 'elem-sw-01',
          puertoNumero: '04',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-pb-1',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'PB_1',
        nombre: 'Puesto Seguridad PB',
        pos_x: 28,
        pos_y: 72,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '05',
        estado: 'activo',
        propiedades: {
          piso: 'PB',
          ubicacion: 'Cabina Vigilancia PB',
          switchId: 'elem-sw-01',
          puertoNumero: '05',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-p2-9',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P2_9',
        nombre: 'Puesto 2do Piso 9',
        pos_x: 52,
        pos_y: 58,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '06',
        estado: 'activo',
        propiedades: {
          piso: '2°',
          ubicacion: '2do Piso Oficina Gerencia',
          switchId: 'elem-sw-01',
          puertoNumero: '06',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-pb-4',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'PB_4',
        nombre: 'Puesto Administración PB',
        pos_x: 38,
        pos_y: 80,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '07',
        estado: 'activo',
        propiedades: {
          piso: 'PB',
          ubicacion: 'Administración',
          switchId: 'elem-sw-01',
          puertoNumero: '07',
          use_poe_injector: false,
        },
      },
      {
        id: 'elem-boca-pb-2',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'PB_2',
        nombre: 'Boca Recepción PB',
        pos_x: 35,
        pos_y: 68,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '09',
        estado: 'activo',
        propiedades: {
          piso: 'PB',
          ubicacion: 'Mostrador Entrada PB',
          tipoCable: 'Cat 6 UTP',
          switchId: 'elem-sw-01',
          puertoNumero: '09',
          use_poe_injector: true,
          poe_voltage: '24V',
          poe_brand: 'Ubiquiti',
          poe_model: 'POE-24-12W-G',
        },
      },
      {
        id: 'elem-boca-pb-3',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'PB_3',
        nombre: 'Puesto PB 3',
        pos_x: 65,
        pos_y: 75,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '10',
        estado: 'activo',
        propiedades: {
          piso: 'PB',
          ubicacion: 'Hall Lateral PB',
          switchId: 'elem-sw-01',
          puertoNumero: '10',
          use_poe_injector: true,
          poe_voltage: '48V',
          poe_brand: 'Ubiquiti',
          poe_model: 'U-POE-af',
        },
      },
      {
        id: 'elem-boca-p3-1',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P3_1',
        nombre: 'Habitación Externa',
        pos_x: 75,
        pos_y: 22,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '12',
        estado: 'activo',
        propiedades: {
          piso: '3°',
          ubicacion: 'Habitación Externa',
          tipoCable: 'Cat 6 UTP Exterior',
          switchId: 'elem-sw-01',
          puertoNumero: '12',
          use_poe_injector: true,
          poe_voltage: '24V',
          poe_brand: 'Ubiquiti',
          poe_model: 'POE-24-12W-G',
          poe_notes: 'Inyector pasivo 24V 0.5A',
        },
      },
      {
        id: 'elem-boca-p2-6',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P2_6',
        nombre: 'Puesto 2do Piso B',
        pos_x: 58,
        pos_y: 42,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '12',
        estado: 'activo',
        propiedades: {
          piso: '2°',
          ubicacion: '2do Piso Oficina B',
          tipoCable: 'Cat 6 UTP',
          switchId: 'elem-sw-01',
          puertoNumero: '12',
          use_poe_injector: true,
          poe_voltage: '48V',
          poe_brand: 'Ubiquiti',
          poe_model: 'U-POE-af',
          poe_notes: 'Fuente 48V 802.3af',
        },
      },
      {
        id: 'elem-boca-p1-4',
        plan_id: 'demo-plan-redes-01',
        tipo: 'boca',
        codigo: 'P1_4',
        nombre: 'Puesto 1er Piso 4',
        pos_x: 70,
        pos_y: 60,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '13',
        estado: 'activo',
        propiedades: {
          piso: '1°',
          ubicacion: '1er Piso Sala Reuniones',
          switchId: 'elem-sw-01',
          puertoNumero: '13',
          use_poe_injector: true,
          poe_voltage: '24V',
          poe_brand: 'Ubiquiti',
          poe_model: 'POE-24-12W-G',
        },
      },
      {
        id: 'elem-ap-01',
        plan_id: 'demo-plan-redes-01',
        tipo: 'ap',
        codigo: 'AP-01',
        nombre: 'Access Point Hall Central',
        pos_x: 74,
        pos_y: 55,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '08',
        estado: 'activo',
        propiedades: {
          marca: 'Ubiquiti',
          modelo: 'U6-Pro WiFi 6',
          ssid: 'SafeLink_Consorcio_5G',
          ip: '192.168.1.30',
          ubicacion: 'Cielorraso Hall PB',
          switchId: 'elem-sw-01',
          puertoNumero: '08',
          use_poe_injector: false,
        },
      },
    ],
    created_at: '2026-08-14T10:30:00Z',
    updated_at: '2026-08-14T10:30:00Z',
  },
  {
    id: 'demo-plan-camaras-01',
    public_id: '9e8d7c6b-5a4f-3e2d-1c0b-9a8f7e6d5c4b',
    nombre: 'Avellaneda 229 — Cámaras',
    tipo: 'camaras',
    archivo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    archivo_tipo: 'imagen',
    archivo_nombre: 'plano_cctv_avellaneda_229.png',
    descripcion: 'Sistema de videovigilancia IP, NVR central y distribución de cámaras perimetrales y de accesos.',
    consorcio: {
      id: 'c1',
      nombre: 'Consorcio Avellaneda 229',
      direccion: 'Avellaneda 229, CABA',
    },
    elementos: [
      {
        id: 'elem-dvr-01',
        plan_id: 'demo-plan-camaras-01',
        tipo: 'dvr',
        codigo: 'DVR-01',
        nombre: 'NVR Central 16 Canales',
        pos_x: 25,
        pos_y: 30,
        estado: 'activo',
        propiedades: {
          marca: 'Hikvision',
          modelo: 'DS-7616NI-Q2/16P',
          tipo: 'NVR',
          ip: '192.168.1.100',
          ubicacion: 'Gabinete Seguridad PB',
          cantidadCanales: 16,
          almacenamiento: '2x WD Purple 4TB (8TB Total)',
          observaciones: 'Grabación continua 24/7 en H.265+',
        },
      },
      {
        id: 'elem-cam-01',
        plan_id: 'demo-plan-camaras-01',
        tipo: 'camara',
        codigo: 'CAM-01',
        nombre: 'Cámara Hall Principal',
        pos_x: 48,
        pos_y: 38,
        parent_element_id: 'elem-dvr-01',
        puerto_canal: 'CH01',
        estado: 'activo',
        propiedades: {
          tipo: 'Domo',
          marca: 'Hikvision',
          modelo: 'DS-2CD1143G0-I',
          resolucion: '4MP (2560x1440)',
          dvrId: 'elem-dvr-01',
          canalNumero: 'CH01',
          ip: '192.168.1.101',
          ubicacion: 'Entrada principal mirando al acceso',
          observaciones: 'Visión nocturna IR 30m activa',
        },
      },
      {
        id: 'elem-cam-02',
        plan_id: 'demo-plan-camaras-01',
        tipo: 'camara',
        codigo: 'CAM-02',
        nombre: 'Cámara Portón Cochera',
        pos_x: 78,
        pos_y: 65,
        parent_element_id: 'elem-dvr-01',
        puerto_canal: 'CH02',
        estado: 'activo',
        propiedades: {
          tipo: 'Bullet',
          marca: 'Hikvision',
          modelo: 'DS-2CD1043G0-I',
          resolucion: '4MP',
          dvrId: 'elem-dvr-01',
          canalNumero: 'CH02',
          ip: '192.168.1.102',
          ubicacion: 'Portón vehicular exterior',
          observaciones: 'LPR / detección de vehículos',
        },
      },
      {
        id: 'elem-cam-03',
        plan_id: 'demo-plan-camaras-01',
        tipo: 'camara',
        codigo: 'CAM-03',
        nombre: 'Cámara Ascensores PB',
        pos_x: 35,
        pos_y: 72,
        parent_element_id: 'elem-dvr-01',
        puerto_canal: 'CH03',
        estado: 'activo',
        propiedades: {
          tipo: 'Domo',
          marca: 'Hikvision',
          modelo: 'DS-2CD1143G0-I',
          resolucion: '4MP',
          dvrId: 'elem-dvr-01',
          canalNumero: 'CH03',
          ubicacion: 'Palier PB ascensores',
        },
      },
    ],
    created_at: '2026-08-14T11:00:00Z',
    updated_at: '2026-08-14T11:00:00Z',
  },
  {
    id: 'demo-plan-redes-02',
    public_id: '7d6c5b4a-3e2f-1a0b-9c8d-7e6f5a4b3c2d',
    nombre: 'Edificio Torres — Redes',
    tipo: 'redes',
    archivo_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    archivo_tipo: 'imagen',
    archivo_nombre: 'plano_torres_redes.png',
    descripcion: 'Puntos de conexión y fibra óptica para enlace entre torres A y B.',
    consorcio: {
      id: 'c2',
      nombre: 'Torres del Sol',
      direccion: 'Av. Libertador 4500, CABA',
    },
    elementos: [
      {
        id: 'elem-sw-02',
        plan_id: 'demo-plan-redes-02',
        tipo: 'switch',
        codigo: 'SW-01',
        nombre: 'Core Switch Torre A',
        pos_x: 30,
        pos_y: 40,
        estado: 'activo',
        propiedades: {
          marca: 'Cisco CBS350',
          modelo: 'CBS350-24P-4G',
          cantidadPuertos: 24,
          ip: '10.0.0.2',
        },
      },
    ],
    created_at: '2026-08-10T14:20:00Z',
    updated_at: '2026-08-10T14:20:00Z',
  },
  {
    id: 'demo-plan-camaras-02',
    public_id: '6c5b4a3e-2f1a-0b9c-8d7e-6f5a4b3c2d1e',
    nombre: 'Edificio Torres — Cámaras',
    tipo: 'camaras',
    archivo_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    archivo_tipo: 'imagen',
    archivo_nombre: 'plano_torres_cctv.png',
    descripcion: 'Circuito cerrado de televisión perimetral y amenities de Torres del Sol.',
    consorcio: {
      id: 'c2',
      nombre: 'Torres del Sol',
      direccion: 'Av. Libertador 4500, CABA',
    },
    elementos: [
      {
        id: 'elem-dvr-02',
        plan_id: 'demo-plan-camaras-02',
        tipo: 'dvr',
        codigo: 'DVR-01',
        nombre: 'NVR Seguridad Torre A',
        pos_x: 28,
        pos_y: 35,
        estado: 'activo',
        propiedades: {
          marca: 'Dahua',
          modelo: 'NVR5216-16P-4KS2E',
          tipo: 'NVR',
          cantidadCanales: 16,
        },
      },
    ],
    created_at: '2026-08-08T09:15:00Z',
    updated_at: '2026-08-08T09:15:00Z',
  },
];

// Helper local para persistencia inmediata y sincronización
function getLocalPlans(): PlanoInfraestructura[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PLANS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading local infra plans:', e);
  }
  return DEMO_PLANS;
}

function saveLocalPlans(plans: PlanoInfraestructura[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PLANS_KEY, JSON.stringify(plans));
  } catch (e) {
    console.warn('Error saving local infra plans:', e);
  }
}

export const infraestructuraService = {
  /**
   * Obtiene todos los planos registrados
   */
  async getAll(tipo?: PlanoTipo): Promise<PlanoInfraestructura[]> {
    try {
      let query = supabase
        .from('infrastructure_plans')
        .select(`
          *,
          consorcios ( id, nombre, direccion ),
          particulares ( id, nombre, direccion )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tipo && tipo !== 'mixto') {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // Enriquecer con conteos
        return data.map(item => ({
          ...item,
          consorcio: item.consorcios,
          particular: item.particulares,
        })) as PlanoInfraestructura[];
      }
    } catch (e) {
      console.info('[InfraestructuraService] Usando almacenamiento local/demo:', e);
    }

    // Fallback a demo/local
    let local = getLocalPlans();
    if (tipo && tipo !== 'mixto') {
      local = local.filter(p => p.tipo === tipo || p.tipo === 'mixto');
    }
    return local;
  },

  /**
   * Obtiene un plano por su ID junto a todos sus elementos técnicos
   */
  async getById(id: string): Promise<PlanoInfraestructura | null> {
    try {
      const { data: plan, error: planError } = await supabase
        .from('infrastructure_plans')
        .select(`
          *,
          consorcios ( id, nombre, direccion ),
          particulares ( id, nombre, direccion )
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (!planError && plan) {
        const { data: elements } = await supabase
          .from('infrastructure_elements')
          .select('*')
          .eq('plan_id', id)
          .order('codigo', { ascending: true });

        return {
          ...plan,
          consorcio: plan.consorcios,
          particular: plan.particulares,
          elementos: (elements as ElementoPlano[]) || [],
        };
      }
    } catch (e) {
      console.warn('[InfraestructuraService] Error fetching plan by ID from Supabase:', e);
    }

    const local = getLocalPlans();
    return local.find(p => p.id === id) || null;
  },

  /**
   * Obtiene un plano por su public_id (para clientes privados / enlace de solo lectura)
   */
  async getByPublicId(publicId: string): Promise<PlanoInfraestructura | null> {
    try {
      let { data: plan } = await supabase
        .from('infrastructure_plans')
        .select(`
          *,
          consorcios ( id, nombre, direccion ),
          particulares ( id, nombre, direccion )
        `)
        .eq('public_id', publicId)
        .is('deleted_at', null)
        .maybeSingle();

      if (!plan) {
        // Intentar buscar por id directo si no se encontró por public_id
        const fallbackRes = await supabase
          .from('infrastructure_plans')
          .select(`
            *,
            consorcios ( id, nombre, direccion ),
            particulares ( id, nombre, direccion )
          `)
          .eq('id', publicId)
          .is('deleted_at', null)
          .maybeSingle();
        plan = fallbackRes.data;
      }

      if (plan) {
        const { data: elements } = await supabase
          .from('infrastructure_elements')
          .select('*')
          .eq('plan_id', plan.id)
          .order('codigo', { ascending: true });

        return {
          ...plan,
          consorcio: plan.consorcios,
          particular: plan.particulares,
          elementos: (elements as ElementoPlano[]) || [],
        };
      }
    } catch (e) {
      console.warn('[InfraestructuraService] Error fetching public plan:', e);
    }

    const local = getLocalPlans();
    return local.find(p => p.public_id === publicId || p.id === publicId) || null;
  },

  /**
   * Sube un archivo de plano (PDF o Imagen) al bucket de Supabase Storage
   */
  async uploadFile(file: File): Promise<{ url: string; tipo: 'pdf' | 'imagen'; nombre: string }> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const ext = file.name.split('.').pop() || (isPdf ? 'pdf' : 'png');
    const fileName = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (!error && data) {
        const { data: pubUrl } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        return {
          url: pubUrl.publicUrl,
          tipo: isPdf ? 'pdf' : 'imagen',
          nombre: file.name,
        };
      }
    } catch (e) {
      console.warn('[InfraestructuraService] Error en upload Supabase Storage, creando ObjectURL local:', e);
    }

    // Fallback con ObjectURL o DataURL para testing inmediato
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          tipo: isPdf ? 'pdf' : 'imagen',
          nombre: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Crea un nuevo plano de infraestructura
   */
  async create(data: {
    nombre: string;
    tipo: PlanoTipo;
    archivo_url: string;
    archivo_tipo: 'pdf' | 'imagen';
    archivo_nombre?: string;
    descripcion?: string;
    consorcio_id?: string | null;
    particular_id?: string | null;
    elementos?: ElementoPlano[];
  }): Promise<PlanoInfraestructura> {
    const id = crypto.randomUUID();
    const public_id = crypto.randomUUID();
    const now = new Date().toISOString();

    const newPlan: PlanoInfraestructura = {
      id,
      public_id,
      nombre: data.nombre,
      tipo: data.tipo,
      archivo_url: data.archivo_url,
      archivo_tipo: data.archivo_tipo,
      archivo_nombre: data.archivo_nombre,
      descripcion: data.descripcion,
      consorcio_id: data.consorcio_id || null,
      particular_id: data.particular_id || null,
      elementos: data.elementos || [],
      created_at: now,
      updated_at: now,
    };

    try {
      const { error } = await supabase.from('infrastructure_plans').insert({
        id,
        public_id,
        nombre: data.nombre,
        tipo: data.tipo,
        archivo_url: data.archivo_url,
        archivo_tipo: data.archivo_tipo,
        archivo_nombre: data.archivo_nombre,
        descripcion: data.descripcion,
        consorcio_id: data.consorcio_id || null,
        particular_id: data.particular_id || null,
      });

      if (!error && data.elementos && data.elementos.length > 0) {
        await supabase.from('infrastructure_elements').insert(
          data.elementos.map(e => ({
            ...e,
            plan_id: id,
          }))
        );
      }
    } catch (e) {
      console.warn('[InfraestructuraService] Error insertando plano en Supabase:', e);
    }

    // Persistir localmente también
    const local = getLocalPlans();
    const updated = [newPlan, ...local];
    saveLocalPlans(updated);

    return newPlan;
  },

  /**
   * Guarda o actualiza los elementos sobre un plano (Bulk Save)
   */
  async saveElements(planId: string, elements: ElementoPlano[]): Promise<boolean> {
    try {
      // Eliminar viejos e insertar nuevos
      await supabase.from('infrastructure_elements').delete().eq('plan_id', planId);
      if (elements.length > 0) {
        await supabase.from('infrastructure_elements').insert(
          elements.map(e => ({
            id: e.id,
            plan_id: planId,
            tipo: e.tipo,
            codigo: e.codigo,
            nombre: e.nombre,
            pos_x: e.pos_x,
            pos_y: e.pos_y,
            parent_element_id: e.parent_element_id || null,
            puerto_canal: e.puerto_canal || null,
            estado: e.estado || 'activo',
            propiedades: e.propiedades || {},
            updated_at: new Date().toISOString(),
          }))
        );
      }
      await supabase
        .from('infrastructure_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', planId);
    } catch (e) {
      console.warn('[InfraestructuraService] Error guardando elementos en Supabase:', e);
    }

    // Actualizar en memoria / localStorage
    const local = getLocalPlans();
    const target = local.find(p => p.id === planId);
    if (target) {
      target.elementos = elements;
      target.updated_at = new Date().toISOString();
      saveLocalPlans(local);
    }

    return true;
  },

  /**
   * Elimina un plano
   */
  async delete(planId: string): Promise<boolean> {
    try {
      await supabase
        .from('infrastructure_plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', planId);
    } catch (e) {
      console.warn('[InfraestructuraService] Error borrando plano en Supabase:', e);
    }

    const local = getLocalPlans().filter(p => p.id !== planId);
    saveLocalPlans(local);
    return true;
  },

  /**
   * Resumen de métricas para la tarjeta lateral
   */
  async getSummary(): Promise<ResumenInfraestructura> {
    const plans = await this.getAll();
    let modems = 0;
    let switches = 0;
    let bocas = 0;
    let aps = 0;
    let dvrs = 0;
    let camaras = 0;

    plans.forEach(p => {
      p.elementos?.forEach(e => {
        if (e.tipo === 'modem') modems++;
        if (e.tipo === 'switch') switches++;
        if (e.tipo === 'boca') bocas++;
        if (e.tipo === 'ap') aps++;
        if (e.tipo === 'dvr') dvrs++;
        if (e.tipo === 'camara') camaras++;
      });
    });

    const planosRedes = plans.filter(p => p.tipo === 'redes').length;
    const planosCamaras = plans.filter(p => p.tipo === 'camaras').length;

    return {
      planosTotales: plans.length,
      planosRedes,
      planosCamaras,
      dispositivosRed: modems + switches + bocas + aps,
      camaras,
      dvrs,
    };
  },
};
