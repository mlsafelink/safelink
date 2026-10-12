// =====================================================
// SafeLink Vibe — Plantillas Creativas Predefinidas (Fase 4B)
// Estructuras de contenido optimizadas para SafeLink
// =====================================================
import type { ContentFormat } from './formats';

export interface CreativeTemplate {
  id: string;
  name: string;
  badge: string;
  description: string;
  format: ContentFormat;
  serviceId: 'camaras' | 'redes' | 'iluminacion';
  targetPlatform: 'WhatsApp Status' | 'Instagram Reel' | 'Instagram Feed' | 'Instagram Story';
  headline: string;
  script: string;
  cta: string;
  suggestedDurationSec: number;
  tags: string[];
  scenes: {
    order: number;
    title: string;
    visualDescription: string;
    audioLine: string;
    durationSec: number;
  }[];
}

export const CREATIVE_TEMPLATES: CreativeTemplate[] = [
  {
    id: 'tpl-wa-camaras-hd',
    name: 'WhatsApp Status — Cámaras IP con Visión Nocturna Color',
    badge: 'Popular WhatsApp',
    description: 'Estado vertical de alto impacto que demuestra la nitidez de las cámaras de seguridad SafeLink tanto de día como de noche.',
    format: 'story_9_16',
    serviceId: 'camaras',
    targetPlatform: 'WhatsApp Status',
    headline: '¿Tu edificio o casa está realmente protegido?',
    script: 'Con SafeLink tenés cámaras de seguridad en ultra alta definición con visión nocturna a color y acceso en tiempo real desde tu celular. Protegé lo que más importa con instalación limpia y soporte técnico continuo.',
    cta: 'Escribinos ahora para pedir tu relevamiento sin cargo.',
    suggestedDurationSec: 15,
    tags: ['whatsapp', 'cctv', 'seguridad', 'consorcios'],
    scenes: [
      {
        order: 1,
        title: 'Gancho Visual: Alerta de Movimiento',
        visualDescription: 'Primer plano de cámara domo SafeLink de alta gama con anillo LED activo montada en fachada moderna.',
        audioLine: '¿Sabías que la mayoría de las intrusiones se evitan con disuasión activa?',
        durationSec: 5,
      },
      {
        order: 2,
        title: 'Demostración: Celular en Tiempo Real',
        visualDescription: 'Mano sosteniendo smartphone mostrando la app de monitoreo SafeLink con 4 canales nítidos en vivo.',
        audioLine: 'Con SafeLink mirás todo lo que pasa en vivo desde tu teléfono, con alertas inmediatas y grabación continua.',
        durationSec: 5,
      },
      {
        order: 3,
        title: 'Cierre y CTA de WhatsApp',
        visualDescription: 'Placa final con logo SafeLink, botón verde de WhatsApp y texto: Consultá presupuesto hoy.',
        audioLine: 'Mandanos un mensaje de WhatsApp y coordinamos una visita técnica para tu consorcio o comercio.',
        durationSec: 5,
      },
    ],
  },
  {
    id: 'tpl-wa-redes-wifi6',
    name: 'WhatsApp Status — Fin a los Cortes de Internet y WiFi',
    badge: 'Alta Conversión',
    description: 'Enfocado en empresas, comercios y consorcios que sufren cortes de red o saturación inalámbrica.',
    format: 'story_9_16',
    serviceId: 'redes',
    targetPlatform: 'WhatsApp Status',
    headline: 'WiFi 6 que nunca se cae en tu negocio',
    script: 'Optimizamos tu cableado estructurado, fibra óptica y cobertura inalámbrica para que disfrutes de velocidad máxima sin zonas ciegas ni microcortes.',
    cta: 'Escribinos por WhatsApp para un diagnóstico de tu red.',
    suggestedDurationSec: 15,
    tags: ['whatsapp', 'wifi6', 'redes', 'conectividad'],
    scenes: [
      {
        order: 1,
        title: 'El Dolor: Internet Lento y Desorden',
        visualDescription: 'Transición rápida mostrando interferencias de señal y luego la solución con Access Points WiFi 6.',
        audioLine: '¿Harto de que la señal se corte en las reuniones o en los puntos clave de tu oficina?',
        durationSec: 5,
      },
      {
        order: 2,
        title: 'La Solución: Rack y APs SafeLink',
        visualDescription: 'Rack de comunicaciones prolijo con patch panel etiquetado y luces de link gigabit activas.',
        audioLine: 'SafeLink diseña tu infraestructura de red con cableado certificado y cobertura WiFi 6 de nivel corporativo.',
        durationSec: 5,
      },
      {
        order: 3,
        title: 'Llamado a la Acción',
        visualDescription: 'Logo SafeLink sobre fondo tecnológico con enlace directo a WhatsApp.',
        audioLine: 'Escribinos al WhatsApp y te ayudamos a tener la red rápida y estable que tu equipo necesita.',
        durationSec: 5,
      },
    ],
  },
  {
    id: 'tpl-wa-domotica-iluminacion',
    name: 'WhatsApp Status — Iluminación Inteligente y Ahorro',
    badge: 'Eficiencia',
    description: 'Demuestra automatización de luces en espacios comunes y áreas residenciales para optimizar consumo y seguridad.',
    format: 'story_9_16',
    serviceId: 'iluminacion',
    targetPlatform: 'WhatsApp Status',
    headline: 'Iluminación inteligente que cuida tu consumo',
    script: 'Programá escenas lumínicas, encendido por presencia y control remoto desde tu app para bajar el costo energético de tu consorcio o casa.',
    cta: 'Consultanos por WhatsApp y modernizá tu espacio.',
    suggestedDurationSec: 15,
    tags: ['whatsapp', 'iluminacion', 'domotica', 'ahorro'],
    scenes: [
      {
        order: 1,
        title: 'Luces Inteligentes en Acción',
        visualDescription: 'Hall de entrada o pasillo común que se ilumina suavemente con sensores de presencia integrados.',
        audioLine: 'Automatizá la iluminación de tu edificio y reducí drásticamente el gasto en electricidad.',
        durationSec: 5,
      },
      {
        order: 2,
        title: 'Control Total',
        visualDescription: 'Interfaz móvil ajustando perfiles de luz y temporizadores automáticos.',
        audioLine: 'Sistemas inteligentes SafeLink: confort, seguridad y máxima durabilidad lumínica.',
        durationSec: 5,
      },
      {
        order: 3,
        title: 'Contacto WhatsApp',
        visualDescription: 'Placa de cierre con contacto de WhatsApp SafeLink.',
        audioLine: 'Pedí tu relevamiento lumínico hoy enviándonos un mensaje directo.',
        durationSec: 5,
      },
    ],
  },
  {
    id: 'tpl-reel-antes-despues-cables',
    name: 'Instagram Reel — Rack Desordenado vs Rack SafeLink',
    badge: 'Viral / Reels',
    description: 'Formato dinámico de antes y después que resalta el profesionalismo técnico y prolijidad de la instalación.',
    format: 'reel',
    serviceId: 'redes',
    targetPlatform: 'Instagram Reel',
    headline: 'La diferencia entre una red improvisada y una profesional',
    script: 'Un rack ordenado no es solo estética: es rendimiento, menos temperatura y diagnósticos inmediatos ante cualquier eventualidad.',
    cta: 'Guardá este Reel y consultanos para tu empresa.',
    suggestedDurationSec: 20,
    tags: ['reels', 'rack', 'redes', 'viral'],
    scenes: [
      {
        order: 1,
        title: 'El Antes: Maraña de Cables',
        visualDescription: 'Toma rápida de cables enredados colgando sin peinar.',
        audioLine: 'Así encontramos muchas salas de servidores y tableros...',
        durationSec: 5,
      },
      {
        order: 2,
        title: 'La Transformación SafeLink',
        visualDescription: 'Tomas de detalle de canalización, patch cords codificados por color y organización impecable.',
        audioLine: 'Y así queda cuando el equipo de ingeniería de SafeLink toma el control.',
        durationSec: 10,
      },
      {
        order: 3,
        title: 'Cierre con Autoridad',
        visualDescription: 'Vista general del rack terminado con logo SafeLink.',
        audioLine: 'Conectividad que funciona. Seguridad en la que podés confiar.',
        durationSec: 5,
      },
    ],
  },
  {
    id: 'tpl-feed-seguridad-consorcios',
    name: 'Instagram Feed 1:1 — 5 Razones para Instalar CCTV',
    badge: 'Educativo / Feed',
    description: 'Diseñado para generar confianza y educación en propietarios y comités de consorcios.',
    format: 'image_1_1',
    serviceId: 'camaras',
    targetPlatform: 'Instagram Feed',
    headline: 'Tranquilidad para cada propietario en tu consorcio',
    script: 'Sistemas de videovigilancia integrados con almacenamiento seguro y mantenimiento periódico programado.',
    cta: 'Pedí una cotización formal para la próxima asamblea.',
    suggestedDurationSec: 0,
    tags: ['feed', 'consorcios', 'seguridad'],
    scenes: [],
  },
];
