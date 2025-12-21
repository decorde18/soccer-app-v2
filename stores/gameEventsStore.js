// stores/gameEventsStore.js
// Enhanced event recording with comprehensive stat tracking
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";

const useGameEventsStore = create((set, get) => ({
  // ==================== STATE ====================
  gameEvents: [],
  teamStats: {
    corner: { us: 0, them: 0 },
    offside: { us: 0, them: 0 },
    foul: { us: 0, them: 0 },
    shot: 0,
    save: 0,
  },
  isLoadingEvents: false,

  // ==================== FETCH & CALCULATE ====================

  /**
   * Fetch all game events and calculate team stats
   */
  fetchGameEvents: async (gameId) => {
    if (!gameId) return;

    set({ isLoadingEvents: true });

    try {
      const events = await apiFetch("game_events", "GET", null, null, {
        filters: { game_id: gameId },
      });
      const game = useGameStore.getState().game;

      // Determine which team is "yours"
      const yourTeamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;

      // Calculate stats
      const counts = {
        corner: { us: 0, them: 0 },
        offside: { us: 0, them: 0 },
        foul: { us: 0, them: 0 },
        shot: 0,
        save: 0,
      };
      const gameEvents = events.filter(
        (event) => event.event_category !== "team"
      );
      events.forEach((stat) => {
        const isOurTeam = stat.team_season_id === yourTeamSeasonId;

        if (stat.event_type === "corner") {
          if (isOurTeam) counts.corner.us++;
          else counts.corner.them++;
        } else if (stat.event_type === "offside") {
          if (isOurTeam) counts.offside.us++;
          else counts.offside.them++;
        } else if (stat.event_type === "foul_committed") {
          if (isOurTeam) counts.foul.us++;
          else counts.foul.them++;
        } else if (stat.event_type === "shot_on_target") {
          counts.shot++;
        } else if (stat.event_type === "save") {
          counts.save++;
        }
      });

      set({
        gameEvents,
        teamStats: counts,
        isLoadingEvents: false,
      });

      return { events, teamStats: counts };
    } catch (error) {
      console.error("Error fetching game events:", error);
      set({ isLoadingEvents: false });
      throw error;
    }
  },

  /**
   * Delete an event and refresh stats
   */
  deleteEvent: async (eventId) => {
    try {
      await apiFetch(`game_events?id=${eventId}`, "DELETE");

      const game = useGameStore.getState().game;
      await get().fetchGameEvents(game.game_id);
      await get().refreshPlayerStats(game.game_id);

      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  },

  // ==================== RECORD EVENT ====================

  recordEvent: async (eventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    // Determine team_season attribution
    const playersStore = useGamePlayersStore.getState();
    let teamSeasonId = null;
    let opponentTeamSeasonId = null;
    let defendingPlayerGameId = null;

    // 1. Try to get from player
    if (eventData.playerGameId) {
      const player = playersStore.getPlayerByPlayerGameId(
        eventData.playerGameId
      );
      if (player) {
        teamSeasonId = player.teamSeasonId;
        opponentTeamSeasonId =
          player.homeAway === "home"
            ? game.away_team_season_id
            : game.home_team_season_id;
      }
    }
    // 2. Try to get from explicit eventData
    else if (eventData.teamSeasonId) {
      teamSeasonId = eventData.teamSeasonId;
      opponentTeamSeasonId = eventData.opponentTeamSeasonId;
    }
    // 3. DEFAULT: Assume event is for "your team"
    else {
      teamSeasonId = game.isHome
        ? game.home_team_season_id
        : game.away_team_season_id;
      opponentTeamSeasonId = game.isHome
        ? game.away_team_season_id
        : game.home_team_season_id;
    }

    try {
      const event = await apiFetch("game_events", "POST", {
        game_id: game.game_id,
        player_game_id: eventData.playerGameId || null,
        team_season_id: teamSeasonId,
        opponent_team_season_id: opponentTeamSeasonId,
        defending_player_game_id: defendingPlayerGameId,
        opponent_jersey_number: eventData.opponentJerseyNumber || null,
        event_category: eventData.category,
        event_type: eventData.type,
        game_time: gameTime,
        period: period,

        stoppage_start_time: eventData.stoppageStartTime || null,
        stoppage_end_time: eventData.stoppageEndTime || null,
        clock_should_run: eventData.clockShouldRun ?? 1,
        assist_player_game_id: eventData.assistPlayerGameId || null,
        goal_types: eventData.goalTypes
          ? JSON.stringify(eventData.goalTypes)
          : null,
        card_reason: eventData.cardReason || null,
        details: eventData.details || null,
      });

      // Update local player stats
      if (eventData.playerGameId) {
        const player = playersStore.getPlayerByPlayerGameId(
          eventData.playerGameId
        );
        if (player) {
          get().updatePlayerStatForEvent(player.id, eventData.type);

          // Handle assist
          if (eventData.assistPlayerGameId) {
            const assistPlayer = playersStore.getPlayerByPlayerGameId(
              eventData.assistPlayerGameId
            );
            if (assistPlayer) {
              get().incrementPlayerStat(assistPlayer.id, "assists");
            }
          }
        }
      }

      // Refresh events to update stats
      await get().fetchGameEvents(game.game_id);

      return event;
    } catch (error) {
      console.error("Error recording event:", error);
      throw error;
    }
  },

  // ==================== OPPONENT EVENTS ====================

  /**
   * Record an event by the opponent (goal against, foul on us, etc.)
   */
  recordOpponentEvent: async (eventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();
    const playersStore = useGamePlayersStore.getState();

    // For opponent events, team_season_id is the opponent, opponent_team_season_id is us
    const opponentTeamSeasonId = game.isHome
      ? game.away_team_season_id
      : game.home_team_season_id;

    const yourTeamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    // For goals/shots against, get current goalkeeper
    let defendingPlayerGameId = null;
    if (["goal", "shot", "shot_on_target"].includes(eventData.type)) {
      const currentGK = playersStore.getCurrentGoalkeeper();
      if (currentGK) {
        defendingPlayerGameId = currentGK.playerGameId;
      }
    }

    try {
      const event = await apiFetch("game_events", "POST", {
        game_id: game.game_id,
        player_game_id: null, // Opponent player not tracked in our roster
        team_season_id: opponentTeamSeasonId, // Opponent performed action
        opponent_team_season_id: yourTeamSeasonId, // Against your team
        defending_player_game_id: defendingPlayerGameId, // Your GK
        opponent_jersey_number: eventData.opponentJerseyNumber || null,
        event_category: eventData.category,
        event_type: eventData.type,
        game_time: gameTime,
        period: period,

        clock_should_run: 1,
        details: eventData.details || `Opponent ${eventData.type}`,
      });

      // If opponent goal, update goals against for your GK locally
      if (eventData.type === "goal") {
        if (defendingPlayerGameId) {
          const gk = playersStore.getPlayerByPlayerGameId(
            defendingPlayerGameId
          );
          if (gk) {
            get().incrementPlayerStat(gk.id, "goalsAgainst");
          }
        }
      }

      // Refresh events to update stats
      await get().fetchGameEvents(game.game_id);

      return event;
    } catch (error) {
      console.error("Error recording opponent event:", error);
      throw error;
    }
  },

  // ==================== TEAM-LEVEL EVENTS ====================

  /**
   * Record team-level events (corners, offsides, etc.)
   */
  recordTeamEvent: async (eventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    const yourTeamSeasonId = game.isHome
      ? game.home_team_season_id
      : game.away_team_season_id;

    const opponentTeamSeasonId = game.isHome
      ? game.away_team_season_id
      : game.home_team_season_id;

    try {
      const event = await apiFetch("game_events", "POST", {
        game_id: game.game_id,
        player_game_id: null,
        team_season_id: eventData.forYourTeam
          ? yourTeamSeasonId
          : opponentTeamSeasonId,
        opponent_team_season_id: eventData.forYourTeam
          ? opponentTeamSeasonId
          : yourTeamSeasonId,
        defending_player_game_id: null,
        opponent_jersey_number: null,
        event_category: "team",
        event_type: eventData.type, // 'corner', 'offside', 'foul_committed'
        game_time: gameTime,
        period: period,

        clock_should_run: 1,
        details: eventData.details || null,
      });

      // Refresh events to update stats
      await get().fetchGameEvents(game.game_id);

      return event;
    } catch (error) {
      console.error("Error recording team event:", error);
      throw error;
    }
  },

  // ==================== PENALTY KICK ====================

  /**
   * Record a penalty kick attempt
   */
  recordPenaltyKick: async (eventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();
    const playersStore = useGamePlayersStore.getState();

    const player = playersStore.getPlayerByPlayerGameId(eventData.playerGameId);
    if (!player) {
      throw new Error("Player not found for penalty kick");
    }

    const teamSeasonId = player.teamSeasonId;
    const opponentTeamSeasonId =
      player.homeAway === "home"
        ? game.away_team_season_id
        : game.home_team_season_id;

    // Get opposing goalkeeper
    let defendingPlayerGameId = null;
    const allPlayers = playersStore.players;
    const opponentGK = allPlayers.find(
      (p) =>
        p.gameStatus === "goalkeeper" && p.teamSeasonId === opponentTeamSeasonId
    );
    if (opponentGK) {
      defendingPlayerGameId = opponentGK.playerGameId;
    }

    try {
      const event = await apiFetch("game_events", "POST", {
        game_id: game.game_id,
        player_game_id: eventData.playerGameId,
        team_season_id: teamSeasonId,
        opponent_team_season_id: opponentTeamSeasonId,
        defending_player_game_id: defendingPlayerGameId,
        opponent_jersey_number: null,
        event_category: "penalty",
        event_type: eventData.result, // 'goal', 'save', 'miss'
        game_time: gameTime,
        period: period,

        clock_should_run: 1,
        details: eventData.details || null,
      });

      // Update local stats
      if (eventData.result === "goal") {
        get().incrementPlayerStat(player.id, "goals");
        get().incrementPlayerStat(player.id, "penaltyGoals");
        if (defendingPlayerGameId) {
          const gk = playersStore.getPlayerByPlayerGameId(
            defendingPlayerGameId
          );
          if (gk) get().incrementPlayerStat(gk.id, "goalsAgainst");
        }
      } else if (eventData.result === "save" && defendingPlayerGameId) {
        const gk = playersStore.getPlayerByPlayerGameId(defendingPlayerGameId);
        if (gk) {
          get().incrementPlayerStat(gk.id, "penaltySaves");
          get().incrementPlayerStat(gk.id, "saves");
        }
      }

      // Refresh events to update stats
      await get().fetchGameEvents(game.game_id);

      return event;
    } catch (error) {
      console.error("Error recording penalty kick:", error);
      throw error;
    }
  },

  // ==================== PLAYER STAT UPDATES ====================

  updatePlayerStatForEvent: (playerId, eventType) => {
    switch (eventType) {
      case "goal":
        get().incrementPlayerStat(playerId, "goals");
        break;
      case "penalty_kick":
        get().incrementPlayerStat(playerId, "penaltyGoals");
        break;
      case "shot":
        get().incrementPlayerStat(playerId, "shots");
        break;
      case "shot_on_target":
        get().incrementPlayerStat(playerId, "shots");
        get().incrementPlayerStat(playerId, "shotsOnTarget");
        break;
      case "save":
        get().incrementPlayerStat(playerId, "saves");
        break;
      case "yellow_card":
        get().incrementPlayerStat(playerId, "yellowCards");
        break;
      case "red_card":
        get().incrementPlayerStat(playerId, "redCards");
        break;
      case "foul_committed":
        get().incrementPlayerStat(playerId, "foulsCommitted");
        break;
      case "foul_drawn":
        get().incrementPlayerStat(playerId, "foulsDrawn");
        break;
    }
  },

  updatePlayerStat: (playerId, stat, value) => {
    const playersStore = useGamePlayersStore.getState();
    playersStore.setPlayers(
      playersStore.players.map((player) =>
        player.id === playerId ? { ...player, [stat]: value } : player
      )
    );
  },

  incrementPlayerStat: (playerId, stat, amount = 1) => {
    const playersStore = useGamePlayersStore.getState();
    playersStore.setPlayers(
      playersStore.players.map((player) =>
        player.id === playerId
          ? { ...player, [stat]: (player[stat] || 0) + amount }
          : player
      )
    );
  },

  // ==================== REFRESH STATS FROM DB ====================

  refreshPlayerStats: async (gameId) => {
    try {
      const allStats = await apiFetch(
        "v_player_game_stats_enhanced",
        "GET",
        null,
        null,
        { filters: { game_id: gameId } }
      );

      const playersStore = useGamePlayersStore.getState();
      playersStore.setPlayers(
        playersStore.players.map((player) => {
          const playerStats = allStats.find(
            (s) => s.player_game_id === player.playerGameId
          );

          if (playerStats) {
            return {
              ...player,
              goals: playerStats.goals || 0,
              penaltyGoals: playerStats.penalty_goals || 0,
              assists: playerStats.assists || 0,
              shots: playerStats.shots || 0,
              shotsOnTarget: playerStats.shots_on_target || 0,
              saves: playerStats.saves || 0,
              goalsAgainst: playerStats.goals_against || 0,
              penaltiesFaced: playerStats.penalties_faced || 0,
              penaltySaves: playerStats.penalty_saves || 0,
              cleanSheet: playerStats.clean_sheet || 0,
              yellowCards: playerStats.yellow_cards || 0,
              redCards: playerStats.red_cards || 0,
              foulsCommitted: playerStats.fouls_committed || 0,
              foulsDrawn: playerStats.fouls_drawn || 0,
            };
          }
          return player;
        })
      );
    } catch (error) {
      console.error("Error refreshing player stats:", error);
    }
  },

  // ==================== QUERY HELPERS ====================

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
