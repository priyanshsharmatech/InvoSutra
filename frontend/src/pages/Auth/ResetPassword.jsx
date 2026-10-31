import React, { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import LogoMark from "../../components/ui/LogoMark";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post(
        API_PATHS.AUTH.RESET_PASSWORD(token),
        { password }
      );
      toast.success(data.message || "Password reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Invalid or expired reset link."
      );
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
            Set a New Password
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-sm">Choose a strong password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="At least 6 characters"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !password || !confirm}
            className="w-full bg-gradient-to-r from-blue-950 to-blue-900 text-white py-3 px-4 rounded-lg font-medium hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
