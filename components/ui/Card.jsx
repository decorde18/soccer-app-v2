// components/ui/Card.jsx
/*
Usage:
<Card
  header='HEADER'
  title='TITLE'
  subTitle='SUBTITLE'
  description='DESCRIPTION'
  footer='FOOTER'
  icon='🎯'
  variant='hover'
  padding='md'
  shadow={true}
  className='custom-class'
>
  CHILDREN
</Card>
*/

/**
 * Reusable Card Component
 * @param {string} variant - 'default' | 'hover' | 'clickable' | 'outlined'
 * @param {string} padding - 'none' | 'sm' | 'md' | 'lg'
 * @param {boolean} shadow - Enable shadow
 * @param {function} onClick - Click handler (makes card clickable)
 * @param {string} className - Additional classes
 * @param {React.ReactNode} header - Optional header content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {string} title - Card title
 * @param {string} subTitle - Card subtitle
 * @param {string} description - Card description
 * @param {React.ReactNode} icon - Optional icon
 */
export function Card({
  children,
  variant = "default",
  padding = "md",
  shadow = false,
  onClick,
  className = "",
  header,
  footer,
  title,
  subTitle,
  description,
  icon,
  ...props
}) {
  const variants = {
    default: "bg-background border border-border",
    hover:
      "bg-background border border-border hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
    clickable:
      "bg-background border border-border hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer",
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

  const hasHeaderContent = header || icon || title || subTitle || description;

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
      {/* Optional Header Section */}
      {header && (
        <div className='mb-4 pb-4 border-b border-border'>{header}</div>
      )}

      {/* Title/Icon Section */}
      {hasHeaderContent && !header && (
        <div className='mb-4'>
          {(icon || title) && (
            <div className='flex items-center gap-3 mb-2'>
              {icon && <span className='text-3xl'>{icon}</span>}
              {title && (
                <div className='flex-1'>
                  <h3 className='font-semibold text-lg text-text'>{title}</h3>
                  {subTitle && (
                    <p className='text-sm text-muted mt-0.5'>
                      HEREEE{subTitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {description && <p className='text-sm text-muted'>{description}</p>}
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* Optional Footer Section */}
      {footer && (
        <div className='mt-4 pt-4 border-t border-border'>{footer}</div>
      )}
    </div>
  );
}
