// api/fetcher.js

const API_BASE_URL = "/api";

/**
 * Main API fetch function with support for filtering, sorting, pagination, and grouping
 * @param {string} table - Table name
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {Object} data - Data for POST, PUT, PATCH
 * @param {string|number} id - ID for GET, DELETE, PUT, PATCH
 * @param {Object} options - Query options for GET requests
 * @param {Object} options.filters - Filters (e.g., { status: 'active', user_id: 123, sub_time_is_null: true })
 * @param {Object} options.operators - Operators for filters (e.g., { age: 'gt', price: 'lte' })
 * first filter then operator so filter color:green then operator color:!=
 * @param {string|Array} options.sortBy - Column(s) to sort by
 * @param {string|Array} options.order - Sort order ('asc' or 'desc')
 * @param {number} options.limit - Limit number of results
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} options.count - If true, returns count instead of data
 * @param {string|Array} options.groupBy - Column(s) to group by
 * @param {Object} options.aggregates - Aggregation functions (e.g., { total: 'SUM(amount)', avg_price: 'AVG(price)' })
 * @param {Object} options.having - HAVING clause filters (e.g., { total: 1000 })
 * @param {Object} options.havingOperators - Operators for HAVING filters (e.g., { total: '>' })
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

  // Handle GET with filters, sorting, pagination, and grouping
  if (method === "GET" && !id) {
    const {
      filters = {},
      operators = {},
      sortBy,
      order,
      limit,
      offset,
      count,
      groupBy,
      aggregates = {},
      having = {},
      havingOperators = {},
    } = options;

    // Add filters
    for (const [key, value] of Object.entries(filters)) {
      // Handle IS NULL checks (e.g., sub_time_is_null: true)
      if (key.endsWith("_is_null")) {
        params.append(key, value);
      }
      // Handle IS NOT NULL checks (e.g., sub_time_is_not_null: true)
      else if (key.endsWith("_is_not_null")) {
        params.append(key, value);
      }
      // Handle operators
      else {
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
    }

    // Add grouping
    if (groupBy) {
      params.append(
        "groupBy",
        Array.isArray(groupBy) ? groupBy.join(",") : groupBy
      );
    }

    // Add aggregates
    if (Object.keys(aggregates).length > 0) {
      // Send aggregates as JSON string
      params.append("aggregates", JSON.stringify(aggregates));
    }

    // Add HAVING clause filters
    if (Object.keys(having).length > 0) {
      for (const [key, value] of Object.entries(having)) {
        const operator = havingOperators[key];
        if (operator) {
          const operatorSuffixMap = {
            ">": "gt",
            ">=": "gte",
            "<": "lt",
            "<=": "lte",
            "!=": "ne",
            "=": "eq",
          };
          const suffix = operatorSuffixMap[operator];
          params.append(`having_${key}_${suffix}`, value);
        } else {
          params.append(`having_${key}`, value);
        }
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

/**
 * Helper function for grouped queries with aggregations
 * @param {string} table - Table name
 * @param {string|Array} groupBy - Column(s) to group by
 * @param {Object} aggregates - Aggregation functions (e.g., { total: 'SUM(amount)', count: 'COUNT(*)' })
 * @param {Object} options - Additional options (filters, having, sortBy, etc.)
 
const result = await apiGroupBy('orders', 'user_id', {
  total_sales: 'SUM(amount)',
  avg_order: 'AVG(amount)',
  order_count: 'COUNT(*)'
});
const result = await apiGroupBy('orders', 'user_id', {
  total: 'SUM(amount)'
}, {
  having: { total: 1000 },
  havingOperators: { total: '>' }
});
const result = await apiGroupBy('orders', 'category', {
  revenue: 'SUM(amount)',
  items: 'COUNT(*)'
}, {
  filters: { status: 'completed' },
  sortBy: 'revenue',
  order: 'desc',
  limit: 10
});
*/
export async function apiGroupBy(
  table,
  groupBy,
  aggregates = {},
  options = {}
) {
  const {
    filters = {},
    operators = {},
    having = {},
    havingOperators = {},
    sortBy,
    order,
    limit,
  } = options;

  return apiFetch(table, "GET", null, null, {
    groupBy,
    aggregates,
    filters,
    operators,
    having,
    havingOperators,
    sortBy,
    order,
    limit,
  });
}
