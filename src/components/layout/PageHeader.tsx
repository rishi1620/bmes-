import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

const PageHeader = ({ title, action }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
      {action && <div>{action}</div>}
    </div>
  );
};

export default PageHeader;
