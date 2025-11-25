// app/dashboard/page.js
import { getCurrentUser } from "@/lib/serverAuth";
import { getUserTeams } from "@/lib/queries/teams";
import { getTeamDashboardData } from "@/lib/data/team-data";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser(); // ✅ YOUR auth method

  // Pass the full user object to getUserTeams so it can check systemAdmin
  const myTeams = user?.userId ? await getUserTeams(user.userId, user) : [];

  // For each team, fetch dashboard data in parallel
  const teamsWithData = await Promise.all(
    myTeams.map(async (team) => ({
      ...team,
      dashboardData: await getTeamDashboardData(team.team_season_id),
    }))
  );

  return <DashboardClient teams={teamsWithData} user={user} />;
}
