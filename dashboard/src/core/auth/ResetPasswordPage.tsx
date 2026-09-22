import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('El enlace de recuperación es inválido. Solicitá uno nuevo.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.resetPassword(token, password);
      toast.success('Contraseña actualizada. Ya podés iniciar sesión.', 'Listo');
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
      setErrorMsg(msg);
      toast.error(msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-accent/30 selection:text-accent-text">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-warning-soft/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft border border-accent/30 text-accent-text font-bold text-2xl mb-4 font-mono shadow-inner">
            iWE
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Elegir nueva contraseña</h1>
          <p className="text-sm text-muted mt-1">Ingresá tu nueva contraseña para el panel.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger-text text-sm flex items-start gap-3 animate-fadeIn">
            <span className="font-bold mt-0.5">✕</span>
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={isLoading}
          />

          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={isLoading}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
            Actualizar contraseña
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-accent-text hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
