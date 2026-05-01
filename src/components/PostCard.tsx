import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Trash2,
  Edit2,
  X,
  Check,
  Bookmark,
  Clock,
  History,
  AlertTriangle
} from 'lucide-react';
import { 
  doc, 
  deleteDoc, 
  setDoc, 
  updateDoc, 
  increment,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import CommentSection from './CommentSection';
import PostEditHistory from './PostEditHistory';
import EditPostModal from './EditPostModal';
import ConfirmationModal from './ConfirmationModal';
import ReportModal from './ReportModal';
import { cn } from '../lib/utils';

interface PostProps {
  post: {
    id: string;
    userId: string;
    username: string;
    userPhotoURL: string;
    text: string;
    imageUrl?: string;
    likesCount: number;
    commentsCount: number;
    createdAt: any;
    updatedAt?: any;
  };
  autoShowComments?: boolean;
}

export default function PostCard({ post, autoShowComments }: PostProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [localPost, setLocalPost] = useState(post);
  const [showComments, setShowComments] = useState(autoShowComments || false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Real-time doc sync (text, likes, etc)
    const postPath = `posts/${post.id}`;
    const postRef = doc(db, 'posts', post.id);
    const unsubscribePost = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        setLocalPost({ id: docSnap.id, ...docSnap.data() } as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, postPath);
    });

    // Like status
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const unsubscribeLike = onSnapshot(likeRef, (docSnap) => {
      setIsLiked(docSnap.exists());
    });

    // Check bookmark status
    const fetchBookmark = async () => {
      const q = query(
        collection(db, 'bookmarks'),
        where('userId', '==', user.uid),
        where('postId', '==', post.id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setIsBookmarked(true);
        setBookmarkId(snap.docs[0].id);
      } else {
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    };
    fetchBookmark();

    return () => {
      unsubscribePost();
      unsubscribeLike();
    };
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) {
      showToast("Please sign in to like posts", "info");
      return;
    }

    const likePath = `posts/${localPost.id}/likes/${user.uid}`;
    const postPath = `posts/${localPost.id}`;
    const likeRef = doc(db, 'posts', localPost.id, 'likes', user.uid);
    const postRef = doc(db, 'posts', localPost.id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, {
          postId: localPost.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, { likesCount: increment(1) });

        // Add Notification
        if (user.uid !== localPost.userId) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: localPost.userId,
            senderId: user.uid,
            senderName: user.displayName || 'Someone',
            type: 'like',
            postId: localPost.id,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, isLiked ? likePath : postPath);
      showToast("Action failed", "error");
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      showToast("Please sign in to bookmark posts", "info");
      return;
    }
    try {
      if (isBookmarked && bookmarkId) {
        await deleteDoc(doc(db, 'bookmarks', bookmarkId));
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast("Signal removed from bookmarks", "info");
      } else {
        const docRef = await addDoc(collection(db, 'bookmarks'), {
          userId: user.uid,
          postId: localPost.id,
          createdAt: serverTimestamp()
        });
        setIsBookmarked(true);
        setBookmarkId(docRef.id);
        showToast("Signal saved to bookmarks", "success");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookmarks');
    }
  };

  const renderText = (text: string) => {
    return text.split(/(\s+)/).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Link 
            key={i} 
            to={`/search?q=${encodeURIComponent(part)}`}
            className="text-nexus-accent hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const path = `posts/${localPost.id}`;
    try {
      await deleteDoc(doc(db, 'posts', localPost.id));
      showToast("Post deleted", "success");
      setShowDeleteConfirm(false);
      setIsDeleted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      showToast("Failed to delete post", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${localPost.id}`;
    navigator.clipboard.writeText(url);
    showToast("Signal link copied to clipboard", "success");
  };

  const date = localPost.createdAt?.toDate();
  const timeAgo = date ? formatDistanceToNow(date, { addSuffix: true }) : 'just now';
  const fullDate = date ? format(date, 'MMM d, yyyy · h:mm a') : '';

  if (isDeleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-px border-b border-nexus-border bg-transparent transition-all hover:bg-white/[0.02]"
    >
      <div className="flex p-6 gap-4">
        <Link to={`/profile/${localPost.userId}`} className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-tr from-nexus-accent/20 to-purple-500/20 ring-1 ring-nexus-border hover:opacity-80 transition-opacity">
          <img
            src={localPost.userPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${localPost.userId}`}
            alt={`${localPost.username}'s profile picture`}
            className="h-full w-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${localPost.userId}`} className="font-extrabold text-[15px] hover:underline cursor-pointer">{localPost.username}</Link>
              <span className="h-1 w-1 rounded-full bg-nexus-dim" />
              <Link 
                to={`/post/${localPost.id}`} 
                title={fullDate}
                className="text-sm text-nexus-dim hover:underline"
              >
                {timeAgo}
              </Link>
              {localPost.updatedAt && (
                <span className="text-[10px] text-nexus-accent font-black uppercase tracking-widest">(Edited)</span>
              )}
            </div>
            
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-nexus-dim hover:text-white transition-colors p-1"
              >
                <MoreHorizontal size={18} />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMoreMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-8 w-40 z-[70] bg-nexus-surface border border-nexus-border rounded-xl shadow-2xl overflow-hidden py-1"
                    >
                      <button
                        onClick={() => {
                          setShowHistory(true);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-nexus-dim hover:text-white hover:bg-white/5 transition-all text-left"
                      >
                        <History size={14} />
                        View History
                      </button>

                      {user?.uid !== localPost.userId && (
                        <button
                          onClick={() => {
                            setShowReportModal(true);
                            setShowMoreMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all text-left"
                        >
                          <AlertTriangle size={14} />
                          Report Signal
                        </button>
                      )}

                      {user?.uid === localPost.userId && (
                        <>
                          <button
                            onClick={() => {
                              setShowEditModal(true);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-nexus-dim hover:text-white hover:bg-white/5 transition-all text-left"
                          >
                            <Edit2 size={14} />
                            Edit Post
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setShowMoreMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all text-left"
                          >
                            <Trash2 size={14} />
                            Delete Post
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Link to={`/post/${localPost.id}`} className="block group/post">
            <p className="text-[15px] leading-relaxed text-neutral-200 mb-4 whitespace-pre-wrap group-hover/post:text-white transition-colors">
              {renderText(localPost.text)}
            </p>

            {localPost.imageUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-nexus-border group-hover/post:border-nexus-accent/30 transition-all">
                <img src={localPost.imageUrl} alt={`Content image for signal by ${localPost.username}`} className="w-full object-cover max-h-[400px]" />
              </div>
            )}
          </Link>

          <div className="flex items-center justify-between text-nexus-dim">
            <div className="flex items-center gap-8">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-all group",
                  isLiked ? "text-red-500" : "hover:text-red-500"
                )}
              >
                <div className={cn("p-2 rounded-full transition-colors group-hover:bg-red-500/10")}>
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </div>
                <span>{localPost.likesCount}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-sm font-bold transition-all group hover:text-nexus-accent"
              >
                <div className="p-2 rounded-full transition-colors group-hover:bg-nexus-accent/10">
                  <MessageCircle size={18} />
                </div>
                <span>{localPost.commentsCount}</span>
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-sm font-bold transition-all group hover:text-green-500"
              >
                <div className="p-2 rounded-full transition-colors group-hover:bg-green-500/10">
                  <Share2 size={18} />
                </div>
              </button>
            </div>

            <button 
              onClick={handleBookmark}
              className={cn(
                "p-2 rounded-full transition-all group hover:text-nexus-accent hover:bg-nexus-accent/10",
                isBookmarked ? "text-nexus-accent" : ""
              )}
            >
              <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/[0.01]"
          >
            <CommentSection postId={localPost.id} postOwnerId={localPost.userId} />
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showHistory && (
          <PostEditHistory 
            postId={localPost.id} 
            onClose={() => setShowHistory(false)} 
          />
        )}
      </AnimatePresence>

      <EditPostModal
        post={localPost}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Signal"
        message="Are you sure you want to permanently delete this signal? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <ReportModal
        postId={localPost.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </motion.div>
  );
}
