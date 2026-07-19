import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { instructivoService } from '@/services/documentService';
import {
  Clock, BarChart2, Smartphone, HelpCircle, Shield,
  Download, Plus, List, UserCheck, CheckCircle,
  Phone, Mail, Building, QrCode, AlertTriangle,
} from 'lucide-react';
import styles from './InstructivoViewer.module.css';

export function PublicInstructivoViewer() {
  const { publicId } = useParams<{ publicId: string }>();

  const { data: instructivo, isLoading, isError } = useQuery({
    queryKey: ['public-instructivo', publicId],
    queryFn: () => instructivoService.getByPublicId(publicId!),
    enabled: !!publicId,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span>Cargando instructivo...</span>
      </div>
    );
  }

  if (isError || !instructivo) {
    return (
      <div className={styles.notFoundWrap}>
        <Shield size={48} style={{ color: '#94a3b8' }} />
        <h2>Documento no encontrado</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
          El enlace puede ser incorrecto o el documento fue removido.
        </p>
      </div>
    );
  }

  const nombreApp = instructivo.nombre_app ?? 'Easy Viewer';
  const urlGooglePlay = instructivo.url_google_play ?? '';
  const urlAppStore = instructivo.url_app_store ?? '';
  const urlSitioWeb = instructivo.url_sitio_web ?? 'www.safelink.com.ar';

  const formatFecha = (f: string | null) => {
    if (!f) return '';
    try {
      return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
    } catch { return f; }
  };

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandSide}>
            <div className={styles.brandLogo}>SafeLink</div>
            <div className={styles.brandTagline}>Soluciones inteligentes para tu seguridad</div>
          </div>
          <div className={styles.titleSide}>
            <div className={styles.instructivoBadge}>
              <Shield size={12} />
              Instructivo
            </div>
            <h1 className={styles.docTitle}>{instructivo.titulo}</h1>
            <p className={styles.docSubtitle}>
              Siga los pasos de este instructivo para configurar la aplicación
              y ver sus cámaras desde su teléfono móvil.
            </p>
          </div>
        </div>
      </header>

      {/* ── BARRA DE INFO ── */}
      <div className={styles.infoBar}>
        <div className={styles.infoBarInner}>
          <div className={styles.infoChip}>
            <Clock size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Tiempo estimado</span>
              <span className={styles.infoValue}>3 a 5 minutos</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <BarChart2 size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Dificultad</span>
              <span className={styles.infoValue}>Muy fácil</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <Smartphone size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>Dispositivos</span>
              <span className={styles.infoValue}>Android / iOS</span>
            </div>
          </div>
          <div className={styles.infoChip}>
            <HelpCircle size={18} className={styles.infoIcon} />
            <div>
              <span className={styles.infoLabel}>¿Necesita ayuda?</span>
              <span className={styles.infoValue}>Ver al final</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PASOS ── */}
      <main className={styles.main}>

        {/* ── PASO 1 ── Descargar la aplicación */}
        <div className={styles.step}>
          <div className={styles.stepLeft}>
            <span className={styles.stepNum}>Paso</span>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepIcon}><Download size={18} /></div>
            <span className={styles.stepLabel}>Descargar<br />la aplicación</span>
          </div>
          <div className={styles.stepRight}>
            <h2 className={styles.stepHeading}>
              Descargue la aplicación {nombreApp}
            </h2>

            {instructivo.texto_descarga && (
              <p className={styles.stepText}>{instructivo.texto_descarga}</p>
            )}

            {/* Store badges */}
            <div className={styles.storeBadges}>
              {urlGooglePlay ? (
                <a
                  href={urlGooglePlay}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.storeBadge} ${styles.google}`}
                >
                  <span className={styles.badgeIcon}>
                    {/* Google Play icon */}
                    <svg width="20" height="20" viewBox="0 0 512 512" fill="white">
                      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l230.6-231-230.6-180.9zm425.6 225.6l-58.9-34-66.7 64.9 66.7 64.9 60.1-34c17.4-9.4 17.4-29.4-.2-38.2l-1-.8zm-220.1 48.9L29.2 512l280.9-161.1-57.6-76.4z"/>
                    </svg>
                  </span>
                  <span className={styles.badgeTextGroup}>
                    <span className={styles.badgeSmall}>Disponible en</span>
                    <span className={styles.badgeBig}>Google Play</span>
                  </span>
                </a>
              ) : (
                <span className={`${styles.storeBadge} ${styles.google} ${styles.disabled}`}>
                  <span className={styles.badgeTextGroup}>
                    <span className={styles.badgeSmall}>Disponible en</span>
                    <span className={styles.badgeBig}>Google Play</span>
                  </span>
                </span>
              )}

              {urlAppStore ? (
                <a
                  href={urlAppStore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.storeBadge} ${styles.apple}`}
                >
                  <span className={styles.badgeIcon}>
                    {/* Apple icon */}
                    <svg width="18" height="20" viewBox="0 0 814 1000" fill="white">
                      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-165.9-123.4c-72.9-104.6-106.9-273.3-106.9-474.6 0-222.2 144.7-339.3 287.3-339.3 74.6 0 136.9 48.9 184.3 48.9 45.5 0 117.1-51.3 199.1-51.3 31.8 0 117.1 2.6 181.1 82.6zm-261.1-61.1c-7.6-36.9-3.2-72.4 18.4-100.2 26.2-35.3 61.8-57.6 100.8-60.4 5.8 37.5-8.9 72.4-33.1 98.8-22.6 26.2-57.1 46.2-86.1 61.8z"/>
                    </svg>
                  </span>
                  <span className={styles.badgeTextGroup}>
                    <span className={styles.badgeSmall}>Disponible en</span>
                    <span className={styles.badgeBig}>App Store</span>
                  </span>
                </a>
              ) : (
                <span className={`${styles.storeBadge} ${styles.apple} ${styles.disabled}`}>
                  <span className={styles.badgeTextGroup}>
                    <span className={styles.badgeSmall}>Disponible en</span>
                    <span className={styles.badgeBig}>App Store</span>
                  </span>
                </span>
              )}
            </div>

            {instructivo.texto_post_instalacion && (
              <p className={styles.stepText}>{instructivo.texto_post_instalacion}</p>
            )}
          </div>
        </div>

        {/* ── PASO 2 ── Agregar el equipo */}
        <div className={styles.step}>
          <div className={styles.stepLeft}>
            <span className={styles.stepNum}>Paso</span>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepIcon}><Plus size={18} /></div>
            <span className={styles.stepLabel}>Agregar<br />el equipo</span>
          </div>
          <div className={styles.stepRight}>
            <h2 className={styles.stepHeading}>Agregue el equipo a la aplicación</h2>
            <div className={styles.qrContainer}>
              <div className={styles.qrInstructions}>
                <ul className={styles.numberedList}>
                  <li>
                    <span className={styles.numBullet}>1</span>
                    <span>Presione el botón <strong>"+"</strong> ubicado en la esquina superior derecha.</span>
                  </li>
                  <li>
                    <span className={styles.numBullet}>2</span>
                    <span>Seleccione la opción <strong>Explorar</strong>.</span>
                  </li>
                  <li>
                    <span className={styles.numBullet}>3</span>
                    <span>Escanee el código QR proporcionado por el instalador.</span>
                  </li>
                </ul>
              </div>
              <div className={styles.qrImageBox}>
                {instructivo.qr_image_url ? (
                  <img
                    src={instructivo.qr_image_url}
                    alt="Código QR del equipo"
                    className={styles.qrImage}
                  />
                ) : (
                  <div className={styles.qrPlaceholder}>
                    <QrCode size={32} />
                    <span>QR del equipo</span>
                  </div>
                )}
                <span className={styles.qrCaption}>Escanee este código dentro del recuadro</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PASO 3 ── Seleccionar el dispositivo */}
        <div className={styles.step}>
          <div className={styles.stepLeft}>
            <span className={styles.stepNum}>Paso</span>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepIcon}><List size={18} /></div>
            <span className={styles.stepLabel}>Seleccionar<br />el dispositivo</span>
          </div>
          <div className={styles.stepRight}>
            <h2 className={styles.stepHeading}>Seleccione el dispositivo encontrado</h2>
            <p className={styles.stepText}>
              Luego de escanear el código QR, seleccione el equipo que aparece identificado como:
            </p>
            <div style={{
              display: 'inline-block',
              background: '#1a2744',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.9rem',
              padding: '0.35rem 1rem',
              borderRadius: '6px',
              letterSpacing: '0.05em',
              marginTop: '0.25rem',
            }}>
              DVR / XVR
            </div>
            <p className={styles.stepText} style={{ marginTop: '0.5rem' }}>
              Tóquelo para seleccionarlo.
            </p>
          </div>
        </div>

        {/* ── PASO 4 ── Completar los datos */}
        <div className={styles.step}>
          <div className={styles.stepLeft}>
            <span className={styles.stepNum}>Paso</span>
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepIcon}><UserCheck size={18} /></div>
            <span className={styles.stepLabel}>Completar<br />los datos</span>
          </div>
          <div className={styles.stepRight}>
            <h2 className={styles.stepHeading}>Complete los siguientes campos:</h2>
            <div className={styles.credentialsLayout}>
              <div className={styles.credentialsList}>
                <div className={styles.credentialItem}>
                  <span className={styles.credNum}>1</span>
                  <div>
                    <div className={styles.credLabel}>Nombre del dispositivo</div>
                    {instructivo.nombre_dispositivo && (
                      <span className={styles.credCode}>{instructivo.nombre_dispositivo}</span>
                    )}
                    <div className={styles.credValue}>Puede colocar cualquier nombre para identificar las cámaras.</div>
                  </div>
                </div>
                <div className={styles.credentialItem}>
                  <span className={styles.credNum}>2</span>
                  <div>
                    <div className={styles.credLabel}>Usuario</div>
                    {instructivo.usuario_dispositivo && (
                      <span className={styles.credCode}>{instructivo.usuario_dispositivo}</span>
                    )}
                  </div>
                </div>
                <div className={styles.credentialItem}>
                  <span className={styles.credNum}>3</span>
                  <div>
                    <div className={styles.credLabel}>Contraseña</div>
                    {instructivo.password_dispositivo && (
                      <span className={styles.credCode}>{instructivo.password_dispositivo}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.importanteBox}>
                <div className={styles.importanteTitle}>
                  <AlertTriangle size={14} />
                  Importante
                </div>
                <p className={styles.importanteText}>
                  Verifique que los datos estén escritos tal como se muestran.
                  Respete mayúsculas, minúsculas y puntos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── PASO 5 ── Finalizar */}
        <div className={styles.step}>
          <div className={styles.stepLeft}>
            <span className={styles.stepNum}>Paso</span>
            <span className={styles.stepNumber}>5</span>
            <div className={styles.stepIcon}><CheckCircle size={18} /></div>
            <span className={styles.stepLabel}>Finalizar</span>
          </div>
          <div className={styles.stepRight}>
            <h2 className={styles.stepHeading}>Presione Finalizar</h2>
            <div className={styles.paso5Layout}>
              <p className={styles.stepText}>
                Luego de unos segundos el equipo quedará agregado y ya podrá
                visualizar las cámaras desde la pantalla principal de la aplicación.
              </p>
              <div className={styles.listoBox}>
                <div className={styles.listoTitle}>
                  <CheckCircle size={16} />
                  ¡Listo!
                </div>
                <p className={styles.listoText}>
                  Ya puede visualizar sus cámaras en cualquier momento
                  desde su teléfono móvil.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER 3 COLUMNAS ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>

          {/* Recomendaciones */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>
              <Shield size={14} />
              Recomendaciones
            </div>
            <ul className={styles.footerBullets}>
              <li>Mantenga la aplicación actualizada.</li>
              <li>No comparta el usuario ni la contraseña con personas no autorizadas.</li>
              <li>Si cambia de teléfono, deberá repetir este procedimiento para agregar nuevamente el dispositivo.</li>
            </ul>
          </div>

          {/* ¿Necesita ayuda? */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>
              <HelpCircle size={14} />
              ¿Necesita ayuda?
            </div>
            <div className={styles.footerContact}>
              <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '0.5rem' }}>
                Si durante la configuración surge algún inconveniente o no logra visualizar las cámaras, comuníquese con nuestro servicio técnico.
              </p>
              <div className={styles.contactRow}>
                <Phone size={13} className={styles.contactIcon} />
                <span>11 1234 5678</span>
              </div>
              <div className={styles.contactRow}>
                <Mail size={13} className={styles.contactIcon} />
                <span>soporte@safelink.com.ar</span>
              </div>
              <div className={styles.contactRow}>
                <Clock size={13} className={styles.contactIcon} />
                <span>Lunes a Viernes de 9:00 a 18:00 hs.</span>
              </div>
            </div>
          </div>

          {/* Datos de la instalación */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>
              <Building size={14} />
              Datos de su instalación
            </div>
            <div className={styles.installData}>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Cliente</span>
                <span className={styles.dataValue}>{instructivo.cliente_nombre ?? ''}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Dirección</span>
                <span className={styles.dataValue}>{instructivo.cliente_direccion ?? ''}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Fecha de instalación</span>
                <span className={styles.dataValue}>{formatFecha(instructivo.fecha_instalacion)}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.dataLabel}>Técnico</span>
                <span className={styles.dataValue}>{instructivo.tecnico_nombre ?? ''}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Barra final */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomBarInner}>
            <div className={styles.bottomBrand}>
              <span className={styles.bottomBrandName}>SafeLink</span>
              <span className={styles.bottomTagline}>Soluciones inteligentes para tu seguridad</span>
            </div>
            <a
              href={urlSitioWeb.startsWith('http') ? urlSitioWeb : `https://${urlSitioWeb}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.bottomUrl}
            >
              {urlSitioWeb}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
