import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles, Wand2, FileText, FileArchive, CheckCircle2,
  Bot, RefreshCw, Layers, ShieldCheck, ArrowRight
} from 'lucide-react';
import styles from './SafeLinkIAPage.module.css';

interface IncomingState {
  slnFile?: string;
  prompt?: string;
}

export function SafeLinkIAPage() {
  const location = useLocation();
  const incoming = (location.state as IncomingState) || {};

  const [promptText, setPromptText] = useState(incoming.prompt || '');
  const [selectedSln, setSelectedSln] = useState<string | null>(incoming.slnFile || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [docType, setDocType] = useState<'reporte' | 'presupuesto' | 'reporte_trabajo'>('reporte');

  useEffect(() => {
    if (incoming.prompt) setPromptText(incoming.prompt);
    if (incoming.slnFile) setSelectedSln(incoming.slnFile);
  }, [incoming]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() && !selectedSln) return;

    setIsGenerating(true);
    setGenerationComplete(false);

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationComplete(true);
    }, 2200);
  };

  return (
    <div className={styles.container}>
      <div className={styles.glowBg} />

      <div className={styles.mainLayout}>
        {/* ── COLUMNA IZQUIERDA: PANEL PRINCIPAL IA ── */}
        <div className={styles.leftPanel}>
          <div className={styles.headerBlock}>
            <div className={styles.badgeGroup}>
              <span className={styles.badgeDot} />
              <span>Nathulia IA · Asistente Activa</span>
            </div>
            <h1>
              SafeLink <span className={styles.gradientText}>IA</span>
            </h1>
            <p className={styles.subtitle}>
              Centro de generación inteligente de documentación técnica, presupuestos y reportes de trabajo efectuado.
            </p>
          </div>

          {/* Contexto de archivo .SLN recibido */}
          {selectedSln && (
            <div className={styles.slnContextBanner}>
              <FileArchive size={20} className={styles.slnIcon} />
              <div className={styles.slnDetails}>
                <span className={styles.slnLabel}>Archivo SafeLink Note Vinculado:</span>
                <span className={styles.slnFileName}>{selectedSln}</span>
              </div>
              <button
                className={styles.removeSlnBtn}
                onClick={() => setSelectedSln(null)}
                title="Desvincular archivo"
              >
                ×
              </button>
            </div>
          )}

          {/* Formulario de Prompt para Nathulia */}
          <form onSubmit={handleGenerate} className={styles.promptCard}>
            <div className={styles.docTypeSelector}>
              <label className={styles.selectorLabel}>Tipo de Documento a Generar:</label>
              <div className={styles.typeButtons}>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${docType === 'reporte' ? styles.activeType : ''}`}
                  onClick={() => setDocType('reporte')}
                >
                  <FileText size={14} />
                  Reporte Técnico (RT)
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${docType === 'presupuesto' ? styles.activeType : ''}`}
                  onClick={() => setDocType('presupuesto')}
                >
                  <Layers size={14} />
                  Presupuesto (PRES)
                </button>
                <button
                  type="button"
                  className={`${styles.typeBtn} ${docType === 'reporte_trabajo' ? styles.activeType : ''}`}
                  onClick={() => setDocType('reporte_trabajo')}
                >
                  <ShieldCheck size={14} />
                  Reporte de Trabajo (RTE)
                </button>
              </div>
            </div>

            <div className={styles.inputWrap}>
              <textarea
                className={styles.promptArea}
                placeholder="Escribe aquí las instrucciones para Nathulia (ej. 'Generar reporte técnico para consorcio Mitre 450 evaluando sistema de cámaras IP...')"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={4}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={isGenerating || (!promptText.trim() && !selectedSln)}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={18} className={styles.spin} />
                    <span>Nathulia procesando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    <span>Generar con Nathulia</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Resultado de la Generación */}
          {generationComplete && (
            <div className={styles.resultBox}>
              <div className={styles.resultHeader}>
                <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
                <div>
                  <h3>Documentación procesada por Nathulia</h3>
                  <p>La estructura base ha sido completada con los datos del relevamiento.</p>
                </div>
              </div>
              <div className={styles.resultActions}>
                <button className={styles.primaryActionBtn}>
                  Ver borrador del documento
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Capacidades de Nathulia */}
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <Sparkles size={20} className={styles.featIcon} />
              <h4>Extracción Automática</h4>
              <p>Analiza archivos de relevamiento .sln e identifica anomalías y sugerencias.</p>
            </div>
            <div className={styles.featureCard}>
              <Layers size={20} className={styles.featIcon} />
              <h4>Trazabilidad Completa</h4>
              <p>Mantiene la cadena jerárquica desde RT hasta el reporte final RTE.</p>
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: ASISTENTE NATHULIA (AVATAR HOLOGRÁFICO) ── */}
        <div className={styles.rightSidebar}>
          <div className={styles.avatarCard}>
            <div className={styles.avatarGlow} />

            <div className={styles.videoWrapper}>
              <video
                src="/assets/Avatar.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={styles.avatarVideo}
              />
              <div className={styles.holoOverlay} />
            </div>

            <div className={styles.avatarMeta}>
              <div className={styles.assistantBadge}>
                <Bot size={14} />
                <span>Nathulia Assistant</span>
              </div>
              <div className={styles.assistantStatus}>
                <span className={styles.pulseDot} />
                <span>En línea · Lista para redactar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
