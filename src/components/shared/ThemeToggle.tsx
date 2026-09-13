import { useState, useEffect } from "react";
import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  align?: "start" | "end" | "center";
  showLabel?: boolean;
}

export function ThemeToggle({ className, align = "end", showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 rounded-md border border-border/40 opacity-70", className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={showLabel ? "sm" : "icon"}
          className={cn(
            "relative h-9 rounded-md border border-border/60 bg-background/80 hover:bg-accent/40 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary shadow-2xs",
            showLabel ? "px-3 gap-2" : "w-9 p-0",
            className
          )}
          aria-label={`Current theme: ${theme}. Click to switch theme`}
          title={`Appearance: ${theme === "system" ? `System (${resolvedTheme})` : theme}`}
        >
          {/* Animated Sun & Moon Icons */}
          <Sun className="h-[1.15rem] w-[1.15rem] text-amber-500 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] text-cyan-400 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          
          {showLabel && (
            <span className="text-xs font-medium capitalize hidden sm:inline-block">
              {theme === "system" ? "System" : theme}
            </span>
          )}
          
          <span className="sr-only">Toggle theme (current: {theme})</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-44 p-1.5 shadow-lg border-border/80 bg-popover/95 backdrop-blur-md">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center justify-between">
          <span>Appearance</span>
          <span className="text-[10px] font-mono normal-case text-primary font-bold">
            {isDark ? "Dark Mode" : "Light Mode"}
          </span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1 opacity-60" />

        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors",
            theme === "light" 
              ? "bg-primary/10 text-primary font-semibold" 
              : "hover:bg-accent/60 text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors",
            theme === "dark" 
              ? "bg-primary/10 text-primary font-semibold" 
              : "hover:bg-accent/60 text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-cyan-400" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={cn(
            "flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md cursor-pointer transition-colors",
            theme === "system" 
              ? "bg-primary/10 text-primary font-semibold" 
              : "hover:bg-accent/60 text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Segmented Theme Switcher: Ideal for mobile drawers, sidebar footers, or settings modals
 */
export function ThemeSegmentedSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("grid grid-cols-3 gap-1 bg-muted/60 p-1 rounded-lg border border-border/40 h-10", className)}>
        <div className="h-full rounded-md bg-muted animate-pulse" />
        <div className="h-full rounded-md bg-muted animate-pulse" />
        <div className="h-full rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  const options = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      iconClass: "text-amber-500",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      iconClass: "text-cyan-400",
    },
    {
      value: "system",
      label: "System",
      icon: Laptop,
      iconClass: "text-slate-500 dark:text-slate-400",
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme selector"
      className={cn(
        "grid grid-cols-3 gap-1 p-1 bg-muted/70 dark:bg-muted/40 rounded-lg border border-border/60 backdrop-blur-xs",
        className
      )}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-md text-xs font-semibold transition-all duration-200 outline-none select-none min-h-[38px]",
              isActive
                ? "bg-background text-foreground shadow-xs border border-border/60 text-primary font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 shrink-0", opt.iconClass)} />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

