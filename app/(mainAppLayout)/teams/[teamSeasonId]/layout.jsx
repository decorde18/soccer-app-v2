// app/teams/[teamSeasonId]/layout.jsx
import { getOptionalUser, checkServerTeamAccess } from "@/lib/serverAuth";
import TeamLayoutClient from "./TeamLayoutClient";
import { getRelatedTeams, getTeam } from "@/lib/queries/teams";

export default async function TeamSeasonLayout({ children, params }) {
  const { teamSeasonId } = await params;

  // ✅ Optional auth - allows public viewing
  const user = await getOptionalUser();

  try {
    // ✅ Fetch team info (always - public data)
    const teamInfo = await getTeam(teamSeasonId);

    if (!teamInfo) {
      return <div>Team not found</div>;
    }

    // ✅ Check access ONLY if user is logged in
    const access = user
      ? await checkServerTeamAccess(teamSeasonId, user)
      : null;

    // ✅ Fetch related teams ONLY if user has access
    // (or make public if you want)
    const relatedTeams = access
      ? await getRelatedTeams(
          teamInfo.club_id,
          teamInfo.season_id,
          teamSeasonId
        )
      : [];

    return (
      <TeamLayoutClient
        teamInfo={teamInfo}
        relatedTeams={relatedTeams}
        access={access}
        teamSeasonId={teamSeasonId}
        user={user}
        isAuthenticated={!!user}
      >
        {children}
      </TeamLayoutClient>
    );
  } catch (error) {
    console.error("Error loading team layout:", error);
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
