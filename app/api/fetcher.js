// api/fetcher.js

const API_BASE_URL = "/api";

/**
 * Main API fetch function with support for filtering, sorting, and pagination
 * @param {string} table - Table name
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {Object} data - Data for POST, PUT, PATCH
 * @param {string|number} id - ID for GET, DELETE, PUT, PATCH
 * @param {Object} options - Query options for GET requests
 * @param {Object} options.filters - Filters (e.g., { status: 'active', user_id: 123 })
 * @param {Object} options.operators - Operators for filters (e.g., { age: 'gt', price: 'lte' })
 * @param {string|Array} options.sortBy - Column(s) to sort by
 * @param {string|Array} options.order - Sort order ('asc' or 'desc')
 * @param {number} options.limit - Limit number of results
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.count - If true, returns count instead of data
 */
export async function apiFetch(
  table,
  method,
  data = null,
  id = null,
  options = {}
) {
  let url = `${API_BASE_URL}/${table}`;
  const params = new URLSearchParams();

  // Handle GET with ID
  if (id && method === "GET") {
    params.append("id", id);
  }

  // Handle GET with filters, sorting, and pagination
  if (method === "GET" && !id) {
    const {
      filters = {},
      operators = {},
      sortBy,
      order,
      limit,
      offset,
      count,
    } = options;

    // Add filters
    for (const [key, value] of Object.entries(filters)) {
      const operator = operators[key];
      if (operator) {
        // Convert operator to suffix (e.g., '>' becomes 'gt')
        const operatorSuffixMap = {
          ">": "gt",
          ">=": "gte",
          "<": "lt",
          "<=": "lte",
          "!=": "ne",
          LIKE: "like",
        };
        const suffix = operatorSuffixMap[operator];
        params.append(`${key}_${suffix}`, value);
      } else {
        params.append(key, value);
      }
    }

    // Add sorting
    if (sortBy) {
      params.append(
        "sortBy",
        Array.isArray(sortBy) ? sortBy.join(",") : sortBy
      );
      if (order) {
        params.append("order", Array.isArray(order) ? order.join(",") : order);
      }
    }

    // Add pagination
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);

    // Add count flag
    if (count) params.append("_count", "true");
  }

  // Handle DELETE, PUT, PATCH with ID
  if (id && (method === "DELETE" || method === "PUT" || method === "PATCH")) {
    params.append("id", id);
  }

  // Append query parameters to URL
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const fetchOptions = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Attach body for POST, PUT, and PATCH
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      throw new Error(`API call failed: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();

    // If PUT/PATCH returns { success: true }, refetch the updated item
    if ((method === "PUT" || method === "PATCH") && result.success && id) {
      const refetchUrl = `${API_BASE_URL}/${table}?id=${id}`;
      const refetchRes = await fetch(refetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refetchRes.ok) {
        const updatedItem = await refetchRes.json();
        return updatedItem;
      }
    }

    // If POST returns { success: true, id: X }, refetch the created item
    if (method === "POST" && result.success && result.id) {
      const refetchUrl = `${API_BASE_URL}/${table}?id=${result.id}`;
      const refetchRes = await fetch(refetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refetchRes.ok) {
        const newItem = await refetchRes.json();
        return newItem;
      }
    }

    return result;
  } catch (error) {
    console.error(`Error in ${method} for ${table}:`, error);
    throw error;
  }
}

/**
 * Helper function to get count of records
 */
export async function apiCount(table, filters = {}, operators = {}) {
  return apiFetch(table, "GET", null, null, {
    filters,
    operators,
    count: true,
  });
}

/**
 * Helper function to get paginated results with total count
 */
export async function apiGetPage(table, page = 1, pageSize = 10, options = {}) {
  const offset = (page - 1) * pageSize;
  const { filters = {}, operators = {}, sortBy, order } = options;

  const [data, countResult] = await Promise.all([
    apiFetch(table, "GET", null, null, {
      filters,
      operators,
      sortBy,
      order,
      limit: pageSize,
      offset,
    }),
    apiCount(table, filters, operators),
  ]);

  return {
    data,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize),
  };
}
