import { mockRecentGames } from "@/mockData";

// app/api/teams/[teamSeasonId]/recent/route.js
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 5;
  return Response.json(mockRecentGames.slice(0, limit));
}
