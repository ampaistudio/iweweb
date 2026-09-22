import React from 'react';

export interface SectionPublishToggleProps {
  title: string;
  activeDescription: string;
  inactiveDescription: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SectionPublishToggle: React.FC<SectionPublishToggleProps> = ({
  title,
  activeDescription,
  inactiveDescription,
  checked,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 bg-surface-elevated rounded-xl border border-border">
      <div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="text-xs text-muted">
          {checked ? activeDescription : inactiveDescription}
        </p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent" />
      </label>
    </div>
  );
};

