// app/teams/[teamSeasonId]/page.js
import { getCurrentUser } from "@/lib/serverAuth";
import TeamOverviewClient from "./TeamOverviewClient";
import { getTeam } from "@/lib/queries/teams";
import { getTeamDashboardData } from "@/lib/data/team-data";

async function page({ params }) {
  const { teamSeasonId } = await params;
  const user = await getCurrentUser(); // ✅ YOUR auth method

  // Pass the full user object to getUserTeams so it can check systemAdmin
  const myTeam = await getTeam(teamSeasonId);
  const dashboardData = await getTeamDashboardData(teamSeasonId);
  // For each team, fetch dashboard data in parallel
  const teamWithData = { ...myTeam, dashboardData };
  return <TeamOverviewClient team={teamWithData} user={user} />;
}

export default page;
