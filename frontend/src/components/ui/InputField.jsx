import React from "react";

const InputField = ({ icon: Icon, label, name, error, ...props }) => {
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
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <input
          id={name}
          name={name}
          {...props}
          className={`w-full h-10 pr-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 dark:border-slate-600 focus:ring-blue-500"
          } ${Icon ? "pl-10" : "pl-3"}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default InputField;
