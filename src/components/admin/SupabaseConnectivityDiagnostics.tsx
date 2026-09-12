import React, { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  supabase, 
  isPlaceholder, 
  getSupabaseDiagnosticsDetails 
} from "@/integrations/supabase/client";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Check, 
  Activity, 
  Key, 
  Terminal,
  Save,
  Trash2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export interface DiagnosticStep {
  id: "env" | "ping" | "auth" | "db" | "storage";
  name: string;
  description: string;
  status: "idle" | "running" | "success" | "warning" | "error";
  latencyMs?: number;
  details?: string;
  error?: string;
  recommendation?: string;
}

interface SupabaseConnectivityDiagnosticsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  inline?: boolean;
}

export const SupabaseConnectivityDiagnostics: React.FC<SupabaseConnectivityDiagnosticsProps> = ({
  open = false,
  onOpenChange,
  inline = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    {
      id: "env",
      name: "Environment Variables",
      description: "Verifies VITE_SUPABASE_URL and publishable/anon API key are loaded.",
      status: "idle",
    },
    {
      id: "ping",
      name: "Endpoint Reachability & Ping",
      description: "Direct HTTP ping to Supabase Auth health endpoint to verify DNS & CORS.",
      status: "idle",
    },
    {
      id: "auth",
      name: "Supabase Auth (getSession)",
      description: "Executes supabase.auth.getSession() to verify client auth engine.",
      status: "idle",
    },
    {
      id: "db",
      name: "Database REST API Query",
      description: "Attempts lightweight query against PostgREST (site_settings / public tables).",
      status: "idle",
    },
    {
      id: "storage",
      name: "Storage Engine Reachability",
      description: "Tests connectivity to Supabase Storage endpoint.",
      status: "idle",
    },
  ]);

  // Local credential override inputs
  const [overrideUrl, setOverrideUrl] = useState("");
  const [overrideKey, setOverrideKey] = useState("");
  const [hasLocalStorageConfig, setHasLocalStorageConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem("VITE_SUPABASE_URL") || "";
      const storedKey = localStorage.getItem("VITE_SUPABASE_PUBLISHABLE_KEY") || localStorage.getItem("VITE_SUPABASE_ANON_KEY") || "";
      setOverrideUrl(storedUrl);
      setOverrideKey(storedKey);
      setHasLocalStorageConfig(!!(storedUrl || storedKey));
    }
  }, []);

  const updateStep = (id: DiagnosticStep["id"], update: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...update } : s)));
  };

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);

    // Reset statuses
    setSteps(prev => prev.map(s => ({ ...s, status: "running", latencyMs: undefined, error: undefined, details: undefined })));

    const diag = getSupabaseDiagnosticsDetails();

    // STEP 1: Environment Variables Check
    try {
      if (diag.isPlaceholder) {
        updateStep("env", {
          status: "warning",
          details: `Running with placeholder fallback. URL: ${diag.url}`,
          error: "VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY are not set in environment.",
          recommendation: "Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment or .env file.",
        });
      } else {
        const isUrlValid = diag.url.startsWith("http://") || diag.url.startsWith("https://");
        if (!isUrlValid) {
          updateStep("env", {
            status: "error",
            details: `Invalid URL format: ${diag.url}`,
            error: "Supabase URL does not start with http:// or https://",
            recommendation: "Ensure VITE_SUPABASE_URL is in the format 'https://<project-ref>.supabase.co'.",
          });
        } else if (!diag.isKeyJWT && diag.maskedKey.includes("placeholder")) {
          updateStep("env", {
            status: "warning",
            details: `URL: ${diag.url} | Key: ${diag.maskedKey}`,
            error: "API Key appears to be invalid or placeholder.",
            recommendation: "Use the 'anon public' key from Supabase Dashboard > Project Settings > API.",
          });
        } else {
          updateStep("env", {
            status: "success",
            details: `URL: ${diag.url} | Key loaded: ${diag.maskedKey} (${diag.isKeyJWT ? "Valid JWT" : "Standard Token"})`,
          });
        }
      }
    } catch (err: unknown) {
      updateStep("env", {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // STEP 2: Direct HTTP Ping (Reachability / CORS)
    const pingStart = performance.now();
    try {
      if (diag.isPlaceholder) {
        updateStep("ping", {
          status: "warning",
          latencyMs: 0,
          details: "Skipped real ping because Supabase is in placeholder mode.",
          recommendation: "Set real Supabase credentials to perform live network ping.",
        });
      } else {
        const healthUrl = `${diag.url.replace(/\/+$/, "")}/auth/v1/health`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
          const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY 
            || import.meta.env.VITE_SUPABASE_ANON_KEY 
            || localStorage.getItem("VITE_SUPABASE_PUBLISHABLE_KEY") 
            || localStorage.getItem("VITE_SUPABASE_ANON_KEY") 
            || "";

          const resp = await fetch(healthUrl, {
            method: "GET",
            headers: {
              apikey: rawKey,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const pingLatency = Math.round(performance.now() - pingStart);

          if (resp.ok) {
            updateStep("ping", {
              status: "success",
              latencyMs: pingLatency,
              details: `HTTP ${resp.status} ${resp.statusText} (${pingLatency}ms) - Auth health endpoint reachable.`,
            });
          } else {
            updateStep("ping", {
              status: resp.status === 401 || resp.status === 403 ? "warning" : "error",
              latencyMs: pingLatency,
              details: `HTTP ${resp.status} ${resp.statusText} (${pingLatency}ms)`,
              error: `Endpoint responded with status code ${resp.status}.`,
              recommendation: resp.status === 401 ? "Check if VITE_SUPABASE_ANON_KEY / PUBLISHABLE_KEY is correct." : "Verify endpoint reachability and firewall.",
            });
          }
        } catch (fetchErr: unknown) {
          clearTimeout(timeoutId);
          const pingLatency = Math.round(performance.now() - pingStart);
          const isAbort = fetchErr instanceof Error && fetchErr.name === "AbortError";
          updateStep("ping", {
            status: "error",
            latencyMs: pingLatency,
            error: isAbort ? "Request timed out after 6000ms" : (fetchErr instanceof Error ? fetchErr.message : "Failed to fetch"),
            recommendation: "Ensure project URL is active and not paused in Supabase Dashboard. Also check for browser ad-blockers or CORS restrictions.",
          });
        }
      }
    } catch (err: unknown) {
      updateStep("ping", {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // STEP 3: Supabase Auth Check (auth.getSession())
    const authStart = performance.now();
    try {
      const { data, error } = await supabase.auth.getSession();
      const authLatency = Math.round(performance.now() - authStart);

      if (error) {
        updateStep("auth", {
          status: "error",
          latencyMs: authLatency,
          error: error.message,
          recommendation: "Ensure Supabase client initialized with valid publishable/anon key.",
        });
      } else {
        const session = data?.session;
        updateStep("auth", {
          status: "success",
          latencyMs: authLatency,
          details: session 
            ? `Active session detected for user: ${session.user?.email || session.user?.id} (${authLatency}ms)` 
            : `auth.getSession() responded successfully with no active session (guest/anon state) (${authLatency}ms)`,
        });
      }
    } catch (err: unknown) {
      const authLatency = Math.round(performance.now() - authStart);
      updateStep("auth", {
        status: "error",
        latencyMs: authLatency,
        error: err instanceof Error ? err.message : String(err),
        recommendation: "Unexpected exception during auth.getSession(). Verify network connection.",
      });
    }

    // STEP 4: Database REST API Table Query Test
    const dbStart = performance.now();
    try {
      // Test querying site_settings or pages
      const { data, error, count } = await supabase
        .from("site_settings")
        .select("setting_key", { count: "exact", head: false })
        .limit(3);

      const dbLatency = Math.round(performance.now() - dbStart);

      if (error) {
        // Fallback test on another table in case site_settings has special RLS
        const fallbackRes = await supabase.from("events").select("id").limit(1);
        if (!fallbackRes.error) {
          updateStep("db", {
            status: "success",
            latencyMs: dbLatency,
            details: `PostgREST connected successfully. (Tested 'events' table, ${dbLatency}ms)`,
          });
        } else {
          updateStep("db", {
            status: error.code === "PGRST116" || error.message.includes("permission") ? "warning" : "error",
            latencyMs: dbLatency,
            error: `Code: ${error.code || "ERR"} - ${error.message}`,
            details: `PostgREST returned error for table 'site_settings': ${error.message}`,
            recommendation: error.message.includes("permission") || error.message.includes("policy")
              ? "Row Level Security (RLS) is active. Add a SELECT policy allowing 'anon' and 'authenticated' roles to read this table."
              : "Verify database table migrations are deployed in Supabase SQL editor.",
          });
        }
      } else {
        updateStep("db", {
          status: "success",
          latencyMs: dbLatency,
          details: `PostgREST connected. Query succeeded with ${Array.isArray(data) ? data.length : 0} rows (Total: ${count ?? "N/A"}) in ${dbLatency}ms.`,
        });
      }
    } catch (err: unknown) {
      const dbLatency = Math.round(performance.now() - dbStart);
      updateStep("db", {
        status: "error",
        latencyMs: dbLatency,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // STEP 5: Storage Engine Reachability
    const storageStart = performance.now();
    try {
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      const storageLatency = Math.round(performance.now() - storageStart);

      if (bucketError) {
        // Fallback to testing public list on 'media' bucket
        const { error: mediaError } = await supabase.storage.from("media").list("", { limit: 1 });
        if (!mediaError) {
          updateStep("storage", {
            status: "success",
            latencyMs: storageLatency,
            details: `Storage 'media' bucket reachable (${storageLatency}ms). Note: listBuckets() restricted (standard for anon key).`,
          });
        } else {
          updateStep("storage", {
            status: "warning",
            latencyMs: storageLatency,
            error: bucketError.message,
            details: `Storage responded: ${bucketError.message}`,
            recommendation: "Ensure public buckets ('media', 'resources') are created in Supabase Dashboard > Storage > Buckets.",
          });
        }
      } else {
        const bucketNames = (buckets || []).map(b => b.name).join(", ") || "No buckets yet";
        updateStep("storage", {
          status: "success",
          latencyMs: storageLatency,
          details: `Storage connected (${storageLatency}ms). Buckets: [${bucketNames}]`,
        });
      }
    } catch (err: unknown) {
      const storageLatency = Math.round(performance.now() - storageStart);
      updateStep("storage", {
        status: "warning",
        latencyMs: storageLatency,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    setIsRunning(false);
  }, []);

  // Auto-run on open
  useEffect(() => {
    if (open || inline) {
      runDiagnostics();
    }
  }, [open, inline, runDiagnostics]);

  const saveLocalOverride = () => {
    if (!overrideUrl.trim()) {
      localStorage.removeItem("VITE_SUPABASE_URL");
      localStorage.removeItem("VITE_SUPABASE_PUBLISHABLE_KEY");
      localStorage.removeItem("VITE_SUPABASE_ANON_KEY");
      setHasLocalStorageConfig(false);
      toast({ title: "Custom overrides cleared", description: "Reloading default app configuration." });
      setTimeout(() => window.location.reload(), 500);
      return;
    }

    localStorage.setItem("VITE_SUPABASE_URL", overrideUrl.trim());
    if (overrideKey.trim()) {
      localStorage.setItem("VITE_SUPABASE_PUBLISHABLE_KEY", overrideKey.trim());
      localStorage.setItem("VITE_SUPABASE_ANON_KEY", overrideKey.trim());
    }
    setHasLocalStorageConfig(true);
    toast({ 
      title: "Supabase configuration updated", 
      description: "Page will reload to initialize client with new credentials." 
    });
    setTimeout(() => window.location.reload(), 600);
  };

  const clearLocalOverride = () => {
    localStorage.removeItem("VITE_SUPABASE_URL");
    localStorage.removeItem("VITE_SUPABASE_PUBLISHABLE_KEY");
    localStorage.removeItem("VITE_SUPABASE_ANON_KEY");
    setOverrideUrl("");
    setOverrideKey("");
    setHasLocalStorageConfig(false);
    toast({ title: "Overrides removed", description: "Reloading default configuration." });
    setTimeout(() => window.location.reload(), 500);
  };

  const copyReport = () => {
    const diag = getSupabaseDiagnosticsDetails();
    const reportText = `### 🔍 BMES Supabase Connectivity Diagnostic Report
Generated: ${new Date().toISOString()}

**Configuration Status:**
- Is Placeholder: ${diag.isPlaceholder ? "YES (Placeholder active)" : "NO (Configured)"}
- Active URL: ${diag.url}
- Key Masked: ${diag.maskedKey}
- Key Format Valid JWT: ${diag.isKeyJWT ? "YES" : "NO"}
- Local Storage Override: ${hasLocalStorageConfig ? "YES" : "NO"}

**Diagnostic Checks:**
${steps.map(s => `* [${s.status.toUpperCase()}] ${s.name} ${s.latencyMs !== undefined ? `(${s.latencyMs}ms)` : ""}
  - Details: ${s.details || "None"}
  ${s.error ? `  - Error: ${s.error}` : ""}
  ${s.recommendation ? `  - Recommendation: ${s.recommendation}` : ""}
`).join("\n")}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast({ title: "Diagnostic report copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: DiagnosticStep["status"]) => {
    switch (status) {
      case "running":
        return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: DiagnosticStep["status"]) => {
    switch (status) {
      case "running":
        return <Badge variant="secondary" className="animate-pulse">Checking...</Badge>;
      case "success":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30">PASS</Badge>;
      case "warning":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/30">WARNING</Badge>;
      case "error":
        return <Badge variant="destructive">FAILED</Badge>;
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/40">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isPlaceholder ? 'bg-amber-500/10 text-amber-600' : 'bg-primary/10 text-primary'}`}>
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold">Supabase Connection Status</h4>
              {isPlaceholder ? (
                <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                  Placeholder Mode
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  Active Endpoint
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {getSupabaseDiagnosticsDetails().url}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyReport} 
            className="gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Log"}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? "Running..." : "Test Connectivity"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="tests" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" />
            Live Verification
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs">
            <Key className="h-3.5 w-3.5" />
            Credentials & Override
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-4 space-y-3">
          {steps.map((step) => (
            <Card key={step.id} className="border transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(step.status)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{step.name}</span>
                        {step.latencyMs !== undefined && (
                          <span className="text-[11px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                            {step.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(step.status)}</div>
                </div>

                {step.details && (
                  <div className="mt-3 text-xs bg-muted/60 p-2.5 rounded-lg font-mono text-muted-foreground break-all border border-border/50">
                    {step.details}
                  </div>
                )}

                {step.error && (
                  <div className="mt-2 text-xs bg-destructive/10 text-destructive p-2.5 rounded-lg border border-destructive/20 font-medium">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{step.error}</span>
                    </div>
                  </div>
                )}

                {step.recommendation && (
                  <div className="mt-2 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-200 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="font-semibold text-amber-700 dark:text-amber-300">Fix suggestion: </span>
                    {step.recommendation}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="config" className="mt-4 space-y-4">
          <Card className="border">
            <CardContent className="p-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  Live Credential Verification
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  You can inspect the environment status or temporarily provide test credentials directly in your browser session.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="diag-supabase-url" className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Supabase Project URL (VITE_SUPABASE_URL)</span>
                    {hasLocalStorageConfig && <span className="text-[10px] text-amber-600 font-normal">Active in LocalStorage</span>}
                  </label>
                  <Input 
                    id="diag-supabase-url"
                    placeholder="https://your-project.supabase.co" 
                    value={overrideUrl}
                    onChange={(e) => setOverrideUrl(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="diag-supabase-anon-key" className="text-xs font-semibold text-muted-foreground">
                    Supabase Anon / Publishable Key (VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY)
                  </label>
                  <Input 
                    id="diag-supabase-anon-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                    value={overrideKey}
                    onChange={(e) => setOverrideKey(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {hasLocalStorageConfig ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearLocalOverride}
                      className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear Local Override
                    </Button>
                  ) : <div />}

                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={saveLocalOverride}
                    className="text-xs gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save & Test Live
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-muted/50 rounded-xl border border-border/50 text-xs space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  Supabase Setup Checklist:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1 text-[11px]">
                  <li>Navigate to <strong>Supabase Dashboard &rarr; Project Settings &rarr; API</strong>.</li>
                  <li>Copy <strong>Project URL</strong> and paste into <code className="text-primary font-mono">VITE_SUPABASE_URL</code>.</li>
                  <li>Copy <strong>anon (public) Key</strong> and paste into <code className="text-primary font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li>
                  <li>In <strong>Authentication &rarr; URL Configuration</strong>, ensure your app URL is listed under <em>Site URL</em> and <em>Redirect URLs</em>.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Supabase Connectivity Diagnostics
          </DialogTitle>
          <DialogDescription className="text-xs">
            Verify environment variables, ping reachability, auth session integrity, and REST database queries.
          </DialogDescription>
        </DialogHeader>

        {content}

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange?.(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
