import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  icon?: string;
  variant?: 'indigo' | 'amber' | 'emerald' | 'rose' | 'cyan' | 'slate';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, icon, variant = 'slate', className = '' }) => {
  let variantClasses = "";
  
  switch (variant) {
    case 'indigo':
      variantClasses = "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      break;
    case 'amber':
      variantClasses = "bg-amber-500/15 text-amber-300 border-amber-500/30";
      break;
    case 'emerald':
      variantClasses = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
      break;
    case 'rose':
      variantClasses = "bg-rose-500/15 text-rose-300 border-rose-500/30";
      break;
    case 'cyan':
      variantClasses = "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
      break;
    case 'slate':
      variantClasses = "bg-slate-800/50 text-slate-300 border-white/10";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border ${variantClasses} ${className}`}>
      {icon && <i className={`${icon} text-xs`} />}
      {children}
    </span>
  );
};
