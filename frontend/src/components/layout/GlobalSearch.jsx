import { useState, useEffect, useRef } from "react";
import { Search, Loader2, FileText, Contact, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { docTypeMeta } from "../../utils/docTypes";

// Header global search across invoices + clients. Inline on desktop; opens a
// full-width overlay on mobile.
const GlobalSearch = () => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false); // desktop dropdown
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await axiosInstance.get(API_PATHS.SEARCH, { params: { q } });
        setResults(r.data);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const go = (path) => {
    setOpen(false);
    setMobileOpen(false);
    setQ("");
    setResults(null);
    navigate(path);
  };

  const hasResults =
    results && (results.invoices?.length || results.clients?.length);

  // Shared results list (used by both the desktop dropdown and mobile overlay).
  const ResultsList = () =>
    !hasResults ? (
      <p className="px-3 py-3 text-sm text-slate-400 dark:text-slate-500">
        No matches.
      </p>
    ) : (
      <>
        {results.invoices?.length > 0 && (
          <div>
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Documents
            </p>
            {results.invoices.map((inv) => (
              <button
                key={inv._id}
                onClick={() => go(`/invoices/${inv._id}`)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-100 flex-shrink-0">
                  {inv.invoiceNumber}
                </span>
                <span className="text-slate-500 dark:text-slate-400 truncate min-w-0">
                  {inv.billTo?.clientName}
                </span>
                <span className="ml-auto pl-2 flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                  {docTypeMeta(inv.type).name}
                </span>
              </button>
            ))}
          </div>
        )}
        {results.clients?.length > 0 && (
          <div>
            <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clients
            </p>
            {results.clients.map((c) => (
              <button
                key={c._id}
                onClick={() => go("/clients")}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
              >
                <Contact className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-800 dark:text-slate-100 flex-shrink-0">
                  {c.clientName}
                </span>
                {c.email && (
                  <span className="text-slate-400 dark:text-slate-500 truncate min-w-0">
                    {c.email}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </>
    );

  return (
    <>
      {/* Desktop inline search */}
      <div className="relative hidden sm:block" ref={ref}>
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search invoices, clients…"
          aria-label="Global search"
          className="w-52 md:w-72 h-10 pl-9 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white/80 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {loading && (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
        {open && results && (
          <div className="absolute left-0 right-0 mt-2 w-full max-h-96 overflow-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700 p-1 z-50">
            <ResultsList />
          </div>
        )}
      </div>

      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Search"
        className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800/60 text-gray-600 dark:text-slate-300 transition-colors cursor-pointer"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search invoices, clients…"
                aria-label="Global search"
                className="flex-1 min-w-0 h-10 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              {loading && (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin flex-shrink-0" />
              )}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close search"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {results && (
              <div className="mt-2 max-h-[60vh] overflow-auto border-t border-slate-100 dark:border-slate-700 pt-2">
                <ResultsList />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
