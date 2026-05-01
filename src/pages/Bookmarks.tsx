import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { Bookmark as BookmarkIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Bookmarks() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const bookmarksQ = query(
          collection(db, 'bookmarks'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(bookmarksQ);
        const postIds = snapshot.docs.map(doc => doc.data().postId);

        if (postIds.length > 0) {
          // Firestore 'in' query limit is 30
          const limitedIds = postIds.slice(0, 30);
          const postsQ = query(collection(db, 'posts'), where('__name__', 'in', limitedIds));
          const postsSnap = await getDocs(postsQ);
          const postsData = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Re-sort because 'in' query doesn't guarantee order
          const sortedPosts = postIds
            .map(id => postsData.find(p => p.id === id))
            .filter(Boolean);
          
          setPosts(sortedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching bookmarks", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-0">
        <div className="mb-8 flex items-center gap-4 animate-pulse">
          <div className="p-3 bg-nexus-accent/10 rounded-2xl h-12 w-12" />
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
        </div>
        <div className="card-immersive divide-y divide-nexus-border/50">
          {[1, 2, 3].map(i => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-0">
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 bg-nexus-accent/10 rounded-2xl text-nexus-accent">
          <BookmarkIcon size={24} />
        </div>
        <h1 className="text-2xl font-black tracking-tight uppercase text-white">Bookmarks</h1>
      </div>

      <div className="card-immersive overflow-hidden">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {posts.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-nexus-dim uppercase tracking-widest font-black text-sm mb-2">Your library is empty</div>
            <p className="text-nexus-dim text-xs">Save posts to see them here for quick access later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
