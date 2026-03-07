import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  value: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
  to?: string;
}

const StatCard = ({ value, label, icon: Icon, className, to }: Props) => {
  const Content = (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md h-full", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{Content}</Link>;
  }

  return Content;
};

export default StatCard;
