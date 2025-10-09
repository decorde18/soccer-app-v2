import { NextResponse } from "next/server";
import { crud } from "@/lib/crud";

// ✅ GET: all rows or ?id=123
export async function GET(request, context) {
  const { table } = await context.params;
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

// ✅ POST: create new row
export async function POST(request, context) {
  const { table } = await context.params;
  try {
    const body = await request.json();
    const created = await crud.create(table, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(`POST /${table} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ PUT: update row by id
export async function PUT(request, context) {
  const { table } = await context.params;
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

// ✅ DELETE: delete row by ?id=123
export async function DELETE(request, context) {
  const { table } = await context.params;
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
