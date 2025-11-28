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
        // Fetch all substitutions for this game
        const allSubs = await apiFetch("game_subs", "GET", null, null, {
          filters: { game_id: gameId },
        });

        // Fetch stats for all players in this game
        const allStats = await apiFetch(
          "v_player_game_stats",
          "GET",
          null,
          null,
          {
            filters: { game_id: gameId },
          }
        );

        // Transform to store format with subs data and stats
        const players = existingPlayerGames.map((pg) => {
          // Get this player's ins and outs from game_subs
          const playerIns = allSubs
            .filter((sub) => sub.in_player_id === pg.player_id)
            .map((sub) => ({
              gameTime: sub.sub_time,
              subId: sub.id,
              gkSub: sub.gk_sub === 1,
            }));

          const playerOuts = allSubs
            .filter((sub) => sub.out_player_id === pg.player_id)
            .map((sub) => ({
              gameTime: sub.sub_time,
              subId: sub.id,
              gkSub: sub.gk_sub === 1,
            }));

          // Get this player's stats
          const playerStats = allStats.find(
            (s) => s.player_game_id === pg.player_game_id
          );

          const player = {
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
            gameStatus: pg.game_status || "dressed",
            started: pg.started === 1,
            isGuest: pg.is_guest === 1,
            homeAway: pg.home_away,
            ins: playerIns,
            outs: playerOuts,
            // Stats from game_events
            goals: playerStats?.goals || 0,
            assists: playerStats?.assists || 0,
            shots: playerStats?.shots || 0,
            shotsOnTarget: playerStats?.shots_on_target || 0,
            saves: playerStats?.saves || 0,
            yellowCards: playerStats?.yellow_cards || 0,
            redCards: playerStats?.red_cards || 0,
            corners: playerStats?.corners || 0,
          };

          // Calculate initial field status
          player.fieldStatus = get().calculateFieldStatus(player);

          return player;
        });

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

  // ==================== FIELD STATUS CALCULATION ====================

  calculateFieldStatus: (player) => {
    if (!player) return "onBench";

    const ins = player.ins || [];
    const outs = player.outs || [];

    // Check if most recent action is pending (no game time)
    const lastIn = ins[ins.length - 1];
    const lastOut = outs[outs.length - 1];
    const hasPendingIn = lastIn && lastIn.gameTime === null;
    const hasPendingOut = lastOut && lastOut.gameTime === null;

    // If there's a pending action, return the appropriate subbing status
    if (hasPendingIn) return "subbingIn";
    if (hasPendingOut) {
      return player.gameStatus === "goalkeeper" ? "subbingOutGk" : "subbingOut";
    }

    // Calculate completed subs (only those with game times)
    const completedIns = ins.filter((sub) => sub.gameTime !== null).length;
    const completedOuts = outs.filter((sub) => sub.gameTime !== null).length;

    // Starters/GK begin on field (count as +1 effective in)
    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const effectiveIns = isStarter ? completedIns + 1 : completedIns;

    const isCurrentlyOnField = effectiveIns > completedOuts;

    if (player.gameStatus === "goalkeeper") {
      return isCurrentlyOnField ? "onFieldGk" : "onBench";
    }

    return isCurrentlyOnField ? "onField" : "onBench";
  },

  createPlayerGamesFromRoster: async (gameId, teamSeasonId) => {
    try {
      // Get game info
      const game = await apiFetch("games", "GET", null, gameId);
      if (!game) throw new Error("Game not found");

      const { home_team_season_id, away_team_season_id } = game;
      const isHome = teamSeasonId === home_team_season_id;
      const selectedTeamSeasonId = isHome
        ? home_team_season_id
        : away_team_season_id;

      // Fetch active roster for the selected team
      const teamPlayers =
        (await apiFetch("v_players", "GET", null, null, {
          filters: {
            team_season_id: selectedTeamSeasonId,
            player_is_active: 1,
          },
        })) || [];

      // Create player_games and transform to store format in one pass
      const createdPlayerGames = await Promise.all(
        teamPlayers.map((p) =>
          apiFetch("player_games", "POST", {
            game_id: gameId,
            player_id: p.player_id,
            team_id: p.team_id,
            position_id: null,
            started: 0,
            game_status: "dressed",
            is_guest: 0,
          })
        )
      );

      const players = createdPlayerGames.map((pg, i) => {
        const p = teamPlayers[i];
        return {
          id: pg.player_id,
          playerGameId: pg.id,
          firstName: p.first_name || "",
          lastName: p.last_name || "",
          fullName: p.full_name || "",
          nickname: p.nickname,
          jerseyNumber: p.jersey_number,
          position: p.position,
          teamId: pg.team_id,
          teamSeasonId: p.team_season_id,
          gameStatus: "dressed",
          fieldStatus: "onBench",
          started: false,
          isGuest: false,
          homeAway: p.team_season_id === home_team_season_id ? "home" : "away",
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
        console.log(`player_games?id=${player.playerGameId}`, dbUpdates);
        await apiFetch(
          `player_games?id=${player.playerGameId}`,
          "PUT",
          dbUpdates
        );
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

    // Special handling for goalkeeper
    if (action === "goalkeeper") {
      const updates = [];

      if (currentPlayer.gameStatus === "goalkeeper") {
        // If this player is already goalkeeper, revert them to starter
        updates.push(get().updatePlayer(playerId, { gameStatus: "starter" }));
      } else {
        // Demote any other goalkeeper to starter
        for (const p of players) {
          if (p.id !== playerId && p.gameStatus === "goalkeeper") {
            updates.push(get().updatePlayer(p.id, { gameStatus: "starter" }));
          }
        }
        // Set current player to goalkeeper
        updates.push(
          get().updatePlayer(playerId, { gameStatus: "goalkeeper" })
        );
      }

      await Promise.all(updates);
      return;
    }

    // For all other actions, just set directly
    await get().updatePlayer(playerId, { gameStatus: action });
  },

  // ==================== SUBSTITUTION TRACKING ====================

  createPendingSub: async (inPlayerId, outPlayerId, isGkSub = false) => {
    const gameId = useGameStore.getState().game?.id;
    if (!gameId) {
      console.error("No active game");
      return null;
    }

    try {
      // Create the substitution record without a game time (pending)
      const sub = await apiFetch("game_subs", "POST", {
        game_id: gameId,
        in_player_id: inPlayerId,
        out_player_id: outPlayerId,
        sub_time: null, // Pending - no time yet
        period: useGameStore.getState().getCurrentPeriodNumber(),
        gk_sub: isGkSub ? 1 : 0,
      });

      // Add to local state
      set((state) => ({
        players: state.players.map((player) => {
          if (player.id === inPlayerId) {
            const newIns = [
              ...(player.ins || []),
              { gameTime: null, subId: sub.id, gkSub: isGkSub },
            ];
            return {
              ...player,
              ins: newIns,
              fieldStatus: "subbingIn",
            };
          }
          if (player.id === outPlayerId) {
            const newOuts = [
              ...(player.outs || []),
              { gameTime: null, subId: sub.id, gkSub: isGkSub },
            ];
            const newFieldStatus = isGkSub ? "subbingOutGk" : "subbingOut";
            return {
              ...player,
              outs: newOuts,
              fieldStatus: newFieldStatus,
            };
          }
          return player;
        }),
      }));

      return sub;
    } catch (error) {
      console.error("Error creating pending sub:", error);
      return null;
    }
  },

  confirmSub: async (subId) => {
    const gameTime = useGameStore.getState().getGameTime();

    try {
      // Update the sub with the actual game time
      await apiFetch(`game_subs?id=${subId}`, "PUT", {
        sub_time: gameTime,
      });

      // Update local state
      set((state) => ({
        players: state.players.map((player) => {
          // Update ins array
          const updatedIns = (player.ins || []).map((sub) =>
            sub.subId === subId ? { ...sub, gameTime } : sub
          );

          // Update outs array
          const updatedOuts = (player.outs || []).map((sub) =>
            sub.subId === subId ? { ...sub, gameTime } : sub
          );

          const hasUpdatedIn = updatedIns.some(
            (sub) => sub.subId === subId && sub.gameTime !== null
          );
          const hasUpdatedOut = updatedOuts.some(
            (sub) => sub.subId === subId && sub.gameTime !== null
          );

          if (hasUpdatedIn || hasUpdatedOut) {
            const updatedPlayer = {
              ...player,
              ins: updatedIns,
              outs: updatedOuts,
            };
            // Recalculate field status
            updatedPlayer.fieldStatus =
              get().calculateFieldStatus(updatedPlayer);
            return updatedPlayer;
          }

          return player;
        }),
      }));

      console.log(`Confirmed sub ${subId} at game time ${gameTime}`);
    } catch (error) {
      console.error("Error confirming sub:", error);
    }
  },

  cancelSub: async (subId) => {
    try {
      // Delete the sub from database
      await apiFetch(`game_subs?id=${subId}`, "DELETE");

      // Remove from local state
      set((state) => ({
        players: state.players.map((player) => {
          const updatedIns = (player.ins || []).filter(
            (sub) => sub.subId !== subId
          );
          const updatedOuts = (player.outs || []).filter(
            (sub) => sub.subId !== subId
          );

          if (
            updatedIns.length !== player.ins.length ||
            updatedOuts.length !== player.outs.length
          ) {
            const updatedPlayer = {
              ...player,
              ins: updatedIns,
              outs: updatedOuts,
            };
            // Recalculate field status
            updatedPlayer.fieldStatus =
              get().calculateFieldStatus(updatedPlayer);
            return updatedPlayer;
          }

          return player;
        }),
      }));

      console.log(`Cancelled sub ${subId}`);
    } catch (error) {
      console.error("Error cancelling sub:", error);
    }
  },

  // Legacy methods - kept for backwards compatibility but deprecated
  recordSubIn: async (playerId) => {
    console.warn(
      "recordSubIn is deprecated. Use createPendingSub and confirmSub instead."
    );
    const gameTime = useGameStore.getState().getGameTime();

    set((state) => ({
      players: state.players.map((player) => {
        if (player.id !== playerId) return player;

        const ins = player.ins || [];
        return {
          ...player,
          ins: [...ins, { gameTime, subId: null, gkSub: false }],
        };
      }),
    }));
  },

  recordSubOut: async (playerId) => {
    console.warn(
      "recordSubOut is deprecated. Use createPendingSub and confirmSub instead."
    );
    const gameTime = useGameStore.getState().getGameTime();

    set((state) => ({
      players: state.players.map((player) => {
        if (player.id !== playerId) return player;

        const outs = player.outs || [];
        return {
          ...player,
          outs: [...outs, { gameTime, subId: null, gkSub: false }],
        };
      }),
    }));
  },

  // ==================== TIME CALCULATIONS ====================

  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const effectiveIns =
      ins.length === 0 &&
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper")
        ? [{ gameTime: 0 }]
        : ins;

    let totalTime = 0;

    const minLength = Math.min(effectiveIns.length, outs.length);
    for (let i = 0; i < minLength; i++) {
      totalTime += outs[i].gameTime - effectiveIns[i].gameTime;
    }

    if (effectiveIns.length > outs.length) {
      const lastIn = effectiveIns[effectiveIns.length - 1];
      totalTime += currentGameTime - lastIn.gameTime;
    }

    return Math.max(0, totalTime);
  },

  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarterNoSubs =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoSubs) return currentGameTime;

    const isOnField = ins.length > outs.length;
    if (!isOnField) return 0;

    const lastIn = ins[ins.length - 1];
    return Math.max(0, currentGameTime - lastIn.gameTime);
  },

  calculateCurrentTimeOffField: (player, currentGameTime) => {
    if (!player) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarterNoOuts =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoOuts) return 0;

    const isOffField = outs.length >= ins.length;
    if (!isOffField) return 0;

    if (outs.length === 0) return currentGameTime;

    const lastOut = outs[outs.length - 1];
    return Math.max(0, currentGameTime - lastOut.gameTime);
  },

  isPlayerOnField: (player) => {
    if (!player) return false;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

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
    return get().players.filter((p) => p.gameStatus === "dressed");
  },

  getPendingSubs: () => {
    const allSubs = [];
    get().players.forEach((player) => {
      (player.ins || []).forEach((sub) => {
        if (sub.gameTime === null) {
          allSubs.push({
            subId: sub.subId,
            inPlayerId: player.id,
            gkSub: sub.gkSub,
          });
        }
      });
      (player.outs || []).forEach((sub) => {
        if (sub.gameTime === null) {
          const existing = allSubs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.outPlayerId = player.id;
          }
        }
      });
    });
    return allSubs;
  },
}));

export default useGamePlayersStore;
