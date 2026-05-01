import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search as SearchIcon, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!queryParam) {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Simple case-insensitive search logic for usernames (prefixes)
        // Firestore doesn't support true partial matching without external tools, 
        // so we search for prefixes using >= and < trick.
        const q = query(
          collection(db, 'users'),
          where('username', '>=', queryParam),
          where('username', '<=', queryParam + '\uf8ff'),
          limit(20)
        );
        const snapshot = await getDocs(q);
        setResults(snapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [queryParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight uppercase text-white mb-6">Explore Nexus</h1>
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search signals..."
            className="w-full bg-nexus-surface border border-nexus-border rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-nexus-accent transition-all shadow-xl"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-nexus-dim" size={20} />
        </form>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-nexus-accent mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest text-nexus-dim">Scanning Grid...</span>
          </div>
        ) : results.length > 0 ? (
          results.map((u, i) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/profile/${u.uid}`}
                className="flex items-center gap-4 p-4 card-immersive hover:bg-white/5 transition-all group"
              >
                <div className="h-14 w-14 rounded-full overflow-hidden border border-nexus-border group-hover:border-nexus-accent transition-colors">
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                    alt={`${u.username}'s profile picture`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-black text-white group-hover:text-nexus-accent transition-colors">
                    {u.username}
                  </div>
                  <div className="text-nexus-dim text-xs uppercase tracking-widest">@{u.username.toLowerCase()}</div>
                  {u.bio && <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{u.bio}</p>}
                </div>
                <UserIcon className="text-nexus-dim group-hover:text-white transition-colors" size={20} />
              </Link>
            </motion.div>
          ))
        ) : queryParam ? (
          <div className="py-20 text-center">
            <div className="text-nexus-dim uppercase tracking-widest font-black text-sm">No signals detected for "{queryParam}"</div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="text-nexus-dim uppercase tracking-widest font-black text-sm">Enter a name to search the network</div>
          </div>
        )}
      </div>
    </div>
  );
}
