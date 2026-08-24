import { supabase } from '@/lib/supabase';
import type { TopologiaRed, TopologiaNodo, TopologiaConexion } from '@/types/topologia';
import type { PlanoInfraestructura } from '@/types/infraestructura';

const STORAGE_KEY = 'safelink_topologias_red_v1';

// Topologías predeterminadas de prueba
const DEMO_TOPOLOGIAS: TopologiaRed[] = [
  {
    id: 'topo-alvarez-thomas-774',
    plan_id: 'demo-plan-redes-01',
    consorcio_id: 'c1',
    public_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    nombre: 'Topología de Red — Álvarez Thomas 774',
    descripcion: 'Topología completa de red: Enlace Fibertel FTTH, Switch UniFi 16 PoE y puestos cableados.',
    consorcio: {
      id: 'c1',
      nombre: 'Álvarez Thomas 774',
      direccion: 'Álvarez Thomas 774, CABA',
    },
    nodos: [
      {
        id: 'node-wan',
        tipo: 'otro',
        codigo: 'INTERNET',
        nombre: 'Conexión WAN / ISP',
        x: 600,
        y: 60,
        estado: 'activo',
        propiedades: { proveedor: 'Fibertel FTTH', ip: 'WAN Pública' },
      },
      {
        id: 'node-modem-01',
        elemento_id: 'elem-modem-01',
        tipo: 'modem',
        codigo: 'MODEM-01',
        nombre: 'Módem Fibertel Principal',
        x: 600,
        y: 200,
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
        },
      },
      {
        id: 'node-sw-01',
        elemento_id: 'elem-sw-01',
        tipo: 'switch',
        codigo: 'SW-01',
        nombre: 'Switch Principal Ubiquiti UniFi',
        x: 600,
        y: 380,
        parent_element_id: 'elem-modem-01',
        estado: 'activo',
        propiedades: {
          marca: 'Ubiquiti UniFi',
          modelo: 'USW-16-PoE',
          ip: '192.168.1.2',
          ubicacion: 'Rack Principal PB',
          cantidadPuertos: 16,
          modemId: 'elem-modem-01',
        },
      },
      // PoE Inyectores intermedios
      {
        id: 'node-poe-p3-1',
        tipo: 'fuente_poe',
        codigo: 'PoE 24V',
        nombre: 'Inyector PoE P3_1',
        x: 100,
        y: 560,
        is_intermediate_poe: true,
        poe_voltage: '24V',
        estado: 'activo',
        propiedades: { poe_voltage: '24V', poe_brand: 'Ubiquiti', poe_model: 'POE-24-12W-G' },
      },
      {
        id: 'node-poe-p2-6',
        tipo: 'fuente_poe',
        codigo: 'PoE 48V',
        nombre: 'Inyector PoE P2_6',
        x: 230,
        y: 560,
        is_intermediate_poe: true,
        poe_voltage: '48V',
        estado: 'activo',
        propiedades: { poe_voltage: '48V', poe_brand: 'Ubiquiti', poe_model: 'U-POE-af' },
      },
      {
        id: 'node-poe-pb-2',
        tipo: 'fuente_poe',
        codigo: 'PoE 24V',
        nombre: 'Inyector PoE PB_2',
        x: 900,
        y: 560,
        is_intermediate_poe: true,
        poe_voltage: '24V',
        estado: 'activo',
        propiedades: { poe_voltage: '24V', poe_brand: 'Ubiquiti', poe_model: 'POE-24-12W-G' },
      },
      {
        id: 'node-poe-pb-3',
        tipo: 'fuente_poe',
        codigo: 'PoE 48V',
        nombre: 'Inyector PoE PB_3',
        x: 1030,
        y: 560,
        is_intermediate_poe: true,
        poe_voltage: '48V',
        estado: 'activo',
        propiedades: { poe_voltage: '48V', poe_brand: 'Ubiquiti', poe_model: 'U-POE-af' },
      },
      {
        id: 'node-poe-p1-4',
        tipo: 'fuente_poe',
        codigo: 'PoE 24V',
        nombre: 'Inyector PoE P1_4',
        x: 1160,
        y: 560,
        is_intermediate_poe: true,
        poe_voltage: '24V',
        estado: 'activo',
        propiedades: { poe_voltage: '24V', poe_brand: 'Ubiquiti', poe_model: 'POE-24-12W-G' },
      },
      // Dispositivos finales
      {
        id: 'node-p3-1',
        elemento_id: 'elem-boca-p3-1',
        tipo: 'boca',
        codigo: 'P3_1',
        nombre: 'Habitación Externa',
        x: 100,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '12',
        estado: 'activo',
        propiedades: { piso: '3°', ubicacion: 'Habitación Externa', use_poe_injector: true, poe_voltage: '24V' },
      },
      {
        id: 'node-p2-6',
        elemento_id: 'elem-boca-p2-6',
        tipo: 'boca',
        codigo: 'P2_6',
        nombre: 'Puesto 2do Piso B',
        x: 230,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '12',
        estado: 'activo',
        propiedades: { piso: '2°', ubicacion: '2do Piso Oficina B', use_poe_injector: true, poe_voltage: '48V' },
      },
      {
        id: 'node-p2-8',
        elemento_id: 'elem-boca-p2-8',
        tipo: 'boca',
        codigo: 'P2_8',
        nombre: 'Puesto 2do Piso 8',
        x: 360,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '01',
        estado: 'activo',
        propiedades: { piso: '2°', switchId: 'elem-sw-01', puertoNumero: '01' },
      },
      {
        id: 'node-p1-5',
        elemento_id: 'elem-boca-p1-5',
        tipo: 'boca',
        codigo: 'P1_5',
        nombre: 'Puesto 1er Piso 5',
        x: 480,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '02',
        estado: 'activo',
        propiedades: { piso: '1°', switchId: 'elem-sw-01', puertoNumero: '02' },
      },
      {
        id: 'node-p2-7',
        elemento_id: 'elem-boca-p2-7',
        tipo: 'boca',
        codigo: 'P2_7',
        nombre: 'Puesto 2do Piso A',
        x: 600,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '03',
        estado: 'activo',
        propiedades: { piso: '2°', switchId: 'elem-sw-01', puertoNumero: '03' },
      },
      {
        id: 'node-sum-8',
        elemento_id: 'elem-boca-sum-8',
        tipo: 'boca',
        codigo: 'SUM_8',
        nombre: 'Puesto SUM',
        x: 720,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '04',
        estado: 'activo',
        propiedades: { piso: 'PB', switchId: 'elem-sw-01', puertoNumero: '04' },
      },
      {
        id: 'node-pb-1',
        elemento_id: 'elem-boca-pb-1',
        tipo: 'boca',
        codigo: 'PB_1',
        nombre: 'Puesto Seguridad PB',
        x: 810,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '05',
        estado: 'activo',
        propiedades: { piso: 'PB', switchId: 'elem-sw-01', puertoNumero: '05' },
      },
      {
        id: 'node-pb-2',
        elemento_id: 'elem-boca-pb-2',
        tipo: 'boca',
        codigo: 'PB_2',
        nombre: 'Boca Recepción PB',
        x: 900,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '09',
        estado: 'activo',
        propiedades: { piso: 'PB', use_poe_injector: true, poe_voltage: '24V' },
      },
      {
        id: 'node-pb-3',
        elemento_id: 'elem-boca-pb-3',
        tipo: 'boca',
        codigo: 'PB_3',
        nombre: 'Puesto PB 3',
        x: 1030,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '10',
        estado: 'activo',
        propiedades: { piso: 'PB', use_poe_injector: true, poe_voltage: '48V' },
      },
      {
        id: 'node-p1-4',
        elemento_id: 'elem-boca-p1-4',
        tipo: 'boca',
        codigo: 'P1_4',
        nombre: 'Puesto 1er Piso 4',
        x: 1160,
        y: 720,
        parent_element_id: 'elem-sw-01',
        puerto_canal: '13',
        estado: 'activo',
        propiedades: { piso: '1°', use_poe_injector: true, poe_voltage: '24V' },
      },
    ],
    conexiones: [
      { id: 'c-wan-modem', source_id: 'node-wan', target_id: 'node-modem-01', tipo_conexion: 'datos', puerto: 'WAN' },
      { id: 'c-modem-sw', source_id: 'node-modem-01', target_id: 'node-sw-01', tipo_conexion: 'datos', puerto: 'LAN 1' },
      // Conexiones directas
      { id: 'c-sw-p28', source_id: 'node-sw-01', target_id: 'node-p2-8', tipo_conexion: 'datos', puerto: 'Pto 01' },
      { id: 'c-sw-p15', source_id: 'node-sw-01', target_id: 'node-p1-5', tipo_conexion: 'datos', puerto: 'Pto 02' },
      { id: 'c-sw-p27', source_id: 'node-sw-01', target_id: 'node-p2-7', tipo_conexion: 'datos', puerto: 'Pto 03' },
      { id: 'c-sw-sum8', source_id: 'node-sw-01', target_id: 'node-sum-8', tipo_conexion: 'datos', puerto: 'Pto 04' },
      { id: 'c-sw-pb1', source_id: 'node-sw-01', target_id: 'node-pb-1', tipo_conexion: 'datos', puerto: 'Pto 05' },
      // Conexiones con PoE
      { id: 'c-sw-poe-p31', source_id: 'node-sw-01', target_id: 'node-poe-p3-1', tipo_conexion: 'datos', puerto: 'Pto 12' },
      { id: 'c-poe-p31', source_id: 'node-poe-p3-1', target_id: 'node-p3-1', tipo_conexion: 'poe', puerto: '24V PoE' },

      { id: 'c-sw-poe-p26', source_id: 'node-sw-01', target_id: 'node-poe-p2-6', tipo_conexion: 'datos', puerto: 'Pto 12' },
      { id: 'c-poe-p26', source_id: 'node-poe-p2-6', target_id: 'node-p2-6', tipo_conexion: 'poe', puerto: '48V PoE' },

      { id: 'c-sw-poe-pb2', source_id: 'node-sw-01', target_id: 'node-poe-pb-2', tipo_conexion: 'datos', puerto: 'Pto 09' },
      { id: 'c-poe-pb2', source_id: 'node-poe-pb-2', target_id: 'node-pb-2', tipo_conexion: 'poe', puerto: '24V PoE' },

      { id: 'c-sw-poe-pb3', source_id: 'node-sw-01', target_id: 'node-poe-pb-3', tipo_conexion: 'datos', puerto: 'Pto 10' },
      { id: 'c-poe-pb3', source_id: 'node-poe-pb-3', target_id: 'node-pb-3', tipo_conexion: 'poe', puerto: '48V PoE' },

      { id: 'c-sw-poe-p14', source_id: 'node-sw-01', target_id: 'node-poe-p1-4', tipo_conexion: 'datos', puerto: 'Pto 13' },
      { id: 'c-poe-p14', source_id: 'node-poe-p1-4', target_id: 'node-p1-4', tipo_conexion: 'poe', puerto: '24V PoE' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalTopologias(): TopologiaRed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_TOPOLOGIAS));
      return DEMO_TOPOLOGIAS;
    }
    return JSON.parse(raw);
  } catch {
    return DEMO_TOPOLOGIAS;
  }
}

