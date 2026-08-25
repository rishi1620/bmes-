import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RealtimeNotificationProvider } from "@/context/RealtimeNotificationContext";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { GlobalCommandSearch } from "@/components/shared/GlobalCommandSearch";
import { ReadingProgressBar } from "@/components/shared/ReadingProgressBar";
import { BackToTop } from "@/components/shared/BackToTop";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

// Lazy-loaded Public Pages
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Academics = lazy(() => import("./pages/Academics"));
const People = lazy(() => import("./pages/People"));
const Research = lazy(() => import("./pages/Research"));
const Activities = lazy(() => import("./pages/Activities"));
const Portal = lazy(() => import("./pages/Portal"));
const Projects = lazy(() => import("./pages/Projects"));
const Events = lazy(() => import("./pages/Events"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Alumni = lazy(() => import("./pages/Alumni"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Notices = lazy(() => import("./pages/Notices"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy-loaded Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPeople = lazy(() => import("./pages/admin/AdminPeople"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminAchievements = lazy(() => import("./pages/admin/AdminAchievements"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));
const AdminRegistrations = lazy(() => import("./pages/admin/AdminRegistrations"));
const AdminMembershipRegistrations = lazy(() => import("./pages/admin/AdminMembershipRegistrations"));
const AdminAlumni = lazy(() => import("./pages/admin/AdminAlumni"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminHomeSections = lazy(() => import("./pages/admin/AdminHomeSections"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const AdminAcademics = lazy(() => import("./pages/admin/AdminAcademics"));
const AdminActivities = lazy(() => import("./pages/admin/AdminActivities"));
const AdminPortal = lazy(() => import("./pages/admin/AdminPortal"));
const AdminResearch = lazy(() => import("./pages/admin/AdminResearch"));
const AdminNotices = lazy(() => import("./pages/admin/AdminNotices"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <div className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent text-foreground">
            <div className="flex w-full max-w-screen-2xl flex-1 flex-col">
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <RealtimeNotificationProvider>
                  <ScrollToTop />
                  <ReadingProgressBar />
                  <GlobalCommandSearch />
                  <BackToTop />
                  <Suspense fallback={<PageLoadingFallback />}>
                    <Routes>
                      {/* Public Routes */}
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
                  </Suspense>
                </RealtimeNotificationProvider>
              </BrowserRouter>
            </div>
          </div>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
