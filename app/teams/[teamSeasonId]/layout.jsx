// app/teams/[teamSeasonId]/layout.jsx
import { getCurrentUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { getPool } from "@/lib/db";
import TeamLayout from "./TeamLayout";

export default async function TeamSeasonLayout({ children, params }) {
  const { teamSeasonId } = await params;

  // Get user (but don't require auth for public pages)
  const user = await getCurrentUser();

  // Check access if user is logged in
  const access = user ? await checkServerTeamAccess(teamSeasonId, user) : null;

  // Get team info (public data)
  const db = getPool();
  const [teamInfo] = await db.query(
    `SELECT 
      t.team_name,
      c.name AS club_name,
      s.season_name
    FROM team_seasons ts
    JOIN teams t ON ts.team_id = t.id
    JOIN clubs c ON t.club_id = c.id
    JOIN seasons s ON ts.season_id = s.id
    WHERE ts.id = ?`,
    [teamSeasonId]
  );

  if (!teamInfo || teamInfo.length === 0) {
    return <div>Team not found</div>;
  }

  return (
    <TeamLayout
      teamInfo={teamInfo[0]}
      access={access} // null if not logged in
      user={user} // null if not logged in
      teamSeasonId={teamSeasonId}
    >
      {children}
    </TeamLayout>
  );
}
