import { NextResponse } from "next/server";
import { getTeamSchedule } from "@/lib/queries/teams";

export async function GET(request, { params }) {
  try {
    const { teamSeasonId } = await params;

    const search = request.nextUrl.searchParams;
    const type = search.get("type") || "all";
    const limit = search.get("limit") ? parseInt(search.get("limit")) : null;

    const rows = await getTeamSchedule(teamSeasonId, { type, limit });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch team schedule" },
      { status: 500 }
    );
  }
}
