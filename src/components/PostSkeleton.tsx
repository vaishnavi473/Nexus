import React from 'react';

export default function PostSkeleton() {
  return (
    <div className="p-6 border-b border-nexus-border/50 animate-pulse">
      <div className="flex gap-4">
        {/* Avatar skeleton */}
        <div className="h-12 w-12 rounded-full bg-white/5 flex-shrink-0" />
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            {/* Username skeleton */}
            <div className="h-4 w-24 bg-white/5 rounded-md" />
            <div className="h-1 w-1 rounded-full bg-nexus-dim/30" />
            {/* Time skeleton */}
            <div className="h-3 w-16 bg-white/5 rounded-md" />
          </div>
          
          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-white/5 rounded-md" />
            <div className="h-4 w-5/6 bg-white/5 rounded-md" />
            <div className="h-4 w-4/6 bg-white/5 rounded-md" />
          </div>
          
          {/* Media placeholder */}
          <div className="h-48 w-full bg-white/5 rounded-2xl" />
          
          {/* Actions placeholder */}
          <div className="flex gap-8 pt-2">
            <div className="h-4 w-12 bg-white/5 rounded-md" />
            <div className="h-4 w-12 bg-white/5 rounded-md" />
            <div className="h-4 w-8 bg-white/5 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
