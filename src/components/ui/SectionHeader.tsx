import React from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  badge?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, badge, rightAction, className = '' }) => {
  return (
    <div className={`flex items-center justify-between px-1 ${className}`}>
      <div className="flex items-center gap-2">
        {icon && <i className={`${icon} text-slate-400 text-sm`} />}
        <h3 className="text-sm font-bold text-slate-300">
          {title}
        </h3>
        {badge}
      </div>
      {rightAction && (
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      )}
    </div>
  );
};
