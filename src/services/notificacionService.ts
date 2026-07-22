import { supabase } from '@/lib/supabase';

export type EventoTipo = 
  | 'presupuesto_visto'
  | 'presupuesto_compartido'
  | 'presupuesto_aceptado'
  | 'inicio_obra'
  | 'trabajo_finalizado'
  | 'garantia_vencer'
  | 'nuevo_reporte'
  | 'nuevo_instructivo';

export type EventoSistema = {
  id: string;
  tipo: EventoTipo;
  presupuesto_id?: string | null;
  codigo_presupuesto?: string | null;
  cliente_nombre?: string | null;
  consorcio_nombre?: string | null;
  detalles?: Record<string, any> | null;
  created_at: string;
};

export type EventoInsert = Omit<EventoSistema, 'id' | 'created_at'>;

export const notificacionService = {
  async getAll() {
    const { data, error } = await supabase
      .from('eventos_sistema')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching eventos:', error);
      return [];
    }
    return data as EventoSistema[];
  },

  async create(evento: EventoInsert) {
    const { data, error } = await supabase
      .from('eventos_sistema')
      .insert(evento)
      .select()
      .single();

    if (error) {
      console.error('Error creating evento:', error);
      throw error;
    }
    return data as EventoSistema;
  },

  async hasEvent(tipo: EventoTipo, presupuestoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('eventos_sistema')
      .select('id')
      .eq('tipo', tipo)
      .eq('presupuesto_id', presupuestoId)
      .limit(1);

    if (error) {
      console.error('Error checking event:', error);
      return false;
    }
    return (data && data.length > 0);
  },

  subscribeToEventos(onNewEvento: (evento: EventoSistema) => void) {
    const channel = supabase
      .channel('eventos_sistema_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'eventos_sistema' },
        (payload) => {
          if (payload.new) {
            onNewEvento(payload.new as EventoSistema);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
