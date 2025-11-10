// components/ui/Card.jsx
/**
 * Reusable Card Component
 * @param {string} variant - 'default' | 'hover' | 'clickable' | 'outlined'
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 * @param {boolean} shadow - Enable shadow
 * @param {function} onClick - Click handler (makes card clickable)
 * @param {string} className - Additional classes
 */
export function Card({
  children,
  variant = "default",
  padding = "md",
  shadow = false,
  onClick,
  className = "",
  header = "",
  footer = "",
  title = "",
  description = "",
  icon,
  ...props
}) {
  const variants = {
    default: "bg-surface border border-border",
    hover:
      "bg-surface border border-border hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
    clickable:
      "bg-surface border border-border hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer",
    outlined: "bg-transparent border-2 border-border hover:border-primary/50",
  };

  const paddings = {
    none: "p-0",
    sm: "p-3",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const shadowClass = shadow ? "shadow-sm" : "";
  const clickableClass = onClick ? "cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl transition-all duration-200
        ${variants[variant]}
        ${paddings[padding]}
        ${shadowClass}
        ${clickableClass}
        ${className}
      `}
      {...props}
    >
      <div className='flex items-center gap-3 mb-4'>
        <span className='text-3xl'>{icon}</span>
        <h3 className={`font-semibold text-lg text-text ${className}`}>
          {title}
        </h3>
      </div>
      <p className='text-sm text-muted mt-1 '>{description}</p>
      {children}
      {footer && (
        <div className='mt-4 pt-4 border-t border-border'>{footer}</div>
      )}
    </div>
  );
}
