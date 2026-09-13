import { useEffect, useState, useCallback, useRef } from "react";
import { 
  syncGoogleFormsData, 
  getStoredSyncStats, 
  saveStoredSyncStats, 
  SyncAuditStats 
} from "@/services/googleFormsSyncService";
import { toast } from "sonner";

export interface UseGoogleFormsAutoSyncOptions {
  enabled?: boolean;
  intervalMs?: number; // default 60000 (1 min)
  notifyOnSuccess?: boolean;
  autoSyncOnMount?: boolean;
}

export function useGoogleFormsAutoSync(options: UseGoogleFormsAutoSyncOptions = {}) {
  const {
    enabled = true,
    intervalMs = 60000,
    notifyOnSuccess = false,
    autoSyncOnMount = true,
  } = options;

  const [stats, setStats] = useState<SyncAuditStats>(getStoredSyncStats);
  const [isSyncing, setIsSyncing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync listener for window events dispatched from anywhere in the app
  useEffect(() => {
    const handleStatsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<SyncAuditStats>;
      if (customEvent.detail) {
        setStats(customEvent.detail);
      }
    };

    window.addEventListener("bmes-gforms-sync-updated", handleStatsUpdated);
    return () => {
      window.removeEventListener("bmes-gforms-sync-updated", handleStatsUpdated);
    };
  }, []);

  const runSync = useCallback(async (manual = false) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await syncGoogleFormsData({ silent: !manual });
      const currentStats = getStoredSyncStats();
      setStats(currentStats);

      if (manual) {
        if (result.success) {
          const totalNew = result.feedbackSynced + result.registrationsSynced;
          if (totalNew > 0) {
            toast.success("Google Forms Synced", {
              description: `Added ${result.feedbackSynced} feedback & ${result.registrationsSynced} event registrations to admin tables.`,
            });
          } else {
            toast.info("Google Forms Up to Date", {
              description: "All Google Form submissions are currently synced to the database.",
            });
          }
        } else if (result.error === "NO_AUTH_TOKEN") {
          toast.warning("Google Workspace Sign-in Required", {
            description: "Please connect your Google Account in the Workspace Hub to poll live Google Forms.",
          });
        } else {
          toast.error("Google Forms Sync Warning", {
            description: result.message,
          });
        }
      } else if (notifyOnSuccess && result.success && (result.feedbackSynced > 0 || result.registrationsSynced > 0)) {
        toast.success("New Google Form Submissions Synced", {
          description: `Automatically imported ${result.feedbackSynced + result.registrationsSynced} new submission(s).`,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, notifyOnSuccess]);

  // Set up background auto-sync interval
  useEffect(() => {
    if (!enabled || !stats.autoSyncEnabled) return;

    if (autoSyncOnMount) {
      // Delay first background check by 2 seconds so the page loads smoothly
      const initialTimeout = setTimeout(() => {
        runSync(false);
      }, 2000);

      timerRef.current = setInterval(() => {
        runSync(false);
      }, intervalMs);

      return () => {
        clearTimeout(initialTimeout);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      timerRef.current = setInterval(() => {
        runSync(false);
      }, intervalMs);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [enabled, stats.autoSyncEnabled, intervalMs, autoSyncOnMount, runSync]);

  const toggleAutoSync = useCallback((enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !stats.autoSyncEnabled;
    const updated = saveStoredSyncStats({ autoSyncEnabled: nextState });
    setStats(updated);
    toast.info(nextState ? "Google Forms Auto-Sync Enabled" : "Google Forms Auto-Sync Paused", {
      description: nextState 
        ? "Submissions will be automatically imported into admin tables in background."
        : "Auto-sync paused. You can still sync manually at any time.",
    });
  }, [stats.autoSyncEnabled]);

  return {
    stats,
    isSyncing,
    syncNow: () => runSync(true),
    toggleAutoSync,
    autoSyncEnabled: stats.autoSyncEnabled,
    lastSyncedAt: stats.lastSyncedAt,
  };
}
