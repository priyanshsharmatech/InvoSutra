import React from "react";

const TextareaField = ({ icon: Icon, label, name, ...props }) => {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <textarea
          id={name}
          name={name}
          rows={3}
          {...props}
          className={`w-full min-h-[100px] pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            Icon ? "pl-10" : "pl-3"
          }`}
        ></textarea>
      </div>
    </div>
  );
};

export default TextareaField;
