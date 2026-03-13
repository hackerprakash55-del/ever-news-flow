import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

// Eagerly load auth for fastest /auth startup; lazy-load everything else
import AuthPage from "./pages/AuthPage";

const Index            = lazy(() => import("./pages/Index"));
const ArticlePage      = lazy(() => import("./pages/ArticlePage"));
const NewsroomPage     = lazy(() => import("./pages/NewsroomPage"));
const AIVideoPage      = lazy(() => import("./pages/AIVideoPage"));
const VideoLibraryPage = lazy(() => import("./pages/VideoLibraryPage"));
const SettingsPage     = lazy(() => import("./pages/SettingsPage"));
const NotFound         = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal skeleton shown while a lazy page chunk is downloading
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-xs font-mono text-muted-foreground">Loading…</span>
    </div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="gainn-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public — no auth required */}
                <Route path="/auth"       element={<AuthPage />} />
                <Route path="/"           element={<Index />} />
                <Route path="/article/:id" element={<ArticlePage />} />
                <Route path="/video"      element={<AIVideoPage />} />
                <Route path="/videos"     element={<VideoLibraryPage />} />

                {/* Protected — must be signed in */}
                <Route path="/newsroom"   element={<AuthGuard><NewsroomPage /></AuthGuard>} />
                <Route path="/settings"   element={<AuthGuard><SettingsPage /></AuthGuard>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
