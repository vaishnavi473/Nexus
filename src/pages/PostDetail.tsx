import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const postRef = doc(db, 'posts', postId);
    
    // Use onSnapshot for real-time updates (likes/comments count)
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() });
      } else {
        setPost(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching post", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [postId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-nexus-accent mb-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-nexus-dim">Syncing Signal...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-white mb-4">Post Not Found</h1>
        <p className="text-nexus-dim mb-8">The signal you are looking for has been terminated or never existed.</p>
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full bg-nexus-accent px-6 py-2 text-sm font-bold text-white transition-all hover:scale-105"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl pb-20"
    >
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-nexus-dim hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-black tracking-tighter uppercase text-white">Post Detail</h1>
      </div>

      <div className="card-immersive overflow-hidden">
        <PostCard post={post} autoShowComments={true} />
      </div>
    </motion.div>
  );
}
