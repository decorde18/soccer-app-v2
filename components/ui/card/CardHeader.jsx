// components/ui/CardHeader.jsx
/**
 * Card Header Component
 */
export function CardHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}
