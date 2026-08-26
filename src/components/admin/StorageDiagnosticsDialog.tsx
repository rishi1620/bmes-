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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  RefreshCw, 
  ExternalLink, 
  Database, 
  Globe, 
  ShieldCheck, 
  Terminal,
  FileCode2,
  Trash2
} from "lucide-react";
import { 
  getMediaLogHistory, 
  subscribeToMediaLogs, 
  clearMediaLogHistory, 
  MediaDiagnosticReport,
  diagnoseMediaAsset,
  getConfiguredSupabaseUrl,
  extractProjectRef,
  BucketAuditReport
} from "@/services/mediaLogger";
import { storageService } from "@/services/storageService";
import { toast } from "@/hooks/use-toast";

interface StorageDiagnosticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBucket?: string;
}

export const StorageDiagnosticsDialog: React.FC<StorageDiagnosticsDialogProps> = ({
  open,
  onOpenChange,
  defaultBucket = "media",
}) => {
  const [activeTab, setActiveTab] = useState<"audit" | "logs" | "tester" | "sql">("audit");
  const [logs, setLogs] = useState<MediaDiagnosticReport[]>([]);
  const [auditing, setAuditing] = useState(false);
  const [mediaAudit, setMediaAudit] = useState<BucketAuditReport | null>(null);
  const [resourcesAudit, setResourcesAudit] = useState<BucketAuditReport | null>(null);
  
  // Custom URL tester state
  const [testUrl, setTestUrl] = useState("");
  const [testResult, setTestResult] = useState<MediaDiagnosticReport | null>(null);
  const [isTestingUrl, setIsTestingUrl] = useState(false);

  const configuredUrl = getConfiguredSupabaseUrl();
  const projectRef = extractProjectRef(configuredUrl);
  const isPlaceholder = configuredUrl.includes("placeholder-project.supabase.co");

  useEffect(() => {
    setLogs(getMediaLogHistory());
    const unsubscribe = subscribeToMediaLogs((report) => {
      setLogs(prev => [report, ...prev.filter(p => p.id !== report.id)]);
    });
    return unsubscribe;
  }, []);

  const runFullAudit = useCallback(async () => {
    setAuditing(true);
    try {
      const [mediaRes, resourcesRes] = await Promise.all([
        storageService.auditBucket(defaultBucket || "media"),
        storageService.auditBucket("resources")
      ]);
      setMediaAudit(mediaRes);
      setResourcesAudit(resourcesRes);
      toast({ title: "Storage Audit Completed", description: `Audited '${defaultBucket || "media"}' and 'resources' buckets.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Audit error";
      toast({ title: "Audit Error", description: msg, variant: "destructive" });
    } finally {
      setAuditing(false);
    }
  }, [defaultBucket]);

  useEffect(() => {
    if (open) {
      runFullAudit();
    }
  }, [open, runFullAudit]);

  const handleTestUrl = async () => {
    if (!testUrl.trim()) return;
    setIsTestingUrl(true);
    try {
      const res = await diagnoseMediaAsset(testUrl.trim(), { component: "DiagnosticsModalTester" });
      setTestResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Test failed";
      toast({ title: "Test Failed", description: msg, variant: "destructive" });
    } finally {
      setIsTestingUrl(false);
    }
  };

  const copyToClipboard = (text: string, label: string = "Text") => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to Clipboard", description: `${label} copied.` });
  };

  const sqlPolicySnippet = `-- Enable Public Read Access for Supabase Storage Buckets
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Ensure storage.objects is accessible to anonymous users for the 'media' bucket:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Media Bucket Read Access'
  ) THEN
    CREATE POLICY "Public Media Bucket Read Access"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'media');
  END IF;
END $$;

-- 2. Ensure storage.objects is accessible for 'resources' bucket:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public Resources Bucket Read Access'
  ) THEN
    CREATE POLICY "Public Resources Bucket Read Access"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'resources');
  END IF;
END $$;`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary animate-pulse" />
              <DialogTitle className="text-xl font-bold">Supabase Storage & CDN Diagnostics</DialogTitle>
            </div>
            <Badge variant={isPlaceholder ? "destructive" : "outline"} className="font-mono text-xs">
              {isPlaceholder ? "Placeholder Supabase URL" : `Project: ${projectRef || "Connected"}`}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Trace why media assets are failing to load and verify public bucket & CDN URL configurations in the Supabase Dashboard.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "audit" | "logs" | "tester" | "sql")} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 border-b border-border bg-muted/30">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="audit" className="text-xs gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Bucket Audit
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Media Failure Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="tester" className="text-xs gap-1.5">
                <Globe className="h-3.5 w-3.5" /> URL Probe Tester
              </TabsTrigger>
              <TabsTrigger value="sql" className="text-xs gap-1.5">
                <FileCode2 className="h-3.5 w-3.5" /> Storage SQL Fix
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6 overflow-y-auto min-h-0">
            {/* AUDIT TAB */}
            <TabsContent value="audit" className="space-y-4 m-0">
              <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Supabase Project Endpoint</p>
                  <p className="text-xs font-mono text-muted-foreground truncate max-w-md">{configuredUrl}</p>
                </div>
                <Button variant="outline" size="sm" onClick={runFullAudit} disabled={auditing} className="gap-1.5 h-8">
                  <RefreshCw className={`h-3.5 w-3.5 ${auditing ? 'animate-spin' : ''}`} />
                  {auditing ? "Auditing..." : "Re-scan Buckets"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Media Bucket Card */}
                <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">media bucket</span>
                    </div>
                    {mediaAudit ? (
                      mediaAudit.isPublic && mediaAudit.canList ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Public & Healthy
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Attention Needed
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">Scanning...</Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Listing Access:</span>
                      <span className="font-medium text-foreground">{mediaAudit?.canList ? "✅ Allowed" : "❌ Blocked / Not Found"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Public Asset Accessibility:</span>
                      <span className="font-medium text-foreground">{mediaAudit?.isPublic ? "✅ Public" : "❌ Private / Restricted"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detected Objects:</span>
                      <span className="font-medium text-foreground">{mediaAudit?.fileCount ?? "—"}</span>
                    </div>
                  </div>

                  {mediaAudit?.remediation && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2.5 text-xs space-y-1 text-destructive">
                      <p className="font-semibold">Dashboard Remediation:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {mediaAudit.remediation.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Resources Bucket Card */}
                <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">resources bucket</span>
                    </div>
                    {resourcesAudit ? (
                      resourcesAudit.isPublic && resourcesAudit.canList ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Public & Healthy
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Attention Needed
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-xs">Scanning...</Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Listing Access:</span>
                      <span className="font-medium text-foreground">{resourcesAudit?.canList ? "✅ Allowed" : "❌ Blocked / Not Found"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Public Asset Accessibility:</span>
                      <span className="font-medium text-foreground">{resourcesAudit?.isPublic ? "✅ Public" : "❌ Private / Restricted"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detected Objects:</span>
                      <span className="font-medium text-foreground">{resourcesAudit?.fileCount ?? "—"}</span>
                    </div>
                  </div>

                  {resourcesAudit?.remediation && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2.5 text-xs space-y-1 text-destructive">
                      <p className="font-semibold">Dashboard Remediation:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {resourcesAudit.remediation.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Supabase Dashboard Guide Card */}
              <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                    Supabase Dashboard Configuration Checklist
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-card p-3 rounded border border-border space-y-1">
                    <p className="font-medium text-foreground">1. Make Buckets Public</p>
                    <p className="text-muted-foreground text-[11px]">
                      Storage &rarr; Buckets &rarr; <strong>media</strong> &rarr; Click three dots &rarr; <strong>Edit Bucket</strong> &rarr; Enable <strong>Public bucket</strong>.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded border border-border space-y-1">
                    <p className="font-medium text-foreground">2. Set Storage Policies</p>
                    <p className="text-muted-foreground text-[11px]">
                      Storage &rarr; Policies &rarr; storage.objects &rarr; Ensure SELECT permission is enabled for <strong>anon</strong> role.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded border border-border space-y-1">
                    <p className="font-medium text-foreground">3. CDN / Custom Domain</p>
                    <p className="text-muted-foreground text-[11px]">
                      Project Settings &rarr; Custom Domains &rarr; Ensure SSL certificate & CNAME proxy are active and pointing to Supabase.
                    </p>
                  </div>
                  <div className="bg-card p-3 rounded border border-border space-y-1">
                    <p className="font-medium text-foreground">4. API CORS Settings</p>
                    <p className="text-muted-foreground text-[11px]">
                      Project Settings &rarr; API &rarr; Verify project URL matches your <code className="text-primary font-bold">VITE_SUPABASE_URL</code>.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* FAILURE LOGS TAB */}
            <TabsContent value="logs" className="space-y-3 m-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">
                  Real-time trace logs captured by the Supabase service layer and SafeImage components.
                </p>
                {logs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => { clearMediaLogHistory(); setLogs([]); }} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" /> Clear Logs
                  </Button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg bg-card text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-foreground">No Media Loading Failures Recorded</p>
                  <p className="text-xs text-muted-foreground mt-0.5">All media assets are resolving cleanly or no requests have failed yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="border border-border rounded-lg p-3 bg-card space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-mono">
                            {log.statusCode ? `HTTP ${log.statusCode}` : log.issueType || "FAILED"}
                          </Badge>
                          <span className="font-semibold text-foreground truncate max-w-sm">
                            {log.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="bg-muted/40 p-2 rounded text-[11px] font-mono break-all text-muted-foreground">
                        {log.url}
                      </div>

                      <p className="text-muted-foreground text-[11px]">{log.description}</p>

                      {log.remediationSteps.length > 0 && (
                        <div className="bg-primary/5 border border-primary/10 rounded p-2 text-[11px] space-y-1">
                          <p className="font-semibold text-primary">Supabase Dashboard Action Steps:</p>
                          <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                            {log.remediationSteps.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* URL TESTER TAB */}
            <TabsContent value="tester" className="space-y-4 m-0">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Test & Diagnose Media Asset URL</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://...supabase.co/storage/v1/object/public/media/image.png" 
                    value={testUrl}
                    onChange={(e) => setTestUrl(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <Button onClick={handleTestUrl} disabled={isTestingUrl || !testUrl.trim()} size="sm">
                    {isTestingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Probe URL"}
                  </Button>
                </div>
              </div>

              {testResult && (
                <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {testResult.status === "ok" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> HTTP {testResult.statusCode} OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> HTTP {testResult.statusCode || "Error"} Failed
                        </Badge>
                      )}
                      <span className="font-semibold text-sm">{testResult.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{testResult.responseTimeMs}ms</span>
                  </div>

                  <p className="text-xs text-muted-foreground">{testResult.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-2.5 rounded">
                    <div>
                      <span className="text-muted-foreground">Bucket: </span>
                      <span className="font-bold text-foreground">{testResult.parsed.bucket || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Endpoint: </span>
                      <span className="font-bold text-foreground">{testResult.parsed.endpointType || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Project Ref: </span>
                      <span className="font-bold text-foreground">{testResult.parsed.projectRef || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Project Match: </span>
                      <span className="font-bold text-foreground">{testResult.parsed.matchesConfiguredProject ? "Yes" : "No / Custom CDN"}</span>
                    </div>
                  </div>

                  {testResult.remediationSteps.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-xs space-y-1.5">
                      <p className="font-semibold text-amber-600 dark:text-amber-400">Recommended Supabase Fix:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {testResult.remediationSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* SQL FIX TAB */}
            <TabsContent value="sql" className="space-y-3 m-0">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  If media assets return HTTP 403 Forbidden, run this SQL script in your Supabase SQL Editor to grant public SELECT access to your media buckets:
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(sqlPolicySnippet, "SQL Script")}
                  className="gap-1 text-xs shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy SQL
                </Button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-border">
                  {sqlPolicySnippet}
                </pre>
              </div>

              <div className="bg-muted/30 p-3 rounded border border-border text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">How to Apply:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Open your Supabase Dashboard &rarr; SQL Editor.</li>
                  <li>Click "New Query" and paste the snippet above.</li>
                  <li>Click "Run" to grant anonymous read permissions to the storage objects.</li>
                </ol>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-4 border-t border-border bg-muted/20 flex justify-between sm:justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.open(`https://supabase.com/dashboard/project/${projectRef || '_'}/storage/buckets`, '_blank')}
            className="text-xs gap-1"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Supabase Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
