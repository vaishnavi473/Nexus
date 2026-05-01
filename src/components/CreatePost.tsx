import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Image, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CreatePost() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || !profile) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (!text.trim() && !image) return;

    setLoading(true);
    const path = 'posts';
    try {
      let imageUrl = '';
      if (image) {
        try {
          const imageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
          await uploadBytes(imageRef, image);
          imageUrl = await getDownloadURL(imageRef);
        } catch (err) {
          console.error("Storage error:", err);
          showToast("Failed to upload image", "error");
          setLoading(false);
          return;
        }
      }

      await addDoc(collection(db, path), {
        userId: user.uid,
        username: profile.username,
        userPhotoURL: profile.photoURL,
        text,
        imageUrl,
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      setText('');
      setImage(null);
      setPreview(null);
      showToast("Post shared successfully!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      showToast("Failed to share post", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 card-immersive p-6">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-nexus-border">
          <img
            src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
            alt={`${profile.username}'s profile picture`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <textarea
            placeholder={`What's on your mind, ${profile.username}?`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none border-none bg-transparent p-0 text-lg font-medium leading-relaxed text-nexus-text placeholder-nexus-dim focus:ring-0"
            rows={3}
          />

          <AnimatePresence>
            {preview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-nexus-border"
              >
                <img src={preview} alt="Selected image preview" className="h-full w-full object-cover" />
                <button
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                  }}
                  className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-all hover:bg-black/80"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex items-center justify-between border-t border-nexus-border pt-4">
            <div className="flex gap-2">
              <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/5 text-nexus-accent transition-all hover:bg-nexus-accent/10">
                <Image size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-nexus-accent opacity-50 cursor-not-allowed">
                <span className="text-lg">📊</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-nexus-accent opacity-50 cursor-not-allowed">
                <span className="text-lg">📍</span>
              </div>
            </div>

            <button
              onClick={handleCreatePost}
              disabled={loading || (!text.trim() && !image)}
              className="flex items-center space-x-2 rounded-full bg-nexus-accent px-8 py-2.5 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-nexus-accent/20"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Share Post</span>
                  <Send size={16} fill="white" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
