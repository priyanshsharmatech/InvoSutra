import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
// Importing Loader2 for the global loading screen
import { Loader2 } from "lucide-react"; 
import LandingPage from "./pages/LandingPage/LandingPage";
import SignUp from "./pages/Auth/SignUp";
import Login from "./pages/Auth/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import AllInvoices from "./pages/Invoices/AllInvoices";
import CreateInvoice from "./pages/Invoices/CreateInvoice";
import InvoiceDetail from "./pages/Invoices/InvoiceDetail";
import ProfilePage from "./pages/Profile/ProfilePage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext"; // 👈 Import useAuth

const AppContent = () => {
  // 1. Access the loading state from the context
  const { loading } = useAuth(); 

  // 2. CRITICAL FIX: If context is still loading (checking localStorage), 
  // display a spinner and stop rendering the routes.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // 3. Once loading is complete, render the full router
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        {/* The ProtectedRoute component will now safely check isAuthenticated 
            because 'loading' is confirmed false at this point. */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<AllInvoices />} />
          <Route path="/invoices/new" element={<CreateInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};


const App = () => {
  return (
    <AuthProvider>
      <AppContent /> {/* The main routing logic is now in a child component */}
      <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px",
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
