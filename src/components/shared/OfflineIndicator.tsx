import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 text-white px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
      <div className="flex flex-col">
        <span className="font-semibold">Offline Mode Active</span>
        <span className="text-[10px] text-amber-100 flex items-center gap-1">
          <RefreshCw className="h-2.5 w-2.5 animate-spin" /> Submissions will auto-sync when online.
        </span>
      </div>
    </div>
  );
};
