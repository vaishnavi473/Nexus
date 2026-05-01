import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useToast } from '../contexts/ToastContext';
import { X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditPostModalProps {
  post: {
    id: string;
    text: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function EditPostModal({ post, isOpen, onClose }: EditPostModalProps) {
  const [text, setText] = useState(post.text);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setText(post.text);
    }
  }, [isOpen, post.text]);

  const handleUpdate = async () => {
    if (!text.trim() || text === post.text) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      // Record history
      await addDoc(collection(db, 'posts', post.id, 'edits'), {
        text: post.text,
        createdAt: serverTimestamp()
      });

      // Update post
      await updateDoc(doc(db, 'posts', post.id), {
        text: text.trim(),
        updatedAt: serverTimestamp()
      });

      showToast("Post updated successfully", "success");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
      showToast("Failed to update post", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg card-immersive overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-nexus-border bg-white/[0.02]">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Edit Your Signal</h2>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-nexus-dim hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-white/5 border border-nexus-border rounded-2xl p-4 text-[15px] text-white focus:outline-none focus:border-nexus-accent transition-all min-h-[200px] resize-none"
                placeholder="Adjust your transmission..."
                autoFocus
                disabled={loading}
              />
              
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-nexus-dim hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={loading || !text.trim() || text === post.text}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-nexus-accent text-white text-sm font-bold shadow-lg shadow-nexus-accent/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Check size={18} />
                  )}
                  Save
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-nexus-border bg-white/[0.02] text-center">
              <p className="text-[10px] text-nexus-dim uppercase tracking-widest font-black">
                A copy of the current version will be stored in history
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
