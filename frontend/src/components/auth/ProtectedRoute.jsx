import { Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../ui/LoadingScreen";

const ProtectedRoute = ({ children }) => {
  //will integrate these values later
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children ? children : <Outlet />}</DashboardLayout>;
};

export default ProtectedRoute;
