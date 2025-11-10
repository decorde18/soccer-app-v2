import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiGetPage, apiCount } from "@/app/api/fetcher";

/**
 * Enhanced hook for API data with filtering, sorting, and pagination
 * @param {string} endpoint - API endpoint/table name
 * @param {Object} options - Configuration options
 * @param {Array} options.initialData - Initial data state
 * @param {boolean} options.skipInitialFetch - Skip automatic fetch on mount
 * @param {Object} options.filters - Initial filters
 * @param {Object} options.operators - Initial operators for filters
 * @param {string|Array} options.sortBy - Initial sort column(s)
 * @param {string|Array} options.order - Initial sort order(s)
 * @param {number} options.limit - Limit results
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.paginate - Enable pagination mode
 * @param {number} options.pageSize - Items per page (default: 10)
 */
export function useApiData(endpoint, options = {}) {
  const {
    initialData = [],
    skipInitialFetch = false,
    filters: initialFilters = {},
    operators: initialOperators = {},
    sortBy: initialSortBy = undefined,
    order: initialOrder = undefined,
    limit: initialLimit = undefined,
    offset: initialOffset = undefined,
    paginate = false,
    pageSize = 10,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState(null);

  // Query state
  const [filters, setFilters] = useState(initialFilters);
  const [operators, setOperators] = useState(initialOperators);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [order, setOrder] = useState(initialOrder);
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(initialOffset);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /**
   * Fetch data with current query parameters
   */
  const fetchData = useCallback(
    async (customOptions = {}) => {
      try {
        setLoading(true);

        const queryOptions = {
          filters: customOptions.filters ?? filters,
          operators: customOptions.operators ?? operators,
          sortBy: customOptions.sortBy ?? sortBy,
          order: customOptions.order ?? order,
          limit: customOptions.limit ?? limit,
          offset: customOptions.offset ?? offset,
        };

        const result = await apiFetch(
          endpoint,
          "GET",
          null,
          null,
          queryOptions
        );
        setData(result);
        setError(null);
        return result;
      } catch (err) {
        console.error(`Failed to load ${endpoint}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, filters, operators, sortBy, order, limit, offset]
  );

  /**
   * Fetch paginated data
   */
  const fetchPage = useCallback(
    async (pageNum = page, customOptions = {}) => {
      try {
        setLoading(true);

        const queryOptions = {
          filters: customOptions.filters ?? filters,
          operators: customOptions.operators ?? operators,
          sortBy: customOptions.sortBy ?? sortBy,
          order: customOptions.order ?? order,
        };

        const result = await apiGetPage(
          endpoint,
          pageNum,
          pageSize,
          queryOptions
        );

        setData(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
        setError(null);

        return result;
      } catch (err) {
        console.error(`Failed to load page ${pageNum} of ${endpoint}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, page, pageSize, filters, operators, sortBy, order]
  );

  /**
   * Get count of records
   */
  const getCount = useCallback(
    async (customFilters = filters, customOperators = operators) => {
      try {
        const result = await apiCount(endpoint, customFilters, customOperators);
        return result.total;
      } catch (err) {
        console.error(`Failed to count ${endpoint}:`, err);
        throw err;
      }
    },
    [endpoint, filters, operators]
  );

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback(
    async (newFilters, newOperators = {}) => {
      setFilters(newFilters);
      setOperators(newOperators);

      if (paginate) {
        setPage(1); // Reset to first page when filters change
        return fetchPage(1, { filters: newFilters, operators: newOperators });
      } else {
        return fetchData({ filters: newFilters, operators: newOperators });
      }
    },
    [paginate, fetchPage, fetchData]
  );

  /**
   * Update sorting and refetch
   */
  const updateSort = useCallback(
    async (newSortBy, newOrder = "asc") => {
      setSortBy(newSortBy);
      setOrder(newOrder);

      if (paginate) {
        return fetchPage(page, { sortBy: newSortBy, order: newOrder });
      } else {
        return fetchData({ sortBy: newSortBy, order: newOrder });
      }
    },
    [paginate, page, fetchPage, fetchData]
  );

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (pageNum) => {
      if (pageNum < 1 || pageNum > totalPages) return;
      return fetchPage(pageNum);
    },
    [totalPages, fetchPage]
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(async () => {
    if (page < totalPages) {
      return fetchPage(page + 1);
    }
  }, [page, totalPages, fetchPage]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(async () => {
    if (page > 1) {
      return fetchPage(page - 1);
    }
  }, [page, fetchPage]);

  /**
   * Update a record
   */
  const update = useCallback(
    async (id, body) => {
      try {
        setLoading(true);
        const result = await apiFetch(endpoint, "PATCH", body, id);

        setData((prev) =>
          Array.isArray(prev)
            ? prev.map((item) => (item.id === id ? result : item))
            : result
        );
        return result;
      } catch (err) {
        console.error(`Failed to update ${endpoint}/${id}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  /**
   * Replace a record
   */
  const replace = useCallback(
    async (id, body) => {
      try {
        setLoading(true);
        const result = await apiFetch(endpoint, "PUT", body, id);

        setData((prev) =>
          Array.isArray(prev)
            ? prev.map((item) => (item.id === id ? result : item))
            : result
        );
        return result;
      } catch (err) {
        console.error(`Failed to replace ${endpoint}/${id}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  /**
   * Create a new record
   */
  const create = useCallback(
    async (body) => {
      try {
        setLoading(true);
        const result = await apiFetch(endpoint, "POST", body);

        setData((prev) => (Array.isArray(prev) ? [...prev, result] : result));

        // Update total count if in pagination mode
        if (paginate) {
          setTotal((prev) => prev + 1);
        }

        return result;
      } catch (err) {
        console.error(`Failed to create ${endpoint}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, paginate]
  );

  /**
   * Delete a record
   */
  const remove = useCallback(
    async (id) => {
      try {
        setLoading(true);
        await apiFetch(endpoint, "DELETE", null, id);

        setData((prev) =>
          Array.isArray(prev) ? prev.filter((item) => item.id !== id) : null
        );

        // Update total count if in pagination mode
        if (paginate) {
          setTotal((prev) => prev - 1);
        }

        return true;
      } catch (err) {
        console.error(`Failed to delete ${endpoint}/${id}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, paginate]
  );

  /**
   * Reset all filters and sorting
   */
  const resetQuery = useCallback(async () => {
    setFilters({});
    setOperators({});
    setSortBy(undefined);
    setOrder(undefined);

    if (paginate) {
      setPage(1);
      return fetchPage(1, {
        filters: {},
        operators: {},
        sortBy: undefined,
        order: undefined,
      });
    } else {
      return fetchData({
        filters: {},
        operators: {},
        sortBy: undefined,
        order: undefined,
      });
    }
  }, [paginate, fetchPage, fetchData]);

  // Initial fetch
  useEffect(() => {
    if (!skipInitialFetch) {
      if (paginate) {
        fetchPage(1);
      } else {
        fetchData();
      }
    }
  }, [skipInitialFetch, paginate, fetchPage, fetchData]);

  return {
    // Data
    data,
    loading,
    error,

    // Manual setters
    setData,

    // Fetch operations
    refetch: paginate ? () => fetchPage(page) : fetchData,

    // CRUD operations
    create,
    update,
    replace,
    remove,

    // Query state
    filters,
    operators,
    sortBy,
    order,
    limit,
    offset,

    // Query operations
    updateFilters,
    updateSort,
    resetQuery,
    getCount,

    // Pagination state (only relevant when paginate=true)
    page,
    total,
    totalPages,
    pageSize,

    // Pagination operations
    goToPage,
    nextPage,
    prevPage,
  };
}
