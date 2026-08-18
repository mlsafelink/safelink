import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { SwitchPortGrid } from './SwitchPortGrid';
import { DVRChannelGrid } from './DVRChannelGrid';
import {
  X, Trash2, Save,
  ArrowRight, ShieldCheck,
} from 'lucide-react';
import type {
  ElementoPlano,
  ElementoTipo,
  ElementoEstado,
  SwitchProperties,
  BocaProperties,
  APProperties,
  DVRProperties,
  CamaraProperties,
} from '@/types/infraestructura';
import styles from './ElementoDetalleModal.module.css';

interface ElementoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  elemento: ElementoPlano | null;
  todosElementos?: ElementoPlano[];
  onSave: (updated: ElementoPlano) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ElementoDetalleModal({
  isOpen,
  onClose,
  elemento,
  todosElementos = [],
  onSave,
  onDelete,
  readOnly = false,
}: ElementoDetalleModalProps) {
  const [formData, setFormData] = useState<ElementoPlano | null>(null);

  useEffect(() => {
    if (elemento) {
      setFormData(JSON.parse(JSON.stringify(elemento)));
    }
  }, [elemento]);

  if (!isOpen || !formData) return null;

  // Filtrar switches y DVRs disponibles en este plano para asociar
  const availableSwitches = todosElementos.filter(e => e.tipo === 'switch' && e.id !== formData.id);
  const availableDVRs = todosElementos.filter(e => e.tipo === 'dvr' && e.id !== formData.id);

  // Elementos hijos conectados a este switch o DVR
  const connectedEndpoints = todosElementos.filter(e => e.parent_element_id === formData.id);

  const handlePropertyChange = (key: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        propiedades: {
          ...prev.propiedades,
          [key]: value,
        },
      };
    });
  };

  const handleParentSwitchChange = (switchId: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        parent_element_id: switchId || null,
        propiedades: {
          ...prev.propiedades,
          switchId: switchId || undefined,
        },
      };
    });
  };

  const handleParentDVRChange = (dvrId: string) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        parent_element_id: dvrId || null,
        propiedades: {
          ...prev.propiedades,
          dvrId: dvrId || undefined,
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  // Switch Properties Casting
  const switchProps = (formData.propiedades as SwitchProperties) || { cantidadPuertos: 24 };
  const bocaProps = (formData.propiedades as BocaProperties) || {};
  const apProps = (formData.propiedades as APProperties) || {};
  const dvrProps = (formData.propiedades as DVRProperties) || { cantidadCanales: 16 };
  const camProps = (formData.propiedades as CamaraProperties) || {};

  // Encontrar equipo padre si existe
  const parentEquipo = todosElementos.find(e => e.id === formData.parent_element_id);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <Card variant="glass" className={styles.modalCard}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerInfo}>
              <span className={`${styles.typeBadge} ${styles[`typeBadge_${formData.tipo}`]}`}>
                {formData.tipo.toUpperCase()}
              </span>
              <div>
                <h2>{formData.codigo || 'Nuevo Elemento'}</h2>
                <p>{formData.nombre || 'Configuración técnica interactiva'}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {/* Trazado Visual de Conexión si está enlazado */}
            {parentEquipo && (
              <div className={styles.connectionTraceBox}>
                <span className={styles.traceTag}>Trazado de Conexión:</span>
                <div className={styles.traceFlow}>
                  <div className={styles.traceNode}>
                    <strong>{formData.codigo}</strong>
                    <span>{formData.nombre}</span>
                  </div>
                  <ArrowRight size={16} className={styles.traceArrow} />
                  <div className={styles.traceNode}>
                    <strong>{parentEquipo.codigo}</strong>
                    <span>{parentEquipo.nombre}</span>
                  </div>
                  <ArrowRight size={16} className={styles.traceArrow} />
                  <div className={styles.traceNode}>
                    <strong style={{ color: '#38bdf8' }}>
                      {formData.tipo === 'camara' ? `Canal ${formData.puerto_canal || 'CH01'}` : `Puerto ${formData.puerto_canal || '01'}`}
                    </strong>
                    <span>Conexión Física</span>
                  </div>
                </div>
              </div>
            )}

            {/* Datos Generales */}
            <div className={styles.formRow}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Identificador / Código"
                  id="elem-code"
                  placeholder="Ej: SW-01, P2-09, CAM-01"
                  value={formData.codigo}
                  onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                  disabled={readOnly}
                  required
                />
              </div>
              <div style={{ flex: 2 }}>
                <Input
                  label="Nombre Descriptivo"
                  id="elem-name"
                  placeholder="Ej: Switch Principal Rack PB"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={readOnly}
                  required
                />
              </div>
            </div>

            {/* Estado del Equipo */}
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Estado Operativo</label>
                <select
                  className={styles.selectInput}
                  value={formData.estado}
                  onChange={e => setFormData({ ...formData, estado: e.target.value as ElementoEstado })}
                  disabled={readOnly}
                >
                  <option value="activo">🟢 Activo / En Servicio</option>
                  <option value="inactivo">⚪ Inactivo</option>
                  <option value="mantenimiento">🟡 Mantenimiento</option>
                  <option value="planificado">🔵 Planificado / Futuro</option>
                </select>
              </div>

              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Ubicación Física</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Ej: Rack PB, Hall, Cocheras"
                  value={
                    (formData.propiedades as any)?.ubicacion || ''
                  }
                  onChange={e => handlePropertyChange('ubicacion', e.target.value)}
                  disabled={readOnly}
                />
              </div>
            </div>

            {/* ── 1. CAMPOS ESPECÍFICOS: SWITCH ── */}
            {formData.tipo === 'switch' && (
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionHeading}>Configuración del Switch</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Marca y Modelo</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: Ubiquiti UniFi USW-24-POE"
                      value={switchProps.modelo || ''}
                      onChange={e => handlePropertyChange('modelo', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Dirección IP de Gestión</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 192.168.1.2"
                      value={switchProps.ip || ''}
                      onChange={e => handlePropertyChange('ip', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ width: '130px' }}>
                    <label className={styles.label}>Cantidad Puertos</label>
                    <select
                      className={styles.selectInput}
                      value={switchProps.cantidadPuertos || 24}
                      onChange={e => handlePropertyChange('cantidadPuertos', parseInt(e.target.value, 10))}
                      disabled={readOnly}
                    >
                      <option value="8">8 Puertos</option>
                      <option value="16">16 Puertos</option>
                      <option value="24">24 Puertos</option>
                      <option value="48">48 Puertos</option>
                    </select>
                  </div>
                </div>

                {/* Panel Gráfico Frontal del Switch */}
                <div className={styles.gridPreviewWrap}>
                  <span className={styles.gridPreviewTitle}>Panel Frontal de Puertos RJ45:</span>
                  <SwitchPortGrid
                    cantidadPuertos={switchProps.cantidadPuertos || 24}
                    switchNombre={formData.codigo}
                    elementosConectados={connectedEndpoints}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}

            {/* ── 2. CAMPOS ESPECÍFICOS: BOCA / PUESTO DE RED ── */}
            {formData.tipo === 'boca' && (
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionHeading}>Conexión al Switch</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Switch Asociado</label>
                    <select
                      className={styles.selectInput}
                      value={formData.parent_element_id || ''}
                      onChange={e => handleParentSwitchChange(e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="">-- Seleccionar Switch --</option>
                      {availableSwitches.map(sw => (
                        <option key={sw.id} value={sw.id}>
                          {sw.codigo} — {sw.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ width: '140px' }}>
                    <label className={styles.label}>Puerto en Switch</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 09"
                      value={formData.puerto_canal || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, puerto_canal: val });
                        handlePropertyChange('puertoNumero', val);
                      }}
                      disabled={readOnly}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ width: '120px' }}>
                    <label className={styles.label}>Piso</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 2°"
                      value={bocaProps.piso || ''}
                      onChange={e => handlePropertyChange('piso', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo de Cable / Norma</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Ej: Cat 6 UTP Furukawa / Patchcord Azul"
                    value={bocaProps.tipoCable || ''}
                    onChange={e => handlePropertyChange('tipoCable', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                {/* Si tiene un switch padre seleccionado, mostrar la matriz para elegir puerto interactivamente */}
                {parentEquipo && parentEquipo.tipo === 'switch' && (
                  <div className={styles.gridPreviewWrap}>
                    <span className={styles.gridPreviewTitle}>
                      Hacé clic en un puerto del switch {parentEquipo.codigo} para asignarlo:
                    </span>
                    <SwitchPortGrid
                      cantidadPuertos={(parentEquipo.propiedades as SwitchProperties)?.cantidadPuertos || 24}
                      switchNombre={parentEquipo.codigo}
                      puertoSeleccionado={formData.puerto_canal}
                      onSelectPuerto={p => {
                        setFormData({ ...formData, puerto_canal: p });
                        handlePropertyChange('puertoNumero', p);
                      }}
                      elementosConectados={todosElementos.filter(e => e.parent_element_id === parentEquipo.id)}
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ── 3. CAMPOS ESPECÍFICOS: ACCESS POINT ── */}
            {formData.tipo === 'ap' && (
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionHeading}>Configuración de Access Point</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>SSID de Red WiFi</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: SafeLink_Consorcio_5G"
                      value={apProps.ssid || ''}
                      onChange={e => handlePropertyChange('ssid', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Dirección IP</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 192.168.1.30"
                      value={apProps.ip || ''}
                      onChange={e => handlePropertyChange('ip', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Switch Asociado</label>
                    <select
                      className={styles.selectInput}
                      value={formData.parent_element_id || ''}
                      onChange={e => handleParentSwitchChange(e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="">-- Seleccionar Switch --</option>
                      {availableSwitches.map(sw => (
                        <option key={sw.id} value={sw.id}>
                          {sw.codigo} — {sw.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup} style={{ width: '130px' }}>
                    <label className={styles.label}>Puerto</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 12"
                      value={formData.puerto_canal || ''}
                      onChange={e => {
                        setFormData({ ...formData, puerto_canal: e.target.value });
                        handlePropertyChange('puertoNumero', e.target.value);
                      }}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── 4. CAMPOS ESPECÍFICOS: DVR / NVR ── */}
            {formData.tipo === 'dvr' && (
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionHeading}>Configuración de Grabador DVR / NVR</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Marca y Modelo</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: Hikvision DS-7616NI-Q2"
                      value={dvrProps.modelo || ''}
                      onChange={e => handlePropertyChange('modelo', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Dirección IP</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 192.168.1.100"
                      value={dvrProps.ip || ''}
                      onChange={e => handlePropertyChange('ip', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ width: '130px' }}>
                    <label className={styles.label}>Canales</label>
                    <select
                      className={styles.selectInput}
                      value={dvrProps.cantidadCanales || 16}
                      onChange={e => handlePropertyChange('cantidadCanales', parseInt(e.target.value, 10))}
                      disabled={readOnly}
                    >
                      <option value="4">4 Canales</option>
                      <option value="8">8 Canales</option>
                      <option value="16">16 Canales</option>
                      <option value="32">32 Canales</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Almacenamiento / Discos HDD</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    placeholder="Ej: 2x WD Purple 4TB (8TB Total)"
                    value={dvrProps.almacenamiento || ''}
                    onChange={e => handlePropertyChange('almacenamiento', e.target.value)}
                    disabled={readOnly}
                  />
                </div>

                {/* Panel Gráfico Frontal del DVR/NVR */}
                <div className={styles.gridPreviewWrap}>
                  <span className={styles.gridPreviewTitle}>Panel Frontal de Canales de Video:</span>
                  <DVRChannelGrid
                    cantidadCanales={dvrProps.cantidadCanales || 16}
                    dvrNombre={formData.codigo}
                    camarasConectadas={connectedEndpoints}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}

            {/* ── 5. CAMPOS ESPECÍFICOS: CÁMARA ── */}
            {formData.tipo === 'camara' && (
              <div className={styles.equipmentSection}>
                <h3 className={styles.sectionHeading}>Conexión a Grabador DVR/NVR</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>DVR / NVR Asociado</label>
                    <select
                      className={styles.selectInput}
                      value={formData.parent_element_id || ''}
                      onChange={e => handleParentDVRChange(e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="">-- Seleccionar DVR / NVR --</option>
                      {availableDVRs.map(dvr => (
                        <option key={dvr.id} value={dvr.id}>
                          {dvr.codigo} — {dvr.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup} style={{ width: '130px' }}>
                    <label className={styles.label}>Canal de Video</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: CH01"
                      value={formData.puerto_canal || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, puerto_canal: val });
                        handlePropertyChange('canalNumero', val);
                      }}
                      disabled={readOnly}
                    />
                  </div>

                  <div className={styles.formGroup} style={{ width: '130px' }}>
                    <label className={styles.label}>Tipo Cámara</label>
                    <select
                      className={styles.selectInput}
                      value={camProps.tipo || 'Domo'}
                      onChange={e => handlePropertyChange('tipo', e.target.value)}
                      disabled={readOnly}
                    >
                      <option value="Domo">Domo</option>
                      <option value="Bullet">Bullet</option>
                      <option value="PTZ">PTZ</option>
                      <option value="Ojo de pez">Ojo de pez</option>
                      <option value="IP">IP</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Resolución de Video</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 4MP (2560x1440) / 1080p"
                      value={camProps.resolucion || ''}
                      onChange={e => handlePropertyChange('resolucion', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label className={styles.label}>Dirección IP (si es cámara IP)</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Ej: 192.168.1.101"
                      value={camProps.ip || ''}
                      onChange={e => handlePropertyChange('ip', e.target.value)}
                      disabled={readOnly}
                    />
                  </div>
                </div>

                {/* Si tiene un DVR padre seleccionado, mostrar la matriz para elegir canal interactivamente */}
                {parentEquipo && parentEquipo.tipo === 'dvr' && (
                  <div className={styles.gridPreviewWrap}>
                    <span className={styles.gridPreviewTitle}>
                      Hacé clic en un canal del grabador {parentEquipo.codigo} para asignarlo:
                    </span>
                    <DVRChannelGrid
                      cantidadCanales={(parentEquipo.propiedades as DVRProperties)?.cantidadCanales || 16}
                      dvrNombre={parentEquipo.codigo}
                      canalSeleccionado={formData.puerto_canal}
                      onSelectCanal={ch => {
                        setFormData({ ...formData, puerto_canal: ch });
                        handlePropertyChange('canalNumero', ch);
                      }}
                      camarasConectadas={todosElementos.filter(e => e.parent_element_id === parentEquipo.id)}
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Observaciones */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Observaciones Técnicas</label>
              <textarea
                className={styles.textarea}
                placeholder="Notas de instalación, contraseñas de servicio, detalles de conexionado..."
                value={(formData.propiedades as any)?.observaciones || ''}
                onChange={e => handlePropertyChange('observaciones', e.target.value)}
                rows={2}
                disabled={readOnly}
              />
            </div>

            {/* Footer de Acciones */}
            <div className={styles.modalFooter}>
              {!readOnly && (
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar elemento ${formData.codigo}?`)) {
                      onDelete(formData.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 size={16} />
                  <span>Eliminar Elemento</span>
                </button>
              )}

              <div className={styles.footerRight}>
                <Button variant="secondary" type="button" onClick={onClose}>
                  {readOnly ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!readOnly && (
                  <Button variant="primary" type="submit" leftIcon={<Save size={16} />}>
                    Guardar Cambios
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
