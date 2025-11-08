// stores/teamSelectorStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper to extract unique values from the flat data
function normalizeTeamsView(rawData) {
  // Get unique clubs
  const clubsMap = new Map();
  rawData.forEach((row) => {
    if (!clubsMap.has(row.club_id)) {
      clubsMap.set(row.club_id, {
        id: row.club_id,
        name: row.club_name,
        type: row.type,
        location: row.location,
        logo_url: row.logo_url,
        founded_year: row.founded_year,
        is_active: row.club_is_active,
        abbreviation: row.abbreviation,
      });
    }
  });

  // Get unique teams
  const teamsMap = new Map();
  rawData.forEach((row) => {
    if (row.team_id && !teamsMap.has(row.team_id)) {
      teamsMap.set(row.team_id, {
        id: row.team_id,
        name: row.team_name,
        club_id: row.club_id,
        gender: row.gender,
        is_active: row.team_is_active,
        age_group: {
          id: row.age_group,
          name: row.age_group_name,
        },
      });
    }
  });

  // Get unique seasons (by season_id, not team_season id)
  const seasonsMap = new Map();
  rawData.forEach((row) => {
    if (row.season_id && !seasonsMap.has(row.season_id)) {
      seasonsMap.set(row.season_id, {
        id: row.season_id,
        name: row.season_name,
        start: row.season_start,
        end: row.season_end,
        is_current: row.is_current,
      });
    }
  });

  return {
    rawData, // Keep the raw data for final filtering
    clubs: Array.from(clubsMap.values()),
    teams: Array.from(teamsMap.values()),
    seasons: Array.from(seasonsMap.values()),
  };
}

export const useTeamSelectorStore = create(
  persist(
    (set, get) => ({
      // Current selections
      selectedType: null,
      selectedClub: null,
      selectedTeam: null,
      selectedSeason: null,
      selectedTeamSeasonId: null, // The final team_season junction ID

      // All data
      rawData: [], // Keep raw data for final ID lookup
      clubs: [],
      teams: [],
      seasons: [],

      // Loading state
      isLoading: false,
      error: null,

      // Actions
      setType: (type) =>
        set({
          selectedType: type,
          selectedClub: null,
          selectedTeam: null,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        }),

      setClub: (club) =>
        set({
          selectedClub: club,
          selectedTeam: null,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        }),

      setTeam: (team) =>
        set({
          selectedTeam: team,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        }),

      setSeason: (season) => {
        const { rawData, selectedTeam } = get();

        // Find the team_season ID from raw data
        const teamSeasonRecord = rawData.find(
          (row) =>
            row.team_id === selectedTeam?.id && row.season_id === season?.id
        );

        set({
          selectedSeason: season,
          selectedTeamSeasonId: teamSeasonRecord?.id || null,
        });
      },

      // Load and normalize data
      loadTeamsView: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch("/api/teams_seasons_view");
          if (!response.ok) throw new Error("Failed to fetch teams");

          const rawData = await response.json();
          const normalized = normalizeTeamsView(rawData);

          set({
            rawData: normalized.rawData,
            clubs: normalized.clubs,
            teams: normalized.teams,
            seasons: normalized.seasons,
            isLoading: false,
          });
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },

      // Filtered getters based on cascade
      getAvailableTypes: () => {
        const { clubs } = get();
        return [...new Set(clubs.map((club) => club.type))];
      },

      getAvailableClubs: () => {
        const { clubs, selectedType } = get();
        if (!selectedType) return [];
        return clubs.filter(
          (club) => club.type === selectedType && club.is_active
        );
      },

      getAvailableTeams: () => {
        const { teams, selectedClub } = get();
        if (!selectedClub) return [];
        return teams.filter(
          (team) => team.club_id === selectedClub.id && team.is_active
        );
      },

      getAvailableSeasons: () => {
        const { rawData, selectedTeam } = get();
        if (!selectedTeam) return [];

        // Get unique seasons for this team from raw data
        const teamSeasons = rawData
          .filter((row) => row.team_id === selectedTeam.id && row.season_id)
          .map((row) => ({
            id: row.season_id,
            name: row.season_name,
            start: row.season_start,
            end: row.season_end,
            is_current: row.is_current,
            team_season_id: row.id, // The junction table ID
          }));

        // Remove duplicates and sort
        const uniqueSeasons = Array.from(
          new Map(teamSeasons.map((s) => [s.id, s])).values()
        );

        return uniqueSeasons.sort((a, b) => {
          if (a.is_current && !b.is_current) return -1;
          if (!a.is_current && b.is_current) return 1;
          return new Date(b.start) - new Date(a.start);
        });
      },
    }),
    {
      name: "team-selector-storage",
      partialize: (state) => ({
        selectedType: state.selectedType,
        selectedClub: state.selectedClub,
        selectedTeam: state.selectedTeam,
        selectedSeason: state.selectedSeason,
        selectedTeamSeasonId: state.selectedTeamSeasonId,
      }),
    }
  )
);
