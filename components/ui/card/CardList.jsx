// components/ui/CardList.jsx
/**
 * Responsive Card List Container (stacked cards)
 * @param {string} gap - Gap size: 'sm' | 'md' | 'lg'
 * @param {string} className - Additional classes
 */
export function CardList({ children, gap = "md", className = "" }) {
  const gaps = {
    sm: "space-y-2",
    md: "space-y-3",
    lg: "space-y-4",
  };

  return <div className={`${gaps[gap]} ${className}`}>{children}</div>;
}
