import React from 'react';
import type { HealthSeverity } from '../../api/types';

interface HealthSeverityBadgeProps {
  severity: HealthSeverity;
  text?: string;
}

export const HealthSeverityBadge: React.FC<HealthSeverityBadgeProps> = ({ severity, text }) => {
  switch (severity) {
    case 'green':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {text || 'Al día'}
        </span>
      );
    case 'yellow':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {text || 'Actualización menor'}
        </span>
      );
    case 'red':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {text || 'Actualización mayor'}
        </span>
      );
  }
};

