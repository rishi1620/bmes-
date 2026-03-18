import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ReactNode } from "react";

interface Props {
  value: ReactNode;
  label: string;
  icon?: LucideIcon;
  className?: string;
  to?: string;
}

const StatCard = ({ value, label, icon: Icon, className, to }: Props) => {
  const Content = (
    <div className={cn("flex flex-col rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/20 h-full", className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </div>
      <div className="mt-auto">
        <span className="text-4xl font-extrabold tracking-tight text-foreground">{value}</span>
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{Content}</Link>;
  }

  return Content;
};

export default StatCard;
