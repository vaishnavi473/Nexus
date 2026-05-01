import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'info' | 'success';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger'
}: ConfirmationModalProps) {
  const variantStyles = {
    danger: {
      bg: 'bg-red-500/10',
      icon: 'text-red-500',
      button: 'bg-red-500 shadow-red-500/20',
      border: 'border-red-500/30'
    },
    info: {
      bg: 'bg-nexus-accent/10',
      icon: 'text-nexus-accent',
      button: 'bg-nexus-accent shadow-nexus-accent/20',
      border: 'border-nexus-accent/30'
    },
    success: {
      bg: 'bg-green-500/10',
      icon: 'text-green-500',
      button: 'bg-green-500 shadow-green-500/20',
      border: 'border-green-500/30'
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm card-immersive overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${currentVariant.bg} ${currentVariant.icon} flex-shrink-0`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-black uppercase tracking-tight text-white mb-2">{title}</h2>
                  <p className="text-sm text-nexus-dim leading-relaxed font-medium">{message}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1 text-nexus-dim hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-nexus-dim hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 ${currentVariant.button}`}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : confirmText}
                </button>
              </div>
            </div>
            
            <div className={`h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${currentVariant.icon}`} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
