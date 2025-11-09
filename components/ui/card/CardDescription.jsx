// components/ui/CardDescription.jsx
/**
 * Card Description Component
 */
export function CardDescription({ children, className = "" }) {
  return <p className={`text-sm text-muted mt-1 ${className}`}>{children}</p>;
}
