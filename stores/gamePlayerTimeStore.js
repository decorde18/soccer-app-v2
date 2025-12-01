// stores/gamePlayerTimeStore.js
// Player time calculations with stoppage time handling
import { create } from "zustand";
import useGameStore from "./gameStore";
import useGamePlayersStore from "./gamePlayersStore";

/**
 * Helper: Calculate stoppage time within a specific time range
 */
const calculateStoppageTimeInRange = (
  stoppages,
  rangeStart,
  rangeEnd,
  periodNumber
) => {
  return stoppages
    .filter((s) => s.periodNumber === periodNumber && s.endTime !== null)
    .reduce((total, stoppage) => {
      const overlapStart = Math.max(stoppage.startTime, rangeStart);
      const overlapEnd = Math.min(stoppage.endTime, rangeEnd);

      if (overlapEnd > overlapStart) {
        return total + (overlapEnd - overlapStart);
      }
      return total;
    }, 0);
};

/**
 * Helper: Find which period a game time falls into
 */
const findPeriodForGameTime = (periods, gameTime) => {
  let cumulativeGameTime = 0;

  for (const period of periods) {
    if (!period.startTime) continue;

    const periodDuration = period.endTime
      ? (period.endTime - period.startTime) / 1000
      : (Date.now() - period.startTime) / 1000;

    const periodStart = cumulativeGameTime;
    const periodEnd = cumulativeGameTime + periodDuration;

    if (gameTime >= periodStart && gameTime < periodEnd) {
      return period;
    }

    cumulativeGameTime = periodEnd;
  }

  return null;
};

const useGamePlayerTimeStore = create((set, get) => ({
  // ==================== TIME CALCULATIONS ====================

  /**
   * Calculate total active playing time for a player
   * Accounts for stoppages and only counts time during active periods
   */
  calculateTotalTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const stoppages = game.stoppages || [];
    const periods = game.periods || [];

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarter = ["starter", "goalkeeper"].includes(player.gameStatus);

    // Build time segments when player was on field
    const segments = [];

    if (isStarter) {
      if (outs.length === 0) {
        segments.push({ start: 0, end: currentGameTime });
      } else {
        segments.push({ start: 0, end: outs[0].gameTime });

        for (let i = 0; i < ins.length; i++) {
          const inTime = ins[i].gameTime;
          const outTime = outs[i + 1] ? outs[i + 1].gameTime : currentGameTime;
          segments.push({ start: inTime, end: outTime });
        }
      }
    } else {
      for (let i = 0; i < ins.length; i++) {
        const inTime = ins[i].gameTime;
        const outTime = outs[i] ? outs[i].gameTime : currentGameTime;
        segments.push({ start: inTime, end: outTime });
      }
    }

    // Calculate active time for each segment, excluding stoppages
    let totalActiveTime = 0;

    for (const segment of segments) {
      const segmentPeriod = findPeriodForGameTime(periods, segment.start);
      if (!segmentPeriod) continue;

      const segmentTime = segment.end - segment.start;

      const stoppageTime = calculateStoppageTimeInRange(
        stoppages,
        segment.start,
        segment.end,
        segmentPeriod.periodNumber
      );

      totalActiveTime += Math.max(0, segmentTime - stoppageTime);
    }

    return Math.round(totalActiveTime);
  },

  /**
   * Calculate current continuous time on field (since last sub in)
   */
  calculateCurrentTimeOnField: (player, currentGameTime) => {
    if (!player) return 0;

    const game = useGameStore.getState().game;
    if (!game) return 0;

    const ins = (player.ins || []).filter((sub) => sub.gameTime !== null);
    const outs = (player.outs || []).filter((sub) => sub.gameTime !== null);

    const isStarterNoSubs =
      (player.gameStatus === "starter" || player.gameStatus === "goalkeeper") &&
      ins.length === 0 &&
      outs.length === 0;

    if (isStarterNoSubs) {
      return get().calculateTotalTimeOnField(player, currentGameTime);
    }

    const isOnField = ins.length > outs.length;
    if (!isOnField) return 0;

    const lastIn = ins[ins.length - 1];
    const stoppages = game.stoppages || [];
    const periods = game.periods || [];

    const segmentPeriod = findPeriodForGameTime(periods, lastIn.gameTime);
    if (!segmentPeriod) return 0;

    const timeRange = currentGameTime - lastIn.gameTime;
    const stoppageTime = calculateStoppageTimeInRange(
      stoppages,
      lastIn.gameTime,
      currentGameTime,
      segmentPeriod.periodNumber
    );

    return Math.max(0, Math.round(timeRange - stoppageTime));
  },

  /**
   * Calculate current continuous time off field (since last sub out)
   */
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

    if (outs.length === 0) return Math.round(currentGameTime);

    const lastOut = outs[outs.length - 1];
    return Math.max(0, Math.round(currentGameTime - lastOut.gameTime));
  },

  /**
   * Check if player is currently on field
   */
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

  /**
   * Get all players currently on field
   */
  getPlayersOnField: () => {
    const players = useGamePlayersStore.getState().players;
    return players.filter((player) => get().isPlayerOnField(player));
  },

  /**
   * Get all players currently on bench
   */
  getPlayersOnBench: () => {
    const players = useGamePlayersStore.getState().players;
    return players.filter((player) => !get().isPlayerOnField(player));
  },
}));

export default useGamePlayerTimeStore;
