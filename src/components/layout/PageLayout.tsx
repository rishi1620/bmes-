import Navbar from "./Navbar";
import Footer from "./Footer";

const PageLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default PageLayout;
