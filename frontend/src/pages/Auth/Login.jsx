import React, { useState } from "react";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { API_PATHS } from "../../utils/apiPaths";
import LogoMark from "../../components/ui/LogoMark";
import AuthLayout from "../../components/auth/AuthLayout";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { validateEmail, validatePassword } from "../../utils/helper"; // Assuming this utility exists

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // --- Input Handlers (Unchanged, good structure) ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (touched[name]) {
      const newFieldErrors = { ...fieldErrors };
      if (name === "email") {
        newFieldErrors.email = validateEmail(value);
      } else if (name === "password") {
        newFieldErrors.password = validatePassword(value);
      }
      setFieldErrors(newFieldErrors);
    }

    if (error) setError("");
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const newFieldErrors = { ...fieldErrors };
    if (name === "email") {
      newFieldErrors.email = validateEmail(formData.email);
    } else if (name === "password") {
      newFieldErrors.password = validatePassword(formData.password);
    }
    setFieldErrors(newFieldErrors);
  };

  const isFormValid = () => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    return !emailError && !passwordError && formData.email && formData.password;
  };

  // --- Submission Handler (CRITICAL FIX applied here) ---

  const handleSubmit = async () => {
    // Validate all fields before submission
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError,
      });
      setTouched({
        email: true,
        password: true,
      });
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, formData);

      if (response.status === 200) {
        const { token } = response.data;

        if (token) {
          setSuccess("Login successful");
          
          // 1. Synchronously update AuthContext and localStorage
          login(response.data, token);

          // 2. FIX: Use setTimeout(..., 0) with client-side navigation (navigate)
          // This forces the navigation instruction to be executed only after 
          // the React rendering cycle has processed the new isAuthenticated=true state.
          // This prevents the 'Not Found' flash.
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 0); 
        }
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occured during login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX Rendering (Unchanged) ---

  return (
    <AuthLayout>
      <div className="w-full max-w-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LogoMark size={48} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
            Login to Your Account
          </h1>
          <p className="text-gray-600 dark:text-slate-300 text-sm">Welcome back to InvoSutra</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-4 py-3 border rounded-lg  focus:ring-2 focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                  fieldErrors.email && touched.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 dark:border-slate-600 focus:ring-black"
                }`}
                placeholder="Enter your email"
              />
            </div>
            {fieldErrors.email && touched.email && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 ${
                  fieldErrors.password && touched.password
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 dark:border-slate-600 focus:ring-black"
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 cursor-pointer" />
                ) : (
                  <Eye className="w-5 h-5 cursor-pointer" />
                )}
              </button>
            </div>
            {fieldErrors.password && touched.password && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="text-right -mt-2">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-700 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !isFormValid()}
            className={`w-full bg-gradient-to-r from-blue-950 to-blue-900 text-white py-3 px-4 rounded-lg font-medium
    hover:scale-105 transform transition-all duration-200 ease-in-out
    disabled:bg-gray-300 disabled:cursor-not-allowed
    flex items-center justify-center cursor-pointer group`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <GoogleLoginButton text="signin_with" />
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Don't have an account?{" "}
            <button
              className="text-black dark:text-slate-100 font-medium hover:underline cursor-pointer"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
