import { supabase } from '@/lib/supabase';

export type EventoTipo = 
  | 'presupuesto_visto'
  | 'presupuesto_compartido'
  | 'presupuesto_aceptado'
  | 'inicio_obra'
  | 'trabajo_finalizado'
  | 'garantia_vencer'
  | 'nuevo_reporte'
  | 'nuevo_instructivo'
  | 'nuevo_sln'
  | 'factura_cargada'
  | 'factura_descargada'
  | 'factura_compartida'
  | 'factura_proxima_vencer'
  | 'factura_pagada'
  | 'consulta_web'
  | 'reporte_aceptado'
  | 'reporte_modificacion_solicitada';

export type EventoSistema = {
  id: string;
  tipo: EventoTipo;
  presupuesto_id?: string | null;
  codigo_presupuesto?: string | null;
  cliente_nombre?: string | null;
  consorcio_nombre?: string | null;
  reporte_id?: string | null;
  reporte_version?: number | null;
  reporte_public_id?: string | null;
  leida?: boolean;
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
    return (data || []) as EventoSistema[];
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

  async marcarLeida(eventoId: string): Promise<boolean> {
    try {
      const { data: current } = await supabase
        .from('eventos_sistema')
        .select('detalles')
        .eq('id', eventoId)
        .maybeSingle();

      const updatedDetalles = {
        ...(current?.detalles || {}),
        leida: true,
        leida_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('eventos_sistema')
        .update({
          leida: true,
          detalles: updatedDetalles,
        })
        .eq('id', eventoId);

      if (error) {
        // Si la columna leida no existe todavía, actualizar sólo detalles
        const { error: errDetalles } = await supabase
          .from('eventos_sistema')
          .update({ detalles: updatedDetalles })
          .eq('id', eventoId);
        if (errDetalles) {
          console.error('[notificacionService] Error marcando evento como leído:', errDetalles);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('[notificacionService] Excepción al marcar leído:', e);
      return false;
    }
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
