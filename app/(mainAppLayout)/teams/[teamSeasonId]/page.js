// app/teams/[teamSeasonId]/page.js
import { getTeamDashboardData } from "@/lib/data/team-data";
import TeamOverviewClient from "./TeamOverviewClient";

export default async function TeamOverviewPage({ params }) {
  const { teamSeasonId } = await params;

  const dashboardData = await getTeamDashboardData(teamSeasonId);

  return <TeamOverviewClient dashboardData={dashboardData} />;
}
