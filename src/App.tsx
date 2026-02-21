import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import IntroPage from "./pages/IntroPage";
import Index from "./pages/Index";
import EligibilityPage from "./pages/EligibilityPage";
import ResultsPage from "./pages/ResultsPage";
import LoanApplicationPage from "./pages/LoanApplicationPage";
import ChatPage from "./pages/ChatPage";
import PrivacyPage from "./pages/PrivacyPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ChatWidget from "./components/chat/ChatWidget";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/intro" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/intro" element={<IntroPage />} />
              <Route path="/" element={<ProtectedRoute element={<Index />} />} />
              <Route path="/eligibility" element={<ProtectedRoute element={<EligibilityPage />} />} />
              <Route path="/results" element={<ProtectedRoute element={<ResultsPage />} />} />
              <Route path="/apply" element={<ProtectedRoute element={<LoanApplicationPage />} />} />
              <Route path="/chat" element={<ProtectedRoute element={<ChatPage />} />} />
              <Route path="/privacy" element={<ProtectedRoute element={<PrivacyPage />} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatWidget />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
