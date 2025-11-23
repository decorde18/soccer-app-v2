"use client";
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
    <div className='flex items-center gap-3'>
      <button
        type='button'
        onClick={() => !disabled && onChange && onChange(!checked)}
        disabled={disabled}
        className={cn(
          "relative w-12 p-0 px-1 m-2 h-[24px] rounded-full transition-colors duration-300",
          checked ? "bg-primary" : "bg-border",
          disabled && "opacity-60 cursor-not-allowed",
          className
        )}
      >
        <span
          className={cn(
            "absolute top-[1px] left-[1px] h-5 w-5 rounded-full bg-surface transition-transform duration-300 shadow-sm",
            checked && "translate-x-[24px]"
          )}
        />
      </button>

      {label && <span className='text-sm text-text-label'>{label}</span>}
    </div>
  );
}
