import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, UserPlus, Search as SearchIcon } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

export default function RightSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usersToFollow, setUsersToFollow] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(10));
        const snap = await getDocs(q);
        const docs = snap.docs
          .map(doc => doc.data())
          .filter(u => u.uid !== user?.uid);
        setUsersToFollow(docs.slice(0, 3));
      } catch (error) {
        console.error("Error fetching users to follow", error);
      }
    };
    fetchUsers();
  }, [user]);

  const trends = [
    { category: 'Trending in Tech', name: '#ReactServerComponents', posts: '12.5k' },
    { category: 'Design', name: '#ImmersiveUI', posts: '8.2k' },
    { category: 'News · Trending', name: 'Nexus Alpha', posts: '45.1k' },
  ];

  return (
    <aside className="hidden lg:flex flex-col gap-6 sticky top-24 self-start">
      <div className="card-immersive p-5">
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search signals..."
            className="w-full bg-white/5 border border-nexus-border rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:border-nexus-accent transition-all"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-nexus-dim group-focus-within:text-nexus-accent transition-colors" size={16} />
        </form>
      </div>

      <div className="card-immersive p-5">
        <h2 className="text-lg font-extrabold tracking-tight mb-4 flex items-center gap-2 text-nexus-text">
          <TrendingUp size={20} className="text-nexus-accent" />
          Trends for you
        </h2>
        <div className="space-y-4">
          {trends.map((trend, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="text-[11px] text-nexus-dim uppercase tracking-wider">{trend.category}</div>
              <div className="font-bold text-sm group-hover:text-nexus-accent transition-colors text-nexus-text">{trend.name}</div>
              <div className="text-[11px] text-nexus-dim">{trend.posts} posts</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-immersive p-5">
        <h2 className="text-lg font-extrabold tracking-tight mb-4 flex items-center gap-2 text-nexus-text">
          <UserPlus size={20} className="text-nexus-accent" />
          Who to follow
        </h2>
        <div className="space-y-1">
          {usersToFollow.map((u) => (
            <Link 
              key={u.uid} 
              to={`/profile/${u.uid}`} 
              className="flex items-center justify-between gap-3 p-2 -mx-2 rounded-xl group hover:bg-white/[0.03] active:bg-white/[0.05] transition-all"
            >
              <div className="relative">
                <img 
                  src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                  alt={`${u.username}'s profile picture`}
                  className="h-10 w-10 rounded-full border border-nexus-border group-hover:border-nexus-accent ring-2 ring-transparent group-hover:ring-nexus-accent/20 transition-all object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate text-nexus-text group-hover:text-nexus-accent transition-colors">{u.username}</div>
                <div className="text-[11px] text-nexus-dim truncate">@{u.username.toLowerCase()}</div>
              </div>
              <div className="text-[10px] font-black text-nexus-accent uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                View
              </div>
            </Link>
          ))}
          {usersToFollow.length === 0 && (
            <div className="text-[10px] text-nexus-dim uppercase tracking-widest text-center py-4">
              Finding people...
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
