import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from './AuthContext';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ChangePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { refreshUser, logout, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.changePassword(password);
      await refreshUser();
      toast.success('Contraseña actualizada correctamente. ¡Bienvenido al panel!', 'Seguridad');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
      setErrorMsg(msg);
      toast.error(msg, 'Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-accent/30 selection:text-accent-text">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-warning-soft/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warning-soft border border-warning/30 text-warning-text font-bold text-2xl mb-4 font-mono shadow-inner">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Cambio obligatorio de contraseña</h1>
          <p className="text-sm text-muted mt-2">
            Hola <span className="font-semibold text-primary">{user?.display_name || 'Usuario'}</span>. Tu cuenta tiene una contraseña inicial temporal. Por seguridad, debes establecer una contraseña personal antes de continuar.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-danger-soft border border-danger/30 text-danger-text text-sm flex items-start gap-3 animate-fadeIn">
            <span className="font-bold mt-0.5">✕</span>
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nueva contraseña (mínimo 8 caracteres)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={isLoading}
          />

          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
            disabled={isLoading}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
            Guardar contraseña y continuar
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-muted hover:text-primary transition-colors underline"
            >
              Cerrar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
