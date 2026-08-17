import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { securityService } from '@/services/securityService';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import styles from './Login.module.css';

/** Traduce los errores de Supabase Auth al español */
function traducirError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'Email o contraseña incorrectos.';
  if (msg.includes('Email not confirmed'))
    return 'El email aún no fue confirmado. Revisá tu bandeja de entrada.';
  if (msg.includes('Too many requests'))
    return 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.';
  if (msg.includes('User not found'))
    return 'No existe una cuenta con ese email.';
  return msg;
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setError(traducirError(error.message));
      // ── SLS: registrar intento fallido (fire-and-forget) ────────
      securityService.recordEvent({
        event_type: 'LOGIN_FAILED',
        user_email: email,
        metadata: { error_code: error.status ?? 'unknown' },
      });
    } else {
      // ── SLS: registrar login exitoso (fire-and-forget) ──────────
      const userId = authData?.user?.id;
      const userEmail = authData?.user?.email ?? email;
      securityService.recordEvent({
        event_type:  'LOGIN_SUCCESS',
        user_id:     userId,
        user_email:  userEmail,
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <Card variant="glass" className={styles.loginCard}>
        <div className={styles.header}>
          <h2>SafeLink</h2>
          <p>Plataforma Técnica</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <Input
            label="Email"
            type="email"
            id="email"
            placeholder="admin@safelink.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Campo contraseña con botón ojo */}
          <div className={styles.passwordWrapper}>
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" variant="primary" isLoading={isLoading}>
            Ingresar
          </Button>
        </form>

        <div className={styles.footerLink}>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Volver a la página principal</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
