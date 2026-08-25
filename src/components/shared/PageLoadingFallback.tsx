import React from "react";

export const PageLoadingFallback: React.FC = () => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-4xl space-y-6">
        {/* Subtle Top Shimmer */}
        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-emerald-500/50 via-teal-500 to-emerald-500/50 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
        </div>

        {/* Skeleton Header */}
        <div className="space-y-3 pt-4">
          <div className="h-8 w-48 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-muted/40 rounded-md animate-pulse" />
        </div>

        {/* Skeleton Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-4">
              <div className="h-36 w-full rounded-xl bg-muted/50 animate-pulse" />
              <div className="h-5 w-3/4 bg-muted/60 rounded-md animate-pulse" />
              <div className="h-4 w-1/2 bg-muted/40 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageLoadingFallback;
