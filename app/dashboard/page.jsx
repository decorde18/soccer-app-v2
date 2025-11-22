// app/dashboard/page.js - Dashboard showing my teams or current selected team
"use client";

import { useUserContextStore } from "@/stores/userContextStore";
import { useTeamSelectorStore } from "@/stores/teamSelectorStore";
import useAuthStore from "@/stores/authStore";
import { useEffect } from "react";
import TeamOverview from "@/components/ui/DashBoard/TeamOverview";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const { myTeams, loadUserContext } = useUserContextStore();

  // Get current team from the header selector
  const {
    selectedTeam,
    selectedClub,
    selectedSeason,
    selectedTeamSeasonId,
    selectedType,
  } = useTeamSelectorStore();

  useEffect(() => {
    if (user) {
      loadUserContext(user.id);
    }
  }, [user, loadUserContext]);

  // Build team object from current selection for TeamOverview component
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

  // Determine what to show: My Teams if authenticated with teams, otherwise current team
  const showMyTeams = isAuthenticated && myTeams.length > 0;

  return (
    <div className='min-h-screen bg-background'>
      {/* Main Content */}
      <div className='container mx-auto px-4 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-text mb-2'>
            {isAuthenticated
              ? `Welcome back, ${user?.first_name}!`
              : "Dashboard"}
          </h1>
          {showMyTeams && (
            <p className='text-muted'>
              Quick overview of all your teams' performance and upcoming matches
            </p>
          )}
          {!showMyTeams && currentTeam && (
            <p className='text-muted'>
              Quick overview of {currentTeam.team_name}'s performance and
              upcoming matches
            </p>
          )}
        </div>

        {/* My Teams Section - Only for authenticated users with teams */}
        {showMyTeams && (
          <div className='space-y-12'>
            {myTeams.map((team) => (
              <div
                key={team.team_season_id}
                className='pb-12 border-b border-border last:border-b-0'
              >
                <TeamOverview team={team} />
              </div>
            ))}
          </div>
        )}

        {/* Current Team Section - For non-authenticated or users without teams */}
        {!showMyTeams && currentTeam && (
          <div className='pb-12'>
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
        {isAuthenticated && myTeams.length === 0 && !currentTeam && (
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
