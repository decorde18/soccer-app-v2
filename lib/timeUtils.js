// stores/gamePlayersStore.js
import { create } from "zustand";
import useGameStore from "./gameStore";

const useGamePlayersStore = create((set, get) => ({
  // State
  players: [],
  isLoading: false,
  error: null,

  // ==================== INITIALIZATION ====================

  loadPlayers: async (gameId) => {
    set({ isLoading: true, error: null });

    try {
      // Fetch players from API
      const response = await fetch(`/api/games/${gameId}/players`);
      const players = await response.json();

      set({ players, isLoading: false });
      return players;
    } catch (error) {
      console.error("Error loading players:", error);
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  setPlayers: (players) => set({ players }),

  // ==================== PLAYER UPDATES ====================

  updatePlayer: (playerId, updates) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      ),
    }));
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

  updateGameStatus: (playerId, action) => {
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
      return;
    }

    get().updatePlayer(playerId, { gameStatus: updatedStatus });
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
      await fetch("/api/subs/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: useGameStore.getState().game?.id,
          playerId,
          action: "sub_in",
          gameTime,
          timestamp: Date.now(),
        }),
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
      await fetch("/api/subs/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: useGameStore.getState().game?.id,
          playerId,
          action: "sub_out",
          gameTime,
          timestamp: Date.now(),
        }),
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
