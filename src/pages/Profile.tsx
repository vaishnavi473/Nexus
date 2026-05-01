import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import ProfileHeader from '../components/ProfileHeader';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'following'>('posts');
  const [followedUsers, setFollowedUsers] = useState<any[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  useEffect(() => {
    if (activeTab !== 'following' || !userId) return;
    
    const fetchFollowed = async () => {
      setLoadingFollowing(true);
      try {
        const q = query(collection(db, 'follows'), where('followerId', '==', userId));
        const snap = await getDocs(q);
        const followedIds = snap.docs.map(doc => doc.data().followedId);
        
        if (followedIds.length > 0) {
          const userResults: any[] = [];
          // Small implementation taking first 30 for speed
          const limitedIds = followedIds.slice(0, 30);
          const userQ = query(collection(db, 'users'), where('uid', 'in', limitedIds));
          const userSnap = await getDocs(userQ);
          userResults.push(...userSnap.docs.map(doc => doc.data()));
          setFollowedUsers(userResults);
        } else {
          setFollowedUsers([]);
        }
      } catch (error) {
        console.error("Error fetching followed users", error);
      } finally {
        setLoadingFollowing(false);
      }
    };
    fetchFollowed();
  }, [userId, activeTab]);

  useEffect(() => {
    if (!userId) return;

    // Fetch profile
    const fetchProfile = async () => {
      const path = `users/${userId}`;
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.error("No such user!");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
        showToast("Failed to load profile", "error");
      }
    };

    fetchProfile();

    // Fetch user's posts
    const postsPath = 'posts';
    const q = query(
      collection(db, postsPath),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, postsPath);
      showToast("Failed to load user posts", "error");
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, showToast]);

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 md:px-0">
      <div className="h-64 animate-pulse rounded-3xl bg-nexus-surface border border-nexus-border mb-8 shadow-xl" />
      <div className="card-immersive divide-y divide-nexus-border/50">
        {[1, 2, 3].map(i => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-20 text-nexus-dim">
      <p className="text-xl font-bold">User not found</p>
      <button onClick={() => navigate('/')} className="mt-4 text-nexus-accent underline">Go Home</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <ProfileHeader profile={profile} isOwnProfile={user?.uid === userId} />
      
      <div className="flex border-b border-nexus-border mb-8 px-4 gap-8">
        <button
          onClick={() => setActiveTab('posts')}
          className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'posts' ? 'text-nexus-accent' : 'text-nexus-dim hover:text-white'
          }`}
        >
          Timeline
          {activeTab === 'posts' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-nexus-accent rounded-t-full shadow-[0_-4px_10px_rgba(59,130,246,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
            activeTab === 'following' ? 'text-nexus-accent' : 'text-nexus-dim hover:text-white'
          }`}
        >
          Following
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-nexus-accent rounded-t-full shadow-[0_-4px_10px_rgba(59,130,246,0.5)]" />
          )}
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'posts' ? (
          <div className="card-immersive overflow-hidden">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {posts.length === 0 && (
              <div className="py-20 text-center text-nexus-dim text-sm font-bold uppercase tracking-widest">
                No signal from this user yet.
              </div>
            )}
          </div>
        ) : (
          <div className="card-immersive p-4 divide-y divide-nexus-border">
            {loadingFollowing ? (
              <div className="py-10 text-center text-nexus-dim animate-pulse uppercase text-[10px] font-bold tracking-widest">
                Searching connections...
              </div>
            ) : followedUsers.length > 0 ? (
              followedUsers.map((followedUser) => (
                <Link 
                  key={followedUser.uid} 
                  to={`/profile/${followedUser.uid}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all rounded-xl group"
                >
                  <img
                    src={followedUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${followedUser.uid}`}
                    alt={`${followedUser.username}'s profile picture`}
                    className="h-12 w-12 rounded-full border border-nexus-border group-hover:border-nexus-accent transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white group-hover:text-nexus-accent transition-colors">
                      {followedUser.username}
                    </div>
                    <div className="text-[10px] text-nexus-dim uppercase tracking-widest">
                      @{followedUser.username.toLowerCase()}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-20 text-center text-nexus-dim text-sm font-bold uppercase tracking-widest">
                This user isn't following anyone yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
