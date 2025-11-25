// lib/apiHandler.js

import { NextResponse } from "next/server";
import { crud } from "@/lib/crud";

/**
 * Unified CRUD handler for /api/[table] routes
 */
export async function handleCrudRequest(request, context) {
  const params = await context.params;
  const { table } = params;
  const method = request.method.toUpperCase();

  try {
    switch (method) {
      case "GET":
        return handleGET(request, table);
      case "POST":
        return handlePOST(request, table);
      case "PUT":
        return handlePUT(request, table);
      case "PATCH":
        return handlePATCH(request, table);
      case "DELETE":
        return handleDELETE(request, table);
      default:
        return NextResponse.json(
          { error: `Method ${method} Not Allowed` },
          { status: 405 }
        );
    }
  } catch (err) {
    console.error(`${method} /${table} fatal error:`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------------
   HELPER: Parse filtering, sorting, pagination
---------------------------------------------------------- */
export function parseQueryOptions(searchParams) {
  const options = {
    filters: {},
    operators: {},
    sortBy: undefined,
    order: undefined,
    limit: undefined,
    offset: undefined,
  };

  const reserved = ["id", "sortBy", "order", "limit", "offset", "_count"];

  for (const [key, value] of searchParams.entries()) {
    if (reserved.includes(key)) continue;

    const operatorMatch = key.match(/^(.+)_(gt|gte|lt|lte|ne|like)$/);

    if (operatorMatch) {
      const [, fieldName, op] = operatorMatch;
      const operatorMap = {
        gt: ">",
        gte: ">=",
        lt: "<",
        lte: "<=",
        ne: "!=",
        like: "LIKE",
      };
      options.filters[fieldName] = value;
      options.operators[fieldName] = operatorMap[op];
    } else {
      options.filters[key] = value;
    }
  }

  const sortBy = searchParams.get("sortBy");
  const order = searchParams.get("order");
  if (sortBy) {
    options.sortBy = sortBy.includes(",") ? sortBy.split(",") : sortBy;
    if (order) {
      options.order = order.includes(",") ? order.split(",") : order;
    }
  }

  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");
  if (limit) options.limit = parseInt(limit, 10);
  if (offset) options.offset = parseInt(offset, 10);

  return options;
}

/* ----------------------------------------------------------
   HELPER: Extract ID from either body OR query
---------------------------------------------------------- */
async function extractId(request) {
  const url = new URL(request.url);
  const queryId = url.searchParams.get("id");

  let bodyId = null;
  try {
    const clone = request.clone();
    const body = await clone.json().catch(() => null);
    if (body && typeof body.id !== "undefined") bodyId = body.id;
  } catch {
    // ignore
  }

  const id = queryId ?? bodyId;

  if (!id && id !== 0) return null;

  // Convert to integer if numeric
  if (/^\d+$/.test(id)) return Number(id);

  return id; // allow string IDs for tables where ID isn't numeric
}

/* ----------------------------------------------------------
   GET
---------------------------------------------------------- */
async function handleGET(request, table) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const countRequested = url.searchParams.get("_count") === "true";

  try {
    // COUNT
    if (countRequested && !id) {
      const options = parseQueryOptions(url.searchParams);
      const total = await crud.count(table, options.filters, options.operators);
      return NextResponse.json({ total });
    }

    // GET by ID
    if (id) {
      const result = await crud.getById(table, id);
      return NextResponse.json(result);
    }

    // GET with filters/pagination
    const options = parseQueryOptions(url.searchParams);
    const data = await crud.getAll(table, options);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`GET /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------------------------------------------
   POST
---------------------------------------------------------- */
async function handlePOST(request, table) {
  try {
    const body = await request.json();
    const created = await crud.create(table, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(`POST /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------------------------------------------
   PUT
---------------------------------------------------------- */
async function handlePUT(request, table) {
  try {
    const id = await extractId(request);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const { id: _, ...data } = body;

    const updated = await crud.update(table, id, data);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PUT /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------------------------------------------
   PATCH
---------------------------------------------------------- */
async function handlePATCH(request, table) {
  try {
    const id = await extractId(request);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await request.json();
    const { id: _, ...data } = body;

    const updated = await crud.update(table, id, data);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PATCH /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ----------------------------------------------------------
   DELETE
---------------------------------------------------------- */
async function handleDELETE(request, table) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const deleted = await crud.remove(table, id);
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
