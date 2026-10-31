import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n) => String(n).padStart(2, "0");
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parse = (s) => {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const fmtDisplay = (d) =>
  d
    ? d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// A modern, dependency-free date picker. Trigger shows the formatted date; the
// calendar opens in a portal (so it is never clipped) and flips upward near the
// bottom of the viewport. Value in/out is a "YYYY-MM-DD" string.
const DatePicker = ({
  value,
  onChange,
  min,
  max,
  placeholder = "Select date",
  disabled = false,
  id,
  className = "",
}) => {
  const selected = parse(value);
  const minD = parse(min);
  const maxD = parse(max);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(selected || new Date());
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const popH = 340;
    const popW = 288;
    const openUp = r.bottom + popH > window.innerHeight && r.top > popH;
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - popW - 8)),
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
    });
  };

  const openCal = () => {
    if (disabled) return;
    setView(selected || new Date());
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onReflow = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
    };
  }, [open]);

  const cells = useMemo(() => {
    const startDow = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const daysInMonth = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0
    ).getDate();
    const out = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(new Date(view.getFullYear(), view.getMonth(), d));
    }
    return out;
  }, [view]);

  const isDisabled = (d) =>
    (minD && d < minD) || (maxD && d > maxD);

  const pick = (d) => {
    if (isDisabled(d)) return;
    onChange(toStr(d));
    setOpen(false);
  };

  const today = stripTime(new Date());

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        id={id}
        onClick={openCal}
        disabled={disabled}
        className={`w-full h-10 px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm text-left flex items-center justify-between gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          open
            ? "border-blue-500 ring-2 ring-blue-500"
            : "border-slate-300 dark:border-slate-600 hover:border-slate-400"
        } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      >
        <span
          className={
            selected
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"
          }
        >
          {selected ? fmtDisplay(selected) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={popRef}
            style={{ position: "fixed", left: pos.left, top: pos.top, bottom: pos.bottom }}
            className="w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 ring-1 ring-slate-200/60 dark:ring-slate-700 p-3 z-[70] animate-slide-down origin-top"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-1"
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isSel = sameDay(d, selected);
                const isToday = sameDay(d, today);
                const dis = isDisabled(d);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={dis}
                    onClick={() => pick(d)}
                    className={`h-8 w-full rounded-lg text-sm transition-colors ${
                      isSel
                        ? "bg-blue-600 text-white font-semibold"
                        : dis
                        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        : isToday
                        ? "text-blue-600 dark:text-blue-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
                    }`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => pick(today)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/15 cursor-pointer"
              >
                Today
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default DatePicker;
