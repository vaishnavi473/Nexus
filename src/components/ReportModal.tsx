import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { X, Send, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ postId, isOpen, onClose }: ReportModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please sign in to report posts", "info");
      return;
    }

    if (!reason.trim()) {
      showToast("Please provide a reason for the report", "info");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        postId,
        reporterId: user.uid,
        reason: reason.trim(),
        createdAt: serverTimestamp()
      });

      showToast("Report submitted. Thank you for keeping Nexus safe.", "success");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
      showToast("Failed to submit report", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md card-immersive overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-nexus-border bg-white/[0.02]">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={18} />
                <h2 className="text-sm font-black uppercase tracking-widest">Report Signal</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-nexus-dim hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-nexus-dim block">
                  Reason for reporting
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white/5 border border-nexus-border rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all min-h-[120px] resize-none"
                  placeholder="Tell us why this signal violates community standards..."
                  autoFocus
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-nexus-dim hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Submit Report
                </button>
              </div>
            </form>

            <div className="p-4 border-t border-nexus-border bg-white/[0.02] text-center">
              <p className="text-[10px] text-nexus-dim uppercase tracking-widest font-black leading-relaxed">
                Misuse of the reporting system may lead to account suspension.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
