// stores/gameEventsStore.js
// Write-only event recording with stat calculation helpers
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";

const useGameEventsStore = create((set, get) => ({
  // ==================== RECORDING STATE ====================
  isRecording: false,

  // ==================== STAT CALCULATION HELPERS ====================

  /**
   * Calculate team stats from gameStore data
   */
  calculateTeamStats: () => {
    const game = useGameStore.getState().game;
    if (!game) return null;

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    const stats = {
      corner: { us: 0, them: 0 },
      offside: { us: 0, them: 0 },
      foul: { us: 0, them: 0 },
      throwIn: { us: 0, them: 0 },
      goalKick: { us: 0, them: 0 },
      freeKick: { us: 0, them: 0 },
      shot: 0,
      shotOnTarget: 0,
      save: 0,
    };

    // Team events
    game.gameEventsTeam.forEach((event) => {
      const isUs = event.team_season_id === teamSeasonId;

      switch (event.event_type) {
        case "corner":
          isUs ? stats.corner.us++ : stats.corner.them++;
          break;
        case "offside":
          isUs ? stats.offside.us++ : stats.offside.them++;
          break;
        case "foul":
          isUs ? stats.foul.us++ : stats.foul.them++;
          break;
        case "throw_in":
          isUs ? stats.throwIn.us++ : stats.throwIn.them++;
          break;
        case "goal_kick":
          isUs ? stats.goalKick.us++ : stats.goalKick.them++;
          break;
        case "free_kick":
          isUs ? stats.freeKick.us++ : stats.freeKick.them++;
          break;
      }
    });

    // Player actions
    game.playerActions.forEach((action) => {
      if (action.event_type === "shot") stats.shot++;
      if (action.event_type === "shot_on_target") stats.shotOnTarget++;
      if (action.event_type === "save") stats.save++;
    });

    return stats;
  },

  /**
   * Get goal scorers with details
   */
  getGoalScorers: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    return game.gameEventsGoals
      .filter((g) => g.team_season_id === teamSeasonId)
      .map((goal) => ({
        id: goal.goal_id,
        scorerName: goal.scorer_name,
        scorerJersey: goal.scorer_jersey_number,
        assistName: goal.assist_name,
        assistJersey: goal.assist_jersey_number,
        gameTime: goal.game_time,
        period: goal.period,
        isOwnGoal: goal.is_own_goal,
        goalTypes: goal.goal_types,
      }));
  },

  /**
   * Get discipline events (cards)
   */
  getDisciplineEvents: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    const teamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    return game.gameEventsDiscipline.map((card) => ({
      id: card.discipline_id,
      playerName: card.player_name,
      jerseyNumber: card.jersey_number,
      cardType: card.card_type,
      cardReason: card.card_reason,
      gameTime: card.game_time,
      period: card.period,
      isOurTeam: card.team_season_id === teamSeasonId,
    }));
  },

  /**
   * Get penalty kick events
   */
  getPenaltyKicks: () => {
    const game = useGameStore.getState().game;
    if (!game) return [];

    return game.gameEventsPenalties.map((pk) => ({
      id: pk.penalty_id,
      shooterName: pk.shooter_name,
      shooterJersey: pk.shooter_jersey_number,
      gkName: pk.gk_name,
      outcome: pk.outcome,
      isShootout: pk.is_shootout,
      shootoutRound: pk.shootout_round,
      gameTime: pk.game_time,
      period: pk.period,
    }));
  },

  // ==================== RECORD GOAL ====================

  recordGoal: async (goalData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      // 1. Create major event (stoppage)
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "goal",
        game_time: gameTime,
        end_time: null, // Goals are instant, no end time
        period: period,
        clock_should_run: 1, // Clock continues after goal
        details: goalData.details || null,
      });

      // 2. Determine team_season_id
      let teamSeasonId = goalData.teamSeasonId;
      let scorerPlayerGameId = goalData.scorerPlayerGameId;
      let opponentJerseyNumber = goalData.opponentJerseyNumber || null;

      // If scoring for our team with a player
      if (!teamSeasonId && scorerPlayerGameId) {
        const playersStore = useGamePlayersStore.getState();
        const player = playersStore.getPlayerByPlayerGameId(scorerPlayerGameId);
        if (player) {
          teamSeasonId = player.teamSeasonId;
        }
      }

      // Default to our team if not specified
      if (!teamSeasonId) {
        teamSeasonId = game.isHome
          ? game.home_team_season_id
          : game.away_team_season_id;
      }

      // 3. Create goal event
      const goalEvent = await apiFetch("game_events_goals", "POST", {
        major_event_id: majorEvent.id,
        team_season_id: teamSeasonId,
        scorer_player_game_id: scorerPlayerGameId || null,
        opponent_jersey_number: opponentJerseyNumber,
        assist_player_game_id: goalData.assistPlayerGameId || null,
        defending_gk_player_game_id: goalData.defendingGkPlayerGameId || null,
        is_own_goal: goalData.isOwnGoal || 0,
        goal_types: goalData.goalTypes
          ? JSON.stringify(goalData.goalTypes)
          : null,
      });

      // 4. Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      set({ isRecording: false });
      return goalEvent;
    } catch (error) {
      console.error("Error recording goal:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== RECORD DISCIPLINE (CARD) ====================

  recordCard: async (cardData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      // 1. Create major event
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "discipline",
        game_time: gameTime,
        end_time: null,
        period: period,
        clock_should_run: 1,
        details: cardData.cardReason || null,
      });

      // 2. Determine team_season_id
      let teamSeasonId = cardData.teamSeasonId;
      let playerGameId = cardData.playerGameId;
      let opponentJerseyNumber = cardData.opponentJerseyNumber || null;

      if (!teamSeasonId && playerGameId) {
        const playersStore = useGamePlayersStore.getState();
        const player = playersStore.getPlayerByPlayerGameId(playerGameId);
        if (player) {
          teamSeasonId = player.teamSeasonId;
        }
      }

      // Default to our team if not specified
      if (!teamSeasonId) {
        teamSeasonId = game.isHome
          ? game.home_team_season_id
          : game.away_team_season_id;
      }

      // 3. Create discipline event
      const cardEvent = await apiFetch("game_events_discipline", "POST", {
        major_event_id: majorEvent.id,
        team_season_id: teamSeasonId,
        player_game_id: playerGameId || null,
        opponent_jersey_number: opponentJerseyNumber,
        card_type: cardData.cardType, // 'yellow', 'red', 'yellow_red'
        card_reason: cardData.cardReason || null,
      });

      // 4. Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      set({ isRecording: false });
      return cardEvent;
    } catch (error) {
      console.error("Error recording card:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== RECORD PENALTY KICK ====================

  recordPenaltyKick: async (penaltyData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      // 1. Create major event
      const majorEvent = await apiFetch("game_events_major", "POST", {
        game_id: game.game_id,
        event_type: "penalty",
        game_time: gameTime,
        end_time: null,
        period: period,
        clock_should_run: 1,
        details: penaltyData.details || null,
      });

      // 2. Determine team_season_id
      let teamSeasonId = penaltyData.teamSeasonId;
      const shooterPlayerGameId = penaltyData.shooterPlayerGameId;

      if (!teamSeasonId && shooterPlayerGameId) {
        const playersStore = useGamePlayersStore.getState();
        const player =
          playersStore.getPlayerByPlayerGameId(shooterPlayerGameId);
        if (player) {
          teamSeasonId = player.teamSeasonId;
        }
      }

      // Default to our team if not specified
      if (!teamSeasonId) {
        teamSeasonId = game.isHome
          ? game.home_team_season_id
          : game.away_team_season_id;
      }

      // 3. Create penalty event
      const penaltyEvent = await apiFetch("game_events_penalties", "POST", {
        major_event_id: majorEvent.id,
        game_id: penaltyData.isShootout ? game.game_id : null,
        team_season_id: teamSeasonId,
        shooter_player_game_id: shooterPlayerGameId || null,
        opponent_jersey_number: penaltyData.opponentJerseyNumber || null,
        gk_player_game_id: penaltyData.gkPlayerGameId || null,
        outcome: penaltyData.outcome, // 'goal', 'saved', 'missed', 'hit_post'
        is_shootout: penaltyData.isShootout || 0,
        shootout_round: penaltyData.shootoutRound || null,
        game_time: penaltyData.isShootout ? gameTime : null,
        period: penaltyData.isShootout ? period : null,
        goal_id: null, // Will be set if goal is created
      });

      let goalId = null;

      // 4. If outcome is 'goal', create goal event
      if (penaltyData.outcome === "goal") {
        const goalEvent = await apiFetch("game_events_goals", "POST", {
          major_event_id: majorEvent.id,
          team_season_id: teamSeasonId,
          scorer_player_game_id: shooterPlayerGameId || null,
          opponent_jersey_number: penaltyData.opponentJerseyNumber || null,
          assist_player_game_id: null,
          defending_gk_player_game_id: penaltyData.gkPlayerGameId || null,
          is_own_goal: 0,
          goal_types: JSON.stringify(["penalty"]),
        });

        goalId = goalEvent.id;

        // Update penalty event with goal_id
        await apiFetch(`game_events_penalties?id=${penaltyEvent.id}`, "PUT", {
          goal_id: goalId,
        });
      }

      // 5. If outcome is 'saved', create save action for GK
      if (penaltyData.outcome === "saved" && penaltyData.gkPlayerGameId) {
        await apiFetch("game_events_player_actions", "POST", {
          game_id: game.game_id,
          player_game_id: penaltyData.gkPlayerGameId,
          event_type: "save",
          game_time: gameTime,
          period: period,
        });
      }

      // 6. Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      set({ isRecording: false });
      return penaltyEvent;
    } catch (error) {
      console.error("Error recording penalty kick:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== RECORD PLAYER ACTION ====================

  recordPlayerAction: async (actionData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      const actionEvent = await apiFetch("game_events_player_actions", "POST", {
        game_id: game.game_id,
        player_game_id: actionData.playerGameId,
        event_type: actionData.eventType, // 'shot', 'shot_on_target', 'shot_blocked', 'save'
        game_time: gameTime,
        period: period,
      });

      // Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      set({ isRecording: false });
      return actionEvent;
    } catch (error) {
      console.error("Error recording player action:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== RECORD TEAM EVENT ====================

  recordTeamEvent: async (teamEventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    set({ isRecording: true });

    try {
      // Determine which team
      let teamSeasonId = teamEventData.teamSeasonId;

      if (!teamSeasonId) {
        // Use forYourTeam flag to determine
        if (teamEventData.forYourTeam) {
          teamSeasonId = game.isHome
            ? game.home_team_season_id
            : game.away_team_season_id;
        } else {
          teamSeasonId = game.isHome
            ? game.away_team_season_id
            : game.home_team_season_id;
        }
      }

      const teamEvent = await apiFetch("game_events_team", "POST", {
        game_id: game.game_id,
        team_season_id: teamSeasonId,
        event_type: teamEventData.eventType, // 'foul', 'corner', 'offside', 'throw_in', 'goal_kick', 'free_kick'
        game_time: gameTime,
        period: period,
      });

      // Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      set({ isRecording: false });
      return teamEvent;
    } catch (error) {
      console.error("Error recording team event:", error);
      set({ isRecording: false });
      throw error;
    }
  },

  // ==================== DELETE EVENT ====================

  deleteEvent: async (eventId, eventType) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;

    try {
      // Use gameStore's delete function which handles all event types
      await gameStore.deleteEvent(eventId, eventType);

      // Refresh game data
      await gameStore.initializeGame(
        game.game_id,
        game.isHome ? game.home_team_season_id : game.away_team_season_id
      );

      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // ==================== CONVENIENCE RECORDING METHODS ====================

  /**
   * Record a shot (on target or off target)
   */
  recordShot: async (playerGameId, onTarget = false) => {
    return get().recordPlayerAction({
      playerGameId,
      eventType: onTarget ? "shot_on_target" : "shot",
    });
  },

  /**
   * Record a save by goalkeeper
   */
  recordSave: async (playerGameId) => {
    return get().recordPlayerAction({
      playerGameId,
      eventType: "save",
    });
  },

  /**
   * Record a corner kick
   */
  recordCorner: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "corner",
      forYourTeam,
    });
  },

  /**
   * Record an offside
   */
  recordOffside: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "offside",
      forYourTeam,
    });
  },

  /**
   * Record a foul
   */
  recordFoul: async (forYourTeam = true) => {
    return get().recordTeamEvent({
      eventType: "foul",
      forYourTeam,
    });
  },

  // ==================== QUERY HELPERS (using views) ====================

  getTeamStats: async (gameId, teamSeasonId) => {
    try {
      const [stats] = await apiFetch("v_team_game_stats", "GET", null, null, {
        filters: { game_id: gameId, team_season_id: teamSeasonId },
      });
      return stats;
    } catch (error) {
      console.error("Error fetching team stats:", error);
      return null;
    }
  },

  getPeriodStats: async (gameId, playerId) => {
    try {
      const stats = await apiFetch("v_player_period_stats", "GET", null, null, {
        filters: { game_id: gameId, player_id: playerId },
      });
      return stats;
    } catch (error) {
      console.error("Error fetching period stats:", error);
      return [];
    }
  },

  getPlayerSeasonStats: async (teamSeasonId, playerId) => {
    try {
      const [stats] = await apiFetch(
        "v_player_season_stats_calculated",
        "GET",
        null,
        null,
        { filters: { team_season_id: teamSeasonId, player_id: playerId } }
      );
      return stats;
    } catch (error) {
      console.error("Error fetching season stats:", error);
      return null;
    }
  },

  getPlayerCareerStats: async (playerId) => {
    try {
      const [stats] = await apiFetch(
        "v_player_career_stats",
        "GET",
        null,
        null,
        { filters: { player_id: playerId } }
      );
      return stats;
    } catch (error) {
      console.error("Error fetching career stats:", error);
      return null;
    }
  },
}));

export default useGameEventsStore;
