import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/shared/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Academics from "./pages/Academics";
import People from "./pages/People";
import Research from "./pages/Research";
import Activities from "./pages/Activities";
import Portal from "./pages/Portal";
import Members from "./pages/Members";
import Projects from "./pages/Projects";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Achievements from "./pages/Achievements";
import Alumni from "./pages/Alumni";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPeople from "./pages/admin/AdminPeople";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminAchievements from "./pages/admin/AdminAchievements";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminAlumni from "./pages/admin/AdminAlumni";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminPages from "./pages/admin/AdminPages";
import AdminHomeSections from "./pages/admin/AdminHomeSections";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminAcademics from "./pages/admin/AdminAcademics";
import AdminActivities from "./pages/admin/AdminActivities";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
          <div className="flex w-full max-w-screen-2xl flex-1 flex-col">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/about" element={<About />} />
                <Route path="/academics" element={<Academics />} />
                <Route path="/people" element={<People />} />
                <Route path="/research" element={<Research />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/portal" element={<Portal />} />
                <Route path="/members" element={<Members />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/events" element={<Events />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/alumni" element={<Alumni />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/home" element={<AdminHomeSections />} />
                <Route path="/admin/about" element={<AdminAbout />} />
                <Route path="/admin/academics" element={<AdminAcademics />} />
                <Route path="/admin/activities" element={<AdminActivities />} />
                <Route path="/admin/pages" element={<AdminPages />} />
                <Route path="/admin/people" element={<AdminPeople />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/achievements" element={<AdminAchievements />} />
                <Route path="/admin/blog" element={<AdminBlog />} />
                <Route path="/admin/alumni" element={<AdminAlumni />} />
                <Route path="/admin/faq" element={<AdminFAQ />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/submissions" element={<AdminSubmissions />} />
                <Route path="/admin/registrations" element={<AdminRegistrations />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
