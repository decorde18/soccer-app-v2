import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Select({
  label,
  options = [],
  disabled = false,
  error = false,
  className = "",
  width = "auto", // "auto", "sm", "md", "lg", "full"
  placeholder = "Select an option",
  showPlaceholder = true,
  defaultValue,
  ...props
}) {
  const widthClasses = {
    auto: "w-auto",
    sm: "w-48",
    md: "w-64",
    lg: "w-80",
    full: "w-full",
  };

  return (
    <div className={cn("relative", widthClasses[width])}>
      <div className='relative'>
        <select
          disabled={disabled}
          defaultValue={defaultValue}
          className={cn(
            "appearance-none w-full px-4 py-2 rounded-md transition-colors border",
            "text-sm font-semibold",
            "cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed",
            error
              ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-900"
              : "bg-slate-50 hover:bg-slate-100 border-slate-200",
            label && "pt-5 pb-2",
            className
          )}
          {...props}
        >
          {showPlaceholder && (
            <option value='' disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt, i) => (
            <option key={i} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>

        {label && (
          <label className='absolute left-4 top-1.5 text-xs text-slate-500 pointer-events-none'>
            {label}
          </label>
        )}

        <ChevronDown
          size={16}
          className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
        />
      </div>
    </div>
  );
}
