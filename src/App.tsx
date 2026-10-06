import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { consumeRecovery, onRecovery } from "@/lib/recovery";

const queryClient = new QueryClient();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .catch(error => {
      console.warn('Service Worker registration failed:', error);
    });
}

// Sends the user to the reset-password form when they open a password-recovery email link,
// whichever page Supabase redirected them to.
const RecoveryRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const goToResetForm = () => {
      if (consumeRecovery()) {
        navigate('/auth', { replace: true, state: { recovery: true } });
      }
    };
    goToResetForm();
    return onRecovery(goToResetForm);
  }, [navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RecoveryRedirect />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
