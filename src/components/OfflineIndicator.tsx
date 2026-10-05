import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 border border-amber-400 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
      <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
      <span>Offline Mode — Running with cached laptop assets and local data.</span>
    </div>
  );
};
