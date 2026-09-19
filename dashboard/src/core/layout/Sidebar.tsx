import React from 'react';
import { NavLink } from 'react-router-dom';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  badge?: string | number;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  customNavItems?: NavItem[];
}

const defaultNavItems: NavItem[] = [
  { to: '/', label: 'Resumen (Overview)', icon: '📊' },
  { to: '/activities', label: 'Actividades', icon: '🏔️' },
  { to: '/packages', label: 'Paquetes Multidía', icon: '🎒' },
  { to: '/menu', label: 'Menú de Navegación', icon: '📋' },
  { to: '/content', label: 'Textos de la Web', icon: '📝' },
  { to: '/posts', label: 'Novedades y Redes', icon: '📢' },
  { to: '/media', label: 'Galería de Fotos', icon: '🖼️' },
  { to: '/settings/api-keys', label: 'Integraciones & API Keys', icon: '🔐' },
  { to: '/settings/site-health', label: 'Salud del Sitio', icon: '🩺' },
];


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  customNavItems,
}) => {
  const items = customNavItems || defaultNavItems;

  return (
    <>
      {/* Backdrop for tablet and mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo / Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/30 text-accent-text font-bold flex items-center justify-center font-mono text-sm">
              iWE
            </div>
            <div>
              <span className="font-bold text-primary text-sm tracking-tight block">Studio</span>
              <span className="text-[10px] text-muted block -mt-0.5">Andorra & Pirineos</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-muted hover:text-primary p-1"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-150 min-h-[44px] ${
                  isActive
                    ? 'bg-accent-soft text-accent-text border border-accent/30 shadow-sm'
                    : 'text-secondary hover:bg-surface-elevated hover:text-primary border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-xs bg-surface-elevated text-secondary px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Quick link to public site */}
        <div className="p-4 border-t border-border/80">
          <a
            href={import.meta.env.VITE_PUBLIC_SITE_URL || '/'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-surface-elevated hover:bg-surface-hover text-secondary hover:text-primary text-xs font-medium border border-border transition-colors"
          >
            <span>Ver sitio público</span>
            <span>↗</span>
          </a>
        </div>
      </aside>
    </>
  );
};
