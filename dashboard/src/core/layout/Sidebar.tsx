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
  { to: '/content', label: 'Textos de la Web', icon: '📝' },
  { to: '/posts', label: 'Novedades y Redes', icon: '📢' },
  { to: '/media', label: 'Galería de Fotos', icon: '🖼️' },
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
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-950 border-r border-stone-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo / Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center font-mono text-sm">
              iWE
            </div>
            <div>
              <span className="font-bold text-stone-100 text-sm tracking-tight block">Studio</span>
              <span className="text-[10px] text-stone-400 block -mt-0.5">Andorra & Pirineos</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-stone-400 hover:text-white p-1"
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
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-stone-300 hover:bg-stone-900 hover:text-white border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-xs bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Quick link to public site */}
        <div className="p-4 border-t border-stone-800/80">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-medium border border-stone-800 transition-colors"
          >
            <span>Ver sitio público</span>
            <span>↗</span>
          </a>
        </div>
      </aside>
    </>
  );
};
