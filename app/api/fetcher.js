// api/fetcher.js

const API_BASE_URL = "/api";

export async function apiFetch(table, method, data = null, id = null) {
  let url = `${API_BASE_URL}/${table}`;

  // Handle ID for GET, DELETE, PUT, and PATCH (query parameter)
  if (
    id &&
    (method === "GET" ||
      method === "DELETE" ||
      method === "PUT" ||
      method === "PATCH")
  ) {
    url += `?id=${id}`;
  }

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Attach body for POST, PUT, and PATCH
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`API call failed: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();

    // If PUT/PATCH returns { success: true }, refetch the updated item
    if ((method === "PUT" || method === "PATCH") && result.success && id) {
      // Refetch the updated item to get complete data
      const refetchUrl = `${API_BASE_URL}/${table}?id=${id}`;
      const refetchRes = await fetch(refetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refetchRes.ok) {
        const updatedItem = await refetchRes.json();
        // If GET returns an array with one item, extract it
        return Array.isArray(updatedItem) ? updatedItem[0] : updatedItem;
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
        return Array.isArray(newItem) ? newItem[0] : newItem;
      }
    }

    return result;
  } catch (error) {
    console.error(`Error in ${method} for ${table}:`, error);
    throw error;
  }
}
