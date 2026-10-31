import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import LogoMark from "../ui/LogoMark";
import ProfileDropDown from "../layout/ProfileDropDown";
import Button from "../ui/Button";
import ThemeToggle from "../ui/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();

  const navigate = useNavigate();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-700 ${
        isScrolled ? "bg-white/80 dark:bg-slate-900/80 shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <div className="flex items-center space-x-2">
            <LogoMark size={34} />
            <span className="text-xl font-bold text-gray-900 dark:text-slate-100">InvoSutra</span>
          </div>
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            <a
              href="#features"
              className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
            >
              FAQ
            </a>
          </div>
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <ProfileDropDown
                isOpen={profileDropdownOpen}
                onToggle={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                avatar={user?.avatar || ""}
                companyName={user?.name || ""}
                email={user?.email || ""}
                onLogout={logout}
              />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-black dark:text-slate-100 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-blue-950 to-blue-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  Signup
                </Link>
              </>
            )}
          </div>
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 " />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/50 dark:border-slate-700 shadow-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="#features"
              className="block px-4 py-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="block px-4 py-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors duration-200"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="block px-4 py-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors duration-200"
            >
              FAQ
            </a>
            <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
            {isAuthenticated ? (
              <div className="p-4">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block w-full text-left bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
