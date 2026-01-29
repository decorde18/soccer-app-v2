"use client";
import { useState } from "react";
import Toggle from "@/components/ui/Toggle";

/**
 * ViewWrapper - Reusable component that toggles between grid and table views
 *
 * @param {React.ReactNode} gridView - Component to render in grid mode
 * @param {React.ReactNode} tableView - Component to render in table mode
 * @param {string} defaultView - 'grid' | 'table' (default: 'grid')
 * @param {string} title - Optional title for the view
 * @param {boolean} loading - Loading state
 * @param {Error} error - Error state
 * @param {React.ReactNode} children - Additional controls/filters
 */
export default function ViewWrapper({
  gridView,
  tableView,
  defaultView = "grid",
  title,
  loading = false,
  error = null,
  children,
}) {
  const [isTableView, setIsTableView] = useState(defaultView === "table");

  if (loading) {
    return <div className='p-8 text-center text-muted'>Loading...</div>;
  }

  if (error) {
    return (
      <div className='p-8 text-center text-accent'>Error: {error?.message}</div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <div className='flex-shrink-0 p-4'>
        <div className='max-w-7xl mx-auto'>
          {/* Header with title and toggle */}
          <div className='flex justify-between items-center flex-wrap gap-4'>
            <h1 className='text-xl font-bold text-text'>{title}</h1>

            <div className='flex items-center gap-4'>
              {children}
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted'>Grid</span>
                <Toggle
                  checked={isTableView}
                  onChange={setIsTableView}
                  aria-label='Toggle between grid and table view'
                />
                <span className='text-sm text-muted'>Table</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable View Content */}
      <div className='flex-1 overflow-y-auto overflow-x-hidden px-8 pb-8'>
        <div className='max-w-7xl mx-auto'>
          {isTableView ? tableView : gridView}
        </div>
      </div>
    </div>
  );
}
