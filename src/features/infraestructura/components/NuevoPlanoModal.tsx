import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { consorcioService } from '@/services/consorcioService';
import { particularService } from '@/services/particularService';
import { infraestructuraService } from '@/services/infraestructuraService';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import {
  X, UploadCloud, FileText, CheckCircle2,
  Layers, ShieldAlert,
} from 'lucide-react';
import type { PlanoTipo, PlanoInfraestructura } from '@/types/infraestructura';
import styles from './NuevoPlanoModal.module.css';

interface NuevoPlanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: PlanoInfraestructura) => void;
  initialTipo?: PlanoTipo;
}

export function NuevoPlanoModal({
  isOpen,
  onClose,
  onPlanCreated,
  initialTipo = 'redes',
}: NuevoPlanoModalProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<PlanoTipo>(initialTipo);
  const [clientType, setClientType] = useState<'consorcio' | 'particular'>('consorcio');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar lista de consorcios y particulares
  const { data: consorcios = [] } = useQuery({
    queryKey: ['consorcios'],
    queryFn: consorcioService.getAll,
    enabled: isOpen,
  });

  const { data: particulares = [] } = useQuery({
    queryKey: ['particulares'],
    queryFn: particularService.getAll,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setErrorMsg(null);

      // Si es imagen, crear preview URL
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selectedFile));
      } else {
        setPreviewUrl(null);
      }

      // Si el nombre está vacío, prellenar con el nombre del archivo
      if (!nombre) {
        const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNombre(cleanName);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresá un nombre para el plano.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let uploadedFileUrl = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
      let uploadedFileType: 'pdf' | 'imagen' = 'imagen';
      let uploadedFileName = 'plano_base.png';

      if (file) {
        const uploadRes = await infraestructuraService.uploadFile(file);
        uploadedFileUrl = uploadRes.url;
        uploadedFileType = uploadRes.tipo;
        uploadedFileName = uploadRes.nombre;
      }

      const createdPlan = await infraestructuraService.create({
        nombre,
        tipo,
        archivo_url: uploadedFileUrl,
        archivo_tipo: uploadedFileType,
        archivo_nombre: uploadedFileName,
        descripcion,
        consorcio_id: clientType === 'consorcio' ? selectedClientId || null : null,
        particular_id: clientType === 'particular' ? selectedClientId || null : null,
      });

      onPlanCreated(createdPlan);
      onClose();
    } catch (err: any) {
      console.error('Error creando plano:', err);
      setErrorMsg(err?.message || 'Ocurrió un error al guardar el plano.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
        <Card variant="glass" className={styles.modalCard}>
          <div className={styles.modalHeader}>
            <div className={styles.headerTitle}>
              <div className={styles.headerIconWrap}>
                <Layers size={22} className={styles.iconAccent} />
              </div>
              <div>
                <h2>Nuevo Plano de Infraestructura</h2>
                <p>Cargá un plano en PDF o imagen para colocar elementos técnicos interactivos</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {errorMsg && (
              <div className={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Tipo de Plano */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Tipo de Infraestructura</label>
              <div className={styles.typeSelector}>
                <button
                  type="button"
                  className={`${styles.typeOption} ${tipo === 'redes' ? styles.typeActiveRedes : ''}`}
                  onClick={() => setTipo('redes')}
                >
                  <div className={styles.typeEmoji}>🌐</div>
                  <div className={styles.typeText}>
                    <strong>Redes</strong>
                    <span>Switches, bocas y APs</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.typeOption} ${tipo === 'camaras' ? styles.typeActiveCamaras : ''}`}
                  onClick={() => setTipo('camaras')}
                >
                  <div className={styles.typeEmoji}>📹</div>
                  <div className={styles.typeText}>
                    <strong>Cámaras</strong>
                    <span>DVR/NVR y CCTV</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.typeOption} ${tipo === 'mixto' ? styles.typeActiveMixto : ''}`}
                  onClick={() => setTipo('mixto')}
                >
                  <div className={styles.typeEmoji}>🗺️</div>
                  <div className={styles.typeText}>
                    <strong>Completo</strong>
                    <span>Redes + CCTV</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Nombre del plano */}
            <Input
              label="Nombre del Plano"
              id="plan-name"
              placeholder="Ej: Avellaneda 229 — Planta Baja Redes"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />

            {/* Asignación de Cliente / Consorcio */}
            <div className={styles.formRow}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Tipo de Cliente</label>
                <div className={styles.clientTypeTabs}>
                  <button
                    type="button"
                    className={`${styles.clientTab} ${clientType === 'consorcio' ? styles.clientTabActive : ''}`}
                    onClick={() => { setClientType('consorcio'); setSelectedClientId(''); }}
                  >
                    Consorcio
                  </button>
                  <button
                    type="button"
                    className={`${styles.clientTab} ${clientType === 'particular' ? styles.clientTabActive : ''}`}
                    onClick={() => { setClientType('particular'); setSelectedClientId(''); }}
                  >
                    Cliente Privado
                  </button>
                </div>
              </div>

              <div className={styles.formGroup} style={{ flex: 2 }}>
                <label className={styles.label}>
                  {clientType === 'consorcio' ? 'Seleccionar Consorcio' : 'Seleccionar Cliente Privado'}
                </label>
                <select
                  className={styles.selectInput}
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                >
                  <option value="">-- Sin asignar (Plano general) --</option>
                  {clientType === 'consorcio'
                    ? consorcios.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.direccion ? `(${c.direccion})` : ''}
                        </option>
                      ))
                    : particulares.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.direccion ? `(${p.direccion})` : ''}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            {/* Subida del Plano PDF o Imagen */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Plano de Fondo (PDF o Imagen de Alta Resolución)</label>
              <div className={styles.dropZone}>
                <input
                  type="file"
                  id="plan-file-upload"
                  accept="application/pdf,image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className={styles.fileInputHidden}
                />
                <label htmlFor="plan-file-upload" className={styles.dropZoneLabel}>
                  {file ? (
                    <div className={styles.fileUploadedInfo}>
                      <CheckCircle2 size={32} className={styles.iconUploaded} />
                      <div className={styles.uploadedText}>
                        <strong>{file.name}</strong>
                        <span>{(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Archivo de plano'}</span>
                      </div>
                      <span className={styles.changeFileBtn}>Cambiar archivo</span>
                    </div>
                  ) : (
                    <div className={styles.dropZoneEmpty}>
                      <UploadCloud size={36} className={styles.iconCloud} />
                      <p className={styles.dropTitle}>Arrastrá tu archivo o hacé clic para explorar</p>
                      <span className={styles.dropSub}>Admite planos en PDF, PNG, JPG de hasta 30 MB</span>
                    </div>
                  )}
                </label>
              </div>

              {previewUrl && (
                <div className={styles.previewContainer}>
                  <span className={styles.previewTag}>Vista previa del plano:</span>
                  <img src={previewUrl} alt="Vista previa del plano" className={styles.previewImage} />
                </div>
              )}
            </div>

            {/* Descripción */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Descripción / Observaciones Técnicas (Opcional)</label>
              <textarea
                className={styles.textarea}
                placeholder="Detalles sobre el tablero, sector, tipo de cableado, etc."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={2}
              />
            </div>

            {/* Botones de acción */}
            <div className={styles.modalFooter}>
              <Button variant="secondary" type="button" onClick={onClose} disabled={isUploading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isUploading}
                leftIcon={<FileText size={16} />}
              >
                Crear y Abrir Editor
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
