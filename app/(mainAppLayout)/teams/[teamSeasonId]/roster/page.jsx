// app/teams/[teamSeasonId]/roster/page.jsx

import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { getAllPlayers } from "@/lib/queries/teams";
import { Permissions } from "@/lib/serverPermissions";
import RosterClient from "./RosterClient";

export default async function RosterPage({ params }) {
  const { teamSeasonId } = await params;

  // Get optional user and check permissions
  const user = await getOptionalUser();
  const access = user ? await checkServerTeamAccess(teamSeasonId, user) : null;

  // Check if user can edit
  const canEdit = access ? Permissions.canEditTeam(access) : false;

  // Fetch games
  const roster = await getAllPlayers(teamSeasonId);

  return (
    <RosterClient
      roster={roster}
      access={access}
      isAuthenticated={!!user}
      teamSeasonId={teamSeasonId}
    />
  );
}
