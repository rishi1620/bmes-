import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  getFormDetails, 
  getFormResponses, 
  GoogleFormFullDetails, 
  FormResponseItem 
} from "@/lib/googleWorkspace";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck2, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  Search, 
  Calendar, 
  Layers, 
  HelpCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface GoogleFormSubmissionsViewerProps {
  formId: string | null;
  formTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleFormSubmissionsViewer: React.FC<GoogleFormSubmissionsViewerProps> = ({
  formId,
  formTitle = "Google Form",
  isOpen,
  onClose,
}) => {
  const [details, setDetails] = useState<GoogleFormFullDetails | null>(null);
  const [responses, setResponses] = useState<FormResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedResponseId, setExpandedResponseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"submissions" | "questions" | "analytics">("submissions");

  const loadData = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch details and responses in parallel
      const [detailsData, responsesData] = await Promise.all([
        getFormDetails(formId).catch((err) => {
          console.warn("Could not fetch form questions schema:", err);
          return null;
        }),
        getFormResponses(formId),
      ]);

      if (detailsData) {
        setDetails(detailsData);
      }
      setResponses(responsesData.responses || []);
      if (responsesData.responses.length > 0) {
        setExpandedResponseId(responsesData.responses[0].responseId);
      }
    } catch (err: unknown) {
      console.error("Error fetching form submissions:", err);
      const msg = err instanceof Error ? err.message : "Failed to load submissions from Google Forms API";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (isOpen && formId) {
      loadData();
    } else {
      setDetails(null);
      setResponses([]);
      setError(null);
      setSearchQuery("");
    }
  }, [isOpen, formId, loadData]);

  // Filtered responses based on search query
  const filteredResponses = useMemo(() => {
    if (!searchQuery.trim()) return responses;
    const query = searchQuery.toLowerCase();

    return responses.filter((resp) => {
      // search respondent email
      if (resp.respondentEmail?.toLowerCase().includes(query)) return true;
      // search response ID
      if (resp.responseId?.toLowerCase().includes(query)) return true;
      // search answers
      if (resp.answers) {
        return Object.values(resp.answers).some((ans) => {
          return ans.textAnswers?.answers?.some((a) =>
            a.value?.toLowerCase().includes(query)
          );
        });
      }
      return false;
    });
  }, [responses, searchQuery]);

  // Export submissions to CSV
  const handleExportCsv = () => {
    if (responses.length === 0) {
      toast.error("No submissions available to export.");
      return;
    }

    try {
      const questionList = details?.questions || [];
      const headers = [
        "Submission ID",
        "Submission Timestamp",
        "Respondent Email",
        ...questionList.map((q) => `"${q.title.replace(/"/g, '""')}"`),
      ];

      const rows = responses.map((resp) => {
        const timeStr = resp.lastSubmittedTime || resp.createTime || "";
        const formattedDate = timeStr ? format(new Date(timeStr), "yyyy-MM-dd HH:mm:ss") : "N/A";
        const email = resp.respondentEmail || "Anonymous / Not Collected";

        const answersCells = questionList.map((q) => {
          const ansObj = resp.answers?.[q.questionId];
          const textValues = ansObj?.textAnswers?.answers?.map((a) => a.value) || [];
          return `"${textValues.join("; ").replace(/"/g, '""')}"`;
        });

        return [
          `"${resp.responseId}"`,
          `"${formattedDate}"`,
          `"${email}"`,
          ...answersCells,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${(details?.info?.title || formTitle || "form").replace(/[^a-zA-Z0-9]/g, "_")}_submissions_${format(new Date(), "yyyyMMdd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Submissions exported as CSV successfully!");
    } catch (err: unknown) {
      toast.error("Failed to export CSV: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-foreground truncate flex items-center gap-2">
                  <span>{details?.info?.title || formTitle}</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-purple-500/30 text-purple-600 bg-purple-500/5 shrink-0">
                    Google Forms Submissions
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
                  Form ID: <span className="font-mono">{formId}</span> • {responses.length} total submissions fetched via Google Forms API
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="h-8 text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={responses.length === 0 || isLoading}
                className="h-8 text-xs gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>

              {formId && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-primary"
                >
                  <a
                    href={`https://docs.google.com/forms/d/${formId}/edit#responses`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open Responses in Google Forms"
                  >
                    <span>Google Forms</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-border bg-card shadow-2xs">
              <p className="text-[11px] font-medium text-muted-foreground">Total Submissions</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{responses.length}</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-2xs">
              <p className="text-[11px] font-medium text-muted-foreground">Form Questions</p>
              <p className="text-xl font-bold text-foreground mt-0.5">{details?.questions.length ?? "N/A"}</p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-2xs">
              <p className="text-[11px] font-medium text-muted-foreground">Latest Submission</p>
              <p className="text-xs font-semibold text-foreground mt-1 truncate">
                {responses[0]?.lastSubmittedTime || responses[0]?.createTime
                  ? format(new Date(responses[0].lastSubmittedTime || responses[0].createTime), "MMM d, h:mm a")
                  : "No submissions"}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border bg-card shadow-2xs">
              <p className="text-[11px] font-medium text-muted-foreground">API Sync Status</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-600">Connected</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Unable to fetch form submissions from Google</p>
                <p className="text-[11px] text-destructive/90">{error}</p>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Ensure you are signed in with the Google account that owns or has edit permissions for this Google Form.
                </p>
              </div>
            </div>
          )}

          {/* Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search across answers, emails, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "submissions" | "questions")} className="shrink-0">
              <TabsList className="h-8">
                <TabsTrigger value="submissions" className="text-xs h-7 px-3 gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Submissions ({filteredResponses.length})</span>
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs h-7 px-3 gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Questions ({details?.questions.length || 0})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab 1: Submissions */}
          {activeTab === "submissions" && (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">Fetching submission records from Google Forms API...</p>
                </div>
              ) : filteredResponses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground space-y-2">
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No submissions found</p>
                  <p className="text-[11px]">
                    {searchQuery ? "Try clearing your search query." : "No responses have been submitted to this Google Form yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredResponses.map((resp, index) => {
                    const isExpanded = expandedResponseId === resp.responseId;
                    const timestamp = resp.lastSubmittedTime || resp.createTime;
                    const answerKeys = Object.keys(resp.answers || {});

                    return (
                      <div
                        key={resp.responseId}
                        className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden transition-colors"
                      >
                        {/* Summary Header */}
                        <div
                          onClick={() => setExpandedResponseId(isExpanded ? null : resp.responseId)}
                          className="flex items-center justify-between gap-3 p-3.5 text-xs cursor-pointer hover:bg-muted/30 select-none"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              #{filteredResponses.length - index}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground truncate">
                                  {resp.respondentEmail || "Submission " + resp.responseId.slice(0, 8)}
                                </span>
                                {resp.respondentEmail && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground font-mono">
                                    Verified Email
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {timestamp ? format(new Date(timestamp), "PPpp") : "N/A"}
                                </span>
                                <span>•</span>
                                <span>{answerKeys.length} question(s) answered</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground"
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Answers Card */}
                        {isExpanded && (
                          <div className="border-t border-border/70 bg-muted/20 p-4 space-y-3">
                            <div className="grid gap-2.5">
                              {/* If questions schema is available */}
                              {details?.questions && details.questions.length > 0 ? (
                                details.questions.map((q) => {
                                  const ansObj = resp.answers?.[q.questionId];
                                  const textAnswers = ansObj?.textAnswers?.answers || [];

                                  return (
                                    <div
                                      key={q.questionId}
                                      className="rounded-lg border border-border/60 bg-card p-3 space-y-1"
                                    >
                                      <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                        <span className="text-primary">•</span>
                                        {q.title}
                                      </p>
                                      {textAnswers.length > 0 ? (
                                        <div className="text-xs text-foreground/90 pl-3 pt-0.5 font-medium space-y-1">
                                          {textAnswers.map((a, i) => (
                                            <p key={i} className="whitespace-pre-wrap">{a.value}</p>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] text-muted-foreground/60 italic pl-3">
                                          (No response provided)
                                        </p>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                /* Fallback if questions schema not loaded */
                                answerKeys.map((qid) => {
                                  const ansObj = resp.answers?.[qid];
                                  const textAnswers = ansObj?.textAnswers?.answers || [];

                                  return (
                                    <div
                                      key={qid}
                                      className="rounded-lg border border-border/60 bg-card p-3 space-y-1"
                                    >
                                      <p className="text-[11px] font-mono text-muted-foreground">
                                        Question ID: {qid}
                                      </p>
                                      <div className="text-xs text-foreground pl-2 pt-0.5 font-medium space-y-1">
                                        {textAnswers.map((a, i) => (
                                          <p key={i}>{a.value}</p>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
                              <span>Full Response ID: {resp.responseId}</span>
                              <span>Timestamp: {timestamp}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Questions Schema */}
          {activeTab === "questions" && (
            <div className="space-y-3">
              {details?.questions && details.questions.length > 0 ? (
                <div className="rounded-xl border border-border divide-y divide-border/60 bg-card overflow-hidden">
                  {details.questions.map((q, idx) => (
                    <div key={q.questionId} className="p-3.5 text-xs flex items-start gap-3">
                      <div className="h-6 w-6 rounded-md bg-muted text-muted-foreground font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="font-semibold text-foreground">{q.title}</p>
                        {q.description && (
                          <p className="text-[11px] text-muted-foreground">{q.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 font-mono">
                          Type: {q.type || "text"} • Question ID: {q.questionId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  <p>Question schema is being loaded or not available for this form.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleFormSubmissionsViewer;
