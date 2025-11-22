import { mockStandings } from "@/mockData";

// app/api/teams/[teamSeasonId]/standings/route.js
export async function GET(request, { params }) {
  return Response.json(mockStandings);
}
