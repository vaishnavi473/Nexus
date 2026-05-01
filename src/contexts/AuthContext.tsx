import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useToast } from './ToastContext';

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  photoURL: string | null;
  bio: string | null;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Set loading to false early so user can see the app (in signed-in state) while profile fetches
        setLoading(false);
        try {
          // Fetch or create profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // New user
            const newProfile = {
              uid: user.uid,
              username: user.displayName || `user_${user.uid.slice(0, 5)}`,
              email: user.email || '',
              photoURL: user.photoURL,
              bio: "Hey there! I'm using Nexus.",
              createdAt: serverTimestamp(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile as UserProfile);
            showToast("Welcome to Nexus!", "success");
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          // We don't block the app if profile fails, user can still see feed
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [showToast]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast("Signed in successfully", "success");
    } catch (error: any) {
      console.error("Login failed", error);
      const errorMessage = error.message || "Unknown error";
      showToast(`Sign in failed: ${errorMessage}`, "error");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      showToast("Signed out", "info");
    } catch (error) {
      console.error("Logout failed", error);
      showToast("Sign out failed", "error");
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
