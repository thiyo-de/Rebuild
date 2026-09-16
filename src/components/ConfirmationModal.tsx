import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '../services/native';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  // Modal-aware hardware back button registration
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => {
      onCancel();
      return true;
    };
    const win = window as any;
    win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__ || [];
    win.__REBUILD_BACK_STACK__.push(handler);
    return () => {
      if (win.__REBUILD_BACK_STACK__) {
        win.__REBUILD_BACK_STACK__ = win.__REBUILD_BACK_STACK__.filter((h: any) => h !== handler);
      }
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#0C101D] border border-white/10 shadow-2xl rounded-3xl p-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDestructive
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
          }`}>
            <i className={`text-2xl ${isDestructive ? 'ri-error-warning-line' : 'ri-question-line'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 break-words">{title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">{message}</p>
          </div>

          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
          <Button
            variant="secondary"
            onClick={onCancel}
            className="w-full"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            className="w-full"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
