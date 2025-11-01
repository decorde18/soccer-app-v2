// lib/apiHandler.js

import { NextResponse } from "next/server";
import { crud } from "@/lib/crud"; // Ensure you import your crud library

// Universal handler for GET, POST, PUT, DELETE, and PATCH
export async function handleCrudRequest(request, context) {
  // 💥 FIX: Await context.params before destructuring
  const params = await context.params;
  const { table } = params; // Access 'table' from the resolved params object
  const method = request.method;

  // Use a switch statement to route based on the HTTP method
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

// --- Individual Method Handlers (Moved from route.js) ---

async function handleGET(request, table) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    const data = id ? await crud.getById(table, id) : await crud.getAll(table);
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

    // Note: If you want PATCH to fail if data is empty, add a check here

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
