import { Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../ui/LoadingScreen";

// Guards admin-only pages: must be authenticated AND have the admin role.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children ? children : <Outlet />}</DashboardLayout>;
};

export default AdminRoute;
