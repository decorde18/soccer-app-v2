// app/dashboard/DashboardClient.jsx
"use client";

import { useTeamSelectorStore } from "@/stores/teamSelectorStore";
import TeamOverview from "@/components/ui/DashBoard/TeamOverview";

export default function DashboardClient({ teams = [], user }) {
  // Get current team from the header selector (for non-authenticated users)
  const {
    selectedTeam,
    selectedClub,
    selectedSeason,
    selectedTeamSeasonId,
    selectedType,
  } = useTeamSelectorStore();

  // Determine authentication status
  const isAuthenticated = !!user;

  // Show user's teams if they're authenticated and have teams
  const hasMyTeams = isAuthenticated && teams.length > 0;

  // Build team object from current selection for non-authenticated users
  // or authenticated users without teams who select a team from header
  const currentTeam =
    selectedTeamSeasonId && selectedTeam && selectedClub && selectedSeason
      ? {
          team_season_id: selectedTeamSeasonId,
          team_id: selectedTeam.id,
          team_name: selectedTeam.name,
          club_id: selectedClub.id,
          club_name: selectedClub.name,
          season_id: selectedSeason.id,
          season_name: selectedSeason.name,
          type: selectedType,
        }
      : null;

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-text mb-2'>
            {isAuthenticated
              ? `Welcome back, ${user?.first_name || user?.firstName}!`
              : "Dashboard"}
          </h1>
          {hasMyTeams && (
            <p className='text-muted'>
              Quick overview of all your teams' performance and upcoming matches
            </p>
          )}
          {!hasMyTeams && currentTeam && (
            <p className='text-muted'>
              Quick overview of {currentTeam.team_name}'s performance and
              upcoming matches
            </p>
          )}
        </div>

        {/* My Teams Section - ALWAYS show for authenticated users with teams */}
        {hasMyTeams && (
          <div className='space-y-12'>
            {teams.map((team) => (
              <div
                key={team.team_season_id}
                className='pb-12 border-b border-border last:border-b-0'
              >
                <TeamOverview team={team} data={team.dashboardData} />
              </div>
            ))}
          </div>
        )}

        {/* Current Team Section - ONLY for non-authenticated users or authenticated users WITHOUT teams */}
        {!hasMyTeams && currentTeam && (
          <div className='pb-12'>
            {/* This will need to fetch data client-side since it's dynamic */}
            <TeamOverview team={currentTeam} />
          </div>
        )}

        {/* Empty State for Non-authenticated Users without selection */}
        {!isAuthenticated && !currentTeam && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <div className='text-6xl mb-4'>⚽</div>
              <h3 className='text-2xl font-bold text-text mb-2'>
                Welcome to TeamHub
              </h3>
              <p className='text-muted max-w-md mx-auto mb-4'>
                Select a team from the selector above to view their performance,
                standings, and upcoming matches.
              </p>
              <p className='text-muted max-w-md mx-auto'>
                Sign in to track your own teams and get personalized updates.
              </p>
            </div>
            <button
              className='bg-primary text-white px-6 py-3 rounded-lg hover:bg-accent-hover transition font-medium'
              onClick={() => (window.location.href = "/auth/login")}
            >
              Sign In to Get Started
            </button>
          </div>
        )}

        {/* Empty State for Authenticated Users with No Teams */}
        {isAuthenticated && teams.length === 0 && !currentTeam && (
          <div className='text-center py-16'>
            <div className='mb-6'>
              <div className='text-6xl mb-4'>🎯</div>
              <h3 className='text-2xl font-bold text-text mb-2'>
                No Teams Yet
              </h3>
              <p className='text-muted max-w-md mx-auto'>
                You haven't joined any teams yet. Use the team selector above to
                explore teams and view their details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
