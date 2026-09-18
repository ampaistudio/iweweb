import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, type NavItem } from './Sidebar';
import { Header } from './Header';

export interface DashboardLayoutProps {
  customNavItems?: NavItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ customNavItems }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/') return 'Resumen General';
    if (pathname.startsWith('/activities')) return 'Gestión de Actividades';
    if (pathname.startsWith('/packages')) return 'Paquetes Multidía';
    if (pathname.startsWith('/menu')) return 'Menú de Navegación';
    if (pathname.startsWith('/content')) return 'Textos de la Web';
    if (pathname.startsWith('/posts')) return 'Novedades y Redes Sociales';
    if (pathname.startsWith('/media')) return 'Galería Multimedia';
    return 'Panel Editorial';
  };


  return (
    <div className="min-h-screen bg-bg text-primary flex">
      {/* Sidebar navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        customNavItems={customNavItems}
      />

      {/* Main wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>

        <footer className="py-4 px-4 sm:px-6 md:px-8 text-center">
          <a
            href="https://www.nodoai.co"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-faint hover:text-muted transition-colors uppercase tracking-wide"
          >
            Powered by NODO Ai Agency
          </a>
        </footer>
      </div>
    </div>
  );
};
