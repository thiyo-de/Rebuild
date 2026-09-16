import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatTime12Hour } from '../utils/dateUtils';
import { nativeHaptics } from '../services/native';

interface TimePicker12HourProps {
  value: string; // ISO format "HH:mm" or ""
  onChange: (val: string) => void;
  allowNone?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const TimePicker12Hour: React.FC<TimePicker12HourProps> = ({
  value,
  onChange,
  allowNone = false,
  className = '',
  ariaLabel = 'Select time',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse existing "HH:mm" into 12-hour parts
  const parseTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) {
      return { hours12: 8, minutes: 0, period: 'AM' as 'AM' | 'PM' };
    }
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const validH = isNaN(h) ? 8 : h;
    const validM = isNaN(m) ? 0 : m;

    const period: 'AM' | 'PM' = validH >= 12 ? 'PM' : 'AM';
    let hours12 = validH % 12;
    if (hours12 === 0) hours12 = 12;

    return { hours12, minutes: validM, period };
  };

  const current = parseTime(value);
  const [tempHours, setTempHours] = useState(current.hours12);
  const [tempMinutes, setTempMinutes] = useState(current.minutes);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(current.period);

  // Sync state when opened or value changes externally
  useEffect(() => {
    const parsed = parseTime(value);
    setTempHours(parsed.hours12);
    setTempMinutes(parsed.minutes);
    setTempPeriod(parsed.period);
  }, [value, isOpen]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleApply = (h: number, m: number, p: 'AM' | 'PM') => {
    let rawHours = h % 12;
    if (p === 'PM') rawHours += 12;
    const timeStr = `${String(rawHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    nativeHaptics.selection();
    onChange(timeStr);
    setIsOpen(false);
  };

  const handleTurnOff = () => {
    nativeHaptics.selection();
    onChange('');
    setIsOpen(false);
  };

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const formattedDisplay = value ? formatTime12Hour(value) : 'Off';

  return (
    <div className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          nativeHaptics.selection();
          setIsOpen(true);
        }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        className={`w-full min-h-[44px] px-3.5 py-2 text-xs rounded-2xl bg-[#090D16] border border-white/10 text-white flex items-center justify-between gap-1.5 transition-all cursor-pointer select-none active:scale-[0.98] ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'hover:border-white/20'
        }`}
      >
        <span className={`font-bold truncate text-xs ${value ? 'text-white' : 'text-slate-400'}`}>
          {formattedDisplay}
        </span>
        <i className="ri-time-line text-xs text-indigo-400 shrink-0" />
      </button>

      {/* Centered Modal with Backdrop (Escapes parent overflow & centers in viewport) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
          >
            {/* Centered Dialog Card */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[310px] bg-[#0C101D] border border-white/10 rounded-3xl shadow-2xl p-4.5 animate-in zoom-in-95 duration-150 text-white"
            >
              {/* Header Preview & Off button */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-tight">
                    {String(tempHours).padStart(2, '0')}:{String(tempMinutes).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-indigo-400 px-2 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                    {tempPeriod}
                  </span>
                </div>

                {allowNone && (
                  <button
                    type="button"
                    onClick={handleTurnOff}
                    className="px-3 py-1 text-xs font-semibold rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-all cursor-pointer active:scale-95"
                  >
                    Turn Off
                  </button>
                )}
              </div>

              {/* AM / PM Segmented Control */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#070A12] rounded-xl border border-white/5 mb-3.5">
                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setTempPeriod('AM');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tempPeriod === 'AM'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    nativeHaptics.selection();
                    setTempPeriod('PM');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    tempPeriod === 'PM'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PM
                </button>
              </div>

              {/* Hours & Minutes Dual Selector */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {/* Hours Column */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 text-center">Hour</span>
                  <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-0.5 no-scrollbar">
                    {hoursList.map((h) => (
                      <button
                        key={`h-${h}`}
                        type="button"
                        onClick={() => {
                          nativeHaptics.selection();
                          setTempHours(h);
                        }}
                        className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          tempHours === h
                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                            : 'bg-[#070A12] text-slate-300 hover:bg-slate-800 border border-white/5'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Minutes Column */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 text-center">Minute</span>
                  <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto pr-0.5 no-scrollbar">
                    {minutesList.map((m) => (
                      <button
                        key={`m-${m}`}
                        type="button"
                        onClick={() => {
                          nativeHaptics.selection();
                          setTempMinutes(m);
                        }}
                        className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          tempMinutes === m
                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                            : 'bg-[#070A12] text-slate-300 hover:bg-slate-800 border border-white/5'
                        }`}
                      >
                        {String(m).padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl text-slate-300 hover:text-white bg-[#070A12] border border-white/10 cursor-pointer active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(tempHours, tempMinutes, tempPeriod)}
                  className="flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 cursor-pointer active:scale-98 shadow-md shadow-indigo-600/20"
                >
                  Set Time
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
