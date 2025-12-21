// utils/gameSummaryHelpers.js
// Normalize major events from different tables into a consistent structure
export function normalizeMajorEvents(game, teamSeasonId) {
  const events = [];

  // Process goals
  game.gameEventsGoals?.forEach((goal) => {
    const isOwnGoal = goal.is_own_goal === 1;
    const isOurs = isOwnGoal
      ? goal.team_season_id !== teamSeasonId // Own goal reverses the team
      : goal.team_season_id === teamSeasonId;

    events.push({
      id: goal.goal_id,
      major_event_id: goal.major_event_id,
      stoppage_type: "goal",
      event_type: "goal",
      game_time: goal.game_time,
      period: goal.period,
      team_season_id: goal.team_season_id,
      isOurs,

      // Goal-specific fields
      scorer_name: goal.scorer_name,
      scorer_jersey_number: goal.scorer_jersey_number,
      scorer_opponent_jersey: goal.scorer_opponent_jersey,
      assist_name: goal.assist_name,
      assist_jersey_number: goal.assist_jersey_number,
      is_own_goal: isOwnGoal,
      goal_types: goal.goal_types,

      // Common fields
      details: goal.stoppage_details,
      clock_should_run: goal.clock_should_run,
      created_at: goal.created_at,
    });
  });

  // Process discipline (cards)
  game.gameEventsDiscipline?.forEach((card) => {
    const isOurs = card.team_season_id === teamSeasonId;

    events.push({
      id: card.discipline_id,
      major_event_id: card.major_event_id,
      stoppage_type: "discipline",
      event_type: "discipline",
      game_time: card.game_time,
      period: card.period,
      team_season_id: card.team_season_id,
      isOurs,

      // Discipline-specific fields
      player_name: card.player_name,
      jersey_number: card.jersey_number,
      opponent_jersey_number: card.opponent_jersey_number,
      card_type: card.card_type,
      card_reason: card.card_reason,

      // Common fields
      details: card.stoppage_details,
      clock_should_run: card.clock_should_run,
      created_at: card.created_at,
    });
  });

  // Process penalties
  game.gameEventsPenalties?.forEach((penalty) => {
    const isOurs = penalty.team_season_id === teamSeasonId;

    events.push({
      id: penalty.penalty_id,
      major_event_id: penalty.major_event_id,
      stoppage_type: "penalty",
      event_type: "penalty",
      game_time: penalty.game_time,
      period: penalty.period,
      team_season_id: penalty.team_season_id,
      isOurs,

      // Penalty-specific fields
      shooter_name: penalty.shooter_name,
      shooter_jersey_number: penalty.shooter_jersey_number,
      shooter_opponent_jersey: penalty.shooter_opponent_jersey,
      gk_name: penalty.gk_name,
      outcome: penalty.outcome,
      is_shootout: penalty.is_shootout,
      shootout_round: penalty.shootout_round,
      goal_id: penalty.goal_id,

      // Common fields
      details: penalty.stoppage_details,
      clock_should_run: penalty.clock_should_run,
      created_at: penalty.created_at,
    });
  });

  // Process other major events (injury, weather, other)
  game.gameEventsMajor?.forEach((major) => {
    // Skip if already processed as goal/discipline/penalty
    const alreadyProcessed = events.some((e) => e.major_event_id === major.id);
    if (alreadyProcessed) return;

    events.push({
      id: major.id,
      major_event_id: major.id,
      stoppage_type: major.event_type, // injury, weather, other
      event_type: major.event_type,
      game_time: major.game_time,
      period: major.period,
      team_season_id: null,
      isOurs: null, // Not applicable for injury/weather

      // Common fields
      details: major.details,
      clock_should_run: major.clock_should_run,
      end_time: major.end_time,
      created_at: major.created_at,
    });
  });

  // Sort by period, then game time
  return events.sort((a, b) => {
    if (a.period !== b.period) return a.period - b.period;
    return a.game_time - b.game_time;
  });
}
// Get display name for an event participant
export function getEventParticipantName(event, role = "primary") {
  let name = null;
  let jerseyNumber = null;
  let opponentJersey = null;

  switch (event.stoppage_type) {
    case "goal":
      if (role === "primary") {
        name = event.scorer_name;
        jerseyNumber = event.scorer_jersey_number;
        opponentJersey = event.scorer_opponent_jersey;
      } else if (role === "assist") {
        name = event.assist_name;
        jerseyNumber = event.assist_jersey_number;
      }
      break;

    case "discipline":
      name = event.player_name;
      jerseyNumber = event.jersey_number;
      opponentJersey = event.opponent_jersey_number;
      break;

    case "penalty":
      if (role === "primary") {
        name = event.shooter_name;
        jerseyNumber = event.shooter_jersey_number;
        opponentJersey = event.shooter_opponent_jersey;
      } else if (role === "gk") {
        name = event.gk_name;
      }
      break;
  }

  // Format the display name
  if (name && jerseyNumber) {
    return `${name} (#${jerseyNumber})`;
  } else if (name) {
    return name;
  } else if (opponentJersey) {
    return `Opponent #${opponentJersey}`;
  }

  return null;
}
// Get event icon
export function getEventIcon(event) {
  switch (event.stoppage_type) {
    case "goal":
      return "⚽";
    case "discipline":
      return event.card_type === "yellow" ? "🟨" : "🟥";
    case "penalty":
      return "🎯";
    case "injury":
      return "🚑";
    case "weather":
      return "🌧️";
    default:
      return "⏸️";
  }
}
// Get event title
export function getEventTitle(event) {
  const participantName = getEventParticipantName(event, "primary");

  switch (event.stoppage_type) {
    case "goal":
      const goalType = event.is_own_goal ? "OWN GOAL" : "GOAL";
      return `${goalType} - ${participantName || "Unknown"}`;

    case "discipline":
      const cardType = event.card_type?.toUpperCase() || "CARD";
      return `${cardType} CARD - ${participantName || "Unknown"}`;

    case "penalty":
      return `PENALTY ${event.outcome?.toUpperCase()} - ${
        participantName || "Unknown"
      }`;

    case "injury":
      return "INJURY STOPPAGE";

    case "weather":
      return "WEATHER DELAY";

    default:
      return event.stoppage_type?.toUpperCase() || "EVENT";
  }
}
// Get event subtitle/details
export function getEventSubtitle(event) {
  const parts = [];

  // Add assist for goals
  if (event.stoppage_type === "goal") {
    const assistName = getEventParticipantName(event, "assist");
    if (assistName) {
      parts.push(`Assist: ${assistName}`);
    }
  }

  // Add GK for penalties
  if (event.stoppage_type === "penalty" && event.outcome === "saved") {
    const gkName = getEventParticipantName(event, "gk");
    if (gkName) {
      parts.push(`Saved by: ${gkName}`);
    }
  }

  // Add card reason
  if (event.stoppage_type === "discipline" && event.card_reason) {
    parts.push(event.card_reason);
  }

  // Add details
  if (event.details) {
    parts.push(event.details);
  }

  return parts.join(" • ");
}
