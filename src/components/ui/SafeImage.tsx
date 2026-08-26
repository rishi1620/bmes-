import React, { useState, useEffect } from "react";
import { ImageOff, AlertCircle, RefreshCw } from "lucide-react";
import { logMediaLoadError, logMediaLoadAttempt, parseMediaUrl } from "@/services/mediaLogger";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  componentName?: string;
  showDiagnosticBadge?: boolean;
}

/**
 * SafeImage Component
 * 
 * Automatically captures image loading failures, performs diagnostic tracing
 * against the Supabase Storage / CDN layer, and outputs structured remediation
 * logs to help identify public bucket access or CDN URL issues.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = "",
  className = "",
  fallbackSrc,
  componentName = "SafeImage",
  showDiagnosticBadge = false,
  onError,
  onLoad,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    if (src) {
      logMediaLoadAttempt(src, { component: componentName });
    }
  }, [src, componentName]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (src) {
      logMediaLoadError(src, {
        component: componentName,
        fileName: alt || undefined,
        error: e,
        element: e.currentTarget
      });
    }

    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }

    if (onError) {
      onError(e);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRetrying(true);
    setHasError(false);
    
    // Append cache-buster for retry
    if (src) {
      const separator = src.includes("?") ? "&" : "?";
      setCurrentSrc(`${src}${separator}t=${Date.now()}`);
    }

    setTimeout(() => setIsRetrying(false), 500);
  };

  if (hasError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    const parsed = src ? parseMediaUrl(src) : null;
    return (
      <div 
        className={`flex flex-col items-center justify-center bg-muted/60 text-muted-foreground border border-dashed border-border/80 rounded p-2 text-center relative overflow-hidden group ${className}`}
        title={`Failed to load media: ${src}`}
      >
        <ImageOff className="h-6 w-6 opacity-60 mb-1" />
        <span className="text-[11px] font-medium truncate max-w-full px-1">
          {alt || parsed?.fileName || "Media Unavailable"}
        </span>

        {(showDiagnosticBadge || parsed?.isSupabaseStorage) && parsed?.isSupabaseStorage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute top-1 right-1 bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer">
                  <AlertCircle className="h-3 w-3" />
                  <span>Bucket Issue</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs p-2.5">
                <p className="font-semibold text-foreground mb-1">Supabase Storage Check</p>
                <p className="text-muted-foreground">
                  Check if bucket <span className="font-mono text-primary font-bold">"{parsed.bucket}"</span> is marked <strong>Public</strong> in Supabase Dashboard.
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">See browser console for diagnostic steps.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <button
          onClick={handleRetry}
          className="mt-1 text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${isRetrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={onLoad}
      {...props}
    />
  );
};
