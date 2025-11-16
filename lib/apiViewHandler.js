// lib/apiViewHandler.js
import { NextResponse } from "next/server";
import { crud } from "@/lib/crud"; // Reusing the crud.query and crud.count methods
import { parseQueryOptions } from "@/lib/apiHandler"; // Reusing the shared query parsing

/**
 * Handles GET requests for database Views.
 * Views are read-only, so only GET and COUNT are supported.
 * @param {Request} request - The Next.js request object.
 * @param {string} viewName - The name of the database view (e.g., 'all_viewable_teams_view').
 */
async function handleGET(request, viewName) {
  const { searchParams } = new URL(request.url);

  try {
    const options = parseQueryOptions(searchParams);

    // Check for count mode (e.g., /api/views/my_view?_count=true)
    if (searchParams.get("_count") === "true") {
      const total = await crud.count(
        viewName,
        options.filters,
        options.operators
      );
      return NextResponse.json({ total });
    }

    // Default: Fetch data
    const data = await crud.getAll(viewName, options);

    // If an ID is requested (e.g., /api/views/my_view?id=123)
    if (options.filters.id) {
      return NextResponse.json(data.length > 0 ? data[0] : null);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`GET /views/${viewName} error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Main entry point for API View requests.
 * @param {Request} request - The Next.js request object.
 * @param {Object} context - The Next.js context object containing params.
 */
export async function handleViewRequest(request, context) {
  // Next.js 15 requires awaiting params
  const params = await context.params;
  const { viewName } = params;
  const method = request.method;

  switch (method) {
    case "GET":
      return handleGET(request, viewName);

    default:
      return NextResponse.json(
        { error: `Method ${method} Not Allowed on Views` },
        { status: 405 }
      );
  }
}
