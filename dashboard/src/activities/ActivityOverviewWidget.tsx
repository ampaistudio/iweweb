import React from 'react';
import { Link } from 'react-router-dom';
import type { OverviewData } from '../api/types';
import { Card } from '../core/ui/Card';
import { Button } from '../core/ui/Button';

export interface ActivityOverviewWidgetProps {
  data: OverviewData | null;
}

export const ActivityOverviewMetric: React.FC<ActivityOverviewWidgetProps> = ({ data }) => {
  if (!data) return null;

  return (
    <Card className="flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Actividades</span>
          <span className="text-xl">🏔️</span>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-primary">{data.activities.published}</span>
          <span className="text-muted text-sm">/ {data.activities.total} en total</span>
        </div>
        <p className="text-xs text-muted mt-2">
          {data.activities.total - data.activities.published} actividades ocultas en borrador
        </p>
      </div>
      <div className="mt-5 pt-4 border-t border-border/80">
        <Link to="/activities">
          <Button variant="secondary" size="sm" className="w-full">
            Gestionar actividades →
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export const ActivityQuickAction: React.FC = () => {
  return (
    <Link to="/activities/new">
      <Button variant="primary" className="w-full justify-start text-left h-auto py-3.5 px-4" leftIcon="➕">
        <div>
          <div className="font-bold text-sm">Nueva actividad</div>
          <div className="text-[11px] opacity-80 font-normal">Crear tour o experiencia</div>
        </div>
      </Button>
    </Link>
  );
};

export const ActivityRecentEdit: React.FC<ActivityOverviewWidgetProps> = ({ data }) => {
  if (!data || !data.activities.last_edit) return null;

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg/60 border border-border/80">
      <div className="flex items-center gap-3">
        <span className="text-lg">🏔️</span>
        <div>
          <div className="text-xs text-muted">Última actividad editada:</div>
          <div className="text-sm font-semibold text-primary">{data.activities.last_edit.title}</div>
        </div>
      </div>
      <span className="text-[11px] text-muted">
        {new Date(data.activities.last_edit.updated_at).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  );
};
