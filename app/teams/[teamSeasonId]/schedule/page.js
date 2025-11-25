// app/teams/[teamSeasonId]/schedule/page.js
import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import { getAllGames } from "@/lib/queries/teams";
import { Permissions } from "@/lib/serverPermissions";
import ScheduleClient from "./ScheduleClient";

export default async function SchedulePage({ params }) {
  const { teamSeasonId } = await params;

  // Get optional user and check permissions
  const user = await getOptionalUser();
  const access = user ? await checkServerTeamAccess(teamSeasonId, user) : null;

  // Check if user can edit
  const canEdit = access ? Permissions.canEditTeam(access) : false;

  // Fetch games
  const games = await getAllGames(teamSeasonId);

  return (
    <ScheduleClient
      games={games}
      teamSeasonId={teamSeasonId}
      canEdit={canEdit}
    />
  );
}
