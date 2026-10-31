import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders the official Google Sign-In button (Google Identity Services).
// Gated on VITE_GOOGLE_CLIENT_ID — renders nothing if Google auth isn't set up.
const GoogleLoginButton = ({ text = "signin_with" }) => {
  const divRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    const handleCredential = async (response) => {
      try {
        const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, {
          credential: response.credential,
        });
        login(res.data, res.data.token);
        navigate("/dashboard");
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Google sign-in failed. Please try again."
        );
      }
    };

    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !divRef.current) {
        return false;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        text,
        shape: "rectangular",
        width: 320,
      });
      return true;
    };

    // The GIS script loads async — poll briefly until it's ready.
    if (!init()) {
      const timer = setInterval(() => {
        if (init()) clearInterval(timer);
      }, 300);
      const stop = setTimeout(() => clearInterval(timer), 6000);
      return () => {
        cancelled = true;
        clearInterval(timer);
        clearTimeout(stop);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [login, navigate, text]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-4">
      <div className="relative flex items-center my-4">
        <div className="flex-grow border-t border-gray-200" />
        <span className="mx-3 text-xs text-gray-400">or continue with</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>
      <div ref={divRef} className="flex justify-center" />
    </div>
  );
};

export default GoogleLoginButton;
