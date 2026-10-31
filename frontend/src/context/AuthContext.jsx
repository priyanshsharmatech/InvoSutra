import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

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
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Validate the stored token against the server. If it's stale/invalid
      // (e.g. the user was deleted), this 401s and we clear the session rather
      // than rendering a "logged in" app whose every API call fails.
      const { data } = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth check failed:", error);
      // The axios interceptor handles the redirect on 401; just clear state.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
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
    // Best-effort: clear the httpOnly refresh cookie on the server.
    axiosInstance.post(API_PATHS.AUTH.LOGOUT).catch(() => {});

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
