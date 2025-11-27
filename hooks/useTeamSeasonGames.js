"use client";
import { useEffect, useState } from "react";
import { useApiData } from "@/hooks/useApiData";
import { apiFetch } from "@/app/api/fetcher";
import {
  processGameFormData,
  processGameUpdate,
  validateGameData,
} from "@/lib/gameDataProcessor";

export function useTeamSeasonGames(teamSeasonId) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonId, setSeasonId] = useState(null);

  // Fetch home games
  const {
    loading: loadingHome,
    error: errorHome,
    data: homeGames,
    refetch: refetchHome,
  } = useApiData("v_games_summary", {
    filters: { home_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });

  // Fetch away games
  const {
    loading: loadingAway,
    error: errorAway,
    data: awayGames,
    refetch: refetchAway,
  } = useApiData("v_games_summary", {
    filters: { away_team_season_id: teamSeasonId },
    sortBy: "start_date",
    order: "asc",
  });

  // Get season_id from team_seasons
  useEffect(() => {
    async function fetchSeasonId() {
      try {
        const teamSeason = await apiFetch(
          "team_seasons",
          "GET",
          null,
          teamSeasonId
        );
        setSeasonId(teamSeason.season_id);
      } catch (err) {
        console.error("Failed to fetch season ID:", err);
      }
    }

    if (teamSeasonId && !seasonId) {
      fetchSeasonId();
    }
  }, [teamSeasonId, seasonId]);

  useEffect(() => {
    const isLoading = loadingHome || loadingAway;
    const hasError = errorHome || errorAway;

    setLoading(isLoading);
    setError(hasError || null);

    if (isLoading || hasError) return;

    // Merge home + away
    const allGames = [...homeGames, ...awayGames];

    // Dedupe by game_id
    const merged = Array.from(
      new Map(allGames.map((g) => [g.game_id, g])).values()
    );

    // Sort chronologically
    merged.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    setGames(merged);
  }, [loadingHome, loadingAway, homeGames, awayGames, errorHome, errorAway]);

  /**
   * Add a new game
   */
  const addGame = async (formData) => {
    try {
      setLoading(true);

      // Validate
      const validation = validateGameData(formData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Process form data into database structure
      const { gameRecord, scoreRecord, leagueAssociations, overtimeRecord } =
        processGameFormData(formData, teamSeasonId, seasonId);
      console.log(gameRecord);
      // 1. Create main game record
      const createdGame = await apiFetch("games", "POST", gameRecord);
      const gameId = createdGame.id;

      // 2. Create score record if scores exist
      if (scoreRecord) {
        await apiFetch("game_scores", "POST", {
          game_id: gameId,
          ...scoreRecord,
        });
      }

      // 3. Create league associations
      for (const association of leagueAssociations) {
        await apiFetch("game_league_nodes", "POST", {
          game_id: gameId,
          league_node_id: association.league_node_id,
          is_primary: association.is_primary,
        });
      }

      // 4. Create overtime record if applicable
      if (overtimeRecord) {
        await apiFetch("games_overtimes", "POST", {
          game_id: gameId,
          ...overtimeRecord,
        });
      }

      // Refetch games to get updated list
      await Promise.all([refetchHome(), refetchAway()]);

      return createdGame;
    } catch (err) {
      console.error("Failed to create game:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing game
   */
  const updateGame = async (gameId, formData) => {
    try {
      setLoading(true);

      // Validate
      const validation = validateGameData(formData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Get existing game data
      const existingGame = games.find((g) => g.game_id === gameId);

      // Process update
      const {
        gameRecord,
        scoreRecord,
        leagueAssociations,
        overtimeRecord,
        scoreOperation,
      } = processGameUpdate(formData, existingGame, teamSeasonId, seasonId);

      // 1. Update main game record
      await apiFetch("games", "PATCH", gameRecord, gameId);

      // 2. Handle score record
      if (scoreRecord) {
        if (scoreOperation === "update") {
          // Find existing score record
          const existingScore = await apiFetch(
            "game_scores",
            "GET",
            null,
            null,
            {
              filters: { game_id: gameId },
            }
          );
          if (existingScore.length > 0) {
            await apiFetch(
              "game_scores",
              "PATCH",
              scoreRecord,
              existingScore[0].id
            );
          } else {
            await apiFetch("game_scores", "POST", {
              game_id: gameId,
              ...scoreRecord,
            });
          }
        } else {
          await apiFetch("game_scores", "POST", {
            game_id: gameId,
            ...scoreRecord,
          });
        }
      }

      // 3. Update league associations
      // First, delete existing associations
      const existingAssociations = await apiFetch(
        "game_league_nodes",
        "GET",
        null,
        null,
        {
          filters: { game_id: gameId },
        }
      );

      for (const assoc of existingAssociations) {
        await apiFetch(
          "game_league_nodes",
          "DELETE",
          null,
          `${gameId}/${assoc.league_node_id}`
        );
      }

      // Then create new associations
      for (const association of leagueAssociations) {
        await apiFetch("game_league_nodes", "POST", {
          game_id: gameId,
          league_node_id: association.league_node_id,
          is_primary: association.is_primary,
        });
      }

      // 4. Handle overtime record
      if (overtimeRecord) {
        // Check if overtime record exists
        const existingOT = await apiFetch(
          "games_overtimes",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );

        if (existingOT.length > 0) {
          await apiFetch(
            "games_overtimes",
            "PATCH",
            overtimeRecord,
            existingOT[0].id
          );
        } else {
          await apiFetch("games_overtimes", "POST", {
            game_id: gameId,
            ...overtimeRecord,
          });
        }
      }

      // Refetch games
      await Promise.all([refetchHome(), refetchAway()]);

      return true;
    } catch (err) {
      console.error("Failed to update game:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a game
   */
  const deleteGame = async (gameId) => {
    try {
      setLoading(true);

      // Delete game (cascading deletes should handle related records)
      await apiFetch("games", "DELETE", null, gameId);

      // Refetch games
      await Promise.all([refetchHome(), refetchAway()]);

      return true;
    } catch (err) {
      console.error("Failed to delete game:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    games,
    loading,
    error,
    setGames,
    addGame,
    updateGame,
    deleteGame,
    refetch: async () => {
      await Promise.all([refetchHome(), refetchAway()]);
    },
  };
}
