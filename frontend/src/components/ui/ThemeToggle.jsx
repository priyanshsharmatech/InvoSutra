import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getStoredTheme, toggleTheme } from "../../utils/theme";

// Light/dark toggle button for navbars.
const ThemeToggle = ({ className = "" }) => {
  const [theme, setTheme] = useState(getStoredTheme());
  return (
    <button
      type="button"
      onClick={() => setTheme(toggleTheme())}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title="Toggle theme"
      className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
