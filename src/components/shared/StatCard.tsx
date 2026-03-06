interface Props {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: Props) => (
  <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 shadow-elevated">
    <span className="text-3xl font-bold text-primary">{value}</span>
    <span className="mt-1 text-sm text-muted-foreground">{label}</span>
  </div>
);

export default StatCard;
