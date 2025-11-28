"use client";
import React from "react";
import Button from "./Button";

const Table = ({
  columns,
  data,
  size = "md",
  hoverable = false,
  caption,
  onRowClick,
  rowClassName,
  emptyMessage = "No data available",
  actions,
  actionsLabel = "Actions",
  actionsWidth = "120px",
}) => {
  const sizeClasses = {
    xs: "text-xxs",
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const cellPadding = {
    xxs: "px-2 py-.5",
    xs: "px-2 py-1",
    sm: "px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "px-5 py-3.5",
  };

  return (
    <div className='overflow-x-auto w-full'>
      <table className={`w-full border-collapse ${sizeClasses[size]}`}>
        {caption && (
          <caption className='text-left p-3 font-semibold text-text'>
            {caption}
          </caption>
        )}

        <thead>
          <tr className='bg-background border-b-2 border-border'>
            {columns.map((column) => (
              <th
                key={column.name}
                className={`${cellPadding[size]} text-left font-semibold text-text`}
              >
                <div className='flex items-center gap-1'>
                  {column.label}
                  {column.sortable && column.onSort && (
                    <Button
                      size='xs'
                      variant='outline'
                      onClick={() => column.onSort(column.name)}
                      className='w-5'
                    >
                      {column.sortDirection === "asc"
                        ? "↑"
                        : column.sortDirection === "desc"
                        ? "↓"
                        : "↕"}
                    </Button>
                  )}
                </div>
              </th>
            ))}

            {actions && (
              <th
                className={`${cellPadding[size]} font-semibold text-text text-left`}
                style={{ width: actionsWidth }}
              >
                {actionsLabel}
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className={`${cellPadding[size]} text-center text-muted italic`}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const customRowClass = rowClassName
                ? rowClassName(row, index)
                : "";
              return (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={`${customRowClass} ${
                    hoverable ? "hover:bg-background" : ""
                  } border-b border-border transition-colors ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.name} className={cellPadding[size]}>
                      {column.render
                        ? column.render(row[column.name], row)
                        : row[column.name]}
                    </td>
                  ))}

                  {actions && (
                    <td className={`${cellPadding[size]}`}>{actions(row)}</td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
