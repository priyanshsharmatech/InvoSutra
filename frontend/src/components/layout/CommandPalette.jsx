import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LayoutDashboard,
  FileText,
  Contact,
  Repeat,
  BarChart3,
  User,
  Plus,
  FileEdit,
  FilePlus2,
} from "lucide-react";
import useFocusTrap from "../../hooks/useFocusTrap";

// A ⌘K / Ctrl+K command palette for fast navigation and quick actions.
const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();
  useFocusTrap(ref, open, () => setOpen(false));

  const commands = useMemo(
    () => [
      { label: "Go to Dashboard", icon: LayoutDashboard, hint: "Go", action: () => navigate("/dashboard") },
      { label: "Go to Invoices", icon: FileText, hint: "Go", action: () => navigate("/invoices") },
      { label: "Go to Clients", icon: Contact, hint: "Go", action: () => navigate("/clients") },
      { label: "Go to Recurring", icon: Repeat, hint: "Go", action: () => navigate("/recurring") },
      { label: "Go to Reports", icon: BarChart3, hint: "Go", action: () => navigate("/reports") },
      { label: "Go to Profile", icon: User, hint: "Go", action: () => navigate("/profile") },
      { label: "New Invoice", icon: Plus, hint: "Create", action: () => navigate("/invoices/new?type=invoice") },
      { label: "New Quotation", icon: FileEdit, hint: "Create", action: () => navigate("/invoices/new?type=estimate") },
      { label: "New Proforma Invoice", icon: FilePlus2, hint: "Create", action: () => navigate("/invoices/new?type=proforma") },
      { label: "New Purchase Order", icon: FilePlus2, hint: "Create", action: () => navigate("/invoices/new?type=purchaseorder") },
    ],
    [navigate]
  );

  // Global shortcut: Cmd/Ctrl + K toggles the palette.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? commands.filter((c) => c.label.toLowerCase().includes(t)) : commands;
  }, [q, commands]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  const run = (cmd) => {
    setOpen(false);
    setQ("");
    cmd.action();
  };

  const onInputKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) run(filtered[active]);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4 bg-slate-900/40 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-slate-200/60 dark:ring-slate-700 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Type a command or search…"
            aria-label="Command palette search"
            className="flex-1 h-12 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
          <kbd className="text-[10px] font-medium text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5">
            Esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
              No matching commands
            </li>
          ) : (
            filtered.map((c, i) => (
              <li key={c.label}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                    i === active
                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  <c.icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                  <span className="flex-1">{c.label}</span>
                  {c.hint && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{c.hint}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
