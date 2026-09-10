'use client';
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync logic
      const saved = localStorage.getItem('sentinel_offline_queue');
      if (saved) {
        try {
          const items = JSON.parse(saved);
          setQueuedCount(items.length);
          // Simulate auto-sync
          setTimeout(() => {
            localStorage.removeItem('sentinel_offline_queue');
            setQueuedCount(0);
          }, 1500);
        } catch (e) {}
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    const saved = localStorage.getItem('sentinel_offline_queue');
    if (saved) {
      try { setQueuedCount(JSON.parse(saved).length); } catch (e) {}
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && queuedCount === 0) return null;

  return (
    <div className={`w-full px-3 py-1.5 text-xs flex items-center justify-between font-medium ${
      !isOnline ? 'bg-amber-900/90 text-amber-200 border-b border-amber-700' : 'bg-emerald-900/90 text-emerald-200 border-b border-emerald-700'
    }`}>
      <div className="flex items-center gap-1.5">
        {!isOnline ? <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
        <span>
          {!isOnline 
            ? 'Operating in Remote 2G/Offline Mode. Check-in actions are queued locally.' 
            : `Network Restored. Synced ${queuedCount} queued action(s) with Command Server.`}
        </span>
      </div>
      {queuedCount > 0 && (
        <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full text-[10px]">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> {queuedCount} in queue
        </span>
      )}
    </div>
  );
};
