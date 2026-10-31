import React, { useState } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import LogoMark from "../../components/ui/LogoMark";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, {
        email,
      });
      setSent(true);
      // In development (no email configured) the API returns the link directly.
      if (data.resetUrl) setDevLink(data.resetUrl);
      toast.success("Request sent");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LogoMark size={48} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-sm">
            Enter your email and we'll send a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                If an account with that email exists, a password reset link has
                been sent.
              </p>
            </div>
            {devLink && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs break-all">
                <p className="font-medium text-amber-800 mb-1">
                  Dev mode (email not configured) — reset link:
                </p>
                <a href={devLink} className="text-blue-700 underline">
                  {devLink}
                </a>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-blue-950 to-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-gray-600 dark:text-slate-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
