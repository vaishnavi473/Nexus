import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Loader2, UserPlus, UserCheck } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface ProfileHeaderProps {
  profile: {
    uid: string;
    username: string;
    photoURL: string | null;
    bio: string | null;
  };
  isOwnProfile: boolean;
}

export default function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio || '');
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!user || isOwnProfile) return;
    
    const checkFollow = async () => {
      try {
        const q = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid),
          where('followedId', '==', profile.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setIsFollowing(true);
          setFollowDocId(snapshot.docs[0].id);
        } else {
          setIsFollowing(false);
          setFollowDocId(null);
        }
      } catch (error) {
        console.error("Error checking follow status", error);
      }
    };
    
    checkFollow();
  }, [user, profile.uid, isOwnProfile]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const followersQ = query(collection(db, 'follows'), where('followedId', '==', profile.uid));
        const followingQ = query(collection(db, 'follows'), where('followerId', '==', profile.uid));
        const [followersSnap, followingSnap] = await Promise.all([
          getDocs(followersQ),
          getDocs(followingQ)
        ]);
        setCounts({
          followers: followersSnap.size,
          following: followingSnap.size
        });
      } catch (error) {
        console.error("Error fetching follow counts", error);
      }
    };
    fetchCounts();
  }, [profile.uid, isFollowing]);

  const handleFollow = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      if (isFollowing && followDocId) {
        await deleteDoc(doc(db, 'follows', followDocId));
        setIsFollowing(false);
        setFollowDocId(null);
        showToast("Unfollowed", "info");
      } else {
        const docRef = await addDoc(collection(db, 'follows'), {
          followerId: user.uid,
          followedId: profile.uid,
          createdAt: serverTimestamp()
        });

        // Add Notification
        await addDoc(collection(db, 'notifications'), {
          recipientId: profile.uid,
          senderId: user.uid,
          senderName: profile.username === user.displayName ? user.displayName : (user.displayName || 'Someone'), // Fallback
          type: 'follow',
          read: false,
          createdAt: serverTimestamp()
        });

        setIsFollowing(true);
        setFollowDocId(docRef.id);
        showToast("Following", "success");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'follows');
      showToast("Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username,
        bio
      });
      setIsEditing(false);
      showToast("Profile updated", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user) {
      const file = e.target.files[0];
      setLoading(true);
      const path = `users/${user.uid}`;
      try {
        const imageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(imageRef, file);
        const photoURL = await getDownloadURL(imageRef);
        await updateDoc(doc(db, 'users', user.uid), { photoURL });
        showToast("Profile picture updated", "success");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        showToast("Failed to update profile picture", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mb-10 card-immersive p-8 md:p-10 transition-all duration-500 hover:border-nexus-accent/20">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
        <div className="relative group">
          <div className="relative h-32 w-32 rounded-full overflow-hidden ring-4 ring-nexus-bg ring-offset-2 ring-nexus-accent/20 bg-gradient-to-tr from-nexus-accent to-purple-500">
            <img
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`}
              alt={`${profile.username}'s profile picture`}
              className="h-full w-full object-cover"
            />
          </div>
          {isOwnProfile && (
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-all duration-300 group-hover:bg-black/60 group-hover:opacity-100 backdrop-blur-sm">
              <Camera size={24} />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </label>
          )}
        </div>

        <div className="flex-1 text-center md:text-left min-w-0">
          {isEditing ? (
            <div className="space-y-4 w-full">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl bg-nexus-bg border border-nexus-border px-4 py-3 text-2xl font-black text-white focus:border-nexus-accent ring-0 outline-none"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl bg-nexus-bg border border-nexus-border px-4 py-3 text-nexus-text focus:border-nexus-accent ring-0 outline-none"
                rows={3}
              />
              <div className="flex justify-center gap-3 md:justify-start">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="rounded-full bg-nexus-accent px-8 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-nexus-accent/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-full bg-white/5 border border-nexus-border px-8 py-2.5 text-sm font-bold text-nexus-dim hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              <div className="flex items-center justify-center gap-4 md:justify-start">
                <h1 className="text-4xl font-black tracking-tighter text-white truncate">
                  {profile.username}
                </h1>
                {isOwnProfile ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border border-nexus-border bg-white/[0.03] p-2.5 text-nexus-dim transition-all hover:text-nexus-accent hover:border-nexus-accent/30"
                  >
                    <Edit2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={loading}
                    className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all ${
                      isFollowing 
                        ? 'bg-white/5 text-white border border-nexus-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' 
                        : 'bg-nexus-accent text-white shadow-lg shadow-nexus-accent/20 hover:scale-105'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={18} />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <div className="mt-4 flex gap-6 text-sm font-bold">
                <div className="flex gap-1.5 items-center">
                  <span className="text-white">{counts.following}</span>
                  <span className="text-nexus-dim uppercase tracking-widest text-[10px]">Following</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="text-white">{counts.followers}</span>
                  <span className="text-nexus-dim uppercase tracking-widest text-[10px]">Followers</span>
                </div>
              </div>

              <div className="mt-4 text-nexus-accent font-bold text-sm tracking-widest uppercase">@member</div>
              <p className="mt-6 text-lg text-neutral-300 leading-relaxed max-w-xl">
                {profile.bio || "Adding light to the world, one post at a time."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
