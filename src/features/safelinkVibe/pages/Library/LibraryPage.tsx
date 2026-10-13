import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Library,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Trash2,
  FileText,
  Search,
  Play,
  Download,
  HardDrive,
  Edit,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  UserPlus,
  LogOut,
  CloudUpload,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './LibraryPage.module.css';
import { supabase } from '@/lib/supabase';
import { listProjects } from '../../services/projectService';
import type { VibeProject } from '../../types';
import { googleDriveService, PRIMARY_DRIVE_EMAIL } from '@/services/googleDriveService';
import type { DriveAccount } from '@/services/googleDriveService';
import { useToast } from '@/components/ui/Toast/ToastContext';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string };
  publicUrl?: string;
}

export function LibraryPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image' | 'projects'>('all');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [savingToDriveId, setSavingToDriveId] = useState<string | null>(null);

  // Drive accounts
  const [accounts, setAccounts] = useState<DriveAccount[]>([]);
  const [showDrivePanel, setShowDrivePanel] = useState(false);
  const [connectingSlot, setConnectingSlot] = useState<'primary' | 'secondary' | null>(null);
  const drivePanelRef = useRef<HTMLDivElement>(null);

  // Export biblioteca
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSlot, setExportSlot] = useState<'primary' | 'secondary'>('primary');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);

  // Modal preview
  const [previewMedia, setPreviewMedia] = useState<{
    title: string; url?: string; type: 'video' | 'audio' | 'image';
  } | null>(null);

  const refreshAccounts = () => setAccounts(googleDriveService.getConnectedAccounts());

  const loadData = async () => {
    setLoading(true);
    refreshAccounts();
    try {
      const { data: storageData } = await supabase.storage
        .from('safelink-vibe')
        .list('', { sortBy: { column: 'created_at', order: 'desc' } });

      if (storageData) {
        const enriched = storageData
          .filter(item => item.name !== '.emptyFolderPlaceholder')
          .map(item => {
            const { data: pubData } = supabase.storage.from('safelink-vibe').getPublicUrl(item.name);
            return { ...item, publicUrl: pubData.publicUrl } as StorageFile;
          });
        setFiles(enriched);
      }

      const projRes = await listProjects({ limit: 50 });
      if (projRes.ok) setProjects(projRes.data);
    } catch { /* ignorar */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadData(); }, []);

  // Cerrar panel Drive al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drivePanelRef.current && !drivePanelRef.current.contains(e.target as Node)) {
        setShowDrivePanel(false);
      }
    };
    if (showDrivePanel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDrivePanel]);

  // ── Handlers Drive ──────────────────────────────────────────────────────────

  const handleConnectDrive = async (slot: 'primary' | 'secondary') => {
    setConnectingSlot(slot);
    try {
      await googleDriveService.signIn(slot);
      refreshAccounts();
      const email = googleDriveService.getEmail(slot) ?? '';
      showToast(`Google Drive conectado: ${email}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al conectar Drive', 'error');
    } finally {
      setConnectingSlot(null);
    }
  };

  const handleDisconnectDrive = (slot: 'primary' | 'secondary') => {
    googleDriveService.signOut(slot);
    refreshAccounts();
    showToast(`Cuenta de Drive desconectada.`, 'info');
  };

  const handleSaveToDrive = async (name: string, url?: string, slot: 'primary' | 'secondary' = 'primary') => {
    if (!url) { showToast('Este recurso no tiene un archivo disponible.', 'error'); return; }

    // Conectar si no está conectado
    if (!googleDriveService.isConnected(slot)) {
      await handleConnectDrive(slot);
      if (!googleDriveService.isConnected(slot)) return;
    }

    setSavingToDriveId(name);
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      await googleDriveService.uploadMedia(blob, name, blob.type || 'video/mp4', slot);
      showToast(`"${name}" guardado en Drive (${googleDriveService.getEmail(slot)})`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al subir a Drive', 'error');
    } finally {
      setSavingToDriveId(null);
    }
  };

  // ── Export biblioteca completa ──────────────────────────────────────────────

  const handleExportLibrary = async () => {
    if (!googleDriveService.isConnected(exportSlot)) {
      await handleConnectDrive(exportSlot);
      if (!googleDriveService.isConnected(exportSlot)) return;
    }

    const exportList = files
      .filter(f => f.publicUrl)
      .map(f => ({ name: f.name, url: f.publicUrl!, mimeType: f.metadata?.mimetype || 'application/octet-stream' }));

    if (exportList.length === 0) {
      showToast('No hay archivos multimedia para exportar.', 'error');
      return;
    }

    setExporting(true);
    setExportProgress({ done: 0, total: exportList.length });

    try {
      const result = await googleDriveService.exportLibrary(
        exportList,
        exportSlot,
        (done, total) => setExportProgress({ done, total }),
      );

      if (result.errors.length === 0) {
        showToast(`✓ ${result.uploaded} archivos exportados a Google Drive.`, 'success');
      } else {
        showToast(`${result.uploaded} exportados, ${result.errors.length} con error.`, 'info');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error en exportación', 'error');
    } finally {
      setExporting(false);
      setExportProgress(null);
      setShowExportModal(false);
    }
  };

  // ── Upload local ────────────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (file.size > 50 * 1024 * 1024) { showToast('Máximo 50 MB.', 'error'); return; }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('safelink-vibe').upload(fileName, file, { upsert: false });
      if (error) { showToast(`Error: ${error.message}`, 'error'); }
      else { showToast('Archivo subido a la biblioteca.', 'success'); await loadData(); }
    } catch (err) { showToast(err instanceof Error ? err.message : 'Error al subir', 'error'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`¿Eliminar ${fileName}?`)) return;
    const { error } = await supabase.storage.from('safelink-vibe').remove([fileName]);
    if (error) { showToast('Error al eliminar.', 'error'); }
    else { showToast('Eliminado.', 'info'); setFiles(p => p.filter(f => f.name !== fileName)); }
  };

  // ── Filtrado ────────────────────────────────────────────────────────────────

  const filteredFiles = files.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'image') return f.metadata?.mimetype?.startsWith('image/');
    if (activeTab === 'video') return f.metadata?.mimetype?.startsWith('video/');
    if (activeTab === 'audio') return f.metadata?.mimetype?.startsWith('audio/');
    if (activeTab === 'projects') return false;
    return true;
  });

  const filteredProjects = projects.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'image') return p.format.startsWith('image');
    if (activeTab === 'video') return p.format.startsWith('video') || p.format === 'reel' || p.format === 'story_9_16';
    if (activeTab === 'audio') return !!p.project_data?.voiceoverScript;
    return true;
  });

  const primaryAccount  = accounts.find(a => a.slot === 'primary');
  const secondaryAccount = accounts.find(a => a.slot === 'secondary');

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>

      {/* ── Encabezado ────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Biblioteca Multimedia SafeLink</h1>
          <p className={styles.subtitle}>
            Almacenamiento permanente en Supabase Storage · Sincronización con Google Drive · Exportar a otras cuentas
          </p>
        </div>

        <div className={styles.headerActions}>

          {/* ── Panel Google Drive ──────────────────────────────────────── */}
          <div className={styles.driveMenuWrapper} ref={drivePanelRef}>
            <button
              type="button"
              className={clsx(
                styles.gdriveBtn,
                (primaryAccount?.isValid || secondaryAccount?.isValid) && styles.gdriveConnected,
              )}
              onClick={() => setShowDrivePanel(v => !v)}
              id="library-drive-btn"
            >
              <HardDrive size={15} />
              <span>
                {primaryAccount?.isValid
                  ? `Drive: ${primaryAccount.email.split('@')[0]}`
                  : 'Google Drive'}
              </span>
              <ChevronDown size={13} className={clsx(styles.chevron, showDrivePanel && styles.chevronOpen)} />
            </button>

            {showDrivePanel && (
              <div className={styles.drivePanel}>
                <div className={styles.drivePanelTitle}>Cuentas de Google Drive</div>

                {/* Cuenta primaria */}
                <div className={styles.driveAccountRow}>
                  <div className={styles.driveAccountInfo}>
                    <div className={styles.driveAccountLabel}>Cuenta principal</div>
                    {primaryAccount?.isValid ? (
                      <div className={styles.driveAccountEmail}>
                        <CheckCircle2 size={11} className={styles.iconGreen} />
                        {primaryAccount.email}
                      </div>
                    ) : (
                      <div className={styles.driveAccountEmailHint}>{PRIMARY_DRIVE_EMAIL}</div>
                    )}
                  </div>
                  {primaryAccount?.isValid ? (
                    <button
                      type="button"
                      className={styles.driveActionBtn}
                      onClick={() => handleDisconnectDrive('primary')}
                      title="Desconectar"
                    >
                      <LogOut size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={clsx(styles.driveActionBtn, styles.driveActionBtnConnect)}
                      onClick={() => handleConnectDrive('primary')}
                      disabled={connectingSlot === 'primary'}
                    >
                      {connectingSlot === 'primary'
                        ? <RefreshCw size={12} className={styles.spin} />
                        : 'Conectar'}
                    </button>
                  )}
                </div>

                {/* Cuenta secundaria */}
                <div className={styles.driveAccountRow}>
                  <div className={styles.driveAccountInfo}>
                    <div className={styles.driveAccountLabel}>Cuenta secundaria</div>
                    {secondaryAccount?.isValid ? (
                      <div className={styles.driveAccountEmail}>
                        <CheckCircle2 size={11} className={styles.iconGreen} />
                        {secondaryAccount.email}
                      </div>
                    ) : (
                      <div className={styles.driveAccountEmailHint}>Cualquier cuenta Gmail</div>
                    )}
                  </div>
                  {secondaryAccount?.isValid ? (
                    <button
                      type="button"
                      className={styles.driveActionBtn}
                      onClick={() => handleDisconnectDrive('secondary')}
                      title="Desconectar"
                    >
                      <LogOut size={12} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={clsx(styles.driveActionBtn, styles.driveActionBtnConnect)}
                      onClick={() => handleConnectDrive('secondary')}
                      disabled={connectingSlot === 'secondary'}
                    >
                      {connectingSlot === 'secondary'
                        ? <RefreshCw size={12} className={styles.spin} />
                        : <><UserPlus size={11} /> Agregar</>}
                    </button>
                  )}
                </div>

                <div className={styles.drivePanelDivider} />

                {/* Exportar biblioteca */}
                <button
                  type="button"
                  className={styles.exportLibraryBtn}
                  onClick={() => { setShowDrivePanel(false); setShowExportModal(true); }}
                  id="library-export-btn"
                >
                  <CloudUpload size={13} />
                  Exportar biblioteca completa a Drive
                </button>

                {/* Link a Drive */}
                {googleDriveService.getFolderUrl('primary') && (
                  <a
                    href={googleDriveService.getFolderUrl('primary')!}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.driveFolderLink}
                  >
                    <ExternalLink size={11} />
                    Abrir carpeta en Drive
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Subir archivo */}
          <label className={styles.uploadBtn}>
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            <Upload size={15} />
            <span>{uploading ? 'Subiendo...' : 'Subir Archivo'}</span>
          </label>
        </div>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.navTabs}>
          {[
            { id: 'all',      label: `Todos (${files.length + projects.length})`, icon: <Library size={14} /> },
            { id: 'video',    label: 'Videos / Status',                           icon: <Video   size={14} /> },
            { id: 'audio',    label: 'Locuciones TTS',                             icon: <Music   size={14} /> },
            { id: 'image',    label: 'Imágenes',                                   icon: <ImageIcon size={14} /> },
            { id: 'projects', label: `Proyectos (${projects.length})`,             icon: <FileText  size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={clsx(styles.tabBtn, activeTab === tab.id && styles.tabBtnActive)}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <Search size={16} color="var(--vibe-text-muted)" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre o formato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className={styles.emptyState}><p>Cargando recursos multimedia...</p></div>
      ) : filteredFiles.length === 0 && filteredProjects.length === 0 ? (
        <div className={styles.emptyState}>
          <Library size={48} color="var(--vibe-text-muted)" style={{ opacity: 0.3 }} />
          <h3>No se encontraron archivos en la biblioteca</h3>
          <p style={{ color: 'var(--vibe-text-muted)', fontSize: '0.875rem' }}>
            Los videos generados, audios de voz y piezas de WhatsApp Status se guardarán automáticamente aquí.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>

          {/* Proyectos */}
          {(activeTab === 'all' || activeTab === 'projects' || activeTab === 'video') &&
            filteredProjects.map(p => (
              <div key={p.id} className={styles.itemCard}>
                <div
                  className={styles.itemThumb}
                  onClick={() => setPreviewMedia({ title: p.title, url: p.thumbnail_url || undefined, type: 'video' })}
                >
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt={p.title} />
                    : <Video size={36} color="var(--vibe-blue)" />}
                  <div className={styles.playOverlay}><div className={styles.playCircle}><Play size={18} /></div></div>
                </div>
                <div className={styles.itemMeta}>
                  <div className={styles.itemName} title={p.title}>{p.title}</div>
                  <div className={styles.itemDetails}>
                    Formato: {p.format.replace('_', ' ')} · {new Date(p.created_at).toLocaleDateString('es-AR')}
                  </div>
                  <div className={styles.cardActions}>
                    <Link to={`/vibe/crear?projectId=${p.id}&format=${p.format}`} className={styles.actionBtn} title="Editar">
                      <Edit size={12} /><span>Editar</span>
                    </Link>
                    {p.thumbnail_url && (
                      <div className={styles.driveDropWrapper}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => handleSaveToDrive(p.title, p.thumbnail_url!, 'primary')}
                          disabled={savingToDriveId === p.title}
                          title="Guardar en Drive principal"
                        >
                          <HardDrive size={12} />
                          <span>{savingToDriveId === p.title ? '...' : 'Drive'}</span>
                        </button>
                        {secondaryAccount?.isValid && (
                          <button
                            type="button"
                            className={clsx(styles.actionBtn, styles.actionBtnSecondary)}
                            onClick={() => handleSaveToDrive(p.title, p.thumbnail_url!, 'secondary')}
                            disabled={savingToDriveId === p.title}
                            title={`Guardar en ${secondaryAccount.email}`}
                          >
                            <HardDrive size={12} />
                            <span>Drive 2</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* Archivos Storage */}
          {activeTab !== 'projects' &&
            filteredFiles.map(file => {
              const isVid = file.metadata?.mimetype?.startsWith('video/');
              const isAud = file.metadata?.mimetype?.startsWith('audio/');
              const isImg = file.metadata?.mimetype?.startsWith('image/');

              return (
                <div key={file.name} className={styles.itemCard}>
                  <div
                    className={styles.itemThumb}
                    onClick={() => setPreviewMedia({
                      title: file.name,
                      url: file.publicUrl,
                      type: isVid ? 'video' : isAud ? 'audio' : 'image',
                    })}
                  >
                    {isImg && file.publicUrl
                      ? <img src={file.publicUrl} alt={file.name} />
                      : isVid ? <Video size={36} color="#60a5fa" />
                      : isAud ? <Music size={36} color="#a78bfa" />
                      : <FileText size={36} color="var(--vibe-text-muted)" />}
                    <div className={styles.playOverlay}><div className={styles.playCircle}><Play size={18} /></div></div>
                  </div>

                  <div className={styles.itemMeta}>
                    <div className={styles.itemName} title={file.name}>{file.name}</div>
                    <div className={styles.itemDetails}>
                      {file.metadata?.size ? `${(file.metadata.size / 1024 / 1024).toFixed(1)} MB` : 'Online'}
                    </div>

                    <div className={styles.cardActions}>
                      {file.publicUrl && (
                        <a href={file.publicUrl} download={file.name} target="_blank" rel="noreferrer"
                          className={styles.actionBtn} title="Descargar">
                          <Download size={12} /><span>Bajar</span>
                        </a>
                      )}

                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleSaveToDrive(file.name, file.publicUrl, 'primary')}
                        disabled={savingToDriveId === file.name}
                        title={`Drive: ${primaryAccount?.email ?? PRIMARY_DRIVE_EMAIL}`}
                      >
                        <HardDrive size={12} />
                        <span>{savingToDriveId === file.name ? '...' : 'Drive'}</span>
                      </button>

                      {secondaryAccount?.isValid && (
                        <button
                          type="button"
                          className={clsx(styles.actionBtn, styles.actionBtnSecondary)}
                          onClick={() => handleSaveToDrive(file.name, file.publicUrl, 'secondary')}
                          disabled={savingToDriveId === file.name}
                          title={`Drive 2: ${secondaryAccount.email}`}
                        >
                          <HardDrive size={12} /><span>Drive 2</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className={clsx(styles.actionBtn, styles.actionBtnDanger)}
                        onClick={() => handleDelete(file.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── Modal Preview ──────────────────────────────────────────────────── */}
      {previewMedia && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{previewMedia.title}</h3>
              <button type="button" className={styles.closeModalBtn} onClick={() => setPreviewMedia(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {previewMedia.url
                ? previewMedia.type === 'video'
                  ? <video src={previewMedia.url} controls autoPlay style={{ width: '100%', maxHeight: '65vh', borderRadius: '8px' }} />
                  : previewMedia.type === 'audio'
                  ? <audio src={previewMedia.url} controls autoPlay style={{ width: '100%' }} />
                  : <img src={previewMedia.url} alt={previewMedia.title} style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain' }} />
                : <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--vibe-text-muted)' }}>
                    <p>Proyecto guardado en SafeLink Vibe. Hacé clic en "Editar" para continuar.</p>
                  </div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Export Biblioteca ────────────────────────────────────────── */}
      {showExportModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={clsx(styles.modal, styles.exportModal)}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <CloudUpload size={18} /> Exportar Biblioteca a Google Drive
              </h3>
              {!exporting && (
                <button type="button" className={styles.closeModalBtn} onClick={() => setShowExportModal(false)}>
                  <X size={20} />
                </button>
              )}
            </div>
            <div className={styles.modalBody}>
              <p className={styles.exportDesc}>
                Subí todos los archivos multimedia de la biblioteca ({files.filter(f => f.publicUrl).length} archivos)
                a la carpeta <strong>SafeLink Cloud / Publicidad Vibe</strong> en Google Drive.
              </p>

              {/* Selector de cuenta */}
              <div className={styles.exportAccountSelector}>
                <div className={styles.exportAccountOption}>
                  <label className={clsx(styles.exportRadio, exportSlot === 'primary' && styles.exportRadioActive)}>
                    <input type="radio" name="exportSlot" value="primary"
                      checked={exportSlot === 'primary'} onChange={() => setExportSlot('primary')} />
                    <div>
                      <div className={styles.exportRadioLabel}>Cuenta principal</div>
                      <div className={styles.exportRadioEmail}>
                        {primaryAccount?.isValid
                          ? <><CheckCircle2 size={11} className={styles.iconGreen} /> {primaryAccount.email}</>
                          : <><AlertCircle size={11} className={styles.iconOrange} /> {PRIMARY_DRIVE_EMAIL} (no conectada)</>}
                      </div>
                    </div>
                  </label>
                </div>

                <div className={styles.exportAccountOption}>
                  <label className={clsx(styles.exportRadio, exportSlot === 'secondary' && styles.exportRadioActive)}>
                    <input type="radio" name="exportSlot" value="secondary"
                      checked={exportSlot === 'secondary'} onChange={() => setExportSlot('secondary')} />
                    <div>
                      <div className={styles.exportRadioLabel}>Cuenta secundaria</div>
                      <div className={styles.exportRadioEmail}>
                        {secondaryAccount?.isValid
                          ? <><CheckCircle2 size={11} className={styles.iconGreen} /> {secondaryAccount.email}</>
                          : <><AlertCircle size={11} className={styles.iconOrange} /> No conectada — se pedirá autenticación</>}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Barra de progreso */}
              {exporting && exportProgress && (
                <div className={styles.exportProgressWrapper}>
                  <div className={styles.exportProgressBar}>
                    <div
                      className={styles.exportProgressFill}
                      style={{ width: `${Math.round((exportProgress.done / exportProgress.total) * 100)}%` }}
                    />
                  </div>
                  <div className={styles.exportProgressText}>
                    <RefreshCw size={12} className={styles.spin} />
                    Subiendo {exportProgress.done} / {exportProgress.total} archivos...
                  </div>
                </div>
              )}

              <div className={styles.exportActions}>
                {!exporting && (
                  <button type="button" className={styles.btnSecondary} onClick={() => setShowExportModal(false)}>
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  className={styles.exportStartBtn}
                  onClick={handleExportLibrary}
                  disabled={exporting}
                  id="library-export-start"
                >
                  {exporting
                    ? <><RefreshCw size={14} className={styles.spin} /> Exportando...</>
                    : <><CloudUpload size={14} /> Exportar {files.filter(f => f.publicUrl).length} archivos</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
