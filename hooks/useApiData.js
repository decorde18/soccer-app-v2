import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/api/fetcher";

export function useApiData(endpoint, method = "GET", options = {}) {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(!options.skipInitialFetch);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiFetch(endpoint, method);
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
  }, [endpoint, method]);

  const update = useCallback(
    async (id, body) => {
      try {
        setLoading(true);
        // Now apiFetch automatically refetches and returns the full object
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
        console.error(`Failed to update ${endpoint}/${id}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  const create = useCallback(
    async (body) => {
      try {
        setLoading(true);
        // If POST returns { success: true, id: 123 }, apiFetch will refetch the new item
        const result = await apiFetch(endpoint, "POST", body);

        setData((prev) => (Array.isArray(prev) ? [...prev, result] : result));
        return result;
      } catch (err) {
        console.error(`Failed to create ${endpoint}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  const remove = useCallback(
    async (id) => {
      try {
        setLoading(true);
        await apiFetch(`${endpoint}?id=${id}`, "DELETE");
        setData((prev) =>
          Array.isArray(prev) ? prev.filter((item) => item.id !== id) : null
        );
        return true;
      } catch (err) {
        console.error(`Failed to delete ${endpoint}/${id}:`, err);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint]
  );

  useEffect(() => {
    if (!options.skipInitialFetch && method === "GET") {
      fetchData();
    }
  }, [fetchData, method, options.skipInitialFetch]);

  return {
    data,
    loading,
    error,
    setData,
    refetch: fetchData,
    create,
    update,
    replace,
    remove,
  };
}
