import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Film,
  Square,
  Sparkles,
  Eye,
  X,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './TemplatesPage.module.css';
import { CREATIVE_TEMPLATES } from '../../constants/templates';
import type { CreativeTemplate } from '../../constants/templates';

type PlatformFilter = 'all' | 'WhatsApp Status' | 'Instagram Reel' | 'Instagram Feed';

export function TemplatesPage() {
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CreativeTemplate | null>(null);

  const filtered = CREATIVE_TEMPLATES.filter((tpl) => {
    const matchesPlatform = platformFilter === 'all' || tpl.targetPlatform === platformFilter;
    const matchesService = serviceFilter === 'all' || tpl.serviceId === serviceFilter;
    return matchesPlatform && matchesService;
  });

  return (
    <div className={styles.page}>
      {/* ── Encabezado ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Plantillas Creativas SafeLink</h1>
          <p className={styles.subtitle}>
            Estructuras de contenido preconfiguradas para WhatsApp Status, Instagram Reels, Historias y Feed, con guiones y escenas optimizadas por servicio.
          </p>
        </div>
      </div>

      {/* ── Barra de filtros ── */}
      <div className={styles.toolbar}>
        <div className={styles.platformTabs}>
          <button
            type="button"
            className={clsx(styles.platformTab, platformFilter === 'all' && styles.platformTabActive)}
            onClick={() => setPlatformFilter('all')}
          >
            <Layers size={14} />
            <span>Todas las plantillas</span>
          </button>
          <button
            type="button"
            className={clsx(styles.platformTab, platformFilter === 'WhatsApp Status' && styles.platformTabActive)}
            onClick={() => setPlatformFilter('WhatsApp Status')}
          >
            <Smartphone size={14} />
            <span>WhatsApp Status</span>
          </button>
          <button
            type="button"
            className={clsx(styles.platformTab, platformFilter === 'Instagram Reel' && styles.platformTabActive)}
            onClick={() => setPlatformFilter('Instagram Reel')}
          >
            <Film size={14} />
            <span>Instagram Reels</span>
          </button>
          <button
            type="button"
            className={clsx(styles.platformTab, platformFilter === 'Instagram Feed' && styles.platformTabActive)}
            onClick={() => setPlatformFilter('Instagram Feed')}
          >
            <Square size={14} />
            <span>Instagram Feed</span>
          </button>
        </div>

        <div>
          <select
            className={styles.serviceSelect}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filtrar por servicio"
          >
            <option value="all">Todos los servicios</option>
            <option value="camaras">Cámaras de Seguridad</option>
            <option value="redes">Redes & WiFi 6</option>
            <option value="iluminacion">Iluminación Inteligente</option>
          </select>
        </div>
      </div>

      {/* ── Grilla de plantillas ── */}
      <div className={styles.templatesGrid}>
        {filtered.map((tpl) => (
          <div key={tpl.id} className={styles.templateCard}>
            <div className={styles.cardHeader}>
              <span className={styles.platformBadge}>
                <Smartphone size={12} />
                <span>{tpl.targetPlatform}</span>
              </span>
              <span className={styles.badgeHighlight}>{tpl.badge}</span>
            </div>

            <div>
              <h3 className={styles.templateTitle}>{tpl.name}</h3>
              <p className={styles.templateDesc}>{tpl.description}</p>
            </div>

            {/* Desglose de escenas */}
            {tpl.scenes.length > 0 && (
              <div className={styles.scenesPreview}>
                <span className={styles.scenesPreviewTitle}>
                  Estructura de Video ({tpl.suggestedDurationSec}s)
                </span>
                <div className={styles.scenesList}>
                  {tpl.scenes.map((s) => (
                    <div key={s.order} className={styles.sceneItem}>
                      <span className={styles.sceneDot} />
                      <span>{s.order}. {s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className={styles.cardActions}>
              <Link
                to={`/vibe/crear?templateId=${tpl.id}&format=${tpl.format}&service=${tpl.serviceId}`}
                className={styles.useTemplateBtn}
              >
                <Sparkles size={14} />
                <span>Usar Plantilla</span>
              </Link>

              <button
                type="button"
                className={styles.previewBtn}
                onClick={() => setSelectedTemplate(tpl)}
                title="Ver guion completo"
              >
                <Eye size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal de Vista Previa ── */}
      {selectedTemplate && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedTemplate.name}</h2>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setSelectedTemplate(null)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <strong>Titular de Gancho:</strong>
                <p style={{ marginTop: '0.25rem', color: 'var(--vibe-text-primary)' }}>
                  "{selectedTemplate.headline}"
                </p>
              </div>

              <div>
                <strong>Guion de Locución Sugerido:</strong>
                <div className={styles.scriptBox}>{selectedTemplate.script}</div>
              </div>

              <div>
                <strong>Llamado a la Acción (CTA):</strong>
                <p style={{ marginTop: '0.25rem', color: '#4ade80' }}>
                  {selectedTemplate.cta}
                </p>
              </div>

              {selectedTemplate.scenes.length > 0 && (
                <div>
                  <strong>Desglose de Escenas Audiovisuales:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {selectedTemplate.scenes.map((s) => (
                      <div
                        key={s.order}
                        style={{
                          background: 'var(--vibe-surface-2)',
                          padding: '0.625rem 0.875rem',
                          borderRadius: '8px',
                          border: '1px solid var(--vibe-border)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--vibe-blue)' }}>
                          Escena {s.order}: {s.title} ({s.durationSec}s)
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--vibe-text-muted)', marginTop: '0.25rem' }}>
                          Visual: {s.visualDescription}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--vibe-text-secondary)', marginTop: '0.25rem' }}>
                          Audio: "{s.audioLine}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.previewBtn}
                onClick={() => setSelectedTemplate(null)}
              >
                Cerrar
              </button>
              <Link
                to={`/vibe/crear?templateId=${selectedTemplate.id}&format=${selectedTemplate.format}&service=${selectedTemplate.serviceId}`}
                className={styles.useTemplateBtn}
              >
                <Sparkles size={14} />
                <span>Usar esta Plantilla</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
