import { useState, useEffect } from 'react';
import { Save, Plus, X, RefreshCw } from 'lucide-react';
import styles from './BrandConfigPage.module.css';
import { getBrandConfig, saveBrandConfig } from '../../services/brandService';
import type { VibeBrandConfigInput } from '../../types';
import { SAFELINK_SERVICES } from '../../constants/services';
import { useToast } from '@/components/ui/Toast/ToastContext';

export function BrandConfigPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<VibeBrandConfigInput>({
    business_name: 'SafeLink',
    description: 'Seguridad electrónica, control de accesos y conectividad profesional para consorcios y empresas.',
    services: SAFELINK_SERVICES.map((s: { name: string }) => s.name),
    phone: '',
    whatsapp: '',
    email: '',
    instagram_handle: '',
    website_url: '',
    logo_url: null,
    brand_color: '#4f6ef7',
    accent_color: '#8b5cf6',
    communication_style: 'profesional',
    cta_options: [
      'Solicitá tu presupuesto sin cargo',
      'Consultanos por WhatsApp',
      'Protegé tu consorcio con SafeLink',
    ],
  });

  const [newService, setNewService] = useState('');
  const [newCta, setNewCta] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getBrandConfig();
      if (res.ok && res.data) {
        setFormData({
          business_name: res.data.business_name || 'SafeLink',
          description: res.data.description || '',
          services: res.data.services?.length ? res.data.services : SAFELINK_SERVICES.map((s: { name: string }) => s.name),
          phone: res.data.phone || '',
          whatsapp: res.data.whatsapp || '',
          email: res.data.email || '',
          instagram_handle: res.data.instagram_handle || '',
          website_url: res.data.website_url || '',
          logo_url: res.data.logo_url || null,
          brand_color: res.data.brand_color || '#4f6ef7',
          accent_color: res.data.accent_color || '#8b5cf6',
          communication_style: res.data.communication_style || 'profesional',
          cta_options: res.data.cta_options?.length ? res.data.cta_options : [
            'Solicitá tu presupuesto sin cargo',
            'Consultanos por WhatsApp',
          ],
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveBrandConfig(formData);
    if (res.ok) {
      showToast('Configuración de marca guardada.', 'success');
    } else {
      showToast('Error al guardar configuración.', 'error');
    }
    setSaving(false);
  };

  const handleAddService = () => {
    if (!newService.trim()) return;
    if (formData.services.includes(newService.trim())) return;
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService.trim()],
    }));
    setNewService('');
  };

  const handleRemoveService = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(s => s !== serviceName),
    }));
  };

  const handleAddCta = () => {
    if (!newCta.trim()) return;
    if (formData.cta_options.includes(newCta.trim())) return;
    setFormData(prev => ({
      ...prev,
      cta_options: [...prev.cta_options, newCta.trim()],
    }));
    setNewCta('');
  };

  const handleRemoveCta = (ctaText: string) => {
    setFormData(prev => ({
      ...prev,
      cta_options: prev.cta_options.filter(c => c !== ctaText),
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--vibe-text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
        <div>Cargando datos de marca...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>ADN Comercial de SafeLink</h1>
          <p className={styles.subtitle}>
            Configuración central de marca, servicios autorizados y canales oficiales de contacto.
          </p>
        </div>

        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* 1. Datos Generales */}
      <div className={styles.card}>
        <div>
          <h2 className={styles.cardTitle}>Identidad Comercial</h2>
          <p className={styles.cardSubtitle}>Información visible en todas las piezas publicitarias</p>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre comercial</label>
            <input
              type="text"
              className={styles.input}
              value={formData.business_name}
              onChange={e => setFormData({ ...formData, business_name: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tono de comunicación</label>
            <select
              className={styles.select}
              value={formData.communication_style}
              onChange={e => setFormData({ ...formData, communication_style: e.target.value as any })}
            >
              <option value="profesional">Profesional y Técnico</option>
              <option value="cercano">Cercano y Confiable</option>
              <option value="informativo">Informativo</option>
              <option value="urgente">Urgente / Prevención</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción comercial de la empresa</label>
          <textarea
            className={styles.textarea}
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción factual del negocio..."
          />
        </div>
      </div>

      {/* 2. Servicios Autorizados */}
      <div className={styles.card}>
        <div>
          <h2 className={styles.cardTitle}>Servicios Autorizados para Publicidad</h2>
          <p className={styles.cardSubtitle}>
            Solo los servicios configurados aquí estarán disponibles al redactar anuncios.
          </p>
        </div>

        <div className={styles.chipsContainer}>
          {formData.services.map(srv => (
            <div key={srv} className={styles.chipItem}>
              <span>{srv}</span>
              <button
                type="button"
                className={styles.chipRemoveBtn}
                onClick={() => handleRemoveService(srv)}
                title="Eliminar servicio"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className={styles.addChipRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="Agregar nuevo servicio autorizado..."
            value={newService}
            onChange={e => setNewService(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
          />
          <button type="button" className={styles.addChipBtn} onClick={handleAddService}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* 3. Canales Oficiales y CTAs */}
      <div className={styles.card}>
        <div>
          <h2 className={styles.cardTitle}>Canales de Contacto Oficiales</h2>
          <p className={styles.cardSubtitle}>Enlaces y teléfonos para las llamadas a la acción</p>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.label}>WhatsApp de contacto</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: +54 9 11 ..."
              value={formData.whatsapp || ''}
              onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Usuario de Instagram (@)</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Ej: safelink.seguridad"
              value={formData.instagram_handle || ''}
              onChange={e => setFormData({ ...formData, instagram_handle: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Teléfono comercial</label>
            <input
              type="text"
              className={styles.input}
              value={formData.phone || ''}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email comercial</label>
            <input
              type="email"
              className={styles.input}
              value={formData.email || ''}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Llamadas a la acción (CTAs) predeterminadas</label>
          <div className={styles.chipsContainer} style={{ marginBottom: '0.75rem' }}>
            {formData.cta_options.map(cta => (
              <div key={cta} className={styles.chipItem}>
                <span>{cta}</span>
                <button
                  type="button"
                  className={styles.chipRemoveBtn}
                  onClick={() => handleRemoveCta(cta)}
                  title="Eliminar CTA"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.addChipRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Agregar nueva llamada a la acción..."
              value={newCta}
              onChange={e => setNewCta(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCta())}
            />
            <button type="button" className={styles.addChipBtn} onClick={handleAddCta}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
