// app/api/views/[viewName]/route.js
import { NextResponse } from "next/server";
import { crud } from "@/lib/crud";
import { parseQueryOptions } from "@/lib/apiHandler";
import { getUserFromRequest } from "@/lib/serverAuth";

// Define which views are publicly accessible (no auth required)
const PUBLIC_VIEWS = [
  "all_viewable_teams_view",
  "v_public_clubs",
  "games_view", // Add your views here
];

// Define which views REQUIRE authentication
const PROTECTED_VIEWS = ["v_user_specific_data", "v_private_team_data"];

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { viewName } = params;

    // Auth check based on view type
    if (!PUBLIC_VIEWS.includes(viewName)) {
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json(
          {
            error: PROTECTED_VIEWS.includes(viewName)
              ? "Unauthorized"
              : "Authentication required for this view",
          },
          { status: 401 }
        );
      }
    }

    // Parse query options (reuse from apiHandler)
    const { searchParams } = new URL(request.url);
    const options = parseQueryOptions(searchParams);

    // Handle count request
    if (searchParams.get("_count") === "true") {
      const total = await crud.count(
        viewName,
        options.filters,
        options.operators
      );
      return NextResponse.json({ total });
    }

    // Fetch data
    const data = await crud.getAll(viewName, options);

    // If filtering by id, return single object
    if (options.filters.id) {
      return NextResponse.json(data.length > 0 ? data[0] : null);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/views/${context.params?.viewName} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Block write methods on views
export async function POST() {
  return NextResponse.json(
    { error: "Method Not Allowed on Views" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed on Views" },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method Not Allowed on Views" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed on Views" },
    { status: 405 }
  );
}
