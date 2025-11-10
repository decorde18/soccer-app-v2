import React from "react";

// 12-column grid system
export const Grid = ({ children, gap = "4", className = "" }) => {
  const gapClass = `gap-${gap}`;
  return (
    <div className={`grid grid-cols-12 ${gapClass} w-full ${className}`}>
      {children}
    </div>
  );
};

// Grid column with dynamic span
export const GridColumn = ({
  children,
  span = 12,
  spanMobile = 12,
  spanTablet,
  className = "",
}) => {
  // Map to complete Tailwind classes (required for Tailwind purge)
  const spanMap = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  };

  const tabletSpanMap = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
  };

  const desktopSpanMap = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  };

  const colSpanMobile = spanMap[spanMobile] || "col-span-12";
  const colSpanTablet = spanTablet ? tabletSpanMap[spanTablet] : "";
  const colSpanDesktop = desktopSpanMap[span] || "lg:col-span-12";

  return (
    <div
      className={`${colSpanMobile} ${colSpanTablet} ${colSpanDesktop} ${className}`}
    >
      {children}
    </div>
  );
};

// Simple 2-column grid
export const GridTwo = ({ children, gap = "4", className = "" }) => {
  const gapClass = `gap-${gap}`;
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Simple 3-column grid
export const GridThree = ({ children, gap = "4", className = "" }) => {
  const gapClass = `gap-${gap}`;
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};

// Simple 4-column grid
export const GridFour = ({ children, gap = "4", className = "" }) => {
  const gapClass = `gap-${gap}`;
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${gapClass} ${className}`}
    >
      {children}
    </div>
  );
};

// Flex container
export const Flex = ({
  children,
  gap = "2",
  align = "center",
  justify = "start",
  direction = "row",
  wrap = false,
  className = "",
}) => {
  const gapClass = `gap-${gap}`;
  const alignMap = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };
  const justifyMap = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  const directionMap = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  };

  const alignClass = alignMap[align] || "items-center";
  const justifyClass = justifyMap[justify] || "justify-start";
  const directionClass = directionMap[direction] || "flex-row";
  const wrapClass = wrap ? "flex-wrap" : "flex-nowrap";

  return (
    <div
      className={`flex ${gapClass} ${alignClass} ${justifyClass} ${directionClass} ${wrapClass} ${className}`}
    >
      {children}
    </div>
  );
};
