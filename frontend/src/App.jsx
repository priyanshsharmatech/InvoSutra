import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import LandingPage from "./pages/LandingPage/LandingPage";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import TermsOfService from "./pages/Legal/TermsOfService";
import PrivacyPolicy from "./pages/Legal/PrivacyPolicy";
import Dashboard from "./pages/Dashboard/Dashboard";
import AllInvoices from "./pages/Invoices/AllInvoices";
import CreateInvoice from "./pages/Invoices/CreateInvoice";
import Clients from "./pages/Clients/Clients";
import Recurring from "./pages/Recurring/Recurring";
import Reports from "./pages/Reports/Reports";
import InvoiceDetail from "./pages/Invoices/InvoiceDetail";
import ProfilePage from "./pages/Profile/ProfilePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<AllInvoices />} />
          <Route path="/invoices/new" element={<CreateInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
    <Toaster
      toastOptions={{
        className: "",
        style: { fontSize: "13px" },
      }}
    />
  </AuthProvider>
);

export default App;
