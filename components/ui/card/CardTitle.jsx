// components/ui/CardTitle.jsx
/**
 * Card Title Component
 */
export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`font-semibold text-lg text-text ${className}`}>
      {children}
    </h3>
  );
}
