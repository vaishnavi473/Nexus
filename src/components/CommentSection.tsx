import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  userId: string;
  username: string;
  userPhotoURL: string;
  text: string;
  createdAt: any;
}

export default function CommentSection({ postId, postOwnerId }: { postId: string, postOwnerId: string }) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const path = `posts/${postId}/comments`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !newComment.trim()) return;

    setLoading(true);
    const commentPath = `posts/${postId}/comments`;
    const postPath = `posts/${postId}`;
    try {
      await addDoc(collection(db, commentPath), {
        postId,
        userId: user.uid,
        username: profile.username,
        userPhotoURL: profile.photoURL,
        text: newComment,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      // Add Notification
      if (user.uid !== postOwnerId) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: postOwnerId,
          senderId: user.uid,
          senderName: profile.username,
          type: 'comment',
          postId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      setNewComment('');
      showToast("Comment added", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, commentPath);
      showToast("Failed to add comment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-nexus-surface p-6 border-t border-nexus-border">
      {user && (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
          <img
            src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
            alt={profile?.username ? `${profile.username}'s profile picture` : 'User profile picture'}
            className="h-10 w-10 rounded-full border border-nexus-border"
          />
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full rounded-2xl bg-nexus-bg border border-nexus-border px-5 py-2.5 pr-12 text-[15px] text-white focus:border-nexus-accent ring-0 outline-none transition-all placeholder:text-nexus-dim"
            />
            <button
              disabled={loading || !newComment.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nexus-accent transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
            >
              <Send size={20} fill="currentColor" />
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4 group">
            <img
              src={comment.userPhotoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`}
              alt={`${comment.username}'s profile picture`}
              className="h-10 w-10 rounded-full border border-nexus-border"
            />
            <div className="flex-1 min-w-0">
              <div className="rounded-2xl rounded-tl-none bg-nexus-bg/50 border border-nexus-border px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-extrabold text-white">{comment.username}</span>
                  <span className="text-[10px] text-nexus-dim uppercase tracking-wider">
                    {comment.createdAt?.toDate() 
                      ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) 
                      : 'just now'}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed text-neutral-300">{comment.text}</p>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-center py-4 text-xs font-bold uppercase tracking-[0.2em] text-nexus-dim">
            Quiet for now
          </div>
        )}
      </div>
    </div>
  );
}
