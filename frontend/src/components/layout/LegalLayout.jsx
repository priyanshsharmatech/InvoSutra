import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LogoMark from "../ui/LogoMark";

// Shared layout for legal/content pages (Terms, Privacy).
const LegalLayout = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/50 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <LogoMark size={32} />
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">InvoSutra</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </header>

      {/* Content card */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 shadow-sm p-6 sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
          {lastUpdated && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
          <div className="legal-prose mt-8 space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

// Small helpers for consistent section styling.
export const Section = ({ heading, children }) => (
  <section>
    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{heading}</h2>
    <div className="space-y-3 text-sm sm:text-[15px]">{children}</div>
  </section>
);

export default LegalLayout;
