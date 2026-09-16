import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { OverviewData } from '../../api/types';
import { useAuth } from '../auth/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface OverviewPageProps {
  renderDomainMetrics?: (data: OverviewData | null) => React.ReactNode;
  renderDomainQuickActions?: () => React.ReactNode;
  renderDomainRecentEdits?: (data: OverviewData | null) => React.ReactNode;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  renderDomainMetrics,
  renderDomainQuickActions,
  renderDomainRecentEdits,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.overview.get();
        setData(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar métricas');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Cargando estado del sitio...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-950/60 border border-rose-500/30 rounded-2xl text-rose-200 text-sm">
        <p className="font-semibold mb-1">No se pudo cargar el resumen:</p>
        <p>{error || 'Datos no disponibles.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <Badge variant="success" size="sm" className="mb-3">
            Sistema operativo
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Hola, {user?.display_name || 'Administrador'} 👋
          </h2>
          <p className="text-stone-400 text-sm mt-1 max-w-xl leading-relaxed">
            Bienvenido al panel editorial. Aquí puedes gestionar los contenidos, novedades y medios del sitio web.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Injected Domain Metrics (e.g. Activities) */}
        {renderDomainMetrics && renderDomainMetrics(data)}

        {/* Posts & News metric (Core) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Novedades & Blog</span>
              <span className="text-xl">📢</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{data.posts.published}</span>
              <span className="text-stone-400 text-sm">/ {data.posts.total} posts</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Sincronizados con Meta (Facebook & Instagram)
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-stone-800/80">
            <Link to="/posts">
              <Button variant="secondary" size="sm" className="w-full">
                Gestionar novedades →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Media metric (Core) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Galería de Fotos</span>
              <span className="text-xl">🖼️</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{data.media.total}</span>
              <span className="text-stone-400 text-sm">imágenes subidas</span>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Disponibles para actividades y novedades
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-stone-800/80">
            <Link to="/media">
              <Button variant="secondary" size="sm" className="w-full">
                Abrir galería →
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Edits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions Card */}
        <Card title="Acciones Rápidas" subtitle="Crea contenido o actualiza la web en un clic">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Injected Domain Quick Action (e.g. New Activity) */}
            {renderDomainQuickActions && renderDomainQuickActions()}

            <Link to="/posts/new">
              <Button variant="secondary" className="w-full justify-start text-left h-auto py-3.5 px-4" leftIcon="✍️">
                <div>
                  <div className="font-bold text-sm">Nuevo post</div>
                  <div className="text-[11px] text-stone-400 font-normal">Publicar en web y redes</div>
                </div>
              </Button>
            </Link>

            <Link to="/media">
              <Button variant="secondary" className="w-full justify-start text-left h-auto py-3.5 px-4" leftIcon="📤">
                <div>
                  <div className="font-bold text-sm">Subir fotos</div>
                  <div className="text-[11px] text-stone-400 font-normal">Agregar a la galería</div>
                </div>
              </Button>
            </Link>

            <Link to="/content">
              <Button variant="secondary" className="w-full justify-start text-left h-auto py-3.5 px-4" leftIcon="📝">
                <div>
                  <div className="font-bold text-sm">Editar textos web</div>
                  <div className="text-[11px] text-stone-400 font-normal">Empresa, equipo y contacto</div>
                </div>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Updates Card */}
        <Card title="Últimas Modificaciones" subtitle="Historial reciente de actualizaciones">
          <div className="space-y-4">
            {/* Injected Domain Recent Edit (e.g. Activity) */}
            {renderDomainRecentEdits && renderDomainRecentEdits(data)}

            {data.posts.last_edit ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-950/60 border border-stone-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📢</span>
                  <div>
                    <div className="text-xs text-stone-400">Último post editado:</div>
                    <div className="text-sm font-semibold text-stone-200">{data.posts.last_edit.title}</div>
                  </div>
                </div>
                <span className="text-[11px] text-stone-500">
                  {new Date(data.posts.last_edit.updated_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ) : (
              <p className="text-xs text-stone-500">No hay publicaciones de novedades aún.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
