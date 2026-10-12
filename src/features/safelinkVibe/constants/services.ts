// =====================================================
// SafeLink Vibe — Servicios autorizados para comunicación pública
// Editables desde la configuración de marca (vibe_brand_config)
// NO contiene precios, garantías ni datos inventados
// =====================================================

export interface ServiceDefinition {
  id: string;
  label: string;
  description: string;
  /** Icono de lucide-react */
  icon: string;
  /** Keywords para generación de prompts */
  keywords: string[];
}

export const SAFELINK_AUTHORIZED_SERVICES: ServiceDefinition[] = [
  {
    id: 'camaras',
    label: 'Cámaras de Seguridad',
    description:
      'Instalación y configuración de sistemas de videovigilancia para hogares y empresas.',
    icon: 'Camera',
    keywords: ['cámaras de seguridad', 'videovigilancia', 'CCTV', 'monitoreo'],
  },
  {
    id: 'redes',
    label: 'Redes y Conectividad',
    description:
      'Diseño e instalación de redes LAN, Wi-Fi y conectividad empresarial.',
    icon: 'Wifi',
    keywords: ['redes', 'conectividad', 'Wi-Fi', 'LAN', 'infraestructura de red'],
  },
  {
    id: 'iluminacion',
    label: 'Iluminación',
    description:
      'Sistemas de iluminación inteligente y eficiente para espacios residenciales y comerciales.',
    icon: 'Lightbulb',
    keywords: ['iluminación', 'LED', 'iluminación inteligente', 'domótica'],
  },
];

export const SAFELINK_SERVICES = SAFELINK_AUTHORIZED_SERVICES.map(s => ({
  ...s,
  name: s.label,
}));

export const COMMUNICATION_STYLES = [
  { value: 'profesional', label: 'Profesional', description: 'Tono formal y confiable' },
  { value: 'cercano', label: 'Cercano', description: 'Tono amigable y accesible' },
  { value: 'urgente', label: 'Urgente', description: 'Tono de acción inmediata' },
  { value: 'informativo', label: 'Informativo', description: 'Tono educativo y claro' },
] as const;

export type CommunicationStyle = typeof COMMUNICATION_STYLES[number]['value'];
