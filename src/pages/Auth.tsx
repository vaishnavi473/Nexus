import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Zap } from 'lucide-react';

export default function Auth() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" />;

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[400px] card-immersive p-10 text-center shadow-2xl shadow-nexus-accent/10 border-t-nexus-accent/20"
      >
        <div className="h-16 w-16 bg-nexus-accent rounded-2xl grid place-items-center text-white mx-auto mb-8 shadow-xl shadow-nexus-accent/20">
          <Zap size={40} fill="white" />
        </div>
        <h1 className="mb-2 text-5xl font-black tracking-tighter uppercase text-white">Nexus</h1>
        <p className="mb-10 text-nexus-dim font-medium">The future of social connection.</p>
        
        <button
          onClick={loginWithGoogle}
          className="flex w-full items-center justify-center space-x-3 rounded-full bg-white py-4 font-black text-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
        >
          <LogIn size={20} />
          <span>Continue with Google</span>
        </button>

        <p className="mt-10 text-[10px] text-nexus-dim uppercase tracking-[0.2em] px-4 font-bold">
          Secure • Real-time • Immersive
        </p>
      </motion.div>
    </div>
  );
}
