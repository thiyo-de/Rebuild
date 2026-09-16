import React, { useState, useRef, useEffect } from 'react';
import { nativeHaptics } from '../services/native';

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: string;
  description?: string;
}

interface CustomSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: (SelectOption<T> | T)[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  accentColor?: 'indigo' | 'amber' | 'emerald';
  ariaLabel?: string;
  relativePopup?: boolean;
}

export function CustomSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  accentColor = 'indigo',
  ariaLabel,
  relativePopup = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption<T>[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as SelectOption<T>;
    }
    return {
      value: opt as T,
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    nativeHaptics.selection();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (val: T) => {
    nativeHaptics.selection();
    onChange(val);
    setIsOpen(false);
  };

  // Color theme maps
  const accentClasses = {
    indigo: {
      selectedItem: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold',
      checkIcon: 'text-indigo-400',
      activeRing: 'border-indigo-500 ring-2 ring-indigo-500/20',
      activeChevron: 'text-indigo-400',
    },
    amber: {
      selectedItem: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold',
      checkIcon: 'text-amber-400',
      activeRing: 'border-amber-500 ring-2 ring-amber-500/20',
      activeChevron: 'text-amber-400',
    },
    emerald: {
      selectedItem: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold',
      checkIcon: 'text-emerald-400',
      activeRing: 'border-emerald-500 ring-2 ring-emerald-500/20',
      activeChevron: 'text-emerald-400',
    },
  }[accentColor];

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[60]' : 'z-10'} ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={ariaLabel || selectedOption?.label || placeholder}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full min-h-[44px] px-3.5 py-2 text-xs rounded-2xl bg-[#080C16] border border-white/10 focus:border-indigo-500/50 outline-none text-white flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? accentClasses.activeRing : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon && (
            <i className={`${selectedOption.icon.startsWith('ri-') ? selectedOption.icon : `ri-${selectedOption.icon}`} text-base text-indigo-400 shrink-0`} />
          )}
          <span className={`truncate font-bold text-xs ${selectedOption ? 'text-white' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <i
          className={`ri-arrow-down-s-line text-base shrink-0 transition-transform duration-200 ${
            isOpen ? `rotate-180 ${accentClasses.activeChevron}` : 'text-slate-400'
          }`}
        />
      </button>

      {/* Custom Dark Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`${
            relativePopup ? 'relative mt-2 z-[60] w-full' : 'absolute top-full left-0 right-0 mt-2 z-[60]'
          } bg-[#0B101D]/95 backdrop-blur-3xl border border-white/12 rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-2 max-h-60 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.05] before:to-transparent before:pointer-events-none`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-[0.98] border relative z-10 ${
                  isSelected
                    ? `${accentClasses.selectedItem} border shadow-xs`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {opt.icon && (
                    <i className={`${opt.icon.startsWith('ri-') ? opt.icon : `ri-${opt.icon}`} text-sm shrink-0 ${isSelected ? accentClasses.checkIcon : 'text-slate-400'}`} />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <i className={`ri-check-line text-sm font-bold ${accentClasses.checkIcon} shrink-0`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
