import React, { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PWAInstallButton: React.FC<{ variant?: "default" | "compact" | "mobile" }> = ({
  variant = "default",
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === "mobile") {
      return (
        <button
          onClick={install}
          className="flex w-full items-center justify-between rounded-md bg-teal-600/10 dark:bg-teal-500/20 px-3 py-2 text-sm font-semibold text-teal-700 dark:text-teal-300 border border-teal-600/30 hover:bg-teal-600/20 transition-all"
        >
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            Install BMES App
          </span>
          <span className="text-[10px] font-mono uppercase bg-teal-600 text-white dark:bg-teal-400 dark:text-teal-950 px-1.5 py-0.5 rounded font-bold">
            PWA
          </span>
        </button>
      );
    }

    if (variant === "compact") {
      return (
        <Button
          onClick={install}
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs font-semibold border-teal-600/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
          title="Install CUET BMES App on this device"
        >
          <Download className="h-3.5 w-3.5 text-teal-600" />
          <span>Install</span>
        </Button>
      );
    }

    return (
      <Button
        onClick={install}
        size="sm"
        className="h-8 gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs"
        title="Install CUET BMES App"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </Button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        {variant === "mobile" ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex w-full items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-teal-600" />
              Add to Home Screen
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">iOS</span>
          </button>
        ) : (
          <Button
            onClick={() => setShowIOSGuide(true)}
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            title="Install on iPhone / iPad"
          >
            <Smartphone className="h-3.5 w-3.5 text-teal-600" />
            <span className="hidden sm:inline">Install</span>
          </Button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Install on iPhone / iPad</h3>
                    <p className="text-[11px] text-muted-foreground">Add CUET BMES to Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ol className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button <Share className="inline h-3.5 w-3.5 text-teal-600 mx-0.5" /> in Safari's bottom toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner to finish installing.
                  </span>
                </li>
              </ol>

              <Button
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-8 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
