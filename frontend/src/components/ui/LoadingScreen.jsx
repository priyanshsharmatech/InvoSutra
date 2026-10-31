import { Loader2 } from "lucide-react";
import LogoMark from "./LogoMark";

// Full-screen branded loading state, used while auth status is being checked.
const LoadingScreen = ({ message = "Loading your workspace..." }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <LogoMark size={56} className="shadow-lg" />
      <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-spin mt-6" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4">{message}</p>
    </div>
  );
};

export default LoadingScreen;
