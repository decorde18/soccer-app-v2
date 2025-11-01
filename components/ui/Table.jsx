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
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const cellPadding = {
    xs: "px-2 py-1",
    sm: "px-3 py-1.5",
    md: "px-4 py-2.5",
    lg: "px-5 py-3.5",
  };

  return (
    <div className='overflow-x-auto w-full'>
      <table className={`w-full border-collapse ${sizeClasses[size]}`}>
        {caption && (
          <caption className='text-left p-3 font-semibold text-gray-700'>
            {caption}
          </caption>
        )}

        <thead>
          <tr className='bg-gray-50 border-b-2 border-gray-200'>
            {columns.map((column) => (
              <th
                key={column.name}
                className={`${cellPadding[size]} text-left font-semibold text-gray-700`}
              >
                <div className='flex items-center gap-1'>
                  {column.label}
                  {/* Sorting UI preserved if container injected sortable props */}
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

            {/* ACTIONS COLUMN (not sortable/filterable) */}
            {actions && (
              <th
                className={`${cellPadding[size]} font-semibold text-gray-700 text-left`}
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
                className={`${cellPadding[size]} text-center text-gray-400 italic`}
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
                    hoverable ? "hover:bg-gray-50" : ""
                  } border-b border-gray-200 transition-colors ${
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

                  {/* ACTION CELL */}
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
