// app/teams/[teamSeasonId]/layout.jsx
import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { getPool } from "@/lib/db";
import TeamLayoutClient from "./TeamLayoutClient";

export default async function TeamSeasonLayout({ children, params }) {
  const { teamSeasonId } = await params;

  // ✅ Use optional auth - doesn't redirect if not logged in
  const user = await getOptionalUser();

  // ✅ Only check access if user is logged in
  const access = user ? await checkServerTeamAccess(teamSeasonId, user) : null;

  const db = getPool();

  // Fetch team info (always - public data)
  const [teamInfo] = await db.query(
    `SELECT 
      t.team_name,
      t.club_id,
      c.name AS club_name,
      s.season_name,
      s.id AS season_id
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

  // Fetch related teams -CLUB SPECIFIC- (for logged in users only, or make public)
  const [relatedTeams] = await db.query(
    `SELECT 
      ts.id AS team_season_id,
      t.team_name
    FROM team_seasons ts
    JOIN teams t ON ts.team_id = t.id
    WHERE t.club_id = ? 
      AND ts.season_id = ?
      AND ts.id != ?
    ORDER BY t.team_name`,
    [teamInfo[0].club_id, teamInfo[0].season_id, teamSeasonId]
  );

  return (
    <TeamLayoutClient
      teamInfo={teamInfo[0]}
      relatedTeams={relatedTeams}
      access={access} // null if not logged in
      teamSeasonId={teamSeasonId}
      user={user} // null if not logged in
      isAuthenticated={!!user} // ✅ explicit flag
    >
      {children}
    </TeamLayoutClient>
  );
}
