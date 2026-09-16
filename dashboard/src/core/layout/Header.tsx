import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../ui/ToastContext';
import { Button } from '../ui/Button';

export interface HeaderProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title }) => {
  const { user, logout } = useAuth();
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
    <header className="h-16 bg-stone-950/80 backdrop-blur-md border-b border-stone-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          ☰
        </button>
        {title && <h1 className="text-lg font-bold text-stone-100 tracking-tight">{title}</h1>}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <div className="flex items-center gap-2.5 bg-stone-900 border border-stone-800/80 py-1.5 px-3 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-stone-200 hidden sm:inline">{user.display_name}</span>
            <span className="text-stone-400 text-[10px] hidden md:inline">({user.email})</span>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="text-stone-300 hover:text-rose-400 hover:border-rose-500/30"
          title="Cerrar sesión"
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};
