import { useEffect, useState } from "react";

export const ReadingProgressBar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (scrollProgress <= 0.5) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[60] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-emerald-500 to-teal-400 transition-all duration-150 ease-out shadow-sm"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};
