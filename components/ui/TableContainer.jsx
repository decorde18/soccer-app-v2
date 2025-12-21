"use client";
import { useMemo, useState, useEffect } from "react";
import Table from "./Table";

const TableContainer = ({
  columns,
  data,
  enableFiltering = false,
  filterPlaceholder = "Search...",
  filterKeys = [],
  customFilter,
  enableSorting = false,
  defaultSortKey = null,
  defaultSortDirection = "asc",
  enablePagination = false,
  pageSize = 10,
  initialPage = 0, // Add initialPage prop (0-indexed)
  pageSizeOptions = [Math.max(pageSize, 10), 25, 50, 100],
  size = "md",
  onRowClick,
  rowClassName,
  caption,
  hoverable = false,
  emptyMessage = "No data available",
  actions,
  actionsLabel = "Actions",
  actionsWidth = "100px",
  children,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage + 1); // Convert to 1-indexed
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortKey, setSortKey] = useState(defaultSortKey);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  // Update current page when initialPage changes (useful if data refreshes)
  useEffect(() => {
    setCurrentPage(initialPage + 1);
  }, [initialPage]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!enableFiltering || !searchTerm) return data;

    const lowerSearch = searchTerm.toLowerCase();

    if (customFilter) {
      return data.filter((row) => customFilter(row, searchTerm));
    }

    return data.filter((row) => {
      const keysToSearch =
        filterKeys.length > 0 ? filterKeys : Object.keys(row);
      return keysToSearch.some((key) => {
        const value = row[key];
        return value && value.toString().toLowerCase().includes(lowerSearch);
      });
    });
  }, [data, searchTerm, enableFiltering, filterKeys, customFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!enableSorting || !sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, enableSorting]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;

    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, currentPageSize, enablePagination]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / currentPageSize);
  const startRecord =
    sortedData.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
  const endRecord = Math.min(currentPage * currentPageSize, sortedData.length);

  // Handle sort
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Handle page size change
  const handlePageSizeChange = (newSize) => {
    setCurrentPageSize(newSize);
    setCurrentPage(1);
  };

  // Add sort props to columns if sorting is enabled
  const enhancedColumns = enableSorting
    ? columns.map((col) => ({
        ...col,
        sortable: col.sortable !== false,
        onSort: handleSort,
        sortDirection: sortKey === col.key ? sortDirection : null,
      }))
    : columns;

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className='flex flex-col gap-4 w-full'>
      {/* Controls Bar */}
      {(enableFiltering || children) && (
        <div className='flex gap-4 items-center flex-wrap'>
          {enableFiltering && (
            <input
              type='text'
              placeholder={filterPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className='flex-1 min-w-[200px] px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-text'
            />
          )}
          {children}
        </div>
      )}

      {/* Table */}
      <Table
        columns={enhancedColumns}
        data={paginatedData}
        size={size}
        onRowClick={onRowClick}
        emptyMessage={emptyMessage}
        hoverable={hoverable}
        rowClassName={rowClassName}
        actions={actions}
        actionsLabel={actionsLabel}
        actionsWidth={actionsWidth}
      />

      {/* Pagination */}
      {enablePagination && sortedData.length > 0 && (
        <div className='flex justify-between items-center py-3 flex-wrap gap-3'>
          <div className='flex items-center gap-3'>
            <span className='text-sm text-muted'>
              Showing {startRecord} to {endRecord} of {sortedData.length}{" "}
              results
            </span>
            <select
              value={currentPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className='px-3 py-1.5 border border-border rounded-md text-sm bg-surface text-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary'
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className='flex gap-2'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-3 py-1.5 border border-border rounded-md bg-surface text-sm hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              Previous
            </button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className='px-3 py-1.5 text-muted'
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 border rounded-md text-sm transition-colors ${
                    currentPage === page
                      ? "bg-primary text-white border-primary"
                      : "bg-surface border-border hover:bg-background"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-3 py-1.5 border border-border rounded-md bg-surface text-sm hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableContainer;
