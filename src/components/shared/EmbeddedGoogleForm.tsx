import React, { useState } from "react";
import { getEmbeddableGoogleFormUrl } from "@/lib/googleWorkspace";
import { ExternalLink, RefreshCw, Maximize2, Minimize2, FileCheck2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EmbeddedGoogleFormProps {
  formUrlOrId: string;
  title?: string;
  description?: string;
  defaultHeight?: number;
  className?: string;
}

export const EmbeddedGoogleForm: React.FC<EmbeddedGoogleFormProps> = ({
  formUrlOrId,
  title = "Official Google Form",
  description,
  defaultHeight = 720,
  className = "",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!formUrlOrId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-xs text-muted-foreground">
        <FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="font-semibold text-foreground">No Google Form configured</p>
        <p className="mt-1">An administrator can connect an official Google Form via the Admin Workspace.</p>
      </div>
    );
  }

  const embedUrl = getEmbeddableGoogleFormUrl(formUrlOrId);
  const directUrl = embedUrl.replace(/[?&]embedded=true/, "");

  return (
    <div
      className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col transition-all ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl bg-background" : className
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/80 bg-muted/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{title}</h4>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5 hidden sm:inline-flex">
                Google Form
              </Badge>
            </div>
            {description && (
              <p className="text-[11px] text-muted-foreground truncate max-w-md hidden md:block">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((prev) => prev + 1);
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Reload Form"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2.5 font-medium gap-1 text-primary border-primary/30 hover:bg-primary/5"
          >
            <a href={directUrl} target="_blank" rel="noopener noreferrer">
              <span>Open Direct</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative flex-1 bg-white min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-10 space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">Loading Google Form...</p>
          </div>
        )}

        <iframe
          key={reloadKey}
          src={embedUrl}
          title={title}
          width="100%"
          height={isFullscreen ? "100%" : defaultHeight}
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          onLoad={() => setIsLoading(false)}
          className="w-full border-0 block"
          style={{ height: isFullscreen ? "calc(100vh - 120px)" : `${defaultHeight}px` }}
        >
          Loading Google Form…
        </iframe>
      </div>

      {/* Footer / Privacy Note */}
      <div className="px-4 py-2 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/70" />
          Responses are recorded directly in the official BMES Google account.
        </span>
        <a
          href={directUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium text-[11px] hidden sm:inline"
        >
          Having trouble? Open in new tab
        </a>
      </div>
    </div>
  );
};

export default EmbeddedGoogleForm;
