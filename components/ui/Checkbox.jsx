import React from "react";

import { cn } from "@/lib/utils";

export default function Checkbox({
  label,
  checked,
  disabled = false,
  onChange,
  error = false,
  className = "",
}) {
  return (
    <label className='flex items-center gap-2 cursor-pointer mb-2'>
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-5 h-5 accent-[hsl(var(--color-primary))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]",
          disabled && "opacity-60 cursor-not-allowed",
          error && "border-[hsl(var(--color-danger))]",
          className
        )}
      />
      {label && (
        <span
          className={cn(
            "text-[var(--color-text-label)] text-[var(--font-size-small)]",
            error && "text-[hsl(var(--color-danger))]"
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
