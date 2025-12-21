import React from "react";

import { useFormClasses } from "@/hooks/useFormClasses";
import { cn } from "@/lib/utils";

export default function Input({
  label,
  size = "md",
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  const inputClasses = useFormClasses({ size, disabled, error, className });

  return (
    <div className='flex flex-col mb-2'>
      {label && (
        <label
          className={cn(
            "font-medium mb-1 text-[var(--font-size-small)]",
            error ? "text-danger" : "text-text-label"
          )}
        >
          {label}
        </label>
      )}
      <input disabled={disabled} className={inputClasses} {...props} />
    </div>
  );
}
