import { NextResponse } from "next/server";
import { getTableSchema } from "@/lib/schema";

export async function GET(_req, context) {
  const { table } = await context.params;
  try {
    const schema = await getTableSchema(table);
    return NextResponse.json(schema);
  } catch (err) {
    console.error(`Schema fetch error for ${table}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
