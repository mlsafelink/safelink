import React from 'react';
import {
  Wifi, Server, Network, Globe,
  ShieldAlert, Bell, Megaphone,
  DoorClosed, Layers, Grid3x3, Video,
} from 'lucide-react';
import type { ElementoTipo } from '@/types/infraestructura';

/**
 * Icono de Red estilo Windows 11 (Monitor con conector LAN RJ45)
 */
export const Windows11NetworkIcon = ({
  size = 18,
  color = 'currentColor',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    {/* Monitor */}
    <rect x="3" y="3" width="18" height="12" rx="2" />
    <path d="M12 15v4" />
    <path d="M8 19h8" />
    {/* Puerto/Conector Ethernet */}
    <path d="M10 21h4" />
    <circle cx="12" cy="9" r="1.5" fill={color} />
  </svg>
);

export interface DispositivoMeta {
  tipo: ElementoTipo;
  categoria: 'redes' | 'alarma' | 'camaras' | 'otros';
  categoriaNombre: string;
  nombre: string;
  descripcionDefault?: string;
  codigoPrefix: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeContent: React.ReactNode;
  renderSidebarIcon: (size?: number) => React.ReactNode;
}

export const DISPOSITIVOS_CATALOGO: Record<ElementoTipo, DispositivoMeta> = {
  // ── REDES ──────────────────────────────────────────
  ap: {
    tipo: 'ap',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Access Point',
    codigoPrefix: 'AP',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    badgeContent: '📡',
    renderSidebarIcon: (size = 18) => <Wifi size={size} />,
  },
  rack: {
    tipo: 'rack',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Rack',
    codigoPrefix: 'RACK',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    badgeContent: '🗄️',
    renderSidebarIcon: (size = 18) => <Server size={size} />,
  },
  periscopio: {
    tipo: 'periscopio',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Periscopio de red (en piso)',
    codigoPrefix: 'PER',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    badgeContent: '🔘',
    renderSidebarIcon: (size = 18) => <Layers size={size} />,
  },
  boca: {
    tipo: 'boca',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Boca de red (en pared)',
    codigoPrefix: 'BOC',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.15)',
    borderColor: 'rgba(2, 132, 199, 0.4)',
    // Icono de red estilo Windows 11 en el plano
    badgeContent: <Windows11NetworkIcon size={14} color="#0284c7" />,
    renderSidebarIcon: (size = 18) => <Windows11NetworkIcon size={size} color="#38bdf8" />,
  },
  switch: {
    tipo: 'switch',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Switch',
    codigoPrefix: 'SW',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    badgeContent: '🖧',
    renderSidebarIcon: (size = 18) => <Network size={size} />,
  },
  modem: {
    tipo: 'modem',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Módem ISP',
    codigoPrefix: 'MODEM',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    badgeContent: '🌐',
    renderSidebarIcon: (size = 18) => <Globe size={size} />,
  },
  router: {
    tipo: 'router',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Router',
    codigoPrefix: 'RTR',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    badgeContent: '🔄',
    renderSidebarIcon: (size = 18) => <Network size={size} />,
  },
  servidor: {
    tipo: 'servidor',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Servidor',
    codigoPrefix: 'SRV',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    badgeContent: '🖥️',
    renderSidebarIcon: (size = 18) => <Server size={size} />,
  },
  impresora: {
    tipo: 'impresora',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Impresora de Red',
    codigoPrefix: 'IMP',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.4)',
    badgeContent: '🖨️',
    renderSidebarIcon: (size = 18) => <Server size={size} />,
  },
  fuente_poe: {
    tipo: 'fuente_poe',
    categoria: 'redes',
    categoriaNombre: 'Redes',
    nombre: 'Inyector PoE',
    codigoPrefix: 'POE',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    badgeContent: '⚡',
    renderSidebarIcon: (size = 18) => <Server size={size} />,
  },

  // ── ALARMAS ─────────────────────────────────────────
  alarma_central: {
    tipo: 'alarma_central',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Central de Alarma',
    codigoPrefix: 'ALM-CEN',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    badgeContent: '🛡️',
    renderSidebarIcon: (size = 18) => <ShieldAlert size={size} />,
  },
  alarma_sirena_interior: {
    tipo: 'alarma_sirena_interior',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Sirena interior',
    codigoPrefix: 'ALM-SINT',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    badgeContent: '🔔',
    renderSidebarIcon: (size = 18) => <Bell size={size} />,
  },
  alarma_sirena_exterior: {
    tipo: 'alarma_sirena_exterior',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Sirena exterior',
    codigoPrefix: 'ALM-SEXT',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.15)',
    borderColor: 'rgba(234, 88, 12, 0.4)',
    badgeContent: '📢',
    renderSidebarIcon: (size = 18) => <Megaphone size={size} />,
  },
  alarma_magnetico: {
    tipo: 'alarma_magnetico',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Magnético',
    codigoPrefix: 'ALM-MAG',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    badgeContent: '🚪',
    renderSidebarIcon: (size = 18) => <DoorClosed size={size} />,
  },
  alarma_movimiento: {
    tipo: 'alarma_movimiento',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Sensor de movimiento',
    codigoPrefix: 'ALM-PIR',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    // Requerimiento: utilizar un punto azul
    badgeContent: (
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          boxShadow: '0 0 6px #60a5fa',
          display: 'inline-block',
        }}
      />
    ),
    renderSidebarIcon: () => (
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          boxShadow: '0 0 8px #60a5fa',
          display: 'inline-block',
        }}
      />
    ),
  },
  alarma_humo: {
    tipo: 'alarma_humo',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Sensor de humo',
    codigoPrefix: 'ALM-HUM',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    // Requerimiento: utilizar un punto rojo
    badgeContent: (
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          boxShadow: '0 0 6px #f87171',
          display: 'inline-block',
        }}
      />
    ),
    renderSidebarIcon: () => (
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          boxShadow: '0 0 8px #f87171',
          display: 'inline-block',
        }}
      />
    ),
  },
  alarma_teclado: {
    tipo: 'alarma_teclado',
    categoria: 'alarma',
    categoriaNombre: 'Alarma',
    nombre: 'Teclado',
    codigoPrefix: 'ALM-TEC',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    badgeContent: '🔢',
    renderSidebarIcon: (size = 18) => <Grid3x3 size={size} />,
  },

  // ── VIDEOVIGILANCIA ─────────────────────────────────
  dvr: {
    tipo: 'dvr',
    categoria: 'camaras',
    categoriaNombre: 'Videovigilancia',
    nombre: 'DVR / NVR',
    codigoPrefix: 'DVR',
    color: '#818cf8',
    bgColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.4)',
    badgeContent: '🖥️',
    renderSidebarIcon: (size = 18) => <Video size={size} />,
  },
  camara: {
    tipo: 'camara',
    categoria: 'camaras',
    categoriaNombre: 'Videovigilancia',
    nombre: 'Cámara CCTV',
    codigoPrefix: 'CAM',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    // Requerimiento: utilizar un punto verde
    badgeContent: (
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: '#22c55e',
          boxShadow: '0 0 6px #4ade80',
          display: 'inline-block',
        }}
      />
    ),
    renderSidebarIcon: () => (
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: '#22c55e',
          boxShadow: '0 0 8px #4ade80',
          display: 'inline-block',
        }}
      />
    ),
  },

  // ── OTROS ──────────────────────────────────────────
  otro: {
    tipo: 'otro',
    categoria: 'otros',
    categoriaNombre: 'Otros',
    nombre: 'Otro dispositivo',
    codigoPrefix: 'EQ',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    badgeContent: '📦',
    renderSidebarIcon: (size = 18) => <Server size={size} />,
  },
};

export const getDispositivoMeta = (tipo: ElementoTipo): DispositivoMeta => {
  return DISPOSITIVOS_CATALOGO[tipo] || DISPOSITIVOS_CATALOGO.otro;
};
