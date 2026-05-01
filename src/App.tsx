/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import Search from './pages/Search';
import Bookmarks from './pages/Bookmarks';
import Auth from './pages/Auth';
import RightSidebar from './components/RightSidebar';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-nexus-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/5 border-t-nexus-accent" />
        <p className="mt-4 text-xs font-bold tracking-[0.2em] uppercase text-nexus-dim animate-pulse">nexus is waking up</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-bg selection:bg-nexus-accent/30 font-sans">
      <div className="nexus-scanline" />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 pt-8 pb-20">
        <section className="min-w-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/post/:postId" element={<PostDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </section>
        <RightSidebar />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
