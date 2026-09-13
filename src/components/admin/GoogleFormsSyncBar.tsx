import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  FileCheck2, 
  AlertCircle, 
  Clock, 
  Play, 
  Pause,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { useGoogleFormsAutoSync } from "@/hooks/useGoogleFormsAutoSync";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface Props {
  contextTitle?: string;
  formType?: "feedback" | "registration" | "all";
  compact?: boolean;
}

export default function GoogleFormsSyncBar({ contextTitle, formType, compact = false }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _type = formType;
  const { stats, isSyncing, syncNow, toggleAutoSync, autoSyncEnabled, lastSyncedAt } = useGoogleFormsAutoSync({
    notifyOnSuccess: true,
  });

  const getRelativeTime = (isoString?: string | null) => {
    if (!isoString) return "Never synced";
    try {
      return formatDistanceToNow(new Date(isoString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Badge 
          variant="outline" 
          className={`h-7 px-2.5 gap-1.5 border font-medium ${
            stats.status === "error" 
              ? "border-destructive/30 bg-destructive/5 text-destructive" 
              : stats.status === "warning"
              ? "border-amber-500/30 bg-amber-500/5 text-amber-600"
              : "border-purple-500/30 bg-purple-500/5 text-purple-700 dark:text-purple-300"
          }`}
        >
          <FileCheck2 className="h-3.5 w-3.5 text-purple-600" />
          <span>Forms Auto-Sync:</span>
          <span className="font-semibold">
            {isSyncing ? "Syncing..." : autoSyncEnabled ? "Live" : "Paused"}
          </span>
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={syncNow}
          disabled={isSyncing}
          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          title="Force Google Forms synchronization now"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-purple-600" : ""}`} />
          <span className="hidden sm:inline">Sync</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-500/5 via-background to-blue-500/5 p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 border border-purple-500/20 shrink-0">
            <FileCheck2 className="h-4 w-4" />
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Google Forms Auto-Sync Service
              </span>
              
              <Badge 
                variant="outline" 
                className={`text-[10px] h-5 px-1.5 gap-1 font-semibold ${
                  autoSyncEnabled 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {autoSyncEnabled ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-Sync Active (Every 60s)
                  </>
                ) : (
                  <>
                    <Pause className="h-2.5 w-2.5" />
                    Auto-Sync Paused
                  </>
                )}
              </Badge>

              {stats.status === "warning" && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Connect Google Workspace Account
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span>{contextTitle || "Embedded feedback & event registration forms sync directly into this table."}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80">
                <Clock className="h-3 w-3" />
                {getRelativeTime(lastSyncedAt)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleAutoSync()}
            className="h-8 text-xs gap-1.5"
            title={autoSyncEnabled ? "Pause automatic 60s background polling" : "Enable automatic 60s background polling"}
          >
            {autoSyncEnabled ? (
              <>
                <Pause className="h-3 w-3 text-muted-foreground" />
                <span className="hidden md:inline">Pause Auto-Sync</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-600" />
                <span className="hidden md:inline">Resume Auto-Sync</span>
              </>
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={syncNow}
            disabled={isSyncing}
            className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Forms Now"}</span>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Open Google Workspace Hub"
          >
            <Link to="/admin/workspace">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
