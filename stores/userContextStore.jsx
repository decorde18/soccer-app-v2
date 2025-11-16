// stores/userContextStore.js
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserContextStore = create(
  persist(
    (set, get) => ({
      // User's relationships (loaded on login)
      myTeams: [], // All teams user has access to
      myClubs: [], // Clubs where user is admin
      favoriteTeams: [], // Teams user favorited

      // Current context (when viewing a specific team)
      currentTeamSeasonId: null,
      currentRole: null, // Role in current team context

      isLoading: false,
      error: null,

      // Load user's full context
      loadUserContext: async (userId) => {
        console.log("=== LOADING USER CONTEXT ===");
        console.log("User ID:", userId);

        set({ isLoading: true, error: null });

        try {
          // ✅ Just fetch from API - no database imports!
          const response = await fetch(`/api/users/${userId}/context`);

          console.log("Response status:", response.status);
          console.log("Response ok:", response.ok);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to load user context");
          }

          const data = await response.json();

          console.log("Context data received:", data);
          console.log("Teams:", data.teams?.length || 0);
          console.log("Clubs:", data.clubs?.length || 0);

          set({
            myTeams: data.teams || [], // From team_staff, player_teams, parent relationships
            myClubs: data.clubs || [], // From club_staff
            favoriteTeams: data.favorites || [], // From user_favorites
            isLoading: false,
          });

          return data;
        } catch (error) {
          console.error("❌ Context load error:", error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // Set context when viewing a team
      setTeamContext: (teamSeasonId) => {
        const { myTeams, myClubs } = get();

        // Find user's role for this team
        const teamAccess = myTeams.find(
          (t) => t.team_season_id === teamSeasonId
        );

        // Check if user is club admin for this team's club
        const isClubAdmin = myClubs.some(
          (c) =>
            myTeams.find((t) => t.team_season_id === teamSeasonId)?.club_id ===
            c.club_id
        );

        set({
          currentTeamSeasonId: teamSeasonId,
          currentRole: isClubAdmin ? "club_admin" : teamAccess?.role || null,
        });
      },

      // Permission checks (deprecated - use contextPermissions.js instead)
      canEdit: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "assistant_coach",
          "team_admin",
        ].includes(currentRole);
      },

      canEnterStats: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "assistant_coach",
          "stats_keeper",
        ].includes(currentRole);
      },

      canManageRoster: () => {
        const { currentRole } = get();
        return [
          "system_admin",
          "club_admin",
          "head_coach",
          "team_admin",
        ].includes(currentRole);
      },

      // Add/remove favorites
      addFavorite: async (teamId) => {
        try {
          // Get token from auth store
          const { default: useAuthStore } = await import("./authStore");
          const token = useAuthStore.getState().token;

          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ teamId }),
          });

          if (response.ok) {
            const team = await response.json();
            set((state) => ({
              favoriteTeams: [...state.favoriteTeams, team],
            }));
          }
        } catch (error) {
          console.error("Failed to add favorite:", error);
        }
      },

      removeFavorite: async (teamId) => {
        try {
          // Get token from auth store
          const { default: useAuthStore } = await import("./authStore");
          const token = useAuthStore.getState().token;

          await fetch(`/api/favorites/${teamId}`, {
            method: "DELETE",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          set((state) => ({
            favoriteTeams: state.favoriteTeams.filter((t) => t.id !== teamId),
          }));
        } catch (error) {
          console.error("Failed to remove favorite:", error);
        }
      },

      clearContext: () =>
        set({
          myTeams: [],
          myClubs: [],
          favoriteTeams: [],
          currentTeamSeasonId: null,
          currentRole: null,
        }),
    }),
    {
      name: "user-context-storage",
      partialize: (state) => ({
        myTeams: state.myTeams,
        myClubs: state.myClubs,
        favoriteTeams: state.favoriteTeams,
        currentTeamSeasonId: state.currentTeamSeasonId,
        currentRole: state.currentRole,
      }),
    }
  )
);
