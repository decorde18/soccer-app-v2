// lib/scoreUtils.js
// Helper functions for managing game scores

import { apiFetch } from "@/app/api/fetcher";

/**
 * Updates the game score after a goal is recorded
 * @param {number} gameId - The game ID
 * @param {number} scoringTeamSeasonId - Team season ID that scored
 * @param {number} homeTeamSeasonId - Home team season ID
 * @param {number} awayTeamSeasonId - Away team season ID
 */
export async function updateGameScore(
  gameId,
  scoringTeamSeasonId,
  homeTeamSeasonId,
  awayTeamSeasonId
) {
  try {
    // Fetch current score record
    const [existingScore] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    const isHomeGoal = scoringTeamSeasonId === homeTeamSeasonId;

    if (existingScore) {
      // Update existing score
      const newHomeScore = isHomeGoal
        ? (existingScore.home_score || 0) + 1
        : existingScore.home_score || 0;
      const newAwayScore = !isHomeGoal
        ? (existingScore.away_score || 0) + 1
        : existingScore.away_score || 0;

      await apiFetch(`game_scores?id=${existingScore.id}`, "PUT", {
        home_score: newHomeScore,
        away_score: newAwayScore,
      });

      return { home: newHomeScore, away: newAwayScore };
    } else {
      // Create new score record
      const newScore = {
        game_id: gameId,
        home_score: isHomeGoal ? 1 : 0,
        away_score: !isHomeGoal ? 1 : 0,
        home_penalty_score: null,
        away_penalty_score: null,
        final_status: "regulation",
      };

      await apiFetch("game_scores", "POST", newScore);

      return { home: newScore.home_score, away: newScore.away_score };
    }
  } catch (error) {
    console.error("Error updating game score:", error);
    throw error;
  }
}

/**
 * Recalculates game score from all goal events
 * Useful for fixing score discrepancies
 * @param {number} gameId - The game ID
 * @param {number} homeTeamSeasonId - Home team season ID
 * @param {number} awayTeamSeasonId - Away team season ID
 */
export async function recalculateGameScore(
  gameId,
  homeTeamSeasonId,
  awayTeamSeasonId
) {
  try {
    // Fetch all goal events
    const goalEvents = await apiFetch("game_events", "GET", null, null, {
      filters: { game_id: gameId, event_type: "goal" },
    });

    let homeScore = 0;
    let awayScore = 0;

    goalEvents.forEach((event) => {
      if (event.team_season_id === homeTeamSeasonId) {
        homeScore++;
      } else if (event.team_season_id === awayTeamSeasonId) {
        awayScore++;
      }
    });

    // Update or create score record
    const [existingScore] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    if (existingScore) {
      await apiFetch(`game_scores?id=${existingScore.id}`, "PUT", {
        home_score: homeScore,
        away_score: awayScore,
      });
    } else {
      await apiFetch("game_scores", "POST", {
        game_id: gameId,
        home_score: homeScore,
        away_score: awayScore,
        home_penalty_score: null,
        away_penalty_score: null,
        final_status: "regulation",
      });
    }

    return { home: homeScore, away: awayScore };
  } catch (error) {
    console.error("Error recalculating game score:", error);
    throw error;
  }
}

/**
 * Gets the current game score
 * @param {number} gameId - The game ID
 * @returns {Promise<{home: number, away: number}>}
 */
export async function getGameScore(gameId) {
  try {
    const [score] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    if (score) {
      return {
        home: score.home_score || 0,
        away: score.away_score || 0,
      };
    }

    return { home: 0, away: 0 };
  } catch (error) {
    console.error("Error getting game score:", error);
    return { home: 0, away: 0 };
  }
}
