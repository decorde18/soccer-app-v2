// lib/gameDataProcessor.js
/**
 * Processes game form data into database-ready format
 * Handles all the complex logic for creating a complete game record
 */

import { toDateInputValue, toTimeInputValue } from "./dateTimeUtils";

/**
 * Calculate end datetime based on start datetime
 * Default game duration: 1 hour 45 minutes (105 minutes)
 */
export function calculateEndDateTime(
  startDate,
  startTime,
  durationMinutes = 105
) {
  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  return {
    end_date: end.toISOString().split("T")[0],
    end_time: end.toTimeString().slice(0, 5),
  };
}

/**
 * Determine home/away team season IDs based on selection
 */
export function determineTeamSeasonIds(formData, currentTeamSeasonId) {
  const isHome = formData.home_away === "home";

  return {
    home_team_season_id: isHome ? currentTeamSeasonId : formData.opponent,
    away_team_season_id: isHome ? formData.opponent : currentTeamSeasonId,
  };
}

/**
 * Determine if game has scores and calculate stats_completeness
 */
export function determineStatsCompleteness(scoreUs, scoreThem) {
  const hasScores =
    scoreUs !== null &&
    scoreUs !== undefined &&
    scoreThem !== null &&
    scoreThem !== undefined;

  if (!hasScores) return "none";

  // If scores exist, minimum is score_only
  // Could be upgraded to partial_events or complete later
  return "score_only";
}

/**
 * Process league/tournament associations
 * Returns array of league node season IDs with primary flag
 */
export function processLeagueAssociations(leagueNodeIds) {
  if (!leagueNodeIds || leagueNodeIds.length === 0) {
    return [];
  }

  // First one is primary, rest are secondary
  return leagueNodeIds.map((nodeId, index) => ({
    league_node_id: nodeId,
    is_primary: index === 0 ? 1 : 0,
  }));
}

/**
 * Main processor: Transform form data into complete game structure
 */
export function processGameFormData(formData, currentTeamSeasonId, seasonId) {
  const { end_date, end_time } = formData.start_time
    ? calculateEndDateTime(formData.start_date, formData.start_time)
    : { end_date: null, end_time: null };

  const { home_team_season_id, away_team_season_id } = determineTeamSeasonIds(
    formData,
    currentTeamSeasonId
  );

  const stats_completeness = determineStatsCompleteness(
    formData.score_us,
    formData.score_them
  );

  // Determine if game should be marked completed based on scores
  const hasScores = formData.score_us !== null && formData.score_them !== null;
  const status = hasScores ? "completed" : formData.status;

  // Base game record
  const gameRecord = {
    season_id: seasonId,
    start_date: toDateInputValue(formData.start_date),
    start_time: toTimeInputValue(formData.start_time) || null,
    end_date: toDateInputValue(end_date) || null,
    end_time: toTimeInputValue(end_time) || null,
    timezone_label: formData.timezone_label,
    home_team_season_id,
    away_team_season_id,
    location_id: formData.location_id || null,
    sublocation_id: formData.sublocation_id || null,
    game_type: formData.game_type,
    status,
    stats_completeness,
    default_reg_periods: "2", // Default for soccer
    notes: formData.notes || null,
    video_link: formData.video_link || null,
  };

  // Score record (if scores exist)
  const scoreRecord = hasScores
    ? {
        home_score:
          formData.home_away === "home"
            ? formData.score_us
            : formData.score_them,
        away_score:
          formData.home_away === "home"
            ? formData.score_them
            : formData.score_us,
        final_status: formData.has_overtime ? "overtime" : "regulation",
      }
    : null;

  // League associations (if applicable)
  const leagueAssociations = ["league", "tournament", "playoff"].includes(
    formData.game_type
  )
    ? processLeagueAssociations(formData.league_node_ids)
    : [];

  // Overtime record (if applicable)
  const overtimeRecord = formData.has_overtime
    ? {
        ot_if_tied: 1,
        so_if_tied: formData.has_shootout ? 1 : 0,
        min_ot_periods: "1",
        max_ot_periods: formData.max_ot_periods || "2",
        default_ot_1_minutes: "10",
      }
    : null;

  return {
    gameRecord,
    scoreRecord,
    leagueAssociations,
    overtimeRecord,
  };
}

/**
 * Update processor: Handle game updates
 */
export function processGameUpdate(
  formData,
  existingGame,
  currentTeamSeasonId,
  seasonId
) {
  // Use same logic as create, but may need to preserve some fields
  const processed = processGameFormData(
    formData,
    currentTeamSeasonId,
    seasonId
  );

  // If game already has a score record, we're updating it
  // If not, we're creating it
  const scoreOperation = existingGame.home_score !== null ? "update" : "create";

  return {
    ...processed,
    scoreOperation,
    existingGameId: existingGame.game_id || existingGame.id,
  };
}

/**
 * Validate game form data
 */
export function validateGameData(formData) {
  const errors = [];

  if (!formData.start_date) errors.push("Start date is required");
  if (!formData.opponent) errors.push("Opponent is required");
  if (!formData.game_type) errors.push("Game type is required");

  // League/tournament games must have league association
  if (["league", "tournament"].includes(formData.game_type)) {
    if (!formData.league_node_ids || formData.league_node_ids.length === 0) {
      errors.push(
        `${formData.game_type} games must be associated with a ${formData.game_type}`
      );
    }
  }

  // If one score is entered, both must be entered
  const hasPartialScore =
    (formData.score_us !== null && formData.score_them === null) ||
    (formData.score_us === null && formData.score_them !== null);
  if (hasPartialScore) {
    errors.push("Both scores must be entered, or leave both empty");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
