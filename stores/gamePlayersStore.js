// stores/gamePlayersStore.js
import { create } from "zustand";
import useGameStore from "./gameStore";
import { apiFetch } from "@/app/api/fetcher";

const useGamePlayersStore = create((set, get) => ({
  // State
  players: [],
  isLoading: false,
  error: null,

  // ==================== INITIALIZATION ====================

  loadPlayers: async (gameId, teamSeasonId) => {
    set({ isLoading: true, error: null });

    try {
      // Fetch existing player_games from v_player_games view
      const existingPlayerGames = await apiFetch(
        "v_player_games",
        "GET",
        null,
        null,
        { filters: { game_id: gameId, team_season_id: teamSeasonId } }
      );

      if (existingPlayerGames && existingPlayerGames.length > 0) {
        // Transform to store format
        const players = existingPlayerGames.map((pg) => ({
          id: pg.player_id,
          playerGameId: pg.player_game_id,
          firstName: pg.first_name,
          lastName: pg.last_name,
          fullName: pg.full_name,
          nickname: pg.nickname,
          jerseyNumber: pg.jersey_number,
          position: pg.primary_position,
          teamId: pg.team_id,
          teamSeasonId: pg.team_season_id,
          gameStatus: pg.game_status || "bench",
          fieldStatus: "onBench",
          started: pg.started === 1,
          isGuest: pg.is_guest === 1,
          homeAway: pg.home_away,
          ins: [],
          outs: [],
        }));

        set({ players, isLoading: false });
        return players;
      }

      // No player_games exist - create them from roster
      console.log(
        `No player_games found for game ${gameId}. Creating from roster...`
      );

      const createdPlayers = await get().createPlayerGamesFromRoster(
        gameId,
        teamSeasonId
      );

      set({ players: createdPlayers, isLoading: false });
      return createdPlayers;
    } catch (error) {
      console.error("Error loading players:", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  createPlayerGamesFromRoster: async (gameId, teamSeasonId) => {
    try {
      // Get game info to find team_season_ids
      const game = await apiFetch("games", "GET", null, gameId);
      if (!game) {
        throw new Error("Game not found");
      }

      const { home_team_season_id, away_team_season_id } = game;
      const isHome = teamSeasonId == home_team_season_id;

      // Fetch roster for both teams

      const teamPlayers = await apiFetch("v_players", "GET", null, null, {
        filters: {
          team_season_id: isHome ? home_team_season_id : away_team_season_id,
          player_is_active: 1,
        },
      });

      // Create player_games records
      const playerGamesToCreate = (teamPlayers || []).map((p) => ({
        game_id: gameId,
        player_id: p.player_id,
        team_id: p.team_id,
        position_id: null,
        started: 0,
        game_status: "bench",
        is_guest: 0,
      }));

      // Bulk insert player_games
      const createdPlayerGames = await Promise.all(
        playerGamesToCreate.map((pg) => apiFetch("player_games", "POST", pg))
      );

      // Transform to store format
      const allPlayers = [...(homePlayers || []), ...(awayPlayers || [])];
      const players = createdPlayerGames.map((pg, index) => {
        const rosterPlayer = allPlayers.find(
          (p) => p.player_id === pg.player_id
        );

        return {
          id: pg.player_id,
          playerGameId: pg.id,
          firstName: rosterPlayer?.first_name || "",
          lastName: rosterPlayer?.last_name || "",
          fullName: rosterPlayer?.full_name || "",
          nickname: rosterPlayer?.nickname,
          jerseyNumber: rosterPlayer?.jersey_number,
          position: rosterPlayer?.position,
          teamId: pg.team_id,
          teamSeasonId: rosterPlayer?.team_season_id,
          gameStatus: "bench",
          fieldStatus: "onBench",
          started: false,
          isGuest: false,
          homeAway:
            rosterPlayer?.team_season_id === home_team_season_id
              ? "home"
              : "away",
          ins: [],
          outs: [],
        };
      });

      console.log(`Created ${players.length} player_games for game ${gameId}`);
      return players;
    } catch (error) {
      console.error("Error creating player_games from roster:", error);
      throw error;
    }
  },

  setPlayers: (players) => set({ players }),

  // ==================== PLAYER UPDATES ====================

  updatePlayer: async (playerId, updates) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      ),
    }));

    // Sync to database if playerGameId exists
    const player = get().players.find((p) => p.id === playerId);
    if (player?.playerGameId) {
      try {
        // Map store fields to DB fields
        const dbUpdates = {};
        if (updates.gameStatus) dbUpdates.game_status = updates.gameStatus;
        if (updates.started !== undefined)
          dbUpdates.started = updates.started ? 1 : 0;

        await apiFetch(`player_games/${player.playerGameId}`, "PUT", dbUpdates);
      } catch (error) {
        console.error("Error updating player_game:", error);
      }
    }
  },

  updatePlayerStat: (playerId, stat, value) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, [stat]: value } : player
      ),
    }));
  },

  incrementPlayerStat: (playerId, stat, amount = 1) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId
          ? { ...player, [stat]: (player[stat] || 0) + amount }
          : player
      ),
    }));
  },

  updateFieldStatus: (playerId, newStatus) => {
    const fieldStatusUpdates = {
      onField: "subbingOut",
      onBench: "subbingIn",
      subbingOut: "onField",
      subbingIn: "onBench",
      subbingOutGk: "onFieldGk",
      onFieldGk: "subbingOutGk",
    };

    const player = get().players.find((p) => p.id === playerId);
    if (!player) return;

    const updatedStatus = newStatus || fieldStatusUpdates[player.fieldStatus];
    get().updatePlayer(playerId, { fieldStatus: updatedStatus });
  },

  updateGameStatus: async (playerId, action) => {
    const players = get().players;
    const currentPlayer = players.find((p) => p.id === playerId);
    if (!currentPlayer) return;

    let updatedStatus = action;

    if (action === "toggle") {
      const cycle = {
        goalkeeper: "injured",
        starter: "injured",
        bench: "injured",
        available: "injured",
        unavailable: "available",
        injured: "unavailable",
      };
      updatedStatus =
        cycle[currentPlayer.gameStatus] || currentPlayer.gameStatus;
    }

    if (action === "goalkeeper") {
      updatedStatus =
        currentPlayer.gameStatus === "goalkeeper" ? "starter" : "goalkeeper";

      // Remove goalkeeper status from other players
      set((state) => ({
        players: state.players.map((p) => {
          if (p.id !== playerId && p.gameStatus === "goalkeeper") {
            return { ...p, gameStatus: "starter" };
          }
          if (p.id === playerId) {
            return { ...p, gameStatus: updatedStatus };
          }
          return p;
        }),
      }));

      // Sync to DB for all affected players
      for (const p of players) {
        if (p.gameStatus === "goalkeeper" || p.id === playerId) {
          await get().updatePlayer(p.id, {
            gameStatus: p.id === playerId ? updatedStatus : "starter",
          });
        }
      }
      return;
    }

    await get().updatePlayer(playerId, { gameStatus: updatedStatus });
  },

  // ==================== SUBSTITUTION TRACKING ====================

  recordSubIn: async (playerId) => {
    const gameTime = useGameStore.getState().getGameTime();

    set((state) => ({
      players: state.players.map((player) => {
        if (player.id !== playerId) return player;

        const ins = player.ins || [];
        return {
          ...player,
          ins: [...ins, gameTime],
        };
      }),
    }));

    // Sync to database
    try {
      await apiFetch("game_subs", "POST", {
        game_id: useGameStore.getState().game?.id,
        in_player_id: playerId,
        out_player_id: null,
        sub_time: new Date().toISOString().split("T")[1].split(".")[0],
        period: useGameStore.getState().getCurrentPeriodNumber(),
        gk_sub: 0,
      });
    } catch (error) {
      console.error("Error recording sub in:", error);
    }
  },

  recordSubOut: async (playerId) => {
    const gameTime = useGameStore.getState().getGameTime();

    set((state) => ({
      players: state.players.map((player) => {
        if (player.id !== playerId) return player;

        const outs = player.outs || [];
        return {
          ...player,
          outs: [...outs, gameTime],
        };
      }),
    }));

    // Sync to database
    try {
      await apiFetch("game_subs", "POST", {
        game_id: useGameStore.getState().game?.id,
        in_player_id: null,
        out_player_id: playerId,
        sub_time: new Date().toISOString().split("T")[1].split(".")[0],
        period: useGameStore.getState().getCurrentPeriodNumber(),
        gk_sub: 0,
      });
    } catch (error) {
      console.error("Error recording sub out:", error);
    }
  },

  // ==================== TIME CALCULATIONS ====================

  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = player.ins || [];
    const outs = player.outs || [];

    const effectiveIns =
      ins.length === 0 &&
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper")
        ? [0]
        : ins;

    let totalTime = 0;

    const minLength = Math.min(effectiveIns.length, outs.length);
    for (let i = 0; i < minLength; i++) {
      totalTime += outs[i] - effectiveIns[i];
    }

    if (effectiveIns.length > outs.length) {
      const lastIn = effectiveIns[effectiveIns.length - 1];
      totalTime += currentGameTime - lastIn;
    }

    return Math.max(0, totalTime);
  },

  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = player.ins || [];
    const outs = player.outs || [];

    const isStarterNoSubs =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoSubs) return currentGameTime;

    const isOnField = ins.length > outs.length;
    if (!isOnField) return 0;

    const lastIn = ins[ins.length - 1];
    return Math.max(0, currentGameTime - lastIn);
  },

  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = player.ins || [];
    const outs = player.outs || [];

    const isStarterNoOuts =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoOuts) return 0;

    const isOffField = outs.length >= ins.length;
    if (!isOffField) return 0;

    if (outs.length === 0) return currentGameTime;

    const lastOut = outs[outs.length - 1];
    return Math.max(0, currentGameTime - lastOut);
  },

  isPlayerOnField: (player) => {
    if (!player) return false;

    const ins = player.ins || [];
    const outs = player.outs || [];

    if (
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0
    ) {
      return true;
    }

    return ins.length > outs.length;
  },

  // ==================== QUERY HELPERS ====================

  getPlayersByFieldStatus: (fieldStatus) => {
    return get().players.filter((player) => player.fieldStatus === fieldStatus);
  },

  getPlayersByGameStatus: (gameStatus) => {
    return get().players.filter((player) => player.gameStatus === gameStatus);
  },

  getPlayerById: (playerId) => {
    return get().players.find((player) => player.id === playerId);
  },

  getStarters: () => {
    return get().players.filter(
      (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper"
    );
  },

  getBench: () => {
    return get().players.filter((p) => p.gameStatus === "bench");
  },
}));

export default useGamePlayersStore;
