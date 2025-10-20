// Table.jsx - Rewritten to use inline styling
const CLASS_STYLE_MAP = {
  // Map Tailwind classes to specific inline styles for reliable rendering
  "bg-red-100": { backgroundColor: "#fee2e2" },
  "bg-green-100": { backgroundColor: "#dcfce7" },
  // Add other critical dynamic classes here
};
import React from "react";
// cn utility is kept for structure but its output will mostly be inline styles now
import { cn } from "@/lib/utils";

export default function Table({
  columns = [],
  data = [],
  size = "md",
  striped = false,
  hoverable = true,
  bordered = false,
  className = "",
  caption,
  emptyMessage = "No data available",
  onRowClick,
  headerClassName = "",
  bodyClassName = "",
  rowClassName,
  cellClassName,
  actions,
  actionsLabel = "Actions",
  actionsWidth,
}) {
  const sizeStyles = {
    xs: { fontSize: "var(--font-size-small)" },
    sm: { fontSize: "var(--font-size-small)" },
    md: { fontSize: "var(--font-size-base)" },
    lg: { fontSize: "var(--font-size-large)" },
  };

  const cellPadding = {
    xs: { padding: "2px 8px" }, // px-2 py-0.5
    sm: { padding: "6px 12px" }, // px-3 py-1.5
    md: { padding: "10px 16px" }, // px-4 py-2.5
    lg: { padding: "14px 20px" }, // px-5 py-3.5
  };

  const borderStyle = bordered
    ? { border: "1px solid hsl(var(--color-border))" }
    : {};
  const headerBaseStyle = {
    backgroundColor: "hsl(var(--color-background))",
    color: "hsl(var(--color-text-label))",
    fontWeight: "600",
    textAlign: "left",
    position: "sticky",
    top: 0,
    zIndex: 10,
    borderBottom: bordered ? "2px solid hsl(var(--color-border))" : "none",
  };

  // Helper to merge padding and custom inline styles/classes
  const getCellStyles = (columnKey, isHeader = false) => {
    let style = { ...cellPadding[size] };

    // Apply custom inline styles if provided via cellClassName (function or string not supported for pure inline)
    // For simplicity, we only include padding and basic structure here.

    return style;
  };

  const renderCellContent = (row, column) => {
    if (column.render) {
      return column.render(row[column.key], row);
    }
    return row[column.key];
  };

  const handleRowClick = (row, index) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  return (
    <div className='overflow-y-auto'>
      {caption && (
        <div
          style={{
            color: "hsl(var(--color-text-label))",
            fontSize: "var(--font-size-small)",
            marginBottom: "8px",
            textAlign: "left",
            fontWeight: "500",
          }}
        >
          {caption}
        </div>
      )}

      <table
        style={{
          ...sizeStyles[size],
          ...borderStyle,
          width: "100%",
          borderCollapse: "collapse",
        }}
        className={className} // Keeping className for outer customizations
      >
        <thead
          style={headerBaseStyle}
          className={cn("shadow-sm", headerClassName)} // Keeping classNames for utility classes like shadow
        >
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...getCellStyles(column.key, true),
                  width: column.width,
                }}
                className={column.headerClassName}
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th
                style={{
                  ...getCellStyles("actions", true),
                  width: actionsWidth,
                }}
              >
                {actionsLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                style={{
                  textAlign: "center",
                  color: "hsl(var(--color-text-secondary))",
                  fontStyle: "italic",
                  ...cellPadding[size],
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              // Row base styling
              let rowStyle = {
                verticalAlign: "middle",
                transition: "background-color 150ms ease-in-out",
                borderBottom: bordered
                  ? "1px solid hsl(var(--color-border))"
                  : "none",
              };

              if (striped && index % 2 === 1) {
                rowStyle.backgroundColor =
                  "hsl(var(--color-background-secondary)/.3)";
              }

              if (hoverable) {
                // Cannot directly simulate hover:bg inline, this feature is lost.
                // You'd need a component with state for true hover effects.
                if (onRowClick) {
                  rowStyle.cursor = "pointer";
                }
              }

              // Apply custom rowClassName (function or string)
              let dynamicClasses = "";

              // Apply custom rowClassName
              if (typeof rowClassName === "function") {
                dynamicClasses = rowClassName(row, index);
              } else if (rowClassName) {
                dynamicClasses = rowClassName;
              }
              // --- NEW: Process dynamicClasses and apply inline style ---
              if (dynamicClasses) {
                // Split classes if multiple are passed (though usually just one here)
                const classes = dynamicClasses.split(/\s+/).filter((c) => c);

                classes.forEach((cls) => {
                  if (CLASS_STYLE_MAP[cls]) {
                    // Merge mapped styles, allowing the map to override default rowStyle
                    rowStyle = { ...rowStyle, ...CLASS_STYLE_MAP[cls] };
                  }
                  // If the class is NOT in the map, it's ignored for inline styling
                });
              }

              return (
                <tr
                  key={row.id || index}
                  style={rowStyle}
                  // Keep className here to apply non-critical classes (like hover styles)
                  className={dynamicClasses}
                  onClick={() => handleRowClick(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={getCellStyles(column.key, false)}
                      className={column.cellClassName}
                    >
                      {renderCellContent(row, column)}
                    </td>
                  ))}

                  {actions && (
                    <td
                      style={{
                        ...getCellStyles("actions", false),
                        padding: 0,
                        verticalAlign: "middle",
                        width: actionsWidth,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-center gap-2 h-full min-h-[2rem] px-2'>
                        {actions(row, index)}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
