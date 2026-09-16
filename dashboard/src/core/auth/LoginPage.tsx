import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Por favor ingresa tu email y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const user = await login(email.trim(), password);
      toast.success(`¡Bienvenido, ${user.display_name}!`, 'Sesión iniciada');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifica tus credenciales.';
      setErrorMsg(msg);
      toast.error(msg, 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-accent/30 selection:text-accent-text">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-warning-soft/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft border border-accent/30 text-accent-text font-bold text-2xl mb-4 font-mono shadow-inner">
            iWE
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Studio Editorial</h1>
          <p className="text-sm text-muted mt-1">Panel de administración y contenidos</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger-text text-sm flex items-start gap-3 animate-fadeIn">
            <span className="font-bold mt-0.5">✕</span>
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@isardwildland.com"
            autoComplete="email"
            required
            disabled={isLoading}
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2"
          >
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/80 text-center">
          <p className="text-xs text-muted">
            Acceso exclusivo para administradores (Christian y Charly).
          </p>
        </div>
      </div>
    </div>
  );
};
