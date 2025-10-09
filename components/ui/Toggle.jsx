import React from "react";

import { cn } from "@/lib/utils";

export default function Toggle({
  label,
  checked,
  disabled = false,
  onChange,
  className = "",
}) {
  return (
    <div className='flex items-center gap-3 mb-2'>
      <button
        type='button'
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative w-12 h-6 rounded-full transition-colors duration-300",
          checked
            ? "bg-[hsl(var(--color-primary))]"
            : "bg-[hsl(var(--color-border))]",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-[hsl(var(--color-surface))] transition-transform duration-300",
            checked && "translate-x-6"
          )}
        />
      </button>
      {label && (
        <span className='text-[var(--font-size-small)] text-[hsl(var(--color-text-label))]'>
          {label}
        </span>
      )}
    </div>
  );
}
