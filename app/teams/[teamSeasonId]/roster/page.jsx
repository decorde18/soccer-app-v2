// app/teams/[teamSeasonId]/roster/page.jsx

import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { getPool } from "@/lib/db";
import RosterClient from "./RosterClient";

export default async function RosterPage({ params }) {
  console.log("=== ROSTER PAGE ===");
  const { teamSeasonId } = await params;
  console.log("Team Season ID:", teamSeasonId);
  // ✅ Optional auth - no redirect
  const user = await getOptionalUser();
  const access = user ? await checkServerTeamAccess(teamSeasonId, user) : null;
  console.log("User:", user ? "LOGGED IN" : "NOT LOGGED IN");

  const db = getPool();

  // ✅ Always fetch public roster data
  const [roster] = await db.query(
    `SELECT 
      p.id,
      p.first_name,
      p.last_name,
      pt.jersey_number,
      pt.position
    FROM player_teams pt
    JOIN people p ON pt.player_id = p.id
    WHERE pt.team_season_id = ?
      AND pt.is_active = 1
    ORDER BY pt.jersey_number`,
    [teamSeasonId]
  );

  return (
    <RosterClient
      roster={roster}
      access={access}
      isAuthenticated={!!user}
      teamSeasonId={teamSeasonId}
    />
  );
}
