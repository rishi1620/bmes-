import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

interface HeroSectionProps {
  hero: any;
}

export const HeroSection = ({ hero }: HeroSectionProps) => {
  if (!hero) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          src={(hero.background_image as string) || heroBg} 
          alt="" 
          className="h-full w-full object-cover" 
        />
        <div className="absolute inset-0 hero-gradient opacity-85" />
      </div>
      <div className="container relative z-10 flex flex-col items-center py-16 text-center md:py-24">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 inline-block rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90"
        >
          {hero.subtitle as string}
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-6xl"
        >
          {hero.title as string}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 max-w-2xl text-base text-primary-foreground/80 md:text-lg leading-relaxed"
        >
          {hero.description as string}
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          {hero.button_text && (
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
              <Link to={(hero.button_link as string) || "/members"}>{hero.button_text as string} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  );
};
