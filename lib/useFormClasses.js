import { cn } from "@/lib/utils";

export const useFormClasses = ({
  size = "md",
  disabled = false,
  error = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "text-sm py-[var(--padding-small)]",
    md: "text-base py-[var(--padding-medium)]",
    lg: "text-lg py-[var(--padding-large)]",
  };

  return cn(
    "px-[var(--padding-medium)] rounded-[var(--radius-default)] border border-[hsl(var(--color-border))] w-full focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-2 focus:ring-[hsl(var(--color-primary)/0.3)] bg-[hsl(var(--color-surface))] text-[hsl(var(--color-text))]",
    sizeClasses[size],
    disabled && "opacity-60 cursor-not-allowed",
    error && "border-[hsl(var(--color-danger))]",
    className
  );
};
