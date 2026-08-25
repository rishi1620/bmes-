import Navbar from "./Navbar";
import Footer from "./Footer";
import { MobileBottomDock } from "./MobileBottomDock";
import { motion } from "framer-motion";

const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
    <Navbar />
    <motion.main 
      className="flex-1 page-gradient"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.main>
    <Footer />
    <MobileBottomDock />
  </div>
);

export default PageLayout;
