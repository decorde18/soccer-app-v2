// app/dashboard/TeamOverviewClient.jsx
"use client";

import TeamOverview from "@/components/ui/DashBoard/TeamOverview";
import { useTeamSelectorStore } from "@/stores/teamSelectorStore";

export default function TeamOverviewClient({ team, user }) {
  // Get current team from the header selector (for non-authenticated users)
  const {
    selectedTeam,
    selectedClub,
    selectedSeason,
    selectedTeamSeasonId,
    selectedType,
  } = useTeamSelectorStore();

  // Build team object from current selection for non-authenticated users
  // or authenticated users without teams who select a team from header
  const currentTeam =
    selectedTeamSeasonId && selectedTeam && selectedClub && selectedSeason
      ? {
          ...team,
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
  if (!currentTeam) return <div>No Team Selected</div>;
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto px-4 py-8'>
        {/* My Teams Section - ALWAYS show for authenticated users with teams */}

        <div className='space-y-12'>
          <div
            key={team.team_season_id}
            className='pb-12 border-b border-border last:border-b-0'
          >
            <TeamOverview
              team={currentTeam}
              data={team.dashboardData}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
