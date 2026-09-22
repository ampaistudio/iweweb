import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/ToastContext';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../ui/Button';

export interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Has cerrado sesión correctamente.', 'Hasta pronto');
    } catch {
      toast.error('Error al cerrar sesión.');
    }
  };

  return (
    <header className="h-16 bg-bg/80 backdrop-blur-md border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-surface-elevated border border-border text-secondary hover:text-primary hover:bg-surface-hover min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          ☰
        </button>
        {title && <h1 className="text-lg font-bold text-primary tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface-elevated border border-border text-secondary hover:text-primary hover:bg-surface-hover min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer transition-colors"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {user && (
          <div className="flex items-center gap-2.5 bg-surface-elevated border border-border/80 py-1.5 px-3 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-semibold text-primary hidden sm:inline">{user.display_name}</span>
            <span className="text-muted text-[10px] hidden md:inline">({user.email})</span>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="text-secondary hover:text-danger-text hover:border-danger/30"
          title="Cerrar sesión"
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};
