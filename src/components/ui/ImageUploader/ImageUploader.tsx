import { useState, useRef } from 'react';
import { Upload, Link, AlertCircle, X, CheckCircle } from 'lucide-react';
import { uploadImageToStorage, convertGoogleDriveLink } from '@/lib/imageHelper';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const [tab, setTab] = useState<'file' | 'drive'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setIsUploading(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo seleccionado debe ser una imagen.');
      }
      const url = await uploadImageToStorage(file);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleLinkDrive = () => {
    setError(null);
    if (!driveUrl.trim()) {
      setError('Por favor, ingrese un enlace de Google Drive.');
      return;
    }
    const converted = convertGoogleDriveLink(driveUrl);
    if (converted === driveUrl) {
      setError('El enlace no parece un enlace de compartir de Google Drive válido. Verifique el formato.');
      return;
    }
    onChange(converted);
    setDriveUrl('');
  };

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      {value ? (
        // Preview State
        <div className={styles.previewContainer}>
          <img src={value} alt="Preview" className={styles.previewImage} />
          <button type="button" onClick={handleClear} className={styles.clearBtn} title="Quitar imagen">
            <X size={16} />
          </button>
          <div className={styles.successBadge}>
            <CheckCircle size={12} />
            <span>Imagen Vinculada</span>
          </div>
        </div>
      ) : (
        // Uploader States
        <div className={styles.uploaderBox}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'file' ? styles.activeTab : ''}`}
              onClick={() => { setTab('file'); setError(null); }}
            >
              <Upload size={14} />
              Subir Archivo (PC)
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === 'drive' ? styles.activeTab : ''}`}
              onClick={() => { setTab('drive'); setError(null); }}
            >
              <Link size={14} />
              Enlace Google Drive
            </button>
          </div>

          <div className={styles.content}>
            {tab === 'file' ? (
              <div
                className={`${styles.dropzone} ${isUploading ? styles.disabled : ''}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                {isUploading ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Subiendo imagen...</p>
                  </div>
                ) : (
                  <div className={styles.promptState}>
                    <Upload size={28} className={styles.uploadIcon} />
                    <p><strong>Arrastra tu imagen aquí</strong> o haz clic para buscar</p>
                    <span>Formatos aceptados: PNG, JPG, WEBP (Máx. 5MB)</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.driveForm}>
                <p className={styles.driveInstructions}>
                  Copia el enlace de compartir de tu imagen en Google Drive (asegúrate de que el acceso esté configurado como <strong>"Cualquier persona con el enlace puede ver"</strong>).
                </p>
                <div className={styles.driveInputGroup}>
                  <Input
                    placeholder="https://drive.google.com/file/d/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                  />
                  <Button type="button" variant="primary" onClick={handleLinkDrive}>
                    Vincular
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
