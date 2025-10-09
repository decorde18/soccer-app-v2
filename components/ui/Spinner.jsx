import React from "react";

// Define maps for Tailwind class variants
const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
  xl: "h-16 w-16 border-8",
};

const colorMap = {
  // These should correspond to the colors configured in your tailwind.config.js
  primary: "border-primary",
  white: "border-white",
  // Using a default Tailwind color for flexibility
  blue: "border-blue-500",
};

/**
 * A customizable loading spinner component using Tailwind CSS.
 * @param {object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - The size of the spinner.
 * @param {'primary' | 'white' | 'blue'} [props.color='primary'] - The color of the spinner.
 * @param {string} [props.className=''] - Additional Tailwind classes to apply.
 */
const Spinner = ({ size = "md", color = "primary", className = "" }) => {
  // Ensure we fall back to a default if an invalid prop is passed
  const selectedSize = sizeMap[size] || sizeMap.md;
  const selectedColor = colorMap[color] || colorMap.primary;

  const spinnerClasses = [
    "rounded-full",
    "animate-spin",
    selectedSize,
    selectedColor,
    // The top border needs a transparent color to create the gap effect
    "border-t-transparent",
    className,
  ].join(" ");

  return (
    <div className={spinnerClasses} role='status' aria-label='Loading'>
      {/* Screen reader only text for accessibility */}
      <span className='sr-only'>Loading...</span>
    </div>
  );
};
export default Spinner;
