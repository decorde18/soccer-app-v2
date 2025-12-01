// stores/gameEventsStore.js
// Event recording and player stats management
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";

const useGameEventsStore = create((set, get) => ({
  // ==================== RECORD EVENT ====================

  recordEvent: async (eventData) => {
    const gameStore = useGameStore.getState();
    const game = gameStore.game;
    const gameTime = gameStore.getGameTime();
    const period = gameStore.getCurrentPeriodNumber();

    try {
      const event = await apiFetch("game_events", "POST", {
        game_id: game.id,
        player_game_id: eventData.playerGameId,
        event_category: eventData.category,
        event_type: eventData.type,
        game_time: gameTime,
        period: period,
        is_stoppage: eventData.isStoppage || 0,
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
      const playersStore = useGamePlayersStore.getState();
      const player = playersStore.players.find(
        (p) => p.playerGameId === eventData.playerGameId
      );

      if (player) {
        get().updatePlayerStatForEvent(player.id, eventData.type);

        // Handle assist
        if (eventData.assistPlayerGameId) {
          const assistPlayer = playersStore.players.find(
            (p) => p.playerGameId === eventData.assistPlayerGameId
          );
          if (assistPlayer) {
            get().incrementPlayerStat(assistPlayer.id, "assists");
          }
        }
      }

      return event;
    } catch (error) {
      console.error("Error recording event:", error);
    }
  },

  // ==================== PLAYER STAT UPDATES ====================

  updatePlayerStatForEvent: (playerId, eventType) => {
    const playersStore = useGamePlayersStore.getState();

    switch (eventType) {
      case "goal":
        get().incrementPlayerStat(playerId, "goals");
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
      case "corner":
        get().incrementPlayerStat(playerId, "corners");
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
        "v_player_game_stats",
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
              assists: playerStats.assists || 0,
              shots: playerStats.shots || 0,
              shotsOnTarget: playerStats.shots_on_target || 0,
              saves: playerStats.saves || 0,
              yellowCards: playerStats.yellow_cards || 0,
              redCards: playerStats.red_cards || 0,
              corners: playerStats.corners || 0,
            };
          }
          return player;
        })
      );
    } catch (error) {
      console.error("Error refreshing player stats:", error);
    }
  },
}));

export default useGameEventsStore;
