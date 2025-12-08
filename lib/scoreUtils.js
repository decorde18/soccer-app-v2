// lib/scoreUtils.js
// Helper functions for managing game scores
// NOTE: These are for MANUAL score entry only
// Auto-calculated scores come from game_events

import { apiFetch } from "@/app/api/fetcher";

/**
 * Manually set the game score (overrides calculated score from events)
 * Use this ONLY when entering scores without detailed stat tracking
 * @param {number} gameId - The game ID
 * @param {number} homeScore - Home team score
 * @param {number} awayScore - Away team score
 */
export async function setManualScore(gameId, homeScore, awayScore) {
  try {
    // Check if score record exists
    const [existingScore] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    if (existingScore) {
      // Update existing score
      await apiFetch(`game_scores?id=${existingScore.id}`, "PUT", {
        home_score: homeScore,
        away_score: awayScore,
      });
    } else {
      // Create new score record
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
    console.error("Error setting manual score:", error);
    throw error;
  }
}

/**
 * Gets the current game score with priority logic:
 * 1. If game_scores record exists → use it (manual entry)
 * 2. Otherwise → calculate from goal events (stat tracking)
 * @param {number} gameId - The game ID
 * @param {number} homeTeamSeasonId - Home team season ID
 * @param {number} awayTeamSeasonId - Away team season ID
 * @returns {Promise<{home: number, away: number, mode: 'manual'|'calculated'}>}
 */
export async function getGameScore(gameId, homeTeamSeasonId, awayTeamSeasonId) {
  try {
    // Check for manual score first (priority)
    const [manualScore] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    if (manualScore) {
      return {
        home: manualScore.home_score || 0,
        away: manualScore.away_score || 0,
        mode: "manual",
      };
    }

    // No manual score - calculate from events
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

    return {
      home: homeScore,
      away: awayScore,
      mode: "calculated",
    };
  } catch (error) {
    console.error("Error getting game score:", error);
    return { home: 0, away: 0, mode: "calculated" };
  }
}

/**
 * Switch from manual score to calculated score
 * (deletes game_scores record so events become source of truth)
 * @param {number} gameId - The game ID
 */
export async function switchToCalculatedScore(gameId) {
  try {
    const [existingScore] = await apiFetch("game_scores", "GET", null, null, {
      filters: { game_id: gameId },
    });

    if (existingScore) {
      await apiFetch(`game_scores?id=${existingScore.id}`, "DELETE");
      return {
        success: true,
        message: "Switched to calculated score from events",
      };
    }

    return { success: true, message: "Already using calculated score" };
  } catch (error) {
    console.error("Error switching to calculated score:", error);
    throw error;
  }
}

/**
 * Switch from calculated score to manual score
 * (creates game_scores record with current calculated values)
 * @param {number} gameId - The game ID
 * @param {number} homeTeamSeasonId - Home team season ID
 * @param {number} awayTeamSeasonId - Away team season ID
 */
export async function switchToManualScore(
  gameId,
  homeTeamSeasonId,
  awayTeamSeasonId
) {
  try {
    // Get current calculated score
    const currentScore = await getGameScore(
      gameId,
      homeTeamSeasonId,
      awayTeamSeasonId
    );

    if (currentScore.mode === "manual") {
      return { success: true, message: "Already using manual score" };
    }

    // Create manual score record with current values
    await setManualScore(gameId, currentScore.home, currentScore.away);

    return {
      success: true,
      message: "Switched to manual score entry",
      score: { home: currentScore.home, away: currentScore.away },
    };
  } catch (error) {
    console.error("Error switching to manual score:", error);
    throw error;
  }
}
