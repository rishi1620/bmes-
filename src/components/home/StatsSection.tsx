import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import StatCard from "@/components/shared/StatCard";

interface Stat {
  value: string;
  label: string;
}

interface StatsSectionProps {
  stats: Stat[];
}

const AnimatedNumber = ({ value }: { value: string }) => {
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, numericValue, { duration: 2 });
    return controls.stop;
  }, [count, numericValue]);

  return <motion.span>{rounded}</motion.span>;
};

const StatsSection = ({ stats }: StatsSectionProps) => {
  return (
    <section className="container -mt-12 relative z-20">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <StatCard
              value={
                <AnimatedNumber value={s.value} />
              }
              label={s.label}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
