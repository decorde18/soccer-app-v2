"use client";
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
    "inline-flex items-center justify-center rounded-DEFAULT font-semibold transition-colors duration-200 mb-0";

  const sizes = {
    xs: "text-[0.7rem] px-1.5 py-0.5",

    sm: "text-xs px-2 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-accent-hover",
    secondary: "bg-secondary text-white hover:opacity-90",
    success: "border border-border bg-success text-white hover:opacity-80",
    danger: "border border-border bg-danger text-white hover:opacity-90",
    muted: "border border-border bg-muted text-white hover:bg-background",
    outline: "border border-border text-text hover:bg-background",
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
