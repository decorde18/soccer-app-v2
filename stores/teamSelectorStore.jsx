// stores/teamSelectorStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Helper to extract unique values from the flat data
function normalizeTeamsView(rawData) {
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

  return {
    clubs: Array.from(clubsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    teams: Array.from(teamsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  };
}

export const useTeamSelectorStore = create(
  persist(
    (set, get) => ({
      // Full, denormalized data loaded from API
      rawData: [],

      // Selector state
      selectedType: null,
      selectedClub: null,
      selectedTeam: null,
      selectedSeason: null,
      selectedTeamSeasonId: null,

      isLoading: false,
      error: null,

      // ACTIONS

      /**
       * Load team data from v_teams_all
       * Works for both public and authenticated users - same view, no filtering needed!
       * @param {number} currentTeamSeasonId - Optional: restore this context
       */
      loadTeamsView: async (currentTeamSeasonId = null) => {
        const currentState = get();

        // Prevent loading if already loading
        if (currentState.isLoading) {
          console.log("[TeamSelectorStore] Already loading, skipping...");
          return;
        }

        // If data exists and no specific team season requested, skip loading
        if (currentState.rawData.length > 0 && !currentTeamSeasonId) {
          console.log("[TeamSelectorStore] Data already loaded, skipping...");
          return;
        }

        console.log("[TeamSelectorStore] Loading teams view...");
        set({ isLoading: true, error: null });

        try {
          // Fetch from the universal view - works for everyone!
          const response = await fetch("/api/v_teams_all", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // Include credentials so auth token is sent if available
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Failed to load teams: ${response.statusText}`);
          }

          const rawData = await response.json();
          console.log("[TeamSelectorStore] Loaded", rawData.length, "records");

          // Normalize the data
          const { clubs, teams } = normalizeTeamsView(rawData);

          // Attempt to restore context from the loaded data
          let initialSeason = currentState.selectedSeason;
          let initialTeam = currentState.selectedTeam;
          let initialClub = currentState.selectedClub;
          let initialType = currentState.selectedType;
          let initialTeamSeasonId =
            currentTeamSeasonId || currentState.selectedTeamSeasonId;

          if (initialTeamSeasonId) {
            const initialRow = rawData.find(
              (row) => row.id === initialTeamSeasonId // 'id' is the team_season_id
            );

            if (initialRow) {
              initialSeason = {
                id: initialRow.season_id,
                name: initialRow.season_name,
                start: initialRow.season_start,
                end: initialRow.season_end,
                is_current: initialRow.is_current,
                team_season_id: initialRow.id, // The team_season junction ID
              };
              initialTeam = teams.find((t) => t.id === initialRow.team_id);
              initialClub = clubs.find((c) => c.id === initialRow.club_id);
              initialType = initialRow.type; // 'club' or 'high_school'
            }
          }

          set({
            rawData,
            clubs,
            teams,
            selectedType: initialType,
            selectedClub: initialClub,
            selectedTeam: initialTeam,
            selectedSeason: initialSeason,
            selectedTeamSeasonId: initialTeamSeasonId,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error("Error loading teams view:", error);
          set({
            isLoading: false,
            error: error.message,
          });
        }
      },

      setType: (type) => {
        set({
          selectedType: type,
          selectedClub: null,
          selectedTeam: null,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        });
      },

      setClub: (club) => {
        set({
          selectedClub: club,
          selectedTeam: null,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        });
      },

      setTeam: (team) => {
        set({
          selectedTeam: team,
          selectedSeason: null,
          selectedTeamSeasonId: null,
        });
      },

      setSeason: (season) => {
        const teamSeasonId = season ? season.team_season_id : null;
        set({
          selectedSeason: season,
          selectedTeamSeasonId: teamSeasonId,
        });
      },

      // SELECTORS

      /**
       * Get all available types - ALWAYS shows all types regardless of selection
       */
      getAvailableTypes: () => {
        const { rawData } = get();

        // Get unique club types from ALL the data
        const types = new Set(rawData.map((row) => row.type));
        return Array.from(types)
          .sort()
          .map((type) => ({
            value: type,
            label: type === "club" ? "Club" : "High School",
          }));
      },

      /**
       * Get all available clubs - shows clubs based on selected type OR all clubs with teams
       */
      getAvailableClubs: () => {
        const { rawData, selectedType } = get();

        // Filter by selected type if one is chosen
        const filteredData = selectedType
          ? rawData.filter((row) => row.type === selectedType)
          : rawData;

        const clubsMap = new Map();
        filteredData.forEach((row) => {
          // Only include clubs that have teams (team_id is not null)
          if (row.team_id && !clubsMap.has(row.club_id)) {
            clubsMap.set(row.club_id, {
              id: row.club_id,
              name: row.club_name,
              type: row.type,
            });
          }
        });

        return Array.from(clubsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      },

      /**
       * Get all available teams - shows teams based on selected club OR all teams with seasons
       */
      getAvailableTeams: () => {
        const { rawData, selectedClub } = get();

        // Filter by selected club if one is chosen
        const filteredData = selectedClub
          ? rawData.filter((row) => row.club_id === selectedClub.id)
          : rawData;

        const teamsMap = new Map();
        filteredData.forEach((row) => {
          // Only include teams that have seasons (season_id is not null)
          if (row.team_id && row.season_id && !teamsMap.has(row.team_id)) {
            teamsMap.set(row.team_id, {
              id: row.team_id,
              name: row.team_name,
              club_id: row.club_id,
            });
          }
        });

        return Array.from(teamsMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      },

      /**
       * Get all available seasons - ALWAYS shows all seasons for selected team
       */
      getAvailableSeasons: () => {
        const { rawData, selectedTeam } = get();
        if (!selectedTeam) return [];

        // Show ALL seasons for the selected team
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

        const uniqueSeasons = Array.from(
          new Map(teamSeasons.map((s) => [s.id, s])).values()
        );

        // Sort: current season first, then by date descending
        return uniqueSeasons.sort((a, b) => {
          if (a.is_current && !b.is_current) return -1;
          if (!a.is_current && b.is_current) return 1;
          return new Date(b.start) - new Date(a.start);
        });
      },

      // Get the full current context - useful for passing to child components
      getCurrentContext: () => {
        const state = get();
        return {
          type: state.selectedType,
          club: state.selectedClub,
          team: state.selectedTeam,
          season: state.selectedSeason,
          teamSeasonId: state.selectedTeamSeasonId,
        };
      },

      // Clear all selections
      clearSelections: () => {
        set({
          selectedType: null,
          selectedClub: null,
          selectedTeam: null,
          selectedSeason: null,
          selectedTeamSeasonId: null,
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
