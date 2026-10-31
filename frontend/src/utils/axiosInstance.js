import axios from "axios";
import { BASE_URL, API_PATHS } from "./apiPaths";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 80000,
  withCredentials: true, // send the httpOnly refresh cookie
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor — attach the access token.
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const forceLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
};

// Single-flight refresh so concurrent 401s trigger only one refresh call.
let refreshPromise = null;

// Response Interceptor — transparently refresh the access token on 401.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = original.url || "";
    const message = error.response?.data?.message || "";

    const isAuthRequest =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/register") ||
      url.includes("/api/auth/google") ||
      url.includes("/api/auth/refresh");
    const isSuspended = status === 403 && /suspend/i.test(message);

    // Access token expired/invalid → try to refresh once, then retry.
    if (status === 401 && !isAuthRequest && !original._retry) {
      original._retry = true;
      try {
        refreshPromise =
          refreshPromise ||
          axios.post(`${BASE_URL}${API_PATHS.AUTH.REFRESH}`, {}, {
            withCredentials: true,
          });
        const { data } = await refreshPromise;
        refreshPromise = null;

        if (data?.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data));
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.token}`;
          return axiosInstance(original);
        }
        forceLogout();
      } catch (refreshErr) {
        refreshPromise = null;
        forceLogout();
        return Promise.reject(refreshErr);
      }
    }

    if (isSuspended && !isAuthRequest) {
      forceLogout();
    }
    if (status === 500) {
      console.error("Server error. Please try again later.");
    } else if (error.code === "ECONNABORTED") {
      console.error("Request timeout. Please try again.");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
