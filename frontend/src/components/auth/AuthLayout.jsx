import { Sparkles, FileText, Repeat, BarChart3 } from "lucide-react";
import LogoMark from "../ui/LogoMark";

const FEATURES = [
  { icon: Sparkles, text: "Create invoices from plain text with AI" },
  { icon: FileText, text: "GST-ready invoices, quotations & more" },
  { icon: Repeat, text: "Recurring billing & automatic reminders" },
  { icon: BarChart3, text: "Clear reports on revenue & dues" },
];

// Split-screen shell for the auth pages: a branded gradient panel on the left
// (desktop only) and the form card centered on the right. The whole thing is a
// single hidden-scrollbar scroll container so tall forms scroll cleanly.
const AuthLayout = ({ children }) => {
  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white p-12 flex-col justify-between">
        {/* decorative glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <LogoMark size={40} />
          <span className="text-2xl font-bold tracking-tight">InvoSutra</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">
            Invoicing,
            <br />
            made effortless.
          </h2>
          <p className="mt-4 text-blue-100/80 max-w-md leading-relaxed">
            Create, send and track professional invoices with AI doing the
            busywork, so you get paid faster.
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-blue-200" />
                </span>
                <span className="text-sm text-blue-50/90">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-blue-200/60">
          © {new Date().getFullYear()} InvoSutra. All rights reserved.
        </p>
      </div>

      {/* Form area — the scroll container, so tall forms scroll from the top */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar">
        <div className="min-h-full flex items-center justify-center px-4 py-8 sm:py-12">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
