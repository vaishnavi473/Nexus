import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Circle,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  doc, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.read).length);
    });

    return unsubscribe;
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle size={14} className="text-nexus-accent fill-nexus-accent" />;
      case 'follow': return <UserPlus size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  const getMessage = (n: any) => {
    switch (n.type) {
      case 'like': return 'liked your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      default: return '';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-nexus-dim hover:text-nexus-accent transition-all duration-300"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-nexus-accent text-[10px] font-black text-white shadow-lg shadow-nexus-accent/40">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 z-50 card-immersive overflow-hidden shadow-2xl border-white/10"
            >
              <div className="flex items-center justify-between p-4 border-b border-nexus-border">
                <span className="text-xs font-black uppercase tracking-widest text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-nexus-accent hover:underline uppercase tracking-wide"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-nexus-border">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={n.postId ? `/post/${n.postId}` : `/profile/${n.senderId}`}
                      onClick={() => {
                        markAsRead(n.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-3 p-4 transition-all hover:bg-white/5",
                        !n.read && "bg-nexus-accent/5"
                      )}
                    >
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-nexus-border">
                          <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${n.senderId}`} 
                            alt={`${n.senderName}'s profile picture`} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-nexus-bg rounded-full p-1 border border-nexus-border">
                          {getIcon(n.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white leading-snug">
                          <span className="font-black">{n.senderName}</span> {getMessage(n)}
                        </div>
                        <div className="text-[10px] text-nexus-dim mt-1 flex items-center gap-1.5">
                          {n.createdAt?.toDate() ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                          {!n.read && <Circle className="fill-nexus-accent text-nexus-accent" size={6} />}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <div className="text-[10px] text-nexus-dim uppercase tracking-widest font-bold">
                      All quiet on the front
                    </div>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 text-center border-t border-nexus-border bg-white/[0.02]">
                  <button className="text-[10px] font-black uppercase tracking-widest text-nexus-dim hover:text-white transition-colors">
                    View All Activity
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
