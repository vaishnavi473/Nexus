import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { X, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Edit {
  id: string;
  text: string;
  createdAt: any;
}

interface PostEditHistoryProps {
  postId: string;
  onClose: () => void;
}

export default function PostEditHistory({ postId, onClose }: PostEditHistoryProps) {
  const [edits, setEdits] = useState<Edit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'edits'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Edit[];
      setEdits(docs);
      setLoading(false);
    });

    return unsubscribe;
  }, [postId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg card-immersive overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-nexus-border bg-white/[0.02]">
          <div className="flex items-center gap-2 text-nexus-text">
            <History size={18} className="text-nexus-accent" />
            <h2 className="text-sm font-black uppercase tracking-widest">Edit History</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-nexus-dim hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : edits.length > 0 ? (
            edits.map((edit, index) => (
              <div key={edit.id} className="relative pl-6 border-l-2 border-nexus-border">
                <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-nexus-bg border-2 border-nexus-border flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-nexus-dim" />
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-nexus-dim">
                    Version {edits.length - index}
                  </span>
                  <span className="text-[10px] text-nexus-dim flex items-center gap-1">
                    <Clock size={10} />
                    {edit.createdAt?.toDate() 
                      ? formatDistanceToNow(edit.createdAt.toDate(), { addSuffix: true }) 
                      : 'Recently'
                    }
                  </span>
                </div>
                <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {edit.text}
                </p>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-nexus-dim text-xs uppercase tracking-widest font-bold">No previous versions detected</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-nexus-border bg-white/[0.02] text-center">
          <p className="text-[10px] text-nexus-dim uppercase tracking-widest font-black">
            Timeline of signal modifications
          </p>
        </div>
      </motion.div>
    </div>
  );
}
