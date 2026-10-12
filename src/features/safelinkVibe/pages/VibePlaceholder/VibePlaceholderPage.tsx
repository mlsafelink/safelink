import { Sparkles, ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VibePlaceholderPageProps {
  title: string;
  description: string;
}

export function VibePlaceholderPage({ title, description }: VibePlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          background: 'var(--vibe-surface)',
          border: '1px solid var(--vibe-border)',
          borderRadius: 'var(--vibe-radius-md)',
          padding: '3rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: 'var(--vibe-shadow-card)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(79, 110, 247, 0.1)',
            border: '1px solid var(--vibe-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--vibe-blue)',
          }}
        >
          <Sparkles size={28} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--vibe-text-primary)', margin: 0 }}>
          {title}
        </h1>

        <p style={{ fontSize: '0.875rem', color: 'var(--vibe-text-secondary)', margin: 0, maxWidth: '480px' }}>
          {description}
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--vibe-warning)',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginTop: '0.5rem',
          }}
        >
          <Clock size={14} />
          <span>Módulo planificado para Fase 2</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vibe')}
          style={{
            marginTop: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: 'var(--vibe-radius-sm)',
            background: 'var(--vibe-surface-2)',
            border: '1px solid var(--vibe-border)',
            color: 'var(--vibe-text-primary)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al Dashboard de Vibe</span>
        </button>
      </div>
    </div>
  );
}
