import React from "react";

import { useFormClasses } from "@/lib/useFormClasses";
import { cn } from "@/lib/utils";

export default function Textarea({
  label,
  rows = 4,
  size = "md",
  disabled = false,
  error = false,
  className = "",
  ...props
}) {
  const textareaClasses = useFormClasses({ size, disabled, error, className });

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
      <textarea
        rows={rows}
        disabled={disabled}
        className={cn(textareaClasses, "resize-y")}
        {...props}
      />
    </div>
  );
}
