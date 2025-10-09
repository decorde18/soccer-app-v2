import React from "react";

import { useFormClasses } from "@/lib/useFormClasses";
import { cn } from "@/lib/utils";

export default function Select({
  label,
  options = [],
  size = "md",
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  const selectClasses = useFormClasses({ size, disabled, error, className });

  return (
    <div className='flex flex-col mb-2'>
      {label && (
        <label
          className={cn(
            "font-medium mb-1 text-[var(--font-size-small)]",
            error
              ? "text-[hsl(var(--color-danger))]"
              : "text-[hsl(var(--color-text-label))]"
          )}
        >
          {label}
        </label>
      )}
      <select disabled={disabled} className={selectClasses} {...props}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
    </div>
  );
}
