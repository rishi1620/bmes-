import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  aspectRatio?: "square" | "video" | "4/3" | "3/2" | "auto";
  containerClassName?: string;
  placeholderClassName?: string;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt = "Image",
  fallbackSrc,
  aspectRatio = "auto",
  className,
  containerClassName,
  placeholderClassName,
  priority = false,
  referrerPolicy = "no-referrer",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc || undefined);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || undefined);
    setIsLoaded(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  const aspectStyles = {
    square: "aspect-square",
    video: "aspect-video",
    "4/3": "aspect-[4/3]",
    "3/2": "aspect-[3/2]",
    auto: "",
  }[aspectRatio];

  if (!currentSrc || hasError) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-muted/40 text-muted-foreground/50 overflow-hidden",
          aspectStyles,
          containerClassName
        )}
      >
        <ImageOff className="h-6 w-6 stroke-1 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30",
        aspectStyles,
        containerClassName
      )}
    >
      {/* Shimmer Placeholder while loading */}
      {!isLoaded && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-muted/60 transition-opacity duration-300",
            placeholderClassName
          )}
        />
      )}

      {/* Lazy / Eager Image */}
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy={referrerPolicy}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (fallbackSrc && currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          } else {
            setHasError(true);
          }
        }}
        className={cn(
          "transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
