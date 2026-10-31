import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProfileDropDown from "./ProfileDropDown";
import LogoMark from "../ui/LogoMark";
import GlobalSearch from "./GlobalSearch";
import CommandPalette from "./CommandPalette";
import ThemeToggle from "../ui/ThemeToggle";
import { NAVIGATION_MENU } from "../../utils/data";

const NavigationItem = ({ item, isActive, onClick, isCollapsed }) => {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onClick(item.id)}
      className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
        isActive
          ? "bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-blue-300 shadow-sm shadow-blue-50 dark:shadow-none"
          : "text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-slate-100"
      } cursor-pointer`}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${
          isActive ? "text-blue-900 dark:text-blue-300" : "text-gray-500 dark:text-slate-400"
        }`}
      />
      {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
    </button>
  );
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDeopdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Derive the active nav item from the current route so it stays correct no
  // matter how the user navigated (clicks, buttons, links, back/forward, deep
  // links). Prefer an exact match (e.g. /invoices/new), else the longest
  // matching prefix (e.g. /invoices/:id -> "invoices").
  const activeNavItem = (() => {
    const exact = NAVIGATION_MENU.find((m) => pathname === `/${m.id}`);
    if (exact) return exact.id;
    const prefix = NAVIGATION_MENU.filter((m) =>
      pathname.startsWith(`/${m.id}`)
    ).sort((a, b) => b.id.length - a.id.length)[0];
    return prefix?.id || null;
  })();

  // Handle responsive behaviour
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (profileDropdownOpen) {
        setProfileDeopdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [profileDropdownOpen]);

  const handleNavigation = (itemId) => {
    navigate(`/${itemId}`);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarCollapsed = !isMobile && false;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <CommandPalette />
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform ${
          isMobile
            ? sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        } ${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-white/50 dark:border-slate-700 shadow-sm`}
      >
        {/* Company Logo */}
        <div className="flex items-center h-16 border-b border-slate-200/60 dark:border-slate-700 px-6">
          <Link className="flex items-center space-x-3" to="/dashboard">
            <LogoMark size={34} />
            {!sidebarCollapsed && (
              <span className="text-gray-900 dark:text-slate-100 font-bold text-xl">InvoSutra</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {NAVIGATION_MENU.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={activeNavItem === item.id}
              onClick={handleNavigation}
              isCollapsed={sidebarCollapsed}
            />
          ))}
        </nav>

      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 bg-opacity-25 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isMobile ? "ml-0" : sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Top navbar */}
        <header className="bg-white/60 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-3 min-w-0">
            {isMobile && (
              <button
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors duration-200 cursor-pointer flex-shrink-0"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                )}
              </button>
            )}

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 hidden sm:block">
                Here's your invoice overview.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <GlobalSearch />
            <ThemeToggle />
            {/* Profile dropdown or other icons */}
            <ProfileDropDown
              isOpen={profileDropdownOpen}
              onToggle={(e) => {
                e.stopPropagation();
                setProfileDeopdownOpen(!profileDropdownOpen);
              }}
              avatar={user?.avatar || ""}
              companyName={user?.name || ""}
              email={user?.email || ""}
              onLogout={logout}
            />
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 no-scrollbar min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
