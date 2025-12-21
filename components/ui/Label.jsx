import React from "react";

import { cn } from "@/lib/utils";

export default function Label({
  children,
  error = false,
  className = "",
  ...props
}) {
  return (
    <label
      className={cn(
        "font-medium text-[var(--font-size-small)] mb-1 block",
        error ? "text-danger" : "text-text-label",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
