// app/teams/[teamSeasonId]/layout.jsx
import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";

import TeamLayoutClient from "./TeamLayoutClient";
import { getRelatedTeams, getTeam } from "@/lib/queries/teams";

export default async function TeamSeasonLayout({ children, params }) {
  const { teamSeasonId } = await params;

  // ✅ Use optional auth - doesn't redirect if not logged in
  const user = await getOptionalUser();
  try {
    // ✅ Only check access if user is logged in
    const access = user
      ? await checkServerTeamAccess(teamSeasonId, user)
      : null;

    // Fetch team info (always - public data)
    const teamInfo = await getTeam(teamSeasonId);

    if (!teamInfo) {
      return <div>Team not found</div>;
    }
    // Fetch related teams -CLUB SPECIFIC- (for logged in users only, or make public)
    const relatedTeams = await getRelatedTeams(
      teamInfo.club_id,
      teamInfo.season_id,
      teamSeasonId
    );

    return (
      <TeamLayoutClient
        teamInfo={teamInfo}
        relatedTeams={relatedTeams}
        access={access} // null if not logged in
        teamSeasonId={teamSeasonId}
        user={user} // null if not logged in
        isAuthenticated={!!user} // ✅ explicit flag
      >
        {children}
      </TeamLayoutClient>
    );
  } catch (error) {
    console.error("Error loading page:", error);
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-text mb-2'>Page Not Found</h1>
          <p className='text-muted'>
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }
}
