import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// A custom, fully-styled dropdown (replaces native <select> so the open menu
// can be themed). Closes on outside click or Escape.
const Dropdown = ({ value, onChange, options, className = "", buttonClassName = "", direction = "down" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full h-10 pl-3 pr-9 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          open ? "border-blue-500 ring-2 ring-blue-500" : "border-slate-300 dark:border-slate-600 hover:border-slate-400"
        } ${buttonClassName}`}
      >
        {selected?.label}
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute z-20 w-full min-w-max bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg ring-1 ring-slate-200/60 dark:ring-slate-700 p-1 ${
            direction === "up" ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-6 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
