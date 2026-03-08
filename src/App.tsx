import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import ArticlePage from "./pages/ArticlePage";
import NewsroomPage from "./pages/NewsroomPage";
import AIVideoPage from "./pages/AIVideoPage";
import VideoLibraryPage from "./pages/VideoLibraryPage";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public — auth only */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected — must be signed in */}
            <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="/article/:id" element={<AuthGuard><ArticlePage /></AuthGuard>} />
            <Route path="/newsroom" element={<AuthGuard><NewsroomPage /></AuthGuard>} />
            <Route path="/video" element={<AuthGuard><AIVideoPage /></AuthGuard>} />
            <Route path="/videos" element={<AuthGuard><VideoLibraryPage /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
