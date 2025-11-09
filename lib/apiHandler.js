// lib/apiHandler.js

import { NextResponse } from "next/server";
import { crud } from "@/lib/crud";

export async function handleCrudRequest(request, context) {
  const params = await context.params;
  const { table } = params;
  const method = request.method;

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
}

/**
 * Parse query parameters for filtering, sorting, and pagination
 */
function parseQueryOptions(searchParams) {
  const options = {
    filters: {},
    operators: {},
    sortBy: undefined,
    order: undefined,
    limit: undefined,
    offset: undefined,
  };

  // Reserved parameter names
  const reserved = ["id", "sortBy", "order", "limit", "offset", "_count"];

  for (const [key, value] of searchParams.entries()) {
    if (reserved.includes(key)) continue;

    // Check if key has an operator suffix (e.g., age_gt, price_lte)
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
      // Exact match filter
      options.filters[key] = value;
    }
  }

  // Parse sorting
  const sortBy = searchParams.get("sortBy");
  const order = searchParams.get("order");

  if (sortBy) {
    options.sortBy = sortBy.includes(",") ? sortBy.split(",") : sortBy;
    if (order) {
      options.order = order.includes(",") ? order.split(",") : order;
    }
  }

  // Parse pagination
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  if (limit) options.limit = parseInt(limit);
  if (offset) options.offset = parseInt(offset);

  return options;
}

async function handleGET(request, table) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const requestCount = searchParams.get("_count") === "true";

  try {
    // Handle count request
    if (requestCount && !id) {
      const options = parseQueryOptions(searchParams);
      const total = await crud.count(table, options.filters, options.operators);
      return NextResponse.json({ total });
    }

    // Handle get by ID
    if (id) {
      const data = await crud.getById(table, id);
      return NextResponse.json(data);
    }

    // Handle get all with options
    const options = parseQueryOptions(searchParams);
    const data = await crud.getAll(table, options);
    return NextResponse.json(data);
  } catch (err) {
    console.error(`GET /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

async function handlePUT(request, table) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updated = await crud.update(table, id, data);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PUT /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handlePATCH(request, table) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const updated = await crud.update(table, id, data);
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`PATCH /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleDELETE(request, table) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const deleted = await crud.remove(table, id);
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`DELETE /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
