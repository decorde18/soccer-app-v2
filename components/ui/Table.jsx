import React from "react";
import { cn } from "@/lib/utils";

/*<Table 
  columns={columns}
  data={data}
  actions={(row, index) => (
    <>
      <button 
        onClick={() => handleEdit(row)}
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit
      </button>
      <button 
        onClick={() => handleDelete(row)}
        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Delete
      </button>
    </>
  )}
  actionsLabel="Actions"
  actionsWidth="200px"
/>*/
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
  const sizeClasses = {
    sm: "text-[var(--font-size-small)]",
    md: "text-[var(--font-size-base)]",
    lg: "text-[var(--font-size-large)]",
  };

  const cellPadding = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "px-5 py-3.5",
  };

  const tableClasses = cn(
    "w-full border-collapse",
    sizeClasses[size],
    bordered && "border border-[hsl(var(--color-border))]",
    className
  );

  const headerClasses = cn(
    "bg-[hsl(var(--color-background-secondary))]",
    "text-[hsl(var(--color-text-label))]",
    "font-semibold",
    "text-left",
    bordered && "border-b-2 border-[hsl(var(--color-border))]",
    headerClassName
  );

  const getRowClasses = (index) => {
    const classes = [
      "transition-colors duration-150",
      bordered && "border-b border-[hsl(var(--color-border))]",
    ];

    if (striped && index % 2 === 1) {
      classes.push("bg-[hsl(var(--color-background-secondary)/.3)]");
    }

    if (hoverable) {
      classes.push(
        "hover:bg-[hsl(var(--color-background-secondary)/.5)]",
        onRowClick && "cursor-pointer"
      );
    }

    if (typeof rowClassName === "function") {
      classes.push(rowClassName(index));
    } else if (rowClassName) {
      classes.push(rowClassName);
    }

    return cn(classes);
  };

  const getCellClasses = (columnKey, isHeader = false) => {
    const classes = [cellPadding[size]];

    if (typeof cellClassName === "function") {
      classes.push(cellClassName(columnKey, isHeader));
    } else if (cellClassName) {
      classes.push(cellClassName);
    }

    return cn(classes);
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
    <div className='overflow-x-auto'>
      <table className={tableClasses}>
        {caption && (
          <caption className='text-[hsl(var(--color-text-label))] text-[var(--font-size-small)] mb-2 text-left font-medium'>
            {caption}
          </caption>
        )}
        <thead className={headerClasses}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  getCellClasses(column.key, true),
                  column.headerClassName
                )}
                style={{ width: column.width }}
              >
                {column.label}
              </th>
            ))}
            {actions && (
              <th
                className={cn(getCellClasses("actions", true))}
                style={{ width: actionsWidth }}
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
                className={cn(
                  "text-center text-[hsl(var(--color-text-secondary))]",
                  cellPadding[size]
                )}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                className={getRowClasses(index)}
                onClick={() => handleRowClick(row, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      getCellClasses(column.key, false),
                      column.cellClassName
                    )}
                  >
                    {renderCellContent(row, column)}
                  </td>
                ))}
                {actions && (
                  <td
                    className={cn(getCellClasses("actions", false))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className='flex gap-2 items-center'>
                      {actions(row, index)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
