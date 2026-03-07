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
      <h2 className="text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
};

export default SectionHeading;
