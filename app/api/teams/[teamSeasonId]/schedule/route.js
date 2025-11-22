import { mockUpcomingGames } from "@/mockData";

// app/api/teams/[teamSeasonId]/schedule/route.js
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit")) || 3;
  return Response.json(mockUpcomingGames.slice(0, limit));
}
