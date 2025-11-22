import { mockStatLeaders } from "@/mockData";

// app/api/teams/[teamSeasonId]/stat-leaders/route.js
export async function GET(request, { params }) {
  return Response.json(mockStatLeaders);
}
