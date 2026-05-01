import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchPosts = async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setPosts([]);
      setLastDoc(null);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const path = 'posts';
      let q;
      const batchSize = 10;

      if (activeTab === 'for-you') {
        if (isInitial) {
          q = query(
            collection(db, path),
            orderBy('createdAt', 'desc'),
            limit(batchSize)
          );
        } else {
          q = query(
            collection(db, path),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(batchSize)
          );
        }
      } else {
        if (followedIds.length > 0) {
          const limitedIds = followedIds.slice(0, 30);
          if (isInitial) {
            q = query(
              collection(db, path),
              where('userId', 'in', limitedIds),
              orderBy('createdAt', 'desc'),
              limit(batchSize)
            );
          } else {
            q = query(
              collection(db, path),
              where('userId', 'in', limitedIds),
              orderBy('createdAt', 'desc'),
              startAfter(lastDoc),
              limit(batchSize)
            );
          }
        } else {
          setPosts([]);
          setLoading(false);
          setHasMore(false);
          return;
        }
      }

      const snapshot = await getDocs(q as any);
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      }));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === batchSize);
      
      if (isInitial) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      showToast("Failed to load feed", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMorePosts = () => {
    if (!lastDoc || loadingMore) return;
    fetchPosts(false);
  };

  useEffect(() => {
    if (!user || activeTab !== 'following') {
      setFollowedIds([]);
      return;
    }
    
    const fetchFollowed = async () => {
      try {
        const q = query(collection(db, 'follows'), where('followerId', '==', user.uid));
        const snapshot = await getDocs(q);
        setFollowedIds(snapshot.docs.map(doc => doc.data().followedId));
      } catch (error) {
        console.error("Error fetching followed IDs", error);
      }
    };
    fetchFollowed();
  }, [user, activeTab]);

  useEffect(() => {
    fetchPosts(true);
  }, [activeTab, followedIds]);

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-0">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black tracking-tight uppercase text-white">Feed</h1>
        <div className="flex bg-nexus-surface p-1 rounded-xl border border-nexus-border">
          <button
            onClick={() => setActiveTab('for-you')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'for-you' ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'text-nexus-dim hover:text-white'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'following' ? 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20' : 'text-nexus-dim hover:text-white'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {user && <CreatePost />}
      
      {loading ? (
        <div className="card-immersive divide-y divide-nexus-border/50">
          {[1, 2, 3].map(i => (
            <PostSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="card-immersive overflow-hidden">
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              ref={index === posts.length - 1 ? lastPostElementRef : null}
            >
              <PostCard post={post} />
            </div>
          ))}

          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 text-nexus-dim">
              <p className="text-lg font-bold tracking-tight">Your feed is empty.</p>
              <p className="text-sm">Start by sharing your thoughts or following others.</p>
            </div>
          )}

          {loadingMore && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-nexus-accent" />
            </div>
          )}
          
          {!hasMore && posts.length > 0 && (
            <div className="py-12 text-center">
              <div className="text-[10px] text-nexus-dim uppercase tracking-[0.2em] font-black">
                You've reached the signal horizon
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
