import React, { createContext, useContext, useState, useEffect } from "react";
// import axiosInstance from "../../utils/axiosInstance"; // Recommended for token validation

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // CRITICAL: This loading state is used by the main App component 
  // to show a full-screen spinner until the initial check is complete.
  const [loading, setLoading] = useState(true); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    // Disabling linting for exhaustive-deps since checkAuthStatus is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        // BEST PRACTICE: If this were a production app, you should make an 
        // API call here to validate the 'token' against the backend 
        // to ensure it hasn't expired. For now, reading localStorage is fine.
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      logout();
    } finally {
      // MUST be set to false after the check, regardless of success/failure
      setLoading(false); 
    }
  };

  const login = (userData, token) => {
    // 1. Update localStorage
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    // 2. Update state synchronously
    setUser(userData);
    setIsAuthenticated(true);
    // The redirect MUST be delayed in the calling component (Login.jsx) 
    // to allow this state update to initiate a re-render cycle.
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
    setIsAuthenticated(false);
    // NOTE: It is generally better practice to use 'navigate("/")' 
    // from the router instead of 'window.location.href' unless you 
    // need a hard page reload.
    window.location.href = "/";
  };

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData };
    localStorage.setItem("user", JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const value = {
    user,
    loading, // Exposing 'loading' is key for the App.js fix
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
