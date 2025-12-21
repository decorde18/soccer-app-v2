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
    "inline-flex flex-col items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-95 mb-0 select-none shadow-sm";
  const sizes = {
    xs: "text-[0.7rem] px-1.5 py-0.5",

    sm: "text-xs px-2 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  const variants = {
    primary: "bg-primary text-white hover:bg-accent-hover shadow-primary/20",
    success: "bg-success text-white hover:opacity-90 shadow-success/20",
    muted: "bg-muted text-white cursor-not-allowed border-none",
    outline: "border-2 border-border text-text hover:bg-background",
    danger: "border border-border bg-danger text-white hover:opacity-90",
    secondary: "bg-secondary text-white hover:opacity-90",
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
