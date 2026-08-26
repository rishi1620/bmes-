import { Toaster } from "@/components/ui/toaster";
// Force update to resolve Vercel build mismatch
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import ScrollToTop from "@/components/shared/ScrollToTop";
import Index from "./pages/Index";
import About from "./pages/About";
import Academics from "./pages/Academics";
import People from "./pages/People";
import Research from "./pages/Research";
import Activities from "./pages/Activities";
import Portal from "./pages/Portal";
import Projects from "./pages/Projects";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Achievements from "./pages/Achievements";
import Alumni from "./pages/Alumni";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
import AdminMembershipRegistrations from "./pages/admin/AdminMembershipRegistrations";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import AdminAlumni from "./pages/admin/AdminAlumni";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminPages from "./pages/admin/AdminPages";
import AdminHomeSections from "./pages/admin/AdminHomeSections";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminAcademics from "./pages/admin/AdminAcademics";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminPortal from "./pages/admin/AdminPortal";
import AdminResearch from "./pages/admin/AdminResearch";
import Notices from "./pages/Notices";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminUsers from "./pages/admin/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent text-foreground">
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
                  <Route path="/members" element={<Navigate to="/people" replace />} />
                  <Route path="/research" element={<Research />} />
                  <Route path="/activities" element={<Activities />} />
                  <Route path="/portal" element={<Portal />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/alumni" element={<Alumni />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/news" element={<Navigate to="/notices" replace />} />
                  
                  {/* Protected Admin Routes */}
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/home" element={<ProtectedRoute requireAdmin><AdminHomeSections /></ProtectedRoute>} />
                  <Route path="/admin/about" element={<ProtectedRoute requireAdmin><AdminAbout /></ProtectedRoute>} />
                  <Route path="/admin/academics" element={<ProtectedRoute requireAdmin><AdminAcademics /></ProtectedRoute>} />
                  <Route path="/admin/activities" element={<ProtectedRoute requireAdmin><AdminActivities /></ProtectedRoute>} />
                  <Route path="/admin/portal" element={<ProtectedRoute requireAdmin><AdminPortal /></ProtectedRoute>} />
                  <Route path="/admin/research" element={<ProtectedRoute requireAdmin><AdminResearch /></ProtectedRoute>} />
                  <Route path="/admin/notices" element={<ProtectedRoute requireAdmin><AdminNotices /></ProtectedRoute>} />
                  <Route path="/admin/pages" element={<ProtectedRoute requireAdmin><AdminPages /></ProtectedRoute>} />
                  <Route path="/admin/people" element={<ProtectedRoute requireAdmin><AdminPeople /></ProtectedRoute>} />
                  <Route path="/admin/events" element={<ProtectedRoute requireAdmin><AdminEvents /></ProtectedRoute>} />
                  <Route path="/admin/projects" element={<ProtectedRoute requireAdmin><AdminProjects /></ProtectedRoute>} />
                  <Route path="/admin/achievements" element={<ProtectedRoute requireAdmin><AdminAchievements /></ProtectedRoute>} />
                  <Route path="/admin/blog" element={<ProtectedRoute requireAdmin><AdminBlog /></ProtectedRoute>} />
                  <Route path="/admin/alumni" element={<ProtectedRoute requireAdmin><AdminAlumni /></ProtectedRoute>} />
                  <Route path="/admin/faq" element={<ProtectedRoute requireAdmin><AdminFAQ /></ProtectedRoute>} />
                  <Route path="/admin/media" element={<ProtectedRoute requireAdmin><AdminMedia /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
                  <Route path="/admin/submissions" element={<ProtectedRoute requireAdmin><AdminSubmissions /></ProtectedRoute>} />
                  <Route path="/admin/registrations" element={<ProtectedRoute requireAdmin><AdminRegistrations /></ProtectedRoute>} />
                  <Route path="/admin/membership" element={<ProtectedRoute requireAdmin><ErrorBoundary><AdminMembershipRegistrations /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </div>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
