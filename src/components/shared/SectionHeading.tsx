interface Props {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

const SectionHeading = ({ badge, title, description, className = "", align = "center" }: Props) => {
  const alignmentClasses = {
    left: "text-left mr-auto",
    center: "text-center mx-auto",
    right: "text-right ml-auto",
  };

  return (
    <div className={`max-w-3xl ${alignmentClasses[align]} ${className}`}>
      {badge && (
        <span className="mb-3 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {badge}
        </span>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">{title}</h2>
      {description && (
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
      )}
    </div>
  );
};

export default SectionHeading;
