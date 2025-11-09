// components/ui/CardGrid.jsx
/**
 * Responsive Card Grid Container
 * @param {number} cols - Number of columns on large screens (1-6)
 * @param {string} gap - Gap size: 'sm' | 'md' | 'lg'
 * @param {string} className - Additional classes
 */
export function CardGrid({ children, cols = 3, gap = "md", className = "" }) {
  const colsMap = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };

  const gaps = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={`
        grid grid-cols-1 sm:grid-cols-2 ${colsMap[cols]}
        ${gaps[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
