import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell } from "lucide-react";

interface Notice {
  title: string;
  content: string;
  date: string;
}

export const FloatingNotice = ({ notice }: { notice: Notice }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Bell className="h-5 w-5" />
            <span className="font-bold">Latest Notice</span>
          </div>
          <button onClick={() => setIsVisible(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h4 className="mt-2 font-semibold text-foreground line-clamp-2">{notice.title}</h4>
        <p className="mt-1 text-xs text-muted-foreground">{notice.date}</p>
      </motion.div>
    </AnimatePresence>
  );
};
