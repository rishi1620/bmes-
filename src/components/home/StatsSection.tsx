import { motion } from "framer-motion";
import StatCard from "@/components/shared/StatCard";

interface StatsSectionProps {
  stats: any;
  containerVariants: any;
  itemVariants: any;
}

export const StatsSection = ({ stats, containerVariants, itemVariants }: StatsSectionProps) => {
  if (!stats?.items) return null;

  return (
    <section className="container -mt-12 relative z-20">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {stats.items.map((s: any) => (
          <motion.div key={s.label} variants={itemVariants}>
            <StatCard value={s.value} label={s.label} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
