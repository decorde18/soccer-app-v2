// app/api/views/[viewName]/route.js
import { handleViewRequest } from "@/lib/apiViewHandler";
import { getUserFromRequest } from "@/lib/serverAuth";
import { NextResponse } from "next/server";

// Define which views are publicly accessible (no auth required)
const PUBLIC_VIEWS = [
  "all_viewable_teams_view", // Used for both public browsing and user context
  "v_public_clubs", // If you have a clubs-only view
];

// Define which views REQUIRE authentication
const PROTECTED_VIEWS = [
  "v_user_specific_data", // Add any truly user-specific views here
  "v_private_team_data", // Views with sensitive information
];

export async function GET(request, context) {
  try {
    const params = await context.params;
    const { viewName } = params;

    // Check if view is public
    if (PUBLIC_VIEWS.includes(viewName)) {
      // Allow unauthenticated access - no auth check needed
      return handleViewRequest(request, context);
    }

    // Check if view is explicitly protected
    if (PROTECTED_VIEWS.includes(viewName)) {
      // Require authentication
      const user = getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return handleViewRequest(request, context);
    }

    // For undefined views, require authentication by default (secure by default)
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required for this view" },
        { status: 401 }
      );
    }

    return handleViewRequest(request, context);
  } catch (error) {
    console.error(`API Views GET error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Block other methods
export async function POST() {
  return NextResponse.json(
    { error: "Method POST Not Allowed on Views" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method PUT Not Allowed on Views" },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method PATCH Not Allowed on Views" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method DELETE Not Allowed on Views" },
    { status: 405 }
  );
}
