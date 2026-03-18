import Navbar from "./Navbar";
import Footer from "./Footer";
import { motion } from "framer-motion";

const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
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
  </div>
);

export default PageLayout;
