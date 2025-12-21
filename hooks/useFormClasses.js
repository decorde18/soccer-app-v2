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
    "px-[var(--padding-medium)] rounded-[var(--radius-default)] border border-border w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-[hsl(var(--color-primary)/0.3)] bg-surface text-text",
    sizeClasses[size],
    disabled && "opacity-60 cursor-not-allowed",
    error && "border-danger",
    className
  );
};
