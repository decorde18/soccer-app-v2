// components/ui/CardContent.jsx
/**
 * Card Content Component
 */
export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

// components/ui/CardFooter.jsx
/**
 * Card Footer Component
 */
export function CardFooter({ children, className = "" }) {
  return (
    <div className={`mt-4 pt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
