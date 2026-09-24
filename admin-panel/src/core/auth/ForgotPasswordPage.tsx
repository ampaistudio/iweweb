import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await api.auth.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo procesar la solicitud.';
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
          <h1 className="text-2xl font-bold text-primary tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-muted mt-1">
            Ingresá tu email y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-accent-soft border border-accent/30 text-accent-text text-sm text-center leading-relaxed">
            Si el email existe en nuestro sistema, vas a recibir un enlace para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              autoComplete="email"
              required
              disabled={isLoading}
            />

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-2">
              Enviar enlace
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-accent-text hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};