function saveLocalTopologias(topos: TopologiaRed[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topos));
  } catch (e) {
    console.warn('[TopologiaService] Error guardando en localStorage:', e);
  }
}

export const topologiaService = {
  /**
   * Obtiene todas las topologías registradas
   */
  async getAll(): Promise<TopologiaRed[]> {
    try {
      const { data, error } = await supabase
        .from('infrastructure_topologies')
        .select(`
          *,
          consorcios ( id, nombre, direccion )
        `)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((t: any) => ({
          ...t,
          consorcio: t.consorcios,
          particular: t.particular_id ? t.consorcios : null,
          nodos: t.nodos || [],
          conexiones: t.conexiones || [],
        }));
      }
    } catch (e) {
      console.warn('[TopologiaService] Error fetching from Supabase, using local:', e);
    }
    return getLocalTopologias();
  },

  /**
   * Obtiene una topología por ID
   */
  async getById(id: string): Promise<TopologiaRed | null> {
    try {
      const { data, error } = await supabase
        .from('infrastructure_topologies')
        .select(`
          *,
          consorcios ( id, nombre, direccion )
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          consorcio: data.consorcios,
          particular: data.particular_id ? data.consorcios : null,
          nodos: data.nodos || [],
          conexiones: data.conexiones || [],
        };
      }
    } catch (e) {
      console.warn('[TopologiaService] Error fetching by id from Supabase:', e);
    }

    const local = getLocalTopologias();
    return local.find(t => t.id === id) || null;
  },

  /**
   * Obtiene una topología por Public ID (para cliente)
   */
  async getByPublicId(publicId: string): Promise<TopologiaRed | null> {
    try {
      let { data } = await supabase
        .from('infrastructure_topologies')
        .select(`
          *,
          consorcios ( id, nombre, direccion )
        `)
        .eq('public_id', publicId)
        .is('deleted_at', null)
        .maybeSingle();

      // Si no se encuentra por public_id, intentar por id directo
      if (!data) {
        const fallbackRes = await supabase
          .from('infrastructure_topologies')
          .select(`
            *,
            consorcios ( id, nombre, direccion )
          `)
          .eq('id', publicId)
          .is('deleted_at', null)
          .maybeSingle();
        data = fallbackRes.data;
      }

      if (data) {
        return {
          ...data,
          consorcio: data.consorcios,
          particular: data.particular_id ? data.consorcios : null,
          nodos: data.nodos || [],
          conexiones: data.conexiones || [],
        };
      }
    } catch (e) {
      console.warn('[TopologiaService] Error fetching by publicId from Supabase:', e);
    }

    const local = getLocalTopologias();
    return local.find(t => t.public_id === publicId || t.id === publicId) || null;
  },

  /**
   * Busca si existe una topología para un consorcio o particular
   */
  async getByClient(consorcioId?: string | null, particularId?: string | null): Promise<TopologiaRed | null> {
    const list = await this.getAll();
    if (consorcioId) {
      const found = list.find(t => t.consorcio_id === consorcioId);
      if (found) return found;
    }
    if (particularId) {
      const found = list.find(t => t.particular_id === particularId);
      if (found) return found;
    }
    return null;
  },

  /**
   * Genera automáticamente una topología sincronizada a partir de los elementos de un Plano
   */
  generateFromPlan(plan: PlanoInfraestructura): TopologiaRed {
    const elements = plan.elementos || [];
    const nodos: TopologiaNodo[] = [];
    const conexiones: TopologiaConexion[] = [];

    // 1. Nodo WAN / Internet
    const wanNode: TopologiaNodo = {
      id: 'node-wan',
      tipo: 'otro',
      codigo: 'INTERNET',
      nombre: 'Enlace WAN / Internet',
      x: 600,
      y: 60,
      estado: 'activo',
      propiedades: {},
    };
    nodos.push(wanNode);

    // 2. Módems
    const modems = elements.filter(e => e.tipo === 'modem');
    if (modems.length === 0) {
      // Si no hay módem explícito, creamos uno representativo
      const defModem: TopologiaNodo = {
        id: `node-modem-default`,
        tipo: 'modem',
        codigo: 'MODEM-01',
        nombre: 'Módem de Acceso ISP',
        x: 600,
        y: 200,
        estado: 'activo',
        propiedades: { proveedor: 'Proveedor ISP', tipoConexion: 'Fibra', ip: '192.168.1.1' },
      };
      nodos.push(defModem);
      conexiones.push({
        id: `conn-wan-modem`,
        source_id: wanNode.id,
        target_id: defModem.id,
        tipo_conexion: 'datos',
        puerto: 'WAN',
      });
    } else {
      modems.forEach(m => {
        const modemNode: TopologiaNodo = {
          id: `node-${m.id}`,
          elemento_id: m.id,
          tipo: 'modem',
          codigo: m.codigo,
          nombre: m.nombre,
          x: 600,
          y: 200,
          estado: m.estado,
          propiedades: m.propiedades,
        };
        nodos.push(modemNode);
        conexiones.push({
          id: `conn-wan-${m.id}`,
          source_id: wanNode.id,
          target_id: modemNode.id,
          tipo_conexion: 'datos',
          puerto: 'WAN',
        });
      });
    }

    // 3. Switches
    const switches = elements.filter(e => e.tipo === 'switch');
    switches.forEach(sw => {
      const swNode: TopologiaNodo = {
        id: `node-${sw.id}`,
        elemento_id: sw.id,
        tipo: 'switch',
        codigo: sw.codigo,
        nombre: sw.nombre,
        x: 600,
        y: 380,
        parent_element_id: sw.parent_element_id,
        estado: sw.estado,
        propiedades: sw.propiedades,
      };
      nodos.push(swNode);

      // Conectar con su módem padre o con el primer módem
      const parentModemId = sw.parent_element_id || (sw.propiedades as any)?.modemId;
      const targetModemNode = nodos.find(n => n.tipo === 'modem' && (n.elemento_id === parentModemId || !parentModemId));
      if (targetModemNode) {
        conexiones.push({
          id: `conn-${targetModemNode.id}-${swNode.id}`,
          source_id: targetModemNode.id,
          target_id: swNode.id,
          tipo_conexion: 'datos',
          puerto: 'LAN Uplink',
        });
      }
    });

    // 4. Dispositivos finales (bocas, aps, servidores, etc.)
    const endpoints = elements.filter(e => e.tipo !== 'modem' && e.tipo !== 'switch' && e.tipo !== 'dvr' && e.tipo !== 'camara');
    
    endpoints.forEach(ep => {
      const props = ep.propiedades as any;
      const usePoe = !!props?.use_poe_injector;
      const poeVoltage = props?.poe_voltage || '24V';

      const epNode: TopologiaNodo = {
        id: `node-${ep.id}`,
        elemento_id: ep.id,
        tipo: ep.tipo,
        codigo: ep.codigo,
        nombre: ep.nombre,
        x: 600,
        y: 720,
        parent_element_id: ep.parent_element_id,
        puerto_canal: ep.puerto_canal,
        estado: ep.estado,
        propiedades: ep.propiedades,
      };
      nodos.push(epNode);

      const parentSwitchNode = nodos.find(n => n.tipo === 'switch' && n.elemento_id === ep.parent_element_id) ||
                               nodos.find(n => n.tipo === 'switch');

      if (parentSwitchNode) {
        const portLabel = ep.puerto_canal ? `Pto ${ep.puerto_canal}` : 'LAN';

        if (usePoe) {
          // Crear nodo intermedio PoE
          const poeNode: TopologiaNodo = {
            id: `node-poe-${ep.id}`,
            tipo: 'fuente_poe',
            codigo: `PoE ${poeVoltage}`,
            nombre: `Inyector PoE ${ep.codigo}`,
            x: 600,
            y: 560,
            is_intermediate_poe: true,
            poe_voltage: poeVoltage,
            estado: 'activo',
            propiedades: {
              poe_voltage: poeVoltage,
              poe_brand: props?.poe_brand,
              poe_model: props?.poe_model,
            },
          };
          nodos.push(poeNode);

          // Conexión Switch -> PoE
          conexiones.push({
            id: `conn-${parentSwitchNode.id}-${poeNode.id}`,
            source_id: parentSwitchNode.id,
            target_id: poeNode.id,
            tipo_conexion: 'datos',
            puerto: portLabel,
          });

          // Conexión PoE -> Dispositivo
          conexiones.push({
            id: `conn-${poeNode.id}-${epNode.id}`,
            source_id: poeNode.id,
            target_id: epNode.id,
            tipo_conexion: 'poe',
            puerto: `${poeVoltage} PoE`,
          });
        } else {
          // Conexión Directa Switch -> Dispositivo
          conexiones.push({
            id: `conn-${parentSwitchNode.id}-${epNode.id}`,
            source_id: parentSwitchNode.id,
            target_id: epNode.id,
            tipo_conexion: 'datos',
            puerto: portLabel,
          });
        }
      }
    });

    // Auto-organizar posiciones
    const organizedNodes = this.autoLayout(nodos, conexiones);

    const clientName = plan.consorcio?.nombre || plan.particular?.nombre || 'Instalación Técnica';

    const newTopo: TopologiaRed = {
      id: `topo-${plan.id || crypto.randomUUID()}`,
      plan_id: plan.id,
      consorcio_id: plan.consorcio_id,
      particular_id: plan.particular_id,
      public_id: crypto.randomUUID(),
      nombre: `Topología de Red — ${clientName}`,
      descripcion: `Topología de red sincronizada para ${clientName}`,
      consorcio: plan.consorcio,
      particular: plan.particular,
      nodos: organizedNodes,
      conexiones,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return newTopo;
  },

  /**
   * Algoritmo de auto-organización jerárquica limpia
   */
  autoLayout(nodos: TopologiaNodo[], _conexiones: TopologiaConexion[]): TopologiaNodo[] {
    const wanNodes = nodos.filter(n => n.codigo === 'INTERNET');
    const modemNodes = nodos.filter(n => n.tipo === 'modem');
    const routerNodes = nodos.filter(n => n.tipo === 'router');
    const switchNodes = nodos.filter(n => n.tipo === 'switch');
    const poeNodes = nodos.filter(n => n.tipo === 'fuente_poe' || n.is_intermediate_poe);
    const endpointNodes = nodos.filter(
      n =>
        n.codigo !== 'INTERNET' &&
        n.tipo !== 'modem' &&
        n.tipo !== 'router' &&
        n.tipo !== 'switch' &&
        n.tipo !== 'fuente_poe' &&
        !n.is_intermediate_poe
    );

    const centerX = 600;

    // Fila 0: WAN
    wanNodes.forEach((n, idx) => {
      const offset = (idx - (wanNodes.length - 1) / 2) * 180;
      n.x = centerX + offset;
      n.y = 80;
    });

    // Fila 1: Módems
    modemNodes.forEach((n, idx) => {
      const offset = (idx - (modemNodes.length - 1) / 2) * 200;
      n.x = centerX + offset;
      n.y = 230;
    });

    // Fila 2: Routers
    routerNodes.forEach((n, idx) => {
      const offset = (idx - (routerNodes.length - 1) / 2) * 200;
      n.x = centerX + offset;
      n.y = 360;
    });

    // Fila 3: Switches
    const switchY = routerNodes.length > 0 ? 490 : 390;
    switchNodes.forEach((n, idx) => {
      const offset = (idx - (switchNodes.length - 1) / 2) * 280;
      n.x = centerX + offset;
      n.y = switchY;
    });

    // Fila 4 & 5: Dispositivos y sus fuentes PoE
    // Spacing dinámico: min 120px, max 150px según cantidad de endpoints
    const itemCount = Math.max(endpointNodes.length, 1);
    const itemSpacing = Math.max(110, Math.min(150, 1200 / itemCount));
    const totalEndpoints = endpointNodes.length;
    const startX = centerX - ((totalEndpoints - 1) * itemSpacing) / 2;

    endpointNodes.forEach((n, idx) => {
      const xPos = startX + idx * itemSpacing;
      n.x = Math.max(100, xPos);
      n.y = switchY + 320;

      // Si tiene inyector PoE asociado, alinearlo verticalmente encima del endpoint
      const linkedPoe = poeNodes.find(p => p.id === `node-poe-${n.elemento_id}` || p.id === `node-poe-${n.id}`);
      if (linkedPoe) {
        linkedPoe.x = n.x;
        linkedPoe.y = switchY + 170;
      }
    });

    // Colocar PoE nodes no asociados
    const unplacedPoe = poeNodes.filter(p => !endpointNodes.some(e => p.id === `node-poe-${e.elemento_id}` || p.id === `node-poe-${e.id}`));
    unplacedPoe.forEach((p, idx) => {
      p.x = startX + idx * itemSpacing;
      p.y = switchY + 170;
    });

    return [...nodos];
  },

  /**
   * Guarda o actualiza una topología
   */
  async save(topologia: TopologiaRed): Promise<TopologiaRed> {
    topologia.updated_at = new Date().toISOString();
    if (!topologia.public_id) {
      topologia.public_id = crypto.randomUUID();
    }

    try {
      const { error } = await supabase.from('infrastructure_topologies').upsert({
        id: topologia.id,
        plan_id: topologia.plan_id || null,
        consorcio_id: topologia.consorcio_id || null,
        particular_id: topologia.particular_id || null,
        public_id: topologia.public_id,
        nombre: topologia.nombre,
        descripcion: topologia.descripcion || null,
        tipo: topologia.tipo || 'redes',
        nodos: topologia.nodos || [],
        conexiones: topologia.conexiones || [],
        updated_at: topologia.updated_at,
      });

      if (error) {
        console.error('[TopologiaService] Error guardando en Supabase:', error);
      }
    } catch (e) {
      console.warn('[TopologiaService] Excepción guardando en Supabase:', e);
    }

    const local = getLocalTopologias();
    const idx = local.findIndex(t => t.id === topologia.id);
    if (idx >= 0) {
      local[idx] = topologia;
    } else {
      local.unshift(topologia);
    }
    saveLocalTopologias(local);

    return topologia;
  },

  /**
   * Obtiene todas las topologías de un cliente (consorcio o particular)
   */
  async getByInstallation(consorcioId?: string | null, particularId?: string | null): Promise<TopologiaRed[]> {
    const all = await this.getAll();
    return all.filter(t => {
      if (consorcioId) return t.consorcio_id === consorcioId;
      if (particularId) return t.particular_id === particularId;
      return false;
    });
  },

  /**
   * Duplica una topología creando una copia independiente con nuevo id y public_id.
   * No afecta la topología original.
   */
  async duplicate(id: string): Promise<TopologiaRed | null> {
    const original = await this.getById(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const copy: TopologiaRed = {
      ...original,
      id: `topo-${Date.now()}-copy`,
      public_id: crypto.randomUUID(),
      nombre: `${original.nombre} — Copia`,
      // Reasignar IDs a nodos y conexiones para independencia total
      nodos: original.nodos.map(n => ({ ...n, id: `${n.id}-c${Date.now()}` })),
      conexiones: original.conexiones.map(c => ({
        ...c,
        id: `${c.id}-c${Date.now()}`,
        source_id: `${c.source_id}-c${Date.now()}`,
        target_id: `${c.target_id}-c${Date.now()}`,
      })),
      created_at: now,
      updated_at: now,
    };

    // Guardar la copia
    return this.save(copy);
  },

  /**
   * Elimina una topología. No elimina los equipos de infraestructura asociados.
   */
  async delete(id: string): Promise<boolean> {
    try {
      await supabase.from('infrastructure_topologies').delete().eq('id', id);
    } catch (e) {
      console.warn('[TopologiaService] Error deleting from Supabase:', e);
    }

    const local = getLocalTopologias().filter(t => t.id !== id);
    saveLocalTopologias(local);
    return true;
  },
};
