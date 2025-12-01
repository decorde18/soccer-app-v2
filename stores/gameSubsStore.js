// stores/gameSubsStore.js
// Substitution management - creating, confirming, updating, canceling subs
import { create } from "zustand";

import useGamePlayersStore from "./gamePlayersStore";
import { apiFetch } from "@/app/api/fetcher";
import useGameStore from "./gameStore";

const useGameSubsStore = create((set, get) => ({
  // ==================== PENDING SUB QUERIES ====================

  getPendingSubs: async () => {
    const gameId = useGameStore.getState().game?.game_id;
    if (!gameId) return [];

    try {
      const pendingSubs = await apiFetch("game_subs", "GET", null, null, {
        filters: { game_id: gameId, sub_time_is_null: true },
      });
      return pendingSubs.map((sub) => ({
        subId: sub.id,
        inPlayerId: sub.in_player_id,
        outPlayerId: sub.out_player_id,
        gkSub: sub.gk_sub === 1,
        period: sub.period,
        isComplete: sub.in_player_id !== null && sub.out_player_id !== null,
      }));
    } catch (error) {
      console.error("Error fetching pending subs:", error);
      return [];
    }
  },

  getPendingSubsSync: () => {
    const allSubs = [];
    const seenSubIds = new Set();
    const players = useGamePlayersStore.getState().players;

    players.forEach((player) => {
      (player.ins || []).forEach((sub) => {
        if (sub.gameTime === null && !seenSubIds.has(sub.subId)) {
          seenSubIds.add(sub.subId);
          allSubs.push({
            subId: sub.subId,
            inPlayerId: player.playerGameId,
            outPlayerId: null,
            gkSub: sub.gkSub,
          });
        }
      });

      (player.outs || []).forEach((sub) => {
        if (sub.gameTime === null) {
          const existing = allSubs.find((s) => s.subId === sub.subId);
          if (existing) {
            existing.outPlayerId = player.playerGameId;
          } else if (!seenSubIds.has(sub.subId)) {
            seenSubIds.add(sub.subId);
            allSubs.push({
              subId: sub.subId,
              inPlayerId: null,
              outPlayerId: player.playerGameId,
              gkSub: sub.gkSub,
            });
          }
        }
      });
    });

    return allSubs.map((sub) => ({
      ...sub,
      isComplete: sub.inPlayerId !== null && sub.outPlayerId !== null,
    }));
  },

  // ==================== CREATE PENDING SUB ====================

  createPendingSub: async (
    inPlayerId = null,
    outPlayerId = null,
    isGkSub = false
  ) => {
    const gameId = useGameStore.getState().game?.game_id;
    if (!gameId) {
      console.error("No active game");
      return null;
    }

    try {
      const sub = await apiFetch("game_subs", "POST", {
        game_id: gameId,
        in_player_id: inPlayerId,
        out_player_id: outPlayerId,
        sub_time: null,
        period: useGameStore.getState().getCurrentPeriodNumber(),
        gk_sub: isGkSub ? 1 : 0,
      });

      const playersStore = useGamePlayersStore.getState();

      playersStore.setPlayers(
        playersStore.players.map((player) => {
          if (inPlayerId && player.playerGameId === inPlayerId) {
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
          if (outPlayerId && player.playerGameId === outPlayerId) {
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
        })
      );

      await playersStore.updateAllSubStatuses(gameId);

      return sub;
    } catch (error) {
      console.error("Error creating pending sub:", error);
      return null;
    }
  },

  // ==================== UPDATE PENDING SUB ====================

  updatePendingSub: async (subId, updates) => {
    try {
      await apiFetch(`game_subs?id=${subId}`, "PUT", updates);

      const [updatedSub] = await apiFetch("game_subs", "GET", null, null, {
        filters: { id: subId },
      });

      if (!updatedSub) return;

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      let players = playersStore.players.map((player) => ({
        ...player,
        ins: (player.ins || []).filter((sub) => sub.subId !== subId),
        outs: (player.outs || []).filter((sub) => sub.subId !== subId),
      }));

      players = players.map((player) => {
        if (
          updatedSub.in_player_id &&
          player.playerGameId === updatedSub.in_player_id
        ) {
          return {
            ...player,
            ins: [
              ...player.ins,
              {
                gameTime: updatedSub.sub_time,
                subId: updatedSub.id,
                gkSub: updatedSub.gk_sub === 1,
              },
            ],
          };
        }
        if (
          updatedSub.out_player_id &&
          player.playerGameId === updatedSub.out_player_id
        ) {
          return {
            ...player,
            outs: [
              ...player.outs,
              {
                gameTime: updatedSub.sub_time,
                subId: updatedSub.id,
                gkSub: updatedSub.gk_sub === 1,
              },
            ],
          };
        }
        return player;
      });

      players = players.map((player) => ({
        ...player,
        fieldStatus: calculateFieldStatus(player),
      }));

      playersStore.setPlayers(players);
      await playersStore.updateAllSubStatuses(
        useGameStore.getState().game?.game_id
      );

      return updatedSub;
    } catch (error) {
      console.error("Error updating pending sub:", error);
      return null;
    }
  },

  // ==================== CONFIRM SUB ====================

  confirmSub: async (subId) => {
    const gameStore = useGameStore.getState();
    const gameStage = gameStore.getGameStage();

    let gameTime;

    if (gameStage === "between_periods") {
      console.log("Sub will be confirmed at start of next period");
      return;
    } else {
      gameTime = gameStore.getGameTime();
    }

    try {
      await apiFetch(`game_subs?id=${subId}`, "PUT", {
        sub_time: gameTime,
      });

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      playersStore.setPlayers(
        playersStore.players.map((player) => {
          const updatedIns = (player.ins || []).map((sub) =>
            sub.subId === subId ? { ...sub, gameTime } : sub
          );

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
            updatedPlayer.fieldStatus = calculateFieldStatus(updatedPlayer);
            return updatedPlayer;
          }

          return player;
        })
      );

      await playersStore.updateAllSubStatuses(gameStore.game?.game_id);

      console.log(`Confirmed sub ${subId} at game time ${gameTime} seconds`);
    } catch (error) {
      console.error("Error confirming sub:", error);
    }
  },

  // ==================== CONFIRM ALL PENDING SUBS ====================

  confirmAllPendingSubs: async () => {
    const gameStore = useGameStore.getState();
    const gameStage = gameStore.getGameStage();

    const pendingSubs = await get().getPendingSubs(gameStore.game?.game_id);
    const completeSubs = pendingSubs.filter((sub) => sub.isComplete);

    if (completeSubs.length === 0) {
      console.log("No complete subs to confirm");
      return { confirmed: 0, errors: [] };
    }

    const incompleteSubs = pendingSubs.filter((sub) => !sub.isComplete);
    const playersOutWithoutReplacement = incompleteSubs.filter(
      (sub) => sub.outPlayerId && !sub.inPlayerId
    );

    if (playersOutWithoutReplacement.length > 0) {
      const players = useGamePlayersStore.getState().players;
      const playerNames = playersOutWithoutReplacement.map((sub) => {
        const player = players.find((p) => p.playerGameId === sub.outPlayerId);
        return player
          ? `#${player.jerseyNumber} ${player.fullName}`
          : "Unknown";
      });

      return {
        confirmed: 0,
        errors: [
          `Players coming out without replacement: ${playerNames.join(", ")}`,
        ],
      };
    }

    if (gameStage === "between_periods") {
      console.log("Subs will be confirmed at start of next period");
      return { confirmed: 0, pending: completeSubs.length };
    }

    const results = await Promise.allSettled(
      completeSubs.map((sub) => get().confirmSub(sub.subId))
    );

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason?.message || "Unknown error");

    const confirmed = results.filter((r) => r.status === "fulfilled").length;

    return { confirmed, errors };
  },

  // ==================== CANCEL SUB ====================

  cancelSub: async (subId) => {
    try {
      await apiFetch(`game_subs?id=${subId}`, "DELETE");

      const playersStore = useGamePlayersStore.getState();
      const calculateFieldStatus = playersStore.calculateFieldStatus;

      playersStore.setPlayers(
        playersStore.players.map((player) => {
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
            updatedPlayer.fieldStatus = calculateFieldStatus(updatedPlayer);
            return updatedPlayer;
          }

          return player;
        })
      );

      await playersStore.updateAllSubStatuses(
        useGameStore.getState().game?.game_id
      );

      console.log(`Cancelled sub ${subId}`);
    } catch (error) {
      console.error("Error cancelling sub:", error);
    }
  },
}));

export default useGameSubsStore;
