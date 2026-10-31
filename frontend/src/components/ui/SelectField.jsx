import { ChevronDown } from "lucide-react";

const SelectField = ({ label, name, options, error, ...props }) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={name}
          name={name}
          {...props}
          className={`w-full h-10 pl-3 pr-10 py-2 border rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 appearance-none cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400 focus:ring-blue-500"
          }`}
        >
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default SelectField;
