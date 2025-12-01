// stores/gamePlayersStore.js
// Core player data management - loading, basic updates, field status
import { create } from "zustand";
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
      const existingPlayerGames = await apiFetch(
        "v_player_games",
        "GET",
        null,
        null,
        { filters: { game_id: gameId, team_season_id: teamSeasonId } }
      );

      if (existingPlayerGames && existingPlayerGames.length > 0) {
        const allSubs = await apiFetch("game_subs", "GET", null, null, {
          filters: { game_id: gameId },
        });

        const pendingSubs = allSubs.filter((sub) => sub.sub_time === null);
        const confirmedSubs = allSubs.filter((sub) => sub.sub_time !== null);

        const allStats = await apiFetch(
          "v_player_game_stats",
          "GET",
          null,
          null,
          { filters: { game_id: gameId } }
        );

        const players = existingPlayerGames.map((pg) => {
          const playerIns = confirmedSubs
            .filter((sub) => sub.in_player_id === pg.player_game_id)
            .map((sub) => ({
              gameTime: sub.sub_time,
              subId: sub.id,
              gkSub: sub.gk_sub === 1,
            }));

          const playerOuts = confirmedSubs
            .filter((sub) => sub.out_player_id === pg.player_game_id)
            .map((sub) => ({
              gameTime: sub.sub_time,
              subId: sub.id,
              gkSub: sub.gk_sub === 1,
            }));

          const playerPendingIn = pendingSubs.find(
            (sub) => sub.in_player_id === pg.player_game_id
          );
          const playerPendingOut = pendingSubs.find(
            (sub) => sub.out_player_id === pg.player_game_id
          );

          if (playerPendingIn) {
            playerIns.push({
              gameTime: null,
              subId: playerPendingIn.id,
              gkSub: playerPendingIn.gk_sub === 1,
            });
          }
          if (playerPendingOut) {
            playerOuts.push({
              gameTime: null,
              subId: playerPendingOut.id,
              gkSub: playerPendingOut.gk_sub === 1,
            });
          }

          let subStatus = null;
          if (playerPendingIn && playerPendingOut) {
            subStatus = "pendingBoth";
          } else if (playerPendingIn) {
            subStatus = "pendingIn";
          } else if (playerPendingOut) {
            subStatus = "pendingOut";
          }

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
            subStatus: subStatus,
            goals: playerStats?.goals || 0,
            assists: playerStats?.assists || 0,
            shots: playerStats?.shots || 0,
            shotsOnTarget: playerStats?.shots_on_target || 0,
            saves: playerStats?.saves || 0,
            yellowCards: playerStats?.yellow_cards || 0,
            redCards: playerStats?.red_cards || 0,
            corners: playerStats?.corners || 0,
          };

          player.fieldStatus = get().calculateFieldStatus(player);

          return player;
        });

        set({ players, isLoading: false });
        return players;
      }

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
      const game = await apiFetch("games", "GET", null, gameId);
      if (!game) throw new Error("Game not found");

      const { home_team_season_id, away_team_season_id } = game;
      const isHome = teamSeasonId === home_team_season_id;
      const selectedTeamSeasonId = isHome
        ? home_team_season_id
        : away_team_season_id;

      const teamPlayers =
        (await apiFetch("v_players", "GET", null, null, {
          filters: {
            team_season_id: selectedTeamSeasonId,
            player_is_active: 1,
          },
        })) || [];

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
          subStatus: null,
          goals: 0,
          assists: 0,
          shots: 0,
          shotsOnTarget: 0,
          saves: 0,
          yellowCards: 0,
          redCards: 0,
          corners: 0,
        };
      });

      console.log(`Created ${players.length} player_games for game ${gameId}`);
      return players;
    } catch (error) {
      console.error("Error creating player_games from roster:", error);
      throw error;
    }
  },

  // ==================== FIELD STATUS CALCULATION ====================

  calculateFieldStatus: (player) => {
    if (!player) return "onBench";

    const ins = player.ins || [];
    const outs = player.outs || [];

    const lastIn = ins[ins.length - 1];
    const lastOut = outs[outs.length - 1];
    const hasPendingIn = lastIn && lastIn.gameTime === null;
    const hasPendingOut = lastOut && lastOut.gameTime === null;

    if (hasPendingIn) return "subbingIn";
    if (hasPendingOut) {
      return player.gameStatus === "goalkeeper" ? "subbingOutGk" : "subbingOut";
    }

    const completedIns = ins.filter((sub) => sub.gameTime !== null).length;
    const completedOuts = outs.filter((sub) => sub.gameTime !== null).length;

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);
    const effectiveIns = isStarter ? completedIns + 1 : completedIns;

    const isCurrentlyOnField = effectiveIns > completedOuts;

    if (player.gameStatus === "goalkeeper") {
      return isCurrentlyOnField ? "onFieldGk" : "onBench";
    }

    return isCurrentlyOnField ? "onField" : "onBench";
  },

  // ==================== BASIC UPDATES ====================

  setPlayers: (players) => set({ players }),

  updatePlayer: async (playerId, updates) => {
    set((state) => ({
      players: state.players.map((player) =>
        player.id === playerId ? { ...player, ...updates } : player
      ),
    }));

    const player = get().players.find((p) => p.id === playerId);
    if (player?.playerGameId) {
      try {
        const dbUpdates = {};
        if (updates.gameStatus) dbUpdates.game_status = updates.gameStatus;
        if (updates.started !== undefined)
          dbUpdates.started = updates.started ? 1 : 0;

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

    if (action === "goalkeeper") {
      const updates = [];

      if (currentPlayer.gameStatus === "goalkeeper") {
        updates.push(get().updatePlayer(playerId, { gameStatus: "starter" }));
      } else {
        for (const p of players) {
          if (p.id !== playerId && p.gameStatus === "goalkeeper") {
            updates.push(get().updatePlayer(p.id, { gameStatus: "starter" }));
          }
        }
        updates.push(
          get().updatePlayer(playerId, { gameStatus: "goalkeeper" })
        );
      }

      await Promise.all(updates);
      return;
    }

    await get().updatePlayer(playerId, { gameStatus: action });
  },

  // ==================== SUB STATUS MANAGEMENT ====================

  updateAllSubStatuses: async (gameId) => {
    if (!gameId) return;

    try {
      const pendingSubs = await apiFetch("game_subs", "GET", null, null, {
        filters: { game_id: gameId, sub_time_is_null: true },
      });

      set((state) => ({
        players: state.players.map((player) => {
          const pendingIn = pendingSubs.find(
            (sub) => sub.in_player_id === player.playerGameId
          );
          const pendingOut = pendingSubs.find(
            (sub) => sub.out_player_id === player.playerGameId
          );

          let subStatus = null;
          if (pendingIn && pendingOut) {
            subStatus = "pendingBoth";
          } else if (pendingIn) {
            subStatus = "pendingIn";
          } else if (pendingOut) {
            subStatus = "pendingOut";
          }

          return { ...player, subStatus };
        }),
      }));
    } catch (error) {
      console.error("Error updating sub statuses:", error);
    }
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

  getPlayerByPlayerGameId: (playerGameId) => {
    return get().players.find((player) => player.playerGameId === playerGameId);
  },

  getStarters: () => {
    return get().players.filter(
      (p) => p.gameStatus === "starter" || p.gameStatus === "goalkeeper"
    );
  },

  getBench: () => {
    return get().players.filter((p) => p.gameStatus === "dressed");
  },

  getCurrentGoalkeeper: () => {
    return get().players.find((p) => p.gameStatus === "goalkeeper");
  },

  getPlayersWithPendingSubs: () => {
    const players = get().players;
    return {
      pendingIn: players.filter((p) => p.subStatus === "pendingIn"),
      pendingOut: players.filter((p) => p.subStatus === "pendingOut"),
      pendingBoth: players.filter((p) => p.subStatus === "pendingBoth"),
    };
  },
}));

export default useGamePlayersStore;
