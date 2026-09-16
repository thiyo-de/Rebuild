import React from 'react';
import { triggerHaptic } from '../../services/native';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon, children, className = '', onClick, ...props }) => {
  const baseClasses = "min-h-[48px] px-6 py-2.5 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap active:scale-95 flex items-center justify-center gap-2";
  
  let variantClasses = "";
  switch (variant) {
    case 'primary':
      variantClasses = "bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 shadow-sm";
      break;
    case 'secondary':
      variantClasses = "bg-[#0C101D] hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white";
      break;
    case 'danger':
      variantClasses = "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400";
      break;
    case 'ghost':
      variantClasses = "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white";
      break;
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    triggerHaptic('light');
    if (onClick) onClick(e);
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {icon && <i className={`${icon} text-lg shrink-0`} />}
      <span>{children}</span>
    </button>
  );
};
