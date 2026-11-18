import { useState, useRef } from 'react';
import {
  X, UploadCloud, FileSpreadsheet, Check,
  ArrowRight, ArrowLeft, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import {
  type CommercialCompany,
  type CommercialCompanyInsert,
  commercialService
} from '@/services/commercialService';
import { parseXlsxFile, type ParsedSheetData } from '../utils/excelParser';
import styles from '../ComercialPage.module.css';

interface ImportarExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCompanies: CommercialCompany[];
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface ColumnMapping {
  nombre_comercial: string;
  razon_social: string;
  cuit: string;
  rubro: string;
  tipo_establecimiento: string;
  direccion: string;
  localidad: string;
  telefono: string;
  email: string;
  prioridad: string;
  contacto_nombre: string;
  contacto_telefono: string;
  contacto_email: string;
}

export function ImportarExcelModal({
  isOpen,
  onClose,
  onSuccess,
  existingCompanies
}: ImportarExcelModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>('upload');
  const [parsedSheets, setParsedSheets] = useState<ParsedSheetData[]>([]);
  const [selectedSheetIdx, setSelectedSheetIdx] = useState(0);
  const [fileName, setFileName] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  // Mapeo de columnas
  const [mapping, setMapping] = useState<ColumnMapping>({
    nombre_comercial: '',
    razon_social: '',
    cuit: '',
    rubro: '',
    tipo_establecimiento: '',
    direccion: '',
    localidad: '',
    telefono: '',
    email: '',
    prioridad: '',
    contacto_nombre: '',
    contacto_telefono: '',
    contacto_email: ''
  });

  // Opciones de duplicados
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  // Progreso e informe de importación
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState({ total: 0, imported: 0, duplicates: 0, errors: 0 });

  if (!isOpen) return null;

  const currentSheet = parsedSheets[selectedSheetIdx] || { headers: [], rows: [] };

  // Manejo de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingFile(true);
    setFileName(file.name);
    try {
      const sheets = await parseXlsxFile(file);
      setParsedSheets(sheets);
      setSelectedSheetIdx(0);

      // Auto-detección inteligente de cabeceras
      const headers = sheets[0]?.headers || [];
      const autoMap: ColumnMapping = {
        nombre_comercial: findHeaderMatch(headers, ['nombre', 'empresa', 'cliente', 'razon comercial', 'cuenta']) || headers[0] || '',
        razon_social: findHeaderMatch(headers, ['razon social', 'razón social', 'sociedad']) || '',
        cuit: findHeaderMatch(headers, ['cuit', 'cuil', 'identificacion', 'tax id', 'rfc']) || '',
        rubro: findHeaderMatch(headers, ['rubro', 'actividad', 'sector', 'industria', 'categoria']) || '',
        tipo_establecimiento: findHeaderMatch(headers, ['tipo', 'establecimiento', 'inmueble', 'sucursal']) || '',
        direccion: findHeaderMatch(headers, ['direccion', 'dirección', 'domicilio', 'calle', 'ubicacion']) || '',
        localidad: findHeaderMatch(headers, ['localidad', 'ciudad', 'zona', 'partido', 'municipio']) || '',
        telefono: findHeaderMatch(headers, ['telefono', 'teléfono', 'celular', 'movil', 'whatsapp', 'tel']) || '',
        email: findHeaderMatch(headers, ['email', 'correo', 'mail', 'e-mail']) || '',
        prioridad: findHeaderMatch(headers, ['prioridad', 'importancia', 'calificacion']) || '',
        contacto_nombre: findHeaderMatch(headers, ['contacto', 'persona de contacto', 'responsable', 'atencion']) || '',
        contacto_telefono: findHeaderMatch(headers, ['tel contacto', 'telefono contacto', 'cel contacto']) || '',
        contacto_email: findHeaderMatch(headers, ['email contacto', 'correo contacto', 'mail contacto']) || ''
      };

      setMapping(autoMap);
      setStep('mapping');
    } catch (err: any) {
      console.error('Error parseando archivo:', err);
      alert('Error leyendo archivo: ' + (err.message || 'Formato no soportado'));
    } finally {
      setLoadingFile(false);
    }
  };

  function findHeaderMatch(headers: string[], keywords: string[]): string {
    for (const h of headers) {
      const lower = h.toLowerCase().trim();
      for (const kw of keywords) {
        if (lower.includes(kw)) return h;
      }
    }
    return '';
  }

  // Comprobar filas preparadas para importar
  const preparedRows = currentSheet.rows.map((row, idx) => {
    const nombre = mapping.nombre_comercial ? (row[mapping.nombre_comercial] || '').trim() : '';
    const cuit = mapping.cuit ? (row[mapping.cuit] || '').trim() : '';
    const direccion = mapping.direccion ? (row[mapping.direccion] || '').trim() : '';

    // Detección de duplicado contra existentes
    const isDuplicate = existingCompanies.some(existing => {
      if (nombre && existing.nombre_comercial.toLowerCase().trim() === nombre.toLowerCase()) return true;
      if (cuit && existing.cuit && existing.cuit.replace(/[^0-9]/g, '') === cuit.replace(/[^0-9]/g, '')) return true;
      return false;
    });

    const hasError = !nombre;

    return {
      index: idx,
      nombre,
      razon_social: mapping.razon_social ? (row[mapping.razon_social] || '').trim() : '',
      cuit,
      rubro: mapping.rubro ? (row[mapping.rubro] || '').trim() : 'Logística y Depósitos',
      tipo_establecimiento: mapping.tipo_establecimiento ? (row[mapping.tipo_establecimiento] || '').trim() : 'Depósito logístico',
      direccion,
      localidad: mapping.localidad ? (row[mapping.localidad] || '').trim() : '',
      telefono: mapping.telefono ? (row[mapping.telefono] || '').trim() : '',
      email: mapping.email ? (row[mapping.email] || '').trim() : '',
      prioridad: mapping.prioridad ? (row[mapping.prioridad] || '').trim() : 'Media',
      contacto_nombre: mapping.contacto_nombre ? (row[mapping.contacto_nombre] || '').trim() : '',
      contacto_telefono: mapping.contacto_telefono ? (row[mapping.contacto_telefono] || '').trim() : '',
      contacto_email: mapping.contacto_email ? (row[mapping.contacto_email] || '').trim() : '',
      isDuplicate,
      hasError
    };
  });

  const duplicateCount = preparedRows.filter(r => r.isDuplicate).length;
  const validRowsToImport = preparedRows.filter(r => !r.hasError && (!skipDuplicates || !r.isDuplicate));

  // Ejecutar Importación
  const handleExecuteImport = async () => {
    setStep('importing');
    setImportProgress(10);

    const companiesToInsert: CommercialCompanyInsert[] = validRowsToImport.map(r => ({
      nombre_comercial: r.nombre,
      razon_social: r.razon_social || null,
      cuit: r.cuit || null,
      rubro: r.rubro || 'Logística y Depósitos',
      tipo_establecimiento: r.tipo_establecimiento || 'Depósito logístico',
      descripcion: 'Importado masivamente desde archivo Excel/CSV',
      direccion: r.direccion || null,
      localidad: r.localidad || null,
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      coordenadas: null,
      sitio_web: null,
      telefono: r.telefono || null,
      email: r.email || null,
      fuente: 'Base de datos',
      prioridad: (r.prioridad === 'Alta' || r.prioridad === 'Baja') ? r.prioridad : 'Media',
      estado_investigacion: 'Identificada',
      servicios_potenciales: ['Sistema de CCTV', 'Control de acceso'],
      observaciones: 'Registro importado el ' + new Date().toLocaleDateString(),
      consorcio_id: null,
      activo: true
    }));

    try {
      setImportProgress(40);
      // Insertar por lotes de 50
      const batchSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < companiesToInsert.length; i += batchSize) {
        const slice = companiesToInsert.slice(i, i + batchSize);
        const insertedCompanies = await commercialService.importCompaniesBatch(slice);

        // Si venían contactos mapeados, crearlos vinculados a cada empresa insertada
        for (let j = 0; j < insertedCompanies.length; j++) {
          const comp = insertedCompanies[j];
          const origRow = validRowsToImport[i + j];
          if (origRow?.contacto_nombre) {
            try {
              await commercialService.createContact({
                company_id: comp.id,
                nombre: origRow.contacto_nombre,
                telefono: origRow.contacto_telefono || null,
                email: origRow.contacto_email || null,
                estado_verificacion: 'A confirmar',
                fuente: 'Importación Excel'
              });
            } catch {}
          }
        }

        insertedCount += slice.length;
        setImportProgress(Math.min(95, Math.round((insertedCount / companiesToInsert.length) * 100)));
      }

      setImportProgress(100);
      setImportSummary({
        total: preparedRows.length,
        imported: insertedCount,
        duplicates: duplicateCount,
        errors: preparedRows.filter(r => r.hasError).length
      });
      setStep('complete');
      onSuccess();
    } catch (err: any) {
      console.error('Error durante la importación masiva:', err);
      alert('Ocurrió un error al importar: ' + (err.message || 'Error desconocido'));
      setStep('preview');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={20} color="var(--primary-color)" />
            <h2>Importar Empresas desde Excel o CSV</h2>
          </div>
          <button className={styles.closeIconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody} style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {/* PASO 1: SUBIR ARCHIVO */}
          {step === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', padding: '2rem 1rem' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--glass-border)',
                  borderRadius: '16px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'var(--glass-bg)',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <UploadCloud size={48} color="var(--primary-color)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem' }}>
                  {loadingFile ? 'Leyendo archivo...' : 'Haz clic o arrastra tu archivo aquí'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Formatos compatibles: .xlsx, .xls o .csv (planillas de prospección comercial)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .tsv"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              <div style={{ width: '100%', fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                💡 <strong>Consejo:</strong> En el siguiente paso podrás elegir qué columna de tu Excel corresponde al Nombre de la Empresa, Dirección, Teléfono, etc., detectando automáticamente duplicados existentes.
              </div>
            </div>
          )}

          {/* PASO 2: MAPEO DE COLUMNAS */}
          {step === 'mapping' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Archivo: {fileName}</span>
                  <h4 style={{ margin: '0.1rem 0 0 0' }}>Mapeo interactivo de columnas</h4>
                </div>
                {parsedSheets.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>Hoja:</span>
                    <select
                      value={selectedSheetIdx}
                      onChange={e => setSelectedSheetIdx(parseInt(e.target.value, 10))}
                      style={smallSelectStyle}
                    >
                      {parsedSheets.map((s, idx) => (
                        <option key={idx} value={idx}>{s.sheetName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Asigna las columnas de tu archivo Excel a los campos comerciales de SafeLink. El campo <strong>Nombre Comercial</strong> es obligatorio.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={fieldLabelStyle}>Nombre Comercial (Obligatorio) *</label>
                  <select
                    value={mapping.nombre_comercial}
                    onChange={e => setMapping({ ...mapping, nombre_comercial: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Seleccionar Columna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Razón Social</label>
                  <select
                    value={mapping.razon_social}
                    onChange={e => setMapping({ ...mapping, razon_social: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>CUIT</label>
                  <select
                    value={mapping.cuit}
                    onChange={e => setMapping({ ...mapping, cuit: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Actividad o Rubro</label>
                  <select
                    value={mapping.rubro}
                    onChange={e => setMapping({ ...mapping, rubro: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Dirección</label>
                  <select
                    value={mapping.direccion}
                    onChange={e => setMapping({ ...mapping, direccion: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Localidad / Zona</label>
                  <select
                    value={mapping.localidad}
                    onChange={e => setMapping({ ...mapping, localidad: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Teléfono de Contacto</label>
                  <select
                    value={mapping.telefono}
                    onChange={e => setMapping({ ...mapping, telefono: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Correo Electrónico</label>
                  <select
                    value={mapping.email}
                    onChange={e => setMapping({ ...mapping, email: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label style={fieldLabelStyle}>Nombre del Contacto / Responsable</label>
                  <select
                    value={mapping.contacto_nombre}
                    onChange={e => setMapping({ ...mapping, contacto_nombre: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">-- Opcional / Ninguna --</option>
                    {currentSheet.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: VALIDACIÓN Y VISTA PREVIA */}
          {step === 'preview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Vista Previa de la Importación</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total filas en archivo: {preparedRows.length} | A importar: <strong>{validRowsToImport.length}</strong>
                  </p>
                </div>

                {duplicateCount > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={e => setSkipDuplicates(e.target.checked)}
                    />
                    <span>Omitir duplicados ({duplicateCount})</span>
                  </label>
                )}
              </div>

              {/* Badges de resumen */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                  ✓ {validRowsToImport.length} Válidas para importar
                </span>
                {duplicateCount > 0 && (
                  <span style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 }}>
                    ⚠ {duplicateCount} Ya existentes en base de datos
                  </span>
                )}
              </div>

              {/* Tabla de previsualización */}
              <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', maxHeight: '350px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead style={{ background: 'rgba(0,0,0,0.04)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={thStyle}>Estado</th>
                      <th style={thStyle}>Empresa</th>
                      <th style={thStyle}>Dirección</th>
                      <th style={thStyle}>Teléfono</th>
                      <th style={thStyle}>Contacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparedRows.slice(0, 50).map(r => (
                      <tr key={r.index} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={tdStyle}>
                          {r.hasError ? (
                            <span style={{ color: '#ef4444', fontWeight: 600 }}>Sin nombre</span>
                          ) : r.isDuplicate ? (
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Duplicada</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>Lista</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{r.nombre || '(Vacío)'}</td>
                        <td style={tdStyle}>{r.direccion || '-'}</td>
                        <td style={tdStyle}>{r.telefono || '-'}</td>
                        <td style={tdStyle}>{r.contacto_nombre || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preparedRows.length > 50 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Mostrando las primeras 50 de {preparedRows.length} filas...
                </span>
              )}
            </div>
          )}

          {/* PASO 4: IMPORTANDO */}
          {step === 'importing' && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <RefreshCw size={36} color="var(--primary-color)" className="spin" />
              <h3>Guardando empresas en la base de datos...</h3>
              <div style={{ width: '80%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${importProgress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.3s ease' }} />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{importProgress}% completado</span>
            </div>
          )}

          {/* PASO 5: COMPLETADO */}
          {step === 'complete' && (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={32} color="#10b981" />
              </div>
              <h3>¡Importación completada con éxito!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Se han incorporado <strong>{importSummary.imported}</strong> empresas a tu directorio comercial de SafeLink.
              </p>
              {importSummary.duplicates > 0 && (
                <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>
                  ({importSummary.duplicates} empresas fueron omitidas por estar duplicadas)
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {step === 'upload' && (
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          )}

          {step === 'mapping' && (
            <>
              <Button variant="secondary" onClick={() => setStep('upload')} leftIcon={<ArrowLeft size={16} />}>
                Volver
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!mapping.nombre_comercial) {
                    alert('Debes mapear al menos la columna del Nombre Comercial');
                    return;
                  }
                  setStep('preview');
                }}
                rightIcon={<ArrowRight size={16} />}
              >
                Continuar a Vista Previa
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="secondary" onClick={() => setStep('mapping')} leftIcon={<ArrowLeft size={16} />}>
                Volver a Mapeo
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteImport}
                disabled={validRowsToImport.length === 0}
                leftIcon={<Layers size={16} />}
              >
                Confirmar e Importar ({validRowsToImport.length} empresas)
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button variant="primary" onClick={onClose}>
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  display: 'block',
  marginBottom: '0.3rem',
  color: 'var(--text-primary)'
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.7rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box'
};

const smallSelectStyle: React.CSSProperties = {
  padding: '0.35rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  fontSize: '0.8rem'
};

const thStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  borderBottom: '1px solid var(--glass-border)',
  fontWeight: 600
};

const tdStyle: React.CSSProperties = {
  padding: '0.6rem 0.75rem',
  borderBottom: '1px solid var(--glass-border)'
};
