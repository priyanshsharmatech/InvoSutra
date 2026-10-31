import { Check, Minus } from "lucide-react";

// A custom, animated checkbox: rounded box that fills blue with a pop-in
// checkmark when checked (or a dash when indeterminate). The real <input> is
// visually hidden but still drives state, focus, and accessibility.
const Checkbox = ({
  checked = false,
  indeterminate = false,
  onChange,
  ariaLabel,
  className = "",
}) => (
  <label
    className={`relative inline-flex items-center justify-center cursor-pointer focus-within:opacity-100 ${className}`}
  >
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={onChange}
      className="peer sr-only"
    />
    <span
      className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ease-out
        peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-slate-800
        ${
          checked || indeterminate
            ? "bg-blue-600 border-blue-600 shadow-sm shadow-blue-600/30"
            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-blue-400"
        }`}
    >
      {indeterminate ? (
        <Minus className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />
      ) : (
        <Check
          className={`w-3.5 h-3.5 text-white transition-transform duration-150 ease-out ${
            checked ? "scale-100" : "scale-0"
          }`}
          strokeWidth={3.5}
        />
      )}
    </span>
  </label>
);

export default Checkbox;
