import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
}

const StatCard = ({ value, label, icon: Icon, className }: Props) => (
  <div className={cn("flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md", className)}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  </div>
);

export default StatCard;
