import { cn } from "@/lib/utils";
import React from "react";

export default function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "outline"
  size = "md",
  disabled = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-default)] font-semibold transition-colors duration-200";

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const variants = {
    primary:
      "bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-accent-hover))]",
    secondary: "bg-[hsl(var(--color-secondary))] text-white hover:opacity-90",
    outline:
      "border border-[hsl(var(--color-border))] text-[hsl(var(--color-text))] hover:bg-[hsl(var(--color-background))]",
  };

  return (
    <button
      disabled={disabled}
      className={cn(
        base,
        sizes[size],
        variants[variant],
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
