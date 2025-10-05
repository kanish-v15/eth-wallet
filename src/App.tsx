import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import WalletSetup from "./pages/WalletSetup";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import History from "./pages/History";
import Receive from "./pages/Receive";
import Profile from "./pages/Profile";
import Wallets from "./pages/Wallets";
import TransactionDetails from "./pages/TransactionDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(240 8% 10%)',
            color: 'hsl(210 40% 98%)',
            border: '1px solid hsl(240 5% 20%)',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/wallet-setup" element={<WalletSetup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<Send />} />
          <Route path="/history" element={<History />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/transaction/:id" element={<TransactionDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
